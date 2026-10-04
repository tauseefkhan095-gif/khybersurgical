/* Progressive enhancement; no third-party runtime, tracking or client-side secrets. */
(() => {
  'use strict';
  let lifecycle;
  let observer;
  const storageFallback = new Map();
  const safeStorage = {
    get(key, session = false) {
      const id = `${session ? 'session' : 'local'}:${key}`;
      try { return (session ? sessionStorage : localStorage).getItem(key) ?? storageFallback.get(id) ?? null; }
      catch { return storageFallback.get(id) ?? null; }
    },
    set(key, value, session = false) {
      storageFallback.set(`${session ? 'session' : 'local'}:${key}`, value);
      try { (session ? sessionStorage : localStorage).setItem(key, value); } catch { /* The portable preview can use page memory when storage is blocked. */ }
    },
    remove(key, session = false) {
      storageFallback.delete(`${session ? 'session' : 'local'}:${key}`);
      try { (session ? sessionStorage : localStorage).removeItem(key); } catch { /* No persistent storage is available. */ }
    }
  };
  const navigate = href => window.__KS_NAVIGATE ? window.__KS_NAVIGATE(href) : location.assign(href);
  function currentUrl() { return new URL(window.__KS_URL || location.href, location.origin === 'null' ? 'https://preview.invalid' : location.origin); }
  function init() {
    lifecycle?.abort();
    observer?.disconnect();
    lifecycle = new AbortController();
    const { signal } = lifecycle;
    const configNode = document.getElementById('site-data');
    if (!configNode) return;
    let config;
    try { config = JSON.parse(configNode.textContent); } catch { return; }
    const { locale, t, products } = config;
    const basePath = window.__KS_PORTABLE ? '' : (config.basePath || '');
    const storageKey = key => `${key}:${basePath || '/'}`;
    const preferred = safeStorage.get(storageKey('ks-language'));
    if (!window.__KS_PORTABLE && (location.pathname === `${basePath}/` || location.pathname === `${basePath}/index.html`) && preferred !== locale && ['en','ar','fa','tr'].includes(preferred)) {
      location.replace(`${basePath}/${preferred}/`);
      return;
    }
    const $ = selector => document.querySelector(selector);
    const $$ = selector => [...document.querySelectorAll(selector)];
    const on = (node, event, fn, options = {}) => node?.addEventListener(event, fn, { ...options, signal });
    const route = path => `${basePath}/${locale}/${path}`;
    const normalise = text => String(text).toLocaleLowerCase(locale).normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f]/g, '').replace(/\u200c/g,' ').trim();

    function saveFormDraft() {
      const form = $('#contact-form');
      if (!form) return;
      const values = Object.fromEntries(new FormData(form));
      delete values.website;
      delete values['cf-turnstile-response'];
      safeStorage.set(storageKey('ks-language-draft'), JSON.stringify({ ...values, consent: $('#consent')?.checked === true, savedAt: Date.now() }), true);
    }
    function switchLanguage(code) {
      if (!['en', 'ar', 'fa', 'tr'].includes(code)) return;
      saveFormDraft();
      safeStorage.set(storageKey('ks-language'), code);
      const current = currentUrl();
      navigate(`${basePath}/${code}/${config.path}${current.search}`);
    }
    on($('[data-language-selector]'), 'change', event => switchLanguage(event.target.value));
    $$('[data-locale-link]').forEach(a => on(a, 'click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      switchLanguage(a.dataset.localeLink);
    }));

    const menuButton = $('.menu-toggle');
    const mobileMenu = $('#mobile-menu');
    function closeMenu(restoreFocus = false) {
      if (!mobileMenu || mobileMenu.hidden) return;
      mobileMenu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', t.nav.menu);
      if (restoreFocus) menuButton.focus();
    }
    on(menuButton, 'click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? t.nav.close : t.nav.menu);
      mobileMenu.hidden = !open;
    });
    on(document, 'click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
    on(window, 'resize', () => { if (window.innerWidth > 930) closeMenu(); });

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.07, rootMargin: '0px 0px 25px 0px' });
      $$('.reveal').forEach(el => { el.classList.add('will-reveal'); observer.observe(el); });
      on(reducedMotion, 'change', event => { if (event.matches) $$('.reveal').forEach(el => el.classList.add('is-visible')); });
    }

    // Pointer-based CSS perspective: desktop only, no animation loop while idle.
    // No WebGL dependency, touch interception, device sensor or unverified 3D product model.
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    $$('[data-depth]').forEach(surface => {
      let frame = 0;
      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        surface.style.setProperty('--tilt-x', '0deg');
        surface.style.setProperty('--tilt-y', '0deg');
      };
      on(surface, 'pointermove', event => {
        if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
        const bounds = surface.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
        const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
        const angle = surface.dataset.depth === 'hero' ? 7 : 5;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (signal.aborted || reducedMotion.matches) return;
          surface.style.setProperty('--tilt-x', `${(-y * angle).toFixed(2)}deg`);
          surface.style.setProperty('--tilt-y', `${(x * angle).toFixed(2)}deg`);
        });
      }, { passive: true });
      on(surface, 'pointerleave', reset);
      on(surface, 'pointercancel', reset);
      on(reducedMotion, 'change', reset);
      on(finePointer, 'change', reset);
      signal.addEventListener('abort', reset, { once: true });
    });

    // Native modal has focus management and Escape support, including RTL layouts.
    const photoDialog = $('.photo-dialog');
    const zoomButton = $('[data-photo-zoom]');
    on(zoomButton, 'click', () => {
      if (photoDialog && !photoDialog.open) photoDialog.showModal();
    });
    on($('[data-photo-close]'), 'click', () => photoDialog?.close());
    on(photoDialog, 'click', event => {
      const rect = photoDialog.getBoundingClientRect();
      if (event.target === photoDialog &&
          (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) photoDialog.close();
    });
    on(photoDialog, 'close', () => zoomButton?.isConnected && zoomButton.focus({ preventScroll: true }));

    const search = $('#product-search');
    let activeFilter = currentUrl().searchParams.get('category') || 'all';
    if (!['all','infusion','access','protection'].includes(activeFilter)) activeFilter='all';
    function applyFilters(updateUrl = true) {
      if (!search) return;
      const query = normalise(search.value);
      let count = 0;
      $$('[data-product]').forEach(card => {
        const show = (activeFilter === 'all' || card.dataset.category === activeFilter) && normalise(card.dataset.search).includes(query);
        card.hidden = !show;
        if (show) { count++; card.classList.add('is-visible'); }
      });
      $$('[data-filter]').forEach(button => {
        const selected = button.dataset.filter === activeFilter;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      $('#product-count').textContent = `${new Intl.NumberFormat(locale).format(count)} ${t.catalog.count}`;
      $('.empty-state').hidden = count !== 0;
      if (updateUrl && !window.__KS_PORTABLE) {
        const next = currentUrl();
        if (activeFilter === 'all') next.searchParams.delete('category'); else next.searchParams.set('category',activeFilter);
        if (search.value.trim()) next.searchParams.set('q',search.value.trim()); else next.searchParams.delete('q');
        history.replaceState(null,'',next);
      }
    }
    if (search) {
      search.value = currentUrl().searchParams.get('q') || '';
      applyFilters(false);
      on(search,'input',()=>applyFilters());
      $$('[data-filter]').forEach(button => on(button,'click',()=>{ activeFilter=button.dataset.filter; applyFilters(); }));
      on($('[data-clear-filters]'),'click',()=>{ activeFilter='all'; search.value=''; applyFilters(); search.focus(); });
    }

    const form = $('#contact-form');
    let turnstileId;
    let turnstileToken = '';
    if (form) {
      const requestedProduct = currentUrl().searchParams.get('product');
      if (products.some(p => p.id === requestedProduct)) $('#product').value = requestedProduct;
      try {
        const draft = JSON.parse(safeStorage.get(storageKey('ks-language-draft'), true) || 'null');
        if (draft && Date.now() - draft.savedAt < 30 * 60 * 1000) {
          ['name','email','organisation','phone','country','product','quantity','message'].forEach(key => {
            const field = form.elements.namedItem(key);
            if (field && typeof draft[key] === 'string') field.value = draft[key];
          });
          $('#consent').checked = draft.consent === true;
        }
      } catch { /* Ignore an invalid or expired draft. */ }
      safeStorage.remove(storageKey('ks-language-draft'), true);
      const result = $('#form-result');
      const submit = $('.form-submit');
      submit.disabled = false; // Enabled only after JS attaches safe validation/submission handling.
      function showResult(text, success = false) {
        result.textContent = text;
        result.hidden = false;
        result.classList.toggle('success', success);
        result.focus({ preventScroll: true });
        result.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
      function fieldError(key, text) {
        const field = form.elements.namedItem(key);
        field?.setAttribute('aria-invalid', text ? 'true' : 'false');
        const target = document.getElementById(`${key}-error`);
        if (target) target.textContent = text || '';
      }
      ['name','email','country','message','consent'].forEach(key => on(form.elements.namedItem(key),'input',()=>fieldError(key,'')));
      if (config.contactEnabled && config.turnstileSiteKey && !window.__KS_PORTABLE) {
        const mount = () => {
          if (signal.aborted || !window.turnstile || !$('#turnstile-widget')) return;
          turnstileId = window.turnstile.render('#turnstile-widget', {
            sitekey: config.turnstileSiteKey, action:'contact',theme:'light',
            language:['en','ar','tr'].includes(locale)?locale:'auto',
            callback:token=>{turnstileToken=token;},
            'expired-callback':()=>{turnstileToken='';},
            'error-callback':()=>{turnstileToken='';}
          });
        };
        if (window.turnstile) mount(); else {
          let script = document.getElementById('turnstile-script');
          if (!script) {
            script = document.createElement('script');
            script.id='turnstile-script';
            script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async=true;
            script.addEventListener('load',mount,{once:true,signal});
            document.head.append(script);
          } else script.addEventListener('load',mount,{once:true,signal});
        }
        signal.addEventListener('abort',()=>{ if(turnstileId!==undefined) window.turnstile?.remove(turnstileId); },{once:true});
      }
      on(form,'submit',async event=>{
        event.preventDefault();
        if (submit.disabled) return;
        const values = Object.fromEntries(new FormData(form));
        const data = {
          name:String(values.name||'').trim(),email:String(values.email||'').trim(),
          organisation:String(values.organisation||'').trim(),phone:String(values.phone||'').trim(),
          country:String(values.country||''),product:String(values.product||'general'),
          quantity:String(values.quantity||'').trim(),message:String(values.message||'').trim(),
          consent:$('#consent').checked,website:String(values.website||''),locale,turnstileToken
        };
        const errors = {};
        if (data.name.length < 2 || data.name.length > 100) errors.name=t.contact.nameError;
        if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email=t.contact.emailError;
        if (!['IN','IQ','IR','TR','AE','OTHER'].includes(data.country)) errors.country=t.contact.countryError;
        if (data.message.length < 10 || data.message.length > 4000) errors.message=t.contact.messageError;
        if (!data.consent) errors.consent=t.contact.consentError;
        ['name','email','country','message','consent'].forEach(key=>fieldError(key,errors[key]||''));
        if (Object.keys(errors).length) {
          result.hidden=false;result.textContent=t.contact.invalid;result.classList.remove('success');
          form.elements.namedItem(Object.keys(errors)[0]).focus();
          return;
        }
        if (!config.contactEnabled || window.__KS_PORTABLE || location.protocol==='file:') {
          showResult(t.contact.previewResult); return;
        }
        if (!turnstileToken) { showResult(t.contact.securityError); return; }
        submit.disabled=true;
        submit.querySelector('span').textContent=t.contact.sending;
        form.setAttribute('aria-busy','true');
        result.hidden=true;
        try {
          const response = await fetch(config.contactEndpoint || '/api/contact',{
            method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),
            signal:AbortSignal.any([signal,AbortSignal.timeout(18000)])
          });
          const payload = await response.json().catch(()=>({}));
          if (!response.ok || payload.ok!==true || !payload.id) {
            const message = response.status===429?t.contact.rateError:
              payload.code==='security_check'?t.contact.securityError:
              payload.code==='not_configured'?t.contact.previewResult:t.contact.error;
            throw new Error(message);
          }
          showResult(t.contact.success,true);
          form.reset();
          safeStorage.remove(storageKey('ks-language-draft'),true);
        } catch(error) {
          if (!signal.aborted) showResult(error instanceof Error && [t.contact.rateError,t.contact.securityError,t.contact.previewResult].includes(error.message)?error.message:t.contact.error);
        } finally {
          if (!signal.aborted) {
            submit.disabled=false;submit.querySelector('span').textContent=t.contact.send;
            form.removeAttribute('aria-busy');turnstileToken='';
            if(turnstileId!==undefined) window.turnstile?.reset(turnstileId);
          }
        }
      });
    }

    const panel = $('#chat-panel');
    const launcher = $('.chat-launcher');
    const chatInput = $('#chat-input');
    const messages = $('.chat-messages');
    let lastOpener = launcher;
    let chatStarted = false;
    function addMessage(text, user = false, link) {
      const bubble = document.createElement('div');
      bubble.className=`chat-message${user?' user':''}`;
      bubble.setAttribute('dir','auto');
      bubble.textContent=text;
      if (link) {
        const a=document.createElement('a');a.href=window.__KS_PORTABLE?'#'+link.href:link.href;a.textContent=link.text;
        bubble.append(a);
      }
      messages.append(bubble);
      // Bound in-memory conversation growth. Nothing is persisted or sent to a remote AI service.
      while (messages.children.length>50) messages.firstElementChild.remove();
      messages.scrollTop=messages.scrollHeight;
    }
    function openChat(opener=launcher) {
      lastOpener=opener;panel.hidden=false;launcher.setAttribute('aria-expanded','true');
      if (!chatStarted) { addMessage(t.chat.intro);chatStarted=true; }
      chatInput.focus({preventScroll:true});
    }
    function closeChat() {
      if (panel.hidden) return;
      panel.hidden=true;launcher.setAttribute('aria-expanded','false');
      if (lastOpener?.isConnected) lastOpener.focus({preventScroll:true});
    }
    on(launcher,'click',()=>panel.hidden?openChat():closeChat());
    on($('.chat-close'),'click',closeChat);
    $$('[data-open-chat]').forEach(button=>on(button,'click',()=>openChat(button)));
    on(document,'keydown',event=>{
      if(event.key==='Escape') { if (!panel.hidden) closeChat(); else closeMenu(true); }
    });
    function reply(topic, product) {
      const link = {href:route(topic==='products'?'products/':'contact/'),text:topic==='products'?t.chat.viewProducts:t.chat.contactCta};
      if (product) {
        addMessage(`${product.short} ${t.detail?.specDesc || t.chat.answers.documents}`,false,{href:route(`products/${product.id}/`),text:t.chat.productCta});
        return;
      }
      const content = t.chat.answers[topic]||t.chat.answers.fallback;
      addMessage(content,false,topic==='medical'?undefined:link);
      if(topic==='contact' && (!config.contactEnabled||window.__KS_PORTABLE)) addMessage(t.chat.answers.preview);
    }
    const synonyms = {
      'iv-infusion-sets':['infusion','iv set','iv sets','تسريب وريدي','تسریب','تزریق وریدی','infuzyon'],
      'iv-cannulas':['cannula','قنية','قنيات','آنژیوکت','انژیوکت','kanul'],
      'syringes':['syringe','محاقن','محقنة','سرنگ','enjektor'],
      'blood-transfusion-sets':['transfusion','blood set','نقل الدم','انتقال خون','transfuzyon'],
      'medical-gloves':['glove','قفاز','قفازات','دستکش','eldiven'],
      'measured-volume-sets':['measured','burette','volume set','محددة الحجم','حجم سنج','حجم‌سنج','hacim']
    };
    const keywords = {
      medical:['how to inject','how to use','insert','dosage','dose','diagnos','symptom','treat my','bleeding','pain','جرعة','كيف أستخدم','كيفية استخدام','نزيف','ألم','دوز','نحوه استفاده','درمان بیماری','نحوه تزریق','doz','nasil kullan','tedavi','agri'],
      shipping:['ship','deliver','export','iran','iraq','india','turkey','uae','بلد','شحن','توصيل','إيران','العراق','تحویل','ارسال کالا','صادرات','teslim','ihrac','kargo'],
      bulk:['bulk','price','cost','minimum','moq','order','quote','جملة','سعر','أسعار','عمده','قیمت','خرید','toplu','fiyat','siparis'],
      documents:['spec','certif','document','size','material','مواصفات','وثائق','شهادة','مدارک','مشخصات','گواهی','اندازه','ozellik','belge','sertifika','boyut'],
      contact:['contact','team','human','support','تواصل','فريق','دعم','تماس','پشتیبان','insan','iletisim','destek'],
      products:['product','catalog','range','منتج','منتجات','محصول','کاتالوگ','urun','katalog']
    };
    $$('[data-chat-topic]').forEach(button=>on(button,'click',()=>{
      addMessage(button.textContent,true);reply(button.dataset.chatTopic);chatInput.focus({preventScroll:true});
    }));
    on($('.chat-form'),'submit',event=>{
      event.preventDefault();
      const text=chatInput.value.trim();if(!text)return;
      addMessage(text,true);chatInput.value='';
      const query=normalise(text);
      const matches=terms=>terms.some(term=>query.includes(normalise(term)));
      if(matches(keywords.medical)){reply('medical');return;}
      const intent=['shipping','bulk','documents','contact'].find(key=>matches(keywords[key]));
      if(intent){reply(intent);return;}
      const product=products.find(p=>query.includes(normalise(p.name))||matches(synonyms[p.id]||[]));
      if(product){reply('products',product);return;}
      reply(matches(keywords.products)?'products':'fallback');
    });
  }
  document.addEventListener('ks:navigate',init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
