/**
 * Cloudflare Pages Function. POST /api/contact
 * No secrets or destinations are accepted from the client.
 * Set RESEND_API_KEY, CONTACT_FROM, CONTACT_TO, TURNSTILE_SECRET_KEY and
 * TURNSTILE_HOSTNAME in the hosting account. Fails closed when unconfigured.
 */
const PRODUCTS = new Set(['general','iv-infusion-sets','iv-cannulas','syringes','blood-transfusion-sets','medical-gloves','measured-volume-sets']);
const COUNTRIES = new Set(['IN','IQ','IR','TR','AE','OTHER']);
const LOCALES = new Set(['en','ar','fa','tr']);
const MAX_BODY = 24576; // Allows up to 4,000 Unicode characters in multilingual requests.
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json = (status,body)=>new Response(JSON.stringify(body),{status,headers});
export function validatePayload(input) {
  if (!input || typeof input!=='object' || Array.isArray(input)) return null;
  const string=(key,max,required=false)=>{
    if(input[key]===undefined && !required)return '';
    if(typeof input[key]!=='string')return null;
    const value=input[key].trim();
    return value.length<=max && (!required||value.length>0)?value:null;
  };
  const data={name:string('name',100,true),email:string('email',254,true),organisation:string('organisation',160),phone:string('phone',40),country:string('country',8,true),product:string('product',50,true),quantity:string('quantity',100),message:string('message',4000,true),locale:string('locale',3,true),website:string('website',200),turnstileToken:string('turnstileToken',2048,true)};
  if(Object.values(data).some(value=>value===null))return null;
  if(data.name.length<2||data.message.length<10||input.consent!==true||data.website)return null;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||/[\r\n]/.test(data.email))return null;
  if(!PRODUCTS.has(data.product)||!COUNTRIES.has(data.country)||!LOCALES.has(data.locale))return null;
  return data;
}
async function readBoundedJson(request) {
  if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)throw new RangeError('Body too large');
  if(!request.body)throw new Error('No body');
  const reader=request.body.getReader();const chunks=[];let size=0;
  try{
    while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BODY){await reader.cancel();throw new RangeError('Body too large');}chunks.push(value);}
  }finally{reader.releaseLock();}
  const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
export async function onRequest(context) {
  const {request,env}=context;
  if(request.method!=='POST')return new Response(JSON.stringify({ok:false,code:'method_not_allowed'}),{status:405,headers:{...headers,Allow:'POST'}});
  // Only same-origin browser submissions. No wildcard CORS.
  const origin=request.headers.get('Origin');
  if(!origin||origin!==new URL(request.url).origin)return json(403,{ok:false,code:'forbidden'});
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json(415,{ok:false,code:'unsupported_type'});
  let input;try{input=await readBoundedJson(request);}catch(error){return json(error instanceof RangeError?413:400,{ok:false,code:'bad_request'});}
  const data=validatePayload(input);
  if(!data)return json(400,{ok:false,code:'invalid_fields'});
  if(!env.RESEND_API_KEY||!env.CONTACT_FROM||!env.CONTACT_TO||!env.TURNSTILE_SECRET_KEY||!env.TURNSTILE_HOSTNAME)return json(503,{ok:false,code:'not_configured'});
  // Optional platform rate-limiter binding, where supported. Also apply a host-side rule.
  if(env.RATE_LIMITER){
    try{const limit=await env.RATE_LIMITER.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});if(!limit.success)return json(429,{ok:false,code:'rate_limited'});}
    catch{return json(503,{ok:false,code:'service_unavailable'});}
  }
  try {
    const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.turnstileToken}),
      signal:AbortSignal.timeout(6500)
    });
    if(!verify.ok)return json(503,{ok:false,code:'service_unavailable'});
    const verdict=await verify.json();
    if(!verdict.success||verdict.action!=='contact'||verdict.hostname!==env.TURNSTILE_HOSTNAME)return json(400,{ok:false,code:'security_check'});
    // Plain-text email prevents untrusted HTML injection; controlled subject and destination.
    const text=[
      'New KS website enquiry',
      `Name: ${data.name}`,`Email: ${data.email}`,`Organisation: ${data.organisation||'Not provided'}`,
      `Phone: ${data.phone||'Not provided'}`,`Destination: ${data.country}`,`Product: ${data.product}`,
      `Quantity: ${data.quantity||'Not provided'}`,`Website language: ${data.locale}`,
      'Consent to respond: yes','', 'Message:', data.message
    ].join('\n');
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:env.CONTACT_FROM,to:[env.CONTACT_TO],reply_to:data.email,subject:`KS product enquiry — ${data.product}`,text}),
      signal:AbortSignal.timeout(8000)
    });
    if(!response.ok)return json(502,{ok:false,code:'delivery_error'});
    const receipt=await response.json();
    if(typeof receipt.id!=='string'||!receipt.id)return json(502,{ok:false,code:'delivery_error'});
    // Accepted by email provider, not a promise of inbox delivery or a human response.
    return json(200,{ok:true,id:receipt.id});
  }catch{return json(502,{ok:false,code:'delivery_error'});}
}
