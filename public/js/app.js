(() => {
  const $ = (s) => document.querySelector(s);
  const state = { data: null, selectedServiceId: '', lat: null, lng: null, noProLat: null, noProLng: null, tracking: null, trackingStars: 0 };
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cleanPhone = (v='') => String(v).replace(/[^0-9]/g,'');
  const waLink = (phone, message='') => `https://wa.me/${cleanPhone(phone)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  function touchGlow(el) { el.classList.add('neon-active'); setTimeout(() => el.classList.remove('neon-active'), 520); }
  document.addEventListener('pointerdown', e => { const el = e.target.closest('.neon-touch,.service-card,.product-card'); if (el) touchGlow(el); });

  async function jsonFetch(url, options={}) {
    const res = await fetch(url, options);
    const out = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(out.error || 'No se pudo completar la operación');
    return out;
  }

  async function load() {
    try {
      state.data = await jsonFetch('/api/data', { headers: { Accept: 'application/json' } });
      applySettings(); renderServices(); applyServiceQuery(); renderProfessionals(); renderProducts(); restoreTracking();
    } catch (err) {
      $('#servicesGrid').innerHTML = `<div class="empty">${esc(err.message)}. Si acabás de subir el sitio, verificá que Netlify Functions estén desplegadas.</div>`;
      $('#professionalsGrid').innerHTML = '<div class="empty">No se pudieron cargar los profesionales.</div>';
      $('#productsGrid').innerHTML = '<div class="empty">No se pudieron cargar los productos.</div>';
    }
  }

  function applySettings() {
    const s = state.data.settings || {};
    document.documentElement.style.setProperty('--hero-start', s.heroStart || '#061f43');
    document.documentElement.style.setProperty('--hero-end', s.heroEnd || '#0a4b8f');
    document.documentElement.style.setProperty('--title-color', s.titleColor || '#ffffff');
    document.documentElement.style.setProperty('--highlight-color', s.highlightColor || '#35d1ff');
    document.documentElement.style.setProperty('--glow', `${4 + (Number(s.glow)||0)*0.28}px`);
    $('#brandLogo').src = s.logoUrl || '/assets/logo.png';
    const name = s.brandName || 'Salta Soluciones';
    const parts = name.split(' '); $('#brandName').innerHTML = `${esc(parts.shift() || '')} <span>${esc(parts.join(' '))}</span>`;
    $('#tagline').textContent = s.tagline || '';
    const title = s.heroTitle || 'Encontrá el servicio que necesitás en Salta';
    const hi = s.heroHighlight || 'Salta';
    const idx = title.toLowerCase().lastIndexOf(hi.toLowerCase());
    if (idx >= 0) $('#heroTitle').innerHTML = `${esc(title.slice(0,idx))}<span class="highlight">${esc(title.slice(idx, idx+hi.length))}</span>${esc(title.slice(idx+hi.length))}`;
    else $('#heroTitle').innerHTML = `${esc(title)} <span class="highlight">${esc(hi)}</span>`;
    $('#heroSubtitle').textContent = s.heroSubtitle || '';
    $('#serviceSearch').placeholder = s.searchPlaceholder || '¿Qué servicio necesitás hoy?';
    $('#servicesTitle').textContent = s.servicesTitle || 'Servicios disponibles';
    $('#servicesSubtitle').textContent = s.servicesSubtitle || 'Elegí el servicio que necesitás para ver profesionales disponibles.';
    $('#welcomeTitle').textContent = s.welcomeTitle || 'Bienvenido a Salta Soluciones';
    $('#welcomeText').textContent = s.welcomeText || 'Encontrá profesionales y servicios de confianza en un solo lugar. Elegí al profesional que mejor se adapte a vos y contactalo directamente. Si necesitás orientación, también podés hablar con Salta Soluciones.';
    const generalWa = s.whatsapp || '543872521955';
    const message = 'Hola Salta Soluciones, quisiera hacer una consulta.';
    ['#headerWhatsApp','#welcomeWhatsApp','#footerWhatsApp'].forEach(id => { const el=$(id); if(el) el.href=waLink(generalWa,message); });
    $('#profesionales').classList.toggle('hidden', s.showProfessionals === false);
    $('#productos').classList.toggle('hidden', s.showProducts === false);
  }

  function renderServices(filter='') {
    const services = state.data.services || [];
    const q = filter.trim().toLowerCase();
    const filtered = services.filter(s => !q || `${s.name} ${s.description}`.toLowerCase().includes(q));
    $('#servicesCount').textContent = `${filtered.length} servicio${filtered.length===1?'':'s'}`;
    $('#servicesGrid').innerHTML = filtered.length ? filtered.map(s => `<button type="button" class="service-card ${state.selectedServiceId===s.id?'selected-service':''}" data-id="${esc(s.id)}"><div class="service-media">${s.imageUrl?`<img src="${esc(s.imageUrl)}" alt="${esc(s.name)}">`:esc(s.icon||'🔧')}</div><div class="service-name">${esc(s.name)}</div><div class="service-desc">${esc(s.description)}</div><div class="service-cta">Ver profesionales →</div></button>`).join('') : '<div class="empty">No encontramos servicios con esa búsqueda.</div>';
    $('#servicesGrid').querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => {
      state.selectedServiceId = card.dataset.id;
      renderServices($('#serviceSearch').value);
      renderProfessionals();
      $('#profesionales').scrollIntoView({behavior:'smooth',block:'start'});
    }));
  }

  function serviceNames(ids=[]) { return ids.map(id => state.data.services.find(s=>s.id===id)?.name).filter(Boolean).join(' · '); }
  function applyServiceQuery(){
    const params=new URLSearchParams(location.search);
    const serviceId=params.get('servicio');
    if(!serviceId || !state.data?.services?.some(s=>s.id===serviceId)) return;
    state.selectedServiceId=serviceId;
    renderServices($('#serviceSearch').value);
    setTimeout(()=>document.querySelector('#profesionales')?.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }

  function renderProfessionals() {
    const all = state.data.professionals || [], summary = state.data.ratingsSummary || {};
    const list = state.selectedServiceId ? all.filter(p => (p.serviceIds||[]).includes(state.selectedServiceId)) : all;
    const service = state.data.services.find(s=>s.id===state.selectedServiceId);
    $('#professionalsSubtitle').textContent = service ? `Profesionales disponibles para ${service.name}. Elegí uno y completá tus datos para enviar dirección, descripción y ubicación antes de abrir WhatsApp.` : 'Elegí un profesional y contactalo directamente por WhatsApp. El contacto queda registrado para seguimiento y calificación.';
    $('#clearProfessionalFilter').classList.toggle('hidden', !state.selectedServiceId);
    if (list.length) {
      $('#professionalsGrid').innerHTML = list.map(p => {
        const r=summary[p.id];
        const rating=r?.count?`⭐ ${r.average.toFixed(1).replace('.',',')} <span>· ${r.count} opinión${r.count===1?'':'es'}</span>`:'<span>Sin calificaciones publicadas</span>';
        return `<article class="pro-card"><div class="pro-top"><div class="avatar">${p.photoUrl?`<img src="${esc(p.photoUrl)}" alt="${esc(p.name)}">`:'👨‍🔧'}</div><div><div class="pro-name">${esc(p.name)}</div><div class="pro-service">${esc(serviceNames(p.serviceIds))}</div></div></div><div class="meta">${Number(p.yearsExperience)||0} años de experiencia<br>${esc(p.zone||'Zona a coordinar')} · ${esc(p.availability||'Consultar disponibilidad')}</div><div class="rating-line">${rating}</div><button type="button" class="primary-btn pro-contact-btn neon-touch" data-pro-contact="${esc(p.id)}">💬 Contactar por WhatsApp</button><small class="contact-register-note">Antes de abrir WhatsApp podés enviar dirección, descripción y GPS. Todo queda registrado.</small></article>`;
      }).join('');
      $('#professionalsGrid').querySelectorAll('[data-pro-contact]').forEach(btn=>btn.addEventListener('click',()=>openContactModal(btn.dataset.proContact)));
      return;
    }
    if (service) {
      const saved=(()=>{try{return JSON.parse(localStorage.getItem('saltaClient')||'{}')}catch{return {}}})();
      state.noProLat=null; state.noProLng=null;
      $('#professionalsGrid').innerHTML = `<div class="no-pro-request span-full"><div class="no-pro-head"><div><div class="eyebrow welcome-eyebrow">Solicitud a Salta Soluciones</div><h3>No hay profesionales disponibles para ${esc(service.name)}</h3><p>Dejanos tus datos y la necesidad del servicio. La solicitud llegará al ADMIN para que Salta Soluciones pueda asignarte un profesional cuando haya uno disponible.</p></div><div class="no-pro-icon">📨</div></div><form id="noProRequestForm" class="form-grid"><input id="noProServiceId" type="hidden" value="${esc(service.id)}"><label class="field">Nombre<input id="noProFirstName" required autocomplete="given-name" value="${esc(saved.firstName||'')}"></label><label class="field">Apellido<input id="noProLastName" required autocomplete="family-name" value="${esc(saved.lastName||'')}"></label><label class="field">WhatsApp<input id="noProWhatsApp" required inputmode="tel" autocomplete="tel" value="${esc(saved.whatsapp||'')}"></label><label class="field">Dirección / zona<input id="noProAddress" required autocomplete="street-address" placeholder="Ej.: Barrio, calle y número"></label><label class="field span-2">Descripción del trabajo<textarea id="noProDescription" required placeholder="Explicá qué necesitás para que podamos buscar el profesional adecuado"></textarea></label><div class="span-2 gps-row"><button id="noProGpsBtn" class="gps-btn neon-touch" type="button">📍 Enviar mi ubicación GPS</button><span id="noProGpsStatus" class="gps-status">Opcional, pero recomendado</span></div><label class="span-2 check-row"><input id="noProConsent" type="checkbox" required><span>Acepto que Salta Soluciones use estos datos para contactarme y asignar un profesional.</span></label><div class="span-2"><button class="primary-btn neon-touch" type="submit">✅ Enviar solicitud a Salta Soluciones</button><div id="noProStatus" class="status-msg" aria-live="polite" style="margin-top:9px"></div></div></form></div>`;
      bindNoProfessionalForm();
    } else {
      $('#professionalsGrid').innerHTML = '<div class="empty">No hay profesionales publicados por el momento.</div>';
    }
  }

  function bindNoProfessionalForm(){
    const form=$('#noProRequestForm'); if(!form)return;
    $('#noProGpsBtn').onclick=()=>{
      if(!navigator.geolocation){$('#noProGpsStatus').textContent='Tu navegador no admite GPS.';return;}
      $('#noProGpsStatus').textContent='Solicitando permiso…';
      navigator.geolocation.getCurrentPosition(pos=>{state.noProLat=pos.coords.latitude;state.noProLng=pos.coords.longitude;$('#noProGpsStatus').textContent='✓ Ubicación GPS agregada';},err=>{$('#noProGpsStatus').textContent=err.code===1?'No autorizaste la ubicación. Podés continuar con la dirección.':'No se pudo obtener la ubicación.';},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
    };
    form.onsubmit=async e=>{
      e.preventDefault(); if(!form.reportValidity())return;
      const btn=form.querySelector('button[type=submit]'); btn.disabled=true; $('#noProStatus').textContent='Enviando solicitud…';
      const payload={serviceId:$('#noProServiceId').value,firstName:$('#noProFirstName').value,lastName:$('#noProLastName').value,whatsapp:$('#noProWhatsApp').value,address:$('#noProAddress').value,description:$('#noProDescription').value,lat:state.noProLat,lng:state.noProLng,consentContact:$('#noProConsent').checked};
      try{
        const out=await jsonFetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        localStorage.setItem('saltaClient',JSON.stringify({firstName:payload.firstName,lastName:payload.lastName,whatsapp:payload.whatsapp}));
        localStorage.setItem('saltaTracking',JSON.stringify({code:out.code,whatsapp:payload.whatsapp}));
        $('#trackingCode').value=out.code; $('#trackingWhatsApp').value=payload.whatsapp;
        $('#noProStatus').innerHTML=`✅ Solicitud enviada. Número: <strong>${esc(out.code)}</strong>.<br><small>Salta Soluciones la verá en el panel ADMIN y podrá asignarte un profesional. Guardá el código para consultar el estado.</small>`;
        form.querySelectorAll('input:not([type=hidden]),textarea').forEach(el=>{if(!['noProFirstName','noProLastName','noProWhatsApp'].includes(el.id))el.value='';});
        $('#noProConsent').checked=false; state.noProLat=null; state.noProLng=null; $('#noProGpsStatus').textContent='Opcional, pero recomendado';
      }catch(err){$('#noProStatus').textContent='Error: '+err.message;}
      finally{btn.disabled=false;}
    };
  }

  $('#clearProfessionalFilter').addEventListener('click',()=>{state.selectedServiceId='';renderServices($('#serviceSearch').value);renderProfessionals();});

  function renderProducts() {
    const list = state.data.products || [];
    $('#productsGrid').innerHTML = list.length ? list.map(p=>`<button type="button" class="product-card" data-product="${esc(p.id)}"><div class="product-cover">${p.images?.[0]?`<img src="${esc(p.images[0])}" alt="${esc(p.name)}">`:'📦'}</div><div class="product-name">${esc(p.name)}</div><div class="product-price">${esc(p.price||'Consultar')}</div><div class="availability">Disponible</div></button>`).join('') : '<div class="empty">Todavía no hay productos publicados.</div>';
    $('#productsGrid').querySelectorAll('[data-product]').forEach(btn=>btn.addEventListener('click',()=>openProduct(btn.dataset.product)));
  }

  function openProduct(id) {
    const p = state.data.products.find(x=>x.id===id); if(!p) return;
    $('#modalProductName').textContent=p.name; $('#modalPrice').textContent=p.price||'Consultar'; $('#modalDescription').textContent=p.description||'';
    const images=p.images||[]; const main=$('#mainProductPhoto'), thumbs=$('#productThumbs');
    const setMain=url=>{ main.innerHTML=url?`<img src="${esc(url)}" alt="${esc(p.name)}">`:'📦'; };
    setMain(images[0]); thumbs.innerHTML=images.map((url,i)=>`<button type="button" class="thumb" data-index="${i}"><img src="${esc(url)}" alt="Foto ${i+1} de ${esc(p.name)}"></button>`).join('');
    thumbs.querySelectorAll('.thumb').forEach(t=>t.addEventListener('click',()=>setMain(images[Number(t.dataset.index)])));
    const phone=p.whatsapp||state.data.settings.whatsapp; $('#modalWhatsApp').href=waLink(phone,`Hola, quisiera consultar por el producto: ${p.name}.`);
    $('#productModal').classList.remove('hidden'); document.body.style.overflow='hidden';
  }
  function closeProduct(){ $('#productModal').classList.add('hidden'); document.body.style.overflow=''; }
  $('#closeModal').addEventListener('click',closeProduct); $('#productModal').addEventListener('click',e=>{if(e.target===$('#productModal'))closeProduct()});

  function openContactModal(id) {
    const p = state.data.professionals.find(x=>x.id===id); if(!p) return;
    $('#contactProfessionalId').value=id;
    $('#contactModalTitle').textContent=`Contactar a ${p.name}`;
    $('#contactProfessionalInfo').textContent=`${serviceNames(p.serviceIds)} · ${p.zone||'Zona a coordinar'}`;
    const services=(state.data.services||[]).filter(s=>(p.serviceIds||[]).includes(s.id));
    $('#contactService').innerHTML='<option value="">Seleccioná un servicio</option>'+services.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    if(state.selectedServiceId && services.some(s=>s.id===state.selectedServiceId)) $('#contactService').value=state.selectedServiceId;
    const saved=JSON.parse(localStorage.getItem('saltaClient')||'{}');
    $('#contactFirstName').value=saved.firstName||''; $('#contactLastName').value=saved.lastName||''; $('#contactWhatsApp').value=saved.whatsapp||'';
    $('#contactAddress').value=''; $('#contactDescription').value=''; $('#contactConsent').checked=false; $('#contactStatus').textContent='';
    state.lat=null; state.lng=null; $('#contactGpsStatus').textContent='Recomendado para ubicar mejor el servicio';
    $('#contactModal').classList.remove('hidden'); document.body.style.overflow='hidden';
  }
  function closeContact(){ $('#contactModal').classList.add('hidden'); document.body.style.overflow=''; }
  $('#closeContactModal').addEventListener('click',closeContact); $('#contactModal').addEventListener('click',e=>{if(e.target===$('#contactModal'))closeContact()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeProduct();closeContact();}});

  $('#contactGpsBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){$('#contactGpsStatus').textContent='Tu navegador no admite GPS.';return;}
    $('#contactGpsStatus').textContent='Solicitando permiso…';
    navigator.geolocation.getCurrentPosition(pos=>{state.lat=pos.coords.latitude;state.lng=pos.coords.longitude;$('#contactGpsStatus').textContent='✓ Ubicación agregada';},err=>{$('#contactGpsStatus').textContent=err.code===1?'No autorizaste la ubicación. Podés continuar.':'No se pudo obtener la ubicación.';},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  });

  $('#directContactForm').addEventListener('submit',async e=>{
    e.preventDefault(); const form=e.currentTarget; if(!form.reportValidity())return;
    const btn=form.querySelector('button[type=submit]'); btn.disabled=true; $('#contactStatus').textContent='Registrando contacto…';
    const popup=window.open('about:blank','_blank');
    try{
      const payload={professionalId:$('#contactProfessionalId').value,serviceId:$('#contactService').value,firstName:$('#contactFirstName').value,lastName:$('#contactLastName').value,whatsapp:$('#contactWhatsApp').value,address:$('#contactAddress').value,description:$('#contactDescription').value,lat:state.lat,lng:state.lng,consentContact:$('#contactConsent').checked};
      const out=await jsonFetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      localStorage.setItem('saltaClient',JSON.stringify({firstName:payload.firstName,lastName:payload.lastName,whatsapp:payload.whatsapp}));
      localStorage.setItem('saltaTracking',JSON.stringify({code:out.code,whatsapp:payload.whatsapp}));
      $('#trackingCode').value=out.code; $('#trackingWhatsApp').value=payload.whatsapp;
      $('#contactStatus').innerHTML=`✅ Contacto registrado. Tu código es <strong>${esc(out.code)}</strong>.<br><small>Guardalo para confirmar después si el profesional asistió y calificar el trabajo.</small>`;
      if(popup) popup.location.href=out.whatsappUrl; else $('#contactStatus').innerHTML += `<br><a class="wa-btn inline-wa" target="_blank" rel="noreferrer" href="${esc(out.whatsappUrl)}">Abrir WhatsApp</a>`;
      setTimeout(()=>{ if(!$('#contactModal').classList.contains('hidden')) $('#contactStatus').insertAdjacentHTML('beforeend','<br><button type="button" class="outline-btn compact" id="goTracking">Ir a Mi solicitud</button>'); const g=$('#goTracking'); if(g)g.onclick=()=>{closeContact();$('#mi-solicitud').scrollIntoView({behavior:'smooth'});}; },100);
    }catch(err){ if(popup)popup.close(); $('#contactStatus').textContent='Error: '+err.message; }
    finally{btn.disabled=false;}
  });

  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();renderServices($('#serviceSearch').value);$('#servicios').scrollIntoView({behavior:'smooth'});});
  $('#serviceSearch').addEventListener('input',()=>renderServices($('#serviceSearch').value));

  function restoreTracking(){
    try{const saved=JSON.parse(localStorage.getItem('saltaTracking')||'{}');if(saved.code)$('#trackingCode').value=String(saved.code).replace(/[^0-9]/g,'').slice(0,5);if(saved.whatsapp)$('#trackingWhatsApp').value=saved.whatsapp;}catch{}
    const qs=new URLSearchParams(location.search); const code=qs.get('codigo'); if(code)$('#trackingCode').value=String(code).replace(/[^0-9]/g,'').slice(0,5);
  }

  $('#trackingCode').addEventListener('input',e=>{e.target.value=e.target.value.replace(/[^0-9]/g,'').slice(0,5);});
  $('#trackingForm').addEventListener('submit',async e=>{e.preventDefault();await lookupTracking();});
  async function lookupTracking(message=''){
    const code=$('#trackingCode').value.replace(/[^0-9]/g,'').slice(0,5), whatsapp=$('#trackingWhatsApp').value.trim(); if(!/^\d{5}$/.test(code)){ $('#trackingStatus').textContent='Ingresá los 5 números de tu solicitud.'; return; } if(!whatsapp){ $('#trackingStatus').textContent='Ingresá el mismo WhatsApp usado en la solicitud.'; return; } $('#trackingCode').value=code;
    $('#trackingStatus').textContent='Consultando…';
    try{const out=await jsonFetch('/api/client-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lookup',code,whatsapp})}); state.tracking=out.request; localStorage.setItem('saltaTracking',JSON.stringify({code,whatsapp})); $('#trackingStatus').textContent=message; renderTracking();}
    catch(err){state.tracking=null;$('#trackingResult').innerHTML='<div class="empty">No se pudo mostrar la solicitud.</div>';$('#trackingStatus').textContent='Error: '+err.message;}
  }

  async function trackingAction(action,value){
    const code=$('#trackingCode').value.replace(/[^0-9]/g,'').slice(0,5), whatsapp=$('#trackingWhatsApp').value.trim();
    try{const out=await jsonFetch('/api/client-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,code,whatsapp,value})});state.tracking=out.request;renderTracking();}
    catch(err){alert(err.message);}
  }

  function yesNo(value){return value===true?'✅ Sí':value===false?'❌ No':'⏳ Pendiente';}
  function renderTracking(){
    const r=state.tracking; if(!r)return;
    const ratingText=r.clientRatingSubmitted?`⭐ ${r.clientStars}/5`:'Pendiente';
    $('#trackingResult').innerHTML=`<div class="track-head"><div><div class="eyebrow welcome-eyebrow">${esc(r.code)}</div><h3>${esc(r.serviceName)}</h3><p>${esc(r.professionalName||'Profesional')}</p></div><span class="track-status">${esc(r.status||'Contacto iniciado')}</span></div>
      <div class="track-steps"><div class="track-step done"><span>1</span><div><strong>Contacto iniciado</strong><small>${r.createdAt?new Date(r.createdAt).toLocaleString('es-AR'):''}</small></div></div><div class="track-step ${r.clientVisit===true?'done':r.clientVisit===false?'bad':''}"><span>2</span><div><strong>¿El profesional asistió?</strong><small>${yesNo(r.clientVisit)}</small></div></div><div class="track-step ${r.clientWork===true?'done':r.clientWork===false?'bad':''}"><span>3</span><div><strong>¿El trabajo se realizó?</strong><small>${yesNo(r.clientWork)}</small></div></div><div class="track-step ${r.clientRatingSubmitted?'done':''}"><span>4</span><div><strong>Calificación</strong><small>${ratingText}</small></div></div></div>
      <div class="track-actions">${!r.hasProfessional?'<div class="tracking-note"><strong>⏳ Salta Soluciones está buscando un profesional para tu solicitud.</strong><br>Cuando se asigne uno, aparecerá acá y podrás confirmar la visita y el trabajo.</div>':`${r.clientVisit==null?`<p><strong>¿El profesional asistió o te atendió?</strong></p><div class="answer-buttons"><button class="primary-btn" data-visit="true" type="button">✅ Sí, asistió</button><button class="outline-btn danger-outline" data-visit="false" type="button">❌ No asistió</button></div>`:''}${r.clientVisit===true&&r.clientWork==null?`<p><strong>¿El trabajo quedó realizado?</strong></p><div class="answer-buttons"><button class="primary-btn" data-work="true" type="button">✅ Sí, finalizado</button><button class="outline-btn danger-outline" data-work="false" type="button">❌ No se realizó</button></div>`:''}${r.clientVisit===false?'<div class="tracking-note">Registramos que el profesional no asistió. Esta información queda visible para Salta Soluciones.</div>':''}${r.clientWork===false?'<div class="tracking-note">Registramos que el trabajo no se concretó.</div>':''}${r.clientWork===true&&!r.clientRatingSubmitted?ratingBox():''}${r.clientRatingSubmitted?'<div class="tracking-note success-note">✅ Gracias. Tu calificación quedó enviada y será revisada antes de publicarse.</div>':''}`}</div>`;
    $('#trackingResult').querySelectorAll('[data-visit]').forEach(b=>b.onclick=()=>trackingAction('confirmVisit',b.dataset.visit==='true'));
    $('#trackingResult').querySelectorAll('[data-work]').forEach(b=>b.onclick=()=>trackingAction('confirmWork',b.dataset.work==='true'));
    initTrackingStars();
  }

  function ratingBox(){return `<div class="tracking-rating"><p><strong>¿Cómo calificás al profesional?</strong></p><div id="trackingStars" class="stars-picker"></div><textarea id="trackingComment" placeholder="Comentario (obligatorio si elegís 1, 2 o 3 estrellas)"></textarea><button id="sendTrackingRating" class="primary-btn" type="button">Enviar calificación</button><div id="trackingRatingStatus" class="status-msg"></div></div>`;}
  function initTrackingStars(){
    const wrap=$('#trackingStars'); if(!wrap)return; state.trackingStars=0; wrap.innerHTML='';
    for(let i=1;i<=5;i++){const b=document.createElement('button');b.type='button';b.className='star-btn';b.textContent='★';b.setAttribute('aria-label',`${i} estrellas`);b.onclick=()=>{state.trackingStars=i;[...wrap.children].forEach((x,j)=>x.classList.toggle('active',j<i));};wrap.appendChild(b);}
    $('#sendTrackingRating').onclick=async()=>{const comment=$('#trackingComment').value.trim();if(!state.trackingStars){$('#trackingRatingStatus').textContent='Elegí de 1 a 5 estrellas.';return;}if(state.trackingStars<=3&&!comment){$('#trackingRatingStatus').textContent='Explicá brevemente el motivo.';return;}const code=$('#trackingCode').value.trim(),whatsapp=$('#trackingWhatsApp').value.trim();try{const out=await jsonFetch('/api/client-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rate',code,whatsapp,stars:state.trackingStars,comment})});state.tracking=out.request;renderTracking();}catch(err){$('#trackingRatingStatus').textContent='Error: '+err.message;}};
  }

  load();
})();
