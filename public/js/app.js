(() => {
  const $ = (s) => document.querySelector(s);
  const state = { data: null, selectedStars: 0, lat: null, lng: null };
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const cleanPhone = (v='') => String(v).replace(/[^0-9]/g,'');
  const waLink = (phone, message='') => `https://wa.me/${cleanPhone(phone)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  function touchGlow(el) {
    el.classList.add('neon-active');
    setTimeout(() => el.classList.remove('neon-active'), 520);
  }
  document.addEventListener('pointerdown', e => { const el = e.target.closest('.neon-touch,.service-card,.product-card'); if (el) touchGlow(el); });

  async function load() {
    try {
      const res = await fetch('/api/data', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('No se pudo cargar la información');
      state.data = await res.json();
      applySettings(); renderServices(); renderProfessionals(); renderProducts(); renderRatingPicker();
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
    $('#servicesTitle').textContent = s.servicesTitle || 'Servicios';
    $('#servicesSubtitle').textContent = s.servicesSubtitle || '';
    const generalWa = s.whatsapp || '543872521955';
    $('#headerWhatsApp').href = waLink(generalWa, 'Hola Salta Soluciones, quisiera hacer una consulta.');
    $('#footerWhatsApp').href = waLink(generalWa, 'Hola Salta Soluciones, quisiera hacer una consulta.');
    $('#profesionales').classList.toggle('hidden', s.showProfessionals === false);
    $('#productos').classList.toggle('hidden', s.showProducts === false);
    $('#calificar').classList.toggle('hidden', s.showRatings === false);
  }

  function renderServices(filter='') {
    const services = state.data.services || [];
    const q = filter.trim().toLowerCase();
    const filtered = services.filter(s => !q || `${s.name} ${s.description}`.toLowerCase().includes(q));
    $('#servicesCount').textContent = `${filtered.length} servicio${filtered.length===1?'':'s'}`;
    $('#servicesGrid').innerHTML = filtered.length ? filtered.map(s => `<button type="button" class="service-card" data-id="${esc(s.id)}"><div class="service-media">${s.imageUrl?`<img src="${esc(s.imageUrl)}" alt="${esc(s.name)}">`:esc(s.icon||'🔧')}</div><div class="service-name">${esc(s.name)}</div><div class="service-desc">${esc(s.description)}</div></button>`).join('') : '<div class="empty">No encontramos servicios con esa búsqueda.</div>';
    const sel = $('#bookingService');
    sel.innerHTML = '<option value="">Seleccioná un servicio</option>' + services.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');
    $('#servicesGrid').querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => { sel.value = card.dataset.id; document.querySelector('.booking-layout').scrollIntoView({behavior:'smooth',block:'start'}); }));
  }

  function serviceNames(ids=[]) { return ids.map(id => state.data.services.find(s=>s.id===id)?.name).filter(Boolean).join(' · '); }
  function renderProfessionals() {
    const list = state.data.professionals || [], summary = state.data.ratingsSummary || {};
    $('#professionalsGrid').innerHTML = list.length ? list.map(p => { const r=summary[p.id]; const rating=r?.count?`⭐ ${r.average.toFixed(1).replace('.',',')} <span>· ${r.count} opinión${r.count===1?'':'es'}</span>`:'<span>Sin calificaciones publicadas</span>'; return `<article class="pro-card"><div class="pro-top"><div class="avatar">${p.photoUrl?`<img src="${esc(p.photoUrl)}" alt="${esc(p.name)}">`:'👨‍🔧'}</div><div><div class="pro-name">${esc(p.name)}</div><div class="pro-service">${esc(serviceNames(p.serviceIds))}</div></div></div><div class="meta">${Number(p.yearsExperience)||0} años de experiencia<br>${esc(p.zone||'Zona a coordinar')} · ${esc(p.availability||'Consultar disponibilidad')}</div><div class="rating-line">${rating}</div><button type="button" class="outline-btn neon-touch" data-pro="${esc(p.id)}">Solicitar atención</button></article>`; }).join('') : '<div class="empty">Todavía no hay profesionales publicados. Podés agregarlos desde el panel ADMIN.</div>';
    const ratingSel = $('#ratingProfessional');
    ratingSel.innerHTML = '<option value="">Seleccioná un profesional</option>' + list.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    $('#professionalsGrid').querySelectorAll('[data-pro]').forEach(btn=>btn.addEventListener('click',()=>{ const p=list.find(x=>x.id===btn.dataset.pro); const sid=p?.serviceIds?.find(id=>state.data.services.some(s=>s.id===id)); if(sid) $('#bookingService').value=sid; document.querySelector('.booking-layout').scrollIntoView({behavior:'smooth'}); }));
  }

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
  $('#closeModal').addEventListener('click',closeProduct); $('#productModal').addEventListener('click',e=>{if(e.target===$('#productModal'))closeProduct()}); document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProduct()});

  $('#searchForm').addEventListener('submit',e=>{e.preventDefault();renderServices($('#serviceSearch').value);$('#servicios').scrollIntoView({behavior:'smooth'});});
  $('#serviceSearch').addEventListener('input',()=>renderServices($('#serviceSearch').value));

  $('#gpsBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){$('#gpsStatus').textContent='Tu navegador no admite GPS.';return;}
    $('#gpsStatus').textContent='Solicitando permiso…';
    navigator.geolocation.getCurrentPosition(pos=>{state.lat=pos.coords.latitude;state.lng=pos.coords.longitude;$('#gpsStatus').textContent='✓ Ubicación agregada';},err=>{$('#gpsStatus').textContent=err.code===1?'No autorizaste la ubicación. Podés continuar con la dirección.':'No se pudo obtener la ubicación.';},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
  });

  $('#bookingForm').addEventListener('submit',async e=>{
    e.preventDefault(); if(!e.currentTarget.reportValidity())return; const btn=e.currentTarget.querySelector('button[type=submit]'); btn.disabled=true; $('#bookingStatus').textContent='Enviando solicitud…';
    try{const res=await fetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:$('#firstName').value,lastName:$('#lastName').value,whatsapp:$('#clientWhatsApp').value,address:$('#address').value,description:$('#description').value,serviceId:$('#bookingService').value,lat:state.lat,lng:state.lng,consentContact:$('#consentContact').checked})});const out=await res.json();if(!res.ok)throw new Error(out.error||'No se pudo enviar');$('#bookingStatus').innerHTML=`✅ Solicitud recibida. Código: <strong>${esc(out.code)}</strong>`;e.currentTarget.reset();state.lat=state.lng=null;$('#gpsStatus').textContent='Opcional';}catch(err){$('#bookingStatus').textContent=`Error: ${err.message}`;}finally{btn.disabled=false;}
  });

  function renderRatingPicker(){const wrap=$('#starsPicker');wrap.innerHTML='';for(let i=1;i<=5;i++){const b=document.createElement('button');b.type='button';b.className='star-btn';b.textContent='★';b.setAttribute('aria-label',`${i} estrellas`);b.addEventListener('click',()=>{state.selectedStars=i;[...wrap.children].forEach((x,j)=>x.classList.toggle('active',j<i));$('#ratingCommentWrap').classList.toggle('hidden',i===5);if(i===5)$('#ratingComment').value='';});wrap.appendChild(b)}}
  $('#ratingForm').addEventListener('submit',async e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;if(!state.selectedStars){$('#ratingStatus').textContent='Elegí de 1 a 5 estrellas.';return;}if(state.selectedStars<5&&!$('#ratingComment').value.trim()){ $('#ratingStatus').textContent='Explicá el motivo de la calificación.';return;}const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;try{const res=await fetch('/api/rating',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({professionalId:$('#ratingProfessional').value,stars:state.selectedStars,comment:$('#ratingComment').value,requestCode:$('#requestCode').value})});const out=await res.json();if(!res.ok)throw new Error(out.error||'No se pudo enviar');$('#ratingStatus').textContent='✅ '+out.message;e.currentTarget.reset();state.selectedStars=0;renderRatingPicker();$('#ratingCommentWrap').classList.add('hidden');}catch(err){$('#ratingStatus').textContent='Error: '+err.message;}finally{btn.disabled=false;}});
  load();
})();
