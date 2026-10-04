import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest,validatePayload} from '../functions/api/contact.js';
const valid={name:'Alex Buyer',email:'buyer@example.com',organisation:'Example Clinic',phone:'',country:'IN',product:'iv-cannulas',quantity:'1000 units',message:'Please send product specifications.',locale:'en',consent:true,website:'',turnstileToken:'test-token'};
const env={RESEND_API_KEY:'test-only-not-real',CONTACT_FROM:'KS <sales@example.com>',CONTACT_TO:'owner@example.com',TURNSTILE_SECRET_KEY:'test-only-not-real',TURNSTILE_HOSTNAME:'ks.example'};
function request(payload=valid,overrides={}){return new Request('https://ks.example/api/contact',{method:'POST',headers:{Origin:'https://ks.example','Content-Type':'application/json',...overrides.headers},body:typeof payload==='string'?payload:JSON.stringify(payload),...Object.fromEntries(Object.entries(overrides).filter(([k])=>k!=='headers'))});}
test('Valid payload, including Unicode messages, is accepted',()=>{
 assert.ok(validatePayload(valid));
 assert.ok(validatePayload({...valid,name:'مشتري طبي',message:'أرغب في الحصول على مواصفات المنتج',locale:'ar'}));
});
test('Invalid fields, recipient/header injection and spam are rejected',()=>{
 for(const update of [{name:''},{email:'bad'},{email:'a@b.com\nBCC:bad@c.com'},{consent:false},{country:'XX'},{product:'unknown'},{locale:'xx'},{website:'spam.example'},{message:'short'},{message:'x'.repeat(4001)},{name:42}])assert.equal(validatePayload({...valid,...update}),null);
});
test('Wrong methods, foreign origins and content types fail closed',async()=>{
 assert.equal((await onRequest({request:new Request('https://ks.example/api/contact'),env})).status,405);
 assert.equal((await onRequest({request:request(valid,{headers:{Origin:'https://other.example'}}),env})).status,403);
 assert.equal((await onRequest({request:request(valid,{headers:{'Content-Type':'text/plain'}}),env})).status,415);
});
test('Malformed and oversized requests are rejected',async()=>{
 assert.equal((await onRequest({request:request('{broken'),env})).status,400);
 assert.equal((await onRequest({request:request('x'.repeat(25000)),env})).status,413);
});
test('An unconfigured deployment never claims delivery',async()=>{
 const response=await onRequest({request:request(),env:{}});
 assert.equal(response.status,503);assert.equal((await response.json()).code,'not_configured');
});
test('Turnstile rejects wrong action or hostname before contacting email provider',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({success:true,action:'wrong',hostname:'other.example'});});
 const response=await onRequest({request:request(),env});
 assert.equal(response.status,400);assert.equal((await response.json()).code,'security_check');assert.equal(calls,1);
});
test('Successful mocked provider acceptance returns a receipt and uses only configured recipient',async t=>{
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  calls.push({url,options});
  return url.includes('siteverify')?Response.json({success:true,action:'contact',hostname:'ks.example'}):Response.json({id:'mock-receipt-id'});
 });
 const response=await onRequest({request:request({...valid,to:'attacker@example.com',message:'<script>alert(1)</script> Please send specs.'}),env});
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true,id:'mock-receipt-id'});
 const mail=JSON.parse(calls[1].options.body);
 assert.deepEqual(mail.to,['owner@example.com']);assert.equal(mail.reply_to,'buyer@example.com');assert.ok(!('html' in mail));assert.ok(mail.text.includes('<script>'));
});
test('Provider errors and missing receipts do not return success',async t=>{
 t.mock.method(globalThis,'fetch',async url=>url.includes('siteverify')?Response.json({success:true,action:'contact',hostname:'ks.example'}):Response.json({error:'rejected'},{status:500}));
 assert.equal((await onRequest({request:request(),env})).status,502);
});
test('Configured rate limiter can reject excessive requests',async()=>{
 const response=await onRequest({request:request(),env:{...env,RATE_LIMITER:{limit:async()=>({success:false})}}});
 assert.equal(response.status,429);
});
