(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const app = { state: null, requests: [], ratings: [], requestFilter: 'all' };
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate = iso => iso ? new Date(iso).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'}) : '—';
  const cleanPhone = (v='') => String(v).replace(/[^0-9]/g,'');
  const waLink = (phone, message='') => `https://wa.me/${cleanPhone(phone)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  const servicesByIds = ids => (ids||[]).map(id=>app.state.services.find(s=>s.id===id)?.name).filter(Boolean).join(', ');
  const statusPill = status => {
    const green=['Activo','Trabajo realizado','Trabajo confirmado','Profesional aceptó','Profesional indicó finalizado','Aprobada','Al día','Sí'].includes(status);
    const red=['Suspendido','Cancelada','No asistió','No concretado','Profesional rechazó','Vencido','No'].includes(status);
    const blue=['Contacto iniciado','Nueva','Visita confirmada','Profesional asignado'].includes(status);
    const pending=['Pendiente de profesional'].includes(status);
    return `<span class="pill ${green?'green':red?'red':blue?'blue':pending?'orange':'orange'}">${esc(status||'Pendiente')}</span>`;
  };
  const saveIndicator = msg => { $('#saveIndicator').textContent=msg; setTimeout(()=>{if($('#saveIndicator').textContent===msg)$('#saveIndicator').textContent='';},3000); };

  async function api(url, options={}) {
    const res = await fetch(url, { ...options, headers: { ...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}), ...(options.headers||{}) } });
    if (res.status===401) { location.href='/acceso.html'; throw new Error('Sesión vencida'); }
    const out = await res.json().catch(()=>({})); if(!res.ok) throw new Error(out.error||'Error de servidor'); return out;
  }
  async function loadAll(){ const out=await api('/api/admin/data'); app.state=out.state; app.requests=out.requests||[]; app.ratings=out.ratings||[]; fillHome(); renderAll(); if(out.initialCleanupPerformed) setTimeout(()=>alert('✓ Se eliminaron los registros de prueba anteriores. Profesionales, servicios, productos y configuración se conservaron.'),150); }
  async function persistState(){ saveIndicator('Guardando…'); const out=await api('/api/admin/save',{method:'POST',body:JSON.stringify({action:'saveState',state:app.state})}); app.state=out.state; renderAll(); saveIndicator('✓ Guardado'); }
  async function uploadFile(file){ if(!file)return ''; const fd=new FormData(); fd.append('file',file); const out=await api('/api/admin/upload',{method:'POST',body:fd}); return out.url; }

  function setTab(name){ $$('.side-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name)); $$('.admin-panel').forEach(p=>p.classList.toggle('active',p.id===`tab-${name}`)); const btn=$(`.side-nav button[data-tab="${name}"]`); $('#pageTitle').textContent=btn?.textContent||'ADMIN'; }
  $$('.side-nav button').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));

  function fillHome(){
    const s=app.state.settings;
    $('#setBrand').value=s.brandName||''; $('#setTagline').value=s.tagline||''; $('#setHeroTitle').value=s.heroTitle||''; $('#setHeroHighlight').value=s.heroHighlight||'';
    $('#setWhatsapp').value=s.whatsapp||''; $('#setHeroSubtitle').value=s.heroSubtitle||''; $('#setSearchPlaceholder').value=s.searchPlaceholder||'';
    $('#setWelcomeTitle').value=s.welcomeTitle||'Bienvenido a Salta Soluciones'; $('#setWelcomeText').value=s.welcomeText||'';
    $('#setServicesTitle').value=s.servicesTitle||''; $('#setServicesSubtitle').value=s.servicesSubtitle||'';
    $('#setHeroStart').value=s.heroStart||'#061f43'; $('#setHeroEnd').value=s.heroEnd||'#0a4b8f'; $('#setTitleColor').value=s.titleColor||'#ffffff'; $('#setHighlightColor').value=s.highlightColor||'#35d1ff'; $('#setGlow').value=s.glow??65;
    $('#setLogoUrl').value=s.logoUrl||'/assets/logo.png'; $('#showPros').checked=s.showProfessionals!==false; $('#showProducts').checked=s.showProducts!==false; previewHome();
  }
  function previewHome(){ const title=$('#setHeroTitle').value||''; const hi=$('#setHeroHighlight').value||''; const idx=hi?title.toLowerCase().lastIndexOf(hi.toLowerCase()):-1; $('#homePreview').style.setProperty('--p-start',$('#setHeroStart').value);$('#homePreview').style.setProperty('--p-end',$('#setHeroEnd').value);$('#homePreview').style.setProperty('--p-title',$('#setTitleColor').value);$('#homePreview').style.setProperty('--p-highlight',$('#setHighlightColor').value);$('#homePreview').style.setProperty('--p-glow',`${4+Number($('#setGlow').value)*.28}px`); $('#previewTitle').innerHTML=idx>=0?`${esc(title.slice(0,idx))}<strong>${esc(title.slice(idx,idx+hi.length))}</strong>${esc(title.slice(idx+hi.length))}`:`${esc(title)} <strong>${esc(hi)}</strong>`; $('#previewSubtitle').textContent=$('#setHeroSubtitle').value; }
  ['setHeroTitle','setHeroHighlight','setHeroSubtitle','setHeroStart','setHeroEnd','setTitleColor','setHighlightColor','setGlow'].forEach(id=>$('#'+id).addEventListener('input',previewHome));
  $('#saveHome').addEventListener('click',async()=>{
    const s=app.state.settings;
    Object.assign(s,{brandName:$('#setBrand').value,tagline:$('#setTagline').value,heroTitle:$('#setHeroTitle').value,heroHighlight:$('#setHeroHighlight').value,whatsapp:$('#setWhatsapp').value,heroSubtitle:$('#setHeroSubtitle').value,searchPlaceholder:$('#setSearchPlaceholder').value,welcomeTitle:$('#setWelcomeTitle').value,welcomeText:$('#setWelcomeText').value,servicesTitle:$('#setServicesTitle').value,servicesSubtitle:$('#setServicesSubtitle').value,heroStart:$('#setHeroStart').value,heroEnd:$('#setHeroEnd').value,titleColor:$('#setTitleColor').value,highlightColor:$('#setHighlightColor').value,glow:Number($('#setGlow').value),showProfessionals:$('#showPros').checked,showProducts:$('#showProducts').checked});
    const file=$('#logoFile').files[0]; if(file){saveIndicator('Subiendo logo…');s.logoUrl=await uploadFile(file);$('#setLogoUrl').value=s.logoUrl;$('#logoFile').value='';}
    await persistState(); alert('Página principal actualizada.');
  });

  function proStats(id){ const rows=app.requests.filter(r=>r.professionalId===id); return {contacts:rows.length,completed:rows.filter(r=>r.clientWork===true).length}; }
  function renderStats(){ $('#statContacts').textContent=app.requests.length; $('#statCompleted').textContent=app.requests.filter(r=>r.clientWork===true).length; $('#statPros').textContent=app.state.professionals.filter(p=>p.status==='Activo').length; $('#statRatings').textContent=app.ratings.length; }
  function renderServices(){ $('#servicesBody').innerHTML=app.state.services.length?app.state.services.map(s=>`<tr><td><div class="thumb-admin">${s.imageUrl?`<img src="${esc(s.imageUrl)}" alt="">`:esc(s.icon||'🔧')}</div></td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.description)}</td><td>${esc(s.whatsapp||'General')}</td><td>${statusPill(s.active!==false?'Activo':'Inactivo')}</td><td><div class="row-actions"><button class="mini-btn" data-edit-service="${esc(s.id)}">Editar</button><button class="mini-btn red" data-delete-service="${esc(s.id)}">Eliminar</button></div></td></tr>`).join(''):'<tr><td colspan="6">No hay servicios.</td></tr>'; $$('[data-edit-service]').forEach(b=>b.addEventListener('click',()=>serviceModal(b.dataset.editService))); $$('[data-delete-service]').forEach(b=>b.addEventListener('click',()=>deleteItem('service',b.dataset.deleteService))); }
  function professionalPortalUrl(p){ return p?.portalToken ? `${location.origin}/profesional.html?token=${encodeURIComponent(p.portalToken)}` : ''; }
  function renderProfessionals(){
    $('#professionalsBody').innerHTML=app.state.professionals.length?app.state.professionals.map(p=>{const st=proStats(p.id);return `<tr><td><div class="thumb-admin">${p.photoUrl?`<img src="${esc(p.photoUrl)}" alt="">`:'👨‍🔧'}</div></td><td><strong>${esc(p.name)}</strong><br><small>${esc(p.whatsapp)}</small></td><td>${esc(servicesByIds(p.serviceIds))}</td><td><strong>${st.contacts}</strong></td><td><strong>${st.completed}</strong></td><td>${esc(p.monthlyFee||'—')}</td><td>${esc(p.nextPayment||'—')}</td><td>${statusPill(p.paymentStatus||'Al día')}</td><td>${statusPill(p.status)}</td><td><div class="row-actions portal-actions"><button class="mini-btn" type="button" data-copy-portal="${esc(p.id)}">🔗 Copiar</button><button class="mini-btn wa-mini" type="button" data-send-portal="${esc(p.id)}">💬 Enviar</button><button class="mini-btn red" type="button" data-regen-portal="${esc(p.id)}">♻️ Regenerar</button></div></td><td><div class="row-actions"><button class="mini-btn" data-edit-pro="${esc(p.id)}">Editar</button><button class="mini-btn red" data-delete-pro="${esc(p.id)}">Eliminar</button></div></td></tr>`;}).join(''):'<tr><td colspan="11">No hay profesionales.</td></tr>';
    $$('[data-edit-pro]').forEach(b=>b.addEventListener('click',()=>professionalModal(b.dataset.editPro)));
    $$('[data-delete-pro]').forEach(b=>b.addEventListener('click',()=>deleteItem('professional',b.dataset.deletePro)));
    $$('[data-copy-portal]').forEach(b=>b.addEventListener('click',()=>copyPortal(b.dataset.copyPortal)));
    $$('[data-send-portal]').forEach(b=>b.addEventListener('click',()=>sendPortal(b.dataset.sendPortal)));
    $$('[data-regen-portal]').forEach(b=>b.addEventListener('click',()=>regeneratePortal(b.dataset.regenPortal)));
  }
  async function copyText(value,message='✓ Copiado'){ try{await navigator.clipboard.writeText(value);saveIndicator(message);}catch{prompt('Copiá este enlace:',value);} }
  async function copyPortal(id){
    const p=app.state.professionals.find(x=>x.id===id);
    const url=professionalPortalUrl(p);
    if(!url){alert('Guardá el profesional una vez para generar su enlace privado.');return;}
    await copyText(url,'✓ Enlace del profesional copiado');
  }
  function sendPortal(id){
    const p=app.state.professionals.find(x=>x.id===id); if(!p)return;
    const phone=cleanPhone(p.whatsapp); const url=professionalPortalUrl(p);
    if(!phone){alert('El profesional no tiene un WhatsApp válido.');return;} if(!url){alert('Guardá el profesional una vez para generar su enlace privado.');return;}
    const msg=`Hola ${p.name}. Este es tu acceso privado permanente a Salta Soluciones. Desde acá podés ver los contactos que recibís y marcar si tomaste, no concretaste o finalizaste un trabajo.\n\nGuardá este enlace en tu celular y no lo compartas:\n${url}`;
    window.open(waLink(phone,msg),'_blank','noopener,noreferrer');
  }
  async function regeneratePortal(id){
    const p=app.state.professionals.find(x=>x.id===id); if(!p)return;
    if(!confirm(`¿Regenerar el enlace privado de ${p.name}? El enlace anterior dejará de funcionar.`))return;
    const out=await api('/api/admin/save',{method:'POST',body:JSON.stringify({action:'regenerateProfessionalToken',id})});
    p.portalToken=out.portalToken; renderProfessionals(); saveIndicator('✓ Nuevo enlace profesional generado');
  }

  function renderProducts(){ $('#productsBody').innerHTML=app.state.products.length?app.state.products.map(p=>`<tr><td><div class="thumb-admin">${p.images?.[0]?`<img src="${esc(p.images[0])}" alt="">`:'📦'}</div></td><td><strong>${esc(p.name)}</strong></td><td>${esc(p.price)}</td><td>${p.images?.length||0}/5</td><td>${statusPill(p.active!==false?'Activo':'Inactivo')}</td><td><div class="row-actions"><button class="mini-btn" data-edit-product="${esc(p.id)}">Editar</button><button class="mini-btn red" data-delete-product="${esc(p.id)}">Eliminar</button></div></td></tr>`).join(''):'<tr><td colspan="6">No hay productos.</td></tr>'; $$('[data-edit-product]').forEach(b=>b.addEventListener('click',()=>productModal(b.dataset.editProduct))); $$('[data-delete-product]').forEach(b=>b.addEventListener('click',()=>deleteItem('product',b.dataset.deleteProduct))); }

  function requestMatches(r){
    if(app.requestFilter==='all')return true;
    if(app.requestFilter==='unassigned')return !r.professionalId;
    if(app.requestFilter==='contact')return !!r.professionalId && r.clientVisit==null;
    if(app.requestFilter==='visit')return r.clientVisit===true&&r.clientWork==null;
    if(app.requestFilter==='completed')return r.clientWork===true||r.professionalWork===true;
    if(app.requestFilter==='issues')return r.clientVisit===false||r.clientWork===false||r.professionalResponse==='Rechazó'||(r.professionalWork===true&&r.clientWork===false);
    return true;
  }
  function yn(v){return v===true?statusPill('Sí'):v===false?statusPill('No'):statusPill('Pendiente');}
  function professionalState(r){
    if(!r.professionalId)return statusPill('Sin profesional');
    if(r.professionalResponse==='Rechazó')return statusPill('Profesional rechazó');
    if(r.professionalWork===true)return statusPill('Profesional indicó finalizado');
    if(r.professionalResponse==='Aceptó')return statusPill('Profesional aceptó');
    return statusPill('Pendiente');
  }
  function clientState(r){
    const visit=r.clientVisit===true?'✅ Visita':r.clientVisit===false?'❌ No asistió':'⏳ Visita';
    const work=r.clientWork===true?'✅ Trabajo':r.clientWork===false?'❌ No realizado':'⏳ Trabajo';
    return `<div class="client-state"><span>${visit}</span><span>${work}</span></div>`;
  }
  function assignmentControl(r){
    const options=app.state.professionals.filter(p=>p.status==='Activo'&&(p.serviceIds||[]).includes(r.serviceId)).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
    if(!options)return '<div class="assign-box"><small>No hay profesionales activos para este servicio.</small></div>';
    return `<div class="assign-box"><select data-assign-select="${esc(r.id)}"><option value="">Elegí profesional</option>${options}</select><button class="mini-btn dispatch-mini" type="button" data-assign-request="${esc(r.id)}">Asignar</button></div>`;
  }
  function renderRequests(){
    const rows=app.requests.filter(requestMatches);
    $('#requestsBody').innerHTML=rows.length?rows.map(r=>{
      const pro=app.state.professionals.find(p=>p.id===r.professionalId);
      const rating=r.clientRatingSubmitted?`<div class="rating-admin ok-rating">⭐ ${Number(r.clientStars)||'—'}/5<br><small>Cliente calificó</small></div>`:'<div class="rating-admin pending-rating">⏳ Sin calificar</div>';
      const desc=r.description?`<div class="request-desc"><strong>📝</strong> ${esc(r.description)}</div>`:'';
      const gps=r.lat!=null&&r.lng!=null?`<br><a class="gps-admin-link" target="_blank" rel="noreferrer" href="https://www.google.com/maps?q=${encodeURIComponent(r.lat+','+r.lng)}">📍 Ver ubicación GPS</a>`:'';
      const phone=esc(r.whatsapp||'—');
      const professionalCell=r.professionalId?`<strong>${esc(r.professionalName||pro?.name||'Profesional')}</strong><br><small>${esc(pro?.whatsapp||'')}</small>`:`<strong class="no-pro-label">Sin profesional</strong>${assignmentControl(r)}`;
      const evalDisabled=!r.professionalId?' disabled title="Primero asigná un profesional"':'';
      const proDisabled=!r.professionalId?' disabled title="Primero asigná un profesional"':'';
      return `<tr><td><strong>${esc(r.code||'—')}</strong><br><small>${fmtDate(r.createdAt)}</small><br><small>${esc(r.channel||'Contacto')}</small></td><td><strong>${esc(r.firstName||'')} ${esc(r.lastName||'')}</strong><div class="client-phone">📱 ${phone}</div><button class="mini-btn wa-mini full-mini" type="button" data-contact-client="${esc(r.id)}">💬 WhatsApp cliente</button></td><td><strong>${esc(r.serviceName||'—')}</strong>${desc}${r.address?`<div class="request-desc"><strong>📌</strong> ${esc(r.address)}${gps}</div>`:gps}</td><td>${professionalCell}</td><td>${professionalState(r)}</td><td>${clientState(r)}</td><td>${rating}</td><td>${statusPill(r.status||'Contacto iniciado')}</td><td><div class="row-actions request-actions"><button class="mini-btn wa-mini" type="button" data-send-eval="${esc(r.id)}"${evalDisabled}>⭐ WhatsApp para calificar</button><button class="mini-btn" type="button" data-copy-eval="${esc(r.id)}"${evalDisabled}>🔗 Copiar acceso</button><button class="mini-btn dispatch-mini" type="button" data-notify-pro="${esc(r.id)}"${proDisabled}>💬 Avisar profesional</button><button class="mini-btn" type="button" data-open-eval="${esc(r.id)}"${evalDisabled}>👁 Abrir Mi solicitud</button><button class="mini-btn red" type="button" data-delete-request="${esc(r.id)}">🗑 Eliminar</button></div></td></tr>`;
    }).join(''):'<tr><td colspan="9">No hay registros para este filtro.</td></tr>';
    $$('[data-contact-client]').forEach(b=>b.onclick=()=>contactClient(b.dataset.contactClient));
    $$('[data-send-eval]').forEach(b=>b.onclick=()=>sendEvaluation(b.dataset.sendEval));
    $$('[data-copy-eval]').forEach(b=>b.onclick=()=>copyEvaluation(b.dataset.copyEval));
    $$('[data-open-eval]').forEach(b=>b.onclick=()=>openEvaluation(b.dataset.openEval));
    $$('[data-notify-pro]').forEach(b=>b.onclick=()=>notifyProfessional(b.dataset.notifyPro));
    $$('[data-assign-request]').forEach(b=>b.onclick=()=>assignProfessional(b.dataset.assignRequest));
    $$('[data-delete-request]').forEach(b=>b.onclick=()=>deleteRequest(b.dataset.deleteRequest));
  }
  async function deleteRequest(id){
    const r=app.requests.find(x=>x.id===id); if(!r)return;
    const label=r.code?`solicitud ${r.code}`:'esta solicitud';
    if(!confirm(`¿Eliminar ${label}?\n\nSe borrará también su calificación asociada, si existe.`))return;
    if(!confirm('Esta acción es permanente y no se puede deshacer. ¿Continuar?'))return;
    await api('/api/admin/save',{method:'POST',body:JSON.stringify({action:'deleteRequest',id})});
    await refreshData(`Solicitud ${r.code||''} eliminada`);
  }

  function contactClient(id){const r=app.requests.find(x=>x.id===id);if(!r)return;const phone=cleanPhone(r.whatsapp);if(!phone){alert('El cliente no tiene WhatsApp válido.');return;}window.open(waLink(phone,`Hola ${r.firstName||''}, te contactamos desde Salta Soluciones por tu solicitud ${r.code||''}.`),'_blank','noopener,noreferrer');}
  async function assignProfessional(id){
    const r=app.requests.find(x=>x.id===id);if(!r)return;
    const select=document.querySelector(`[data-assign-select="${CSS.escape(id)}"]`); const professionalId=select?.value||'';
    if(!professionalId){alert('Elegí un profesional.');return;}
    const out=await api('/api/admin/save',{method:'POST',body:JSON.stringify({action:'assignProfessional',id,professionalId})});
    Object.assign(r,out.request); await refreshData('Profesional asignado');
  }
  function notifyProfessional(id){
    const r=app.requests.find(x=>x.id===id);if(!r||!r.professionalId)return;
    const p=app.state.professionals.find(x=>x.id===r.professionalId); if(!p)return;
    const phone=cleanPhone(p.whatsapp); if(!phone){alert('El profesional no tiene WhatsApp válido.');return;}
    const portal=professionalPortalUrl(p);
    const gps=r.lat!=null&&r.lng!=null?`\n📍 GPS: https://www.google.com/maps?q=${r.lat},${r.lng}`:'';
    const msg=`Hola ${p.name}. Tenés una solicitud de Salta Soluciones.\n\nNúmero de solicitud: ${r.code||''}\nServicio: ${r.serviceName||''}\nCliente: ${r.firstName||''} ${r.lastName||''}\nWhatsApp cliente: ${r.whatsapp||''}\nDirección: ${r.address||'A coordinar'}\nDescripción: ${r.description||'Sin descripción'}${gps}\n\nIngresá a tu portal para confirmar si tomás el trabajo o marcarlo finalizado:\n${portal}`;
    window.open(waLink(phone,msg),'_blank','noopener,noreferrer');
  }
  function clientTrackingUrl(r){return `${location.origin}/?codigo=${encodeURIComponent(r.code||'')}#mi-solicitud`;}
  function sendEvaluation(id){const r=app.requests.find(x=>x.id===id);if(!r)return;if(!r.professionalId){alert('Primero asigná un profesional.');return;}const phone=cleanPhone(r.whatsapp);if(!phone){alert('El cliente no tiene WhatsApp válido.');return;}const url=clientTrackingUrl(r);const msg=`Hola ${r.firstName||''}. Gracias por utilizar Salta Soluciones. Queremos saber cómo fue tu experiencia con ${r.professionalName||'el profesional'}.\n\nTu número de solicitud es: ${r.code||''}\n\nEntrá al enlace, verificá tu solicitud con estos 5 números y el mismo WhatsApp que usaste al pedir el servicio. Ahí podrás confirmar si el profesional asistió, si el trabajo se realizó y calificarlo de 1 a 5 estrellas.\n\n${url}`;window.open(waLink(phone,msg),'_blank','noopener,noreferrer');}
  async function copyEvaluation(id){const r=app.requests.find(x=>x.id===id);if(!r)return;if(!r.professionalId){alert('Primero asigná un profesional.');return;}await copyText(clientTrackingUrl(r),'✓ Enlace de Mi solicitud copiado');}
  function openEvaluation(id){const r=app.requests.find(x=>x.id===id);if(!r)return;if(!r.professionalId){alert('Primero asigná un profesional.');return;}window.open(clientTrackingUrl(r),'_blank','noopener,noreferrer');}
  $$('[data-request-filter]').forEach(b=>b.onclick=()=>{app.requestFilter=b.dataset.requestFilter;$$('[data-request-filter]').forEach(x=>x.classList.toggle('active',x===b));renderRequests();});

  function renderRatings(){ $('#ratingsBody').innerHTML=app.ratings.length?app.ratings.map(r=>`<tr><td>${fmtDate(r.createdAt)}</td><td>${esc(r.professionalName)}</td><td>${'★'.repeat(Number(r.stars)||0)}${'☆'.repeat(5-(Number(r.stars)||0))}</td><td>${esc(r.comment||'—')}</td><td>${esc(r.requestCode||'—')}</td><td>${statusPill(r.approved===true?'Aprobada':'Pendiente')}</td><td><div class="row-actions"><button class="mini-btn" data-approve="${esc(r.id)}">Aprobar</button><button class="mini-btn red" data-reject="${esc(r.id)}">Ocultar</button></div></td></tr>`).join(''):'<tr><td colspan="7">No hay calificaciones.</td></tr>'; $$('[data-approve]').forEach(b=>b.addEventListener('click',()=>moderateRating(b.dataset.approve,true))); $$('[data-reject]').forEach(b=>b.addEventListener('click',()=>moderateRating(b.dataset.reject,false))); }
  function renderAll(){renderStats();renderServices();renderProfessionals();renderProducts();renderRequests();renderRatings();}

  function openModal(title,html){$('#modalTitle').textContent=title;$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden');document.body.style.overflow='hidden';}
  function closeModal(){ $('#modal').classList.add('hidden');document.body.style.overflow=''; }
  $('#modalClose').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});

  function serviceModal(id){const old=app.state.services.find(x=>x.id===id)||{id:crypto.randomUUID(),name:'',slug:'',description:'',icon:'🔧',imageUrl:'',whatsapp:app.state.settings.whatsapp,active:true};openModal(id?'Editar servicio':'Nuevo servicio',`<form id="serviceForm"><div class="form-grid-admin"><label class="admin-field">Nombre<input id="mServiceName" required value="${esc(old.name)}"></label><label class="admin-field">Icono (emoji)<input id="mServiceIcon" value="${esc(old.icon)}"></label><label class="admin-field full">Descripción<input id="mServiceDesc" value="${esc(old.description)}"></label><label class="admin-field">WhatsApp<input id="mServiceWa" value="${esc(old.whatsapp)}"></label><label class="admin-field">Estado<select id="mServiceActive"><option value="true" ${old.active!==false?'selected':''}>Activo</option><option value="false" ${old.active===false?'selected':''}>Inactivo</option></select></label><label class="admin-field">Imagen actual<input id="mServiceImage" readonly value="${esc(old.imageUrl)}"></label><label class="admin-field">Subir imagen<input id="mServiceFile" type="file" accept="image/*"></label></div><div class="form-actions"><button class="admin-btn secondary" type="button" id="cancelModal">Cancelar</button><button class="admin-btn" type="submit">Guardar</button></div></form>`);$('#cancelModal').onclick=closeModal;$('#serviceForm').onsubmit=async e=>{e.preventDefault();let imageUrl=old.imageUrl||'';const f=$('#mServiceFile').files[0];if(f)imageUrl=await uploadFile(f);const obj={...old,name:$('#mServiceName').value,description:$('#mServiceDesc').value,icon:$('#mServiceIcon').value,imageUrl,whatsapp:$('#mServiceWa').value,active:$('#mServiceActive').value==='true'};const i=app.state.services.findIndex(x=>x.id===obj.id);if(i>=0)app.state.services[i]=obj;else app.state.services.push(obj);await persistState();closeModal();};}

  function professionalModal(id){
    const old=app.state.professionals.find(x=>x.id===id)||{id:crypto.randomUUID(),photoUrl:'',name:'',serviceIds:[],yearsExperience:0,whatsapp:'',zone:'',availability:'Disponible',privateNotes:'',monthlyFee:'',nextPayment:'',paymentStatus:'Al día',status:'Activo'};
    const serviceOptions=app.state.services.map(s=>`<label><input type="checkbox" name="proService" value="${esc(s.id)}" ${(old.serviceIds||[]).includes(s.id)?'checked':''}> ${esc(s.name)}</label>`).join('');
    openModal(id?'Editar profesional':'Nuevo profesional',`<form id="proForm"><div class="form-grid-admin"><label class="admin-field">Nombre y apellido<input id="mProName" required value="${esc(old.name)}"></label><label class="admin-field">Años de experiencia<input id="mProYears" type="number" min="0" max="70" value="${Number(old.yearsExperience)||0}"></label><div class="admin-field full">Servicios<div class="check-group">${serviceOptions||'Primero agregá un servicio.'}</div></div><label class="admin-field">WhatsApp<input id="mProWa" required value="${esc(old.whatsapp)}"></label><label class="admin-field">Zona donde trabaja<input id="mProZone" value="${esc(old.zone)}"></label><label class="admin-field">Disponibilidad<input id="mProAvailability" value="${esc(old.availability)}" placeholder="Ej.: Disponible hoy"></label><label class="admin-field">Mensualidad fija<input id="mProFee" value="${esc(old.monthlyFee||'')}" placeholder="Ej.: $ 15.000"></label><label class="admin-field">Próximo vencimiento<input id="mProNextPayment" type="date" value="${esc(old.nextPayment||'')}"></label><label class="admin-field">Estado de pago<select id="mProPaymentStatus">${['Al día','Pendiente','Vencido'].map(x=>`<option ${x===(old.paymentStatus||'Al día')?'selected':''}>${x}</option>`).join('')}</select></label><label class="admin-field">Estado público<select id="mProStatus">${['Activo','Inactivo','Suspendido'].map(x=>`<option ${x===old.status?'selected':''}>${x}</option>`).join('')}</select></label><label class="admin-field full">Observaciones privadas del administrador<textarea id="mProNotes">${esc(old.privateNotes)}</textarea></label><label class="admin-field">Foto actual<input id="mProPhoto" readonly value="${esc(old.photoUrl)}"></label><label class="admin-field">Cambiar foto<input id="mProFile" type="file" accept="image/*"></label></div><div class="form-actions"><button class="admin-btn secondary" type="button" id="cancelModal">Cancelar</button><button class="admin-btn" type="submit">Guardar</button></div></form>`);
    $('#cancelModal').onclick=closeModal;
    $('#proForm').onsubmit=async e=>{e.preventDefault();let photoUrl=old.photoUrl||'';const f=$('#mProFile').files[0];if(f)photoUrl=await uploadFile(f);const obj={...old,photoUrl,name:$('#mProName').value,serviceIds:$$('input[name="proService"]:checked').map(x=>x.value),yearsExperience:Number($('#mProYears').value)||0,whatsapp:$('#mProWa').value,zone:$('#mProZone').value,availability:$('#mProAvailability').value,monthlyFee:$('#mProFee').value,nextPayment:$('#mProNextPayment').value,paymentStatus:$('#mProPaymentStatus').value,privateNotes:$('#mProNotes').value,status:$('#mProStatus').value};const i=app.state.professionals.findIndex(x=>x.id===obj.id);if(i>=0)app.state.professionals[i]=obj;else app.state.professionals.push(obj);await persistState();closeModal();};
  }

  function productModal(id){const old=app.state.products.find(x=>x.id===id)||{id:crypto.randomUUID(),name:'',description:'',price:'',whatsapp:app.state.settings.whatsapp,active:true,images:[]};const slots=[0,1,2,3,4].map(i=>`<div class="image-slot">${old.images[i]?`<img src="${esc(old.images[i])}" alt="Foto ${i+1}"><label><input type="checkbox" data-remove-image="${i}"> Quitar</label>`:`<span>Foto ${i+1}</span>`}<input type="file" data-product-file="${i}" accept="image/*"></div>`).join('');openModal(id?'Editar producto':'Nuevo producto',`<form id="productForm"><div class="form-grid-admin"><label class="admin-field">Nombre<input id="mProductName" required value="${esc(old.name)}"></label><label class="admin-field">Precio público<input id="mProductPrice" required value="${esc(old.price)}" placeholder="$ 25.000"></label><label class="admin-field full">Descripción<textarea id="mProductDesc">${esc(old.description)}</textarea></label><label class="admin-field">WhatsApp<input id="mProductWa" value="${esc(old.whatsapp)}"></label><label class="admin-field">Estado<select id="mProductActive"><option value="true" ${old.active!==false?'selected':''}>Publicado</option><option value="false" ${old.active===false?'selected':''}>Oculto</option></select></label><div class="admin-field full">Galería de imágenes (máximo 5)<div class="image-slots">${slots}</div></div></div><div class="form-actions"><button class="admin-btn secondary" type="button" id="cancelModal">Cancelar</button><button class="admin-btn" type="submit">Guardar producto</button></div></form>`);$('#cancelModal').onclick=closeModal;$('#productForm').onsubmit=async e=>{e.preventDefault();let images=[...(old.images||[])];$$('[data-remove-image]:checked').forEach(x=>{images[Number(x.dataset.removeImage)]=''});for(const inp of $$('[data-product-file]')){if(inp.files[0])images[Number(inp.dataset.productFile)]=await uploadFile(inp.files[0]);}images=images.filter(Boolean).slice(0,5);const obj={...old,name:$('#mProductName').value,description:$('#mProductDesc').value,price:$('#mProductPrice').value,whatsapp:$('#mProductWa').value,active:$('#mProductActive').value==='true',images};const i=app.state.products.findIndex(x=>x.id===obj.id);if(i>=0)app.state.products[i]=obj;else app.state.products.push(obj);await persistState();closeModal();};}

  async function deleteItem(kind,id){if(!confirm('¿Seguro que querés eliminar este elemento?'))return;if(kind==='service'){const used=app.state.professionals.some(p=>p.serviceIds?.includes(id));if(used&&!confirm('Este servicio está asignado a profesionales. Si lo eliminás, dejará de aparecer en sus perfiles. ¿Continuar?'))return;app.state.services=app.state.services.filter(x=>x.id!==id);app.state.professionals.forEach(p=>p.serviceIds=(p.serviceIds||[]).filter(x=>x!==id));}if(kind==='professional')app.state.professionals=app.state.professionals.filter(x=>x.id!==id);if(kind==='product')app.state.products=app.state.products.filter(x=>x.id!==id);await persistState();}
  async function moderateRating(id,approved){await api('/api/admin/save',{method:'POST',body:JSON.stringify({action:'ratingModerate',id,approved})});await refreshData(approved?'Calificación aprobada.':'Calificación ocultada.');}
  async function refreshData(msg='Actualizado'){const out=await api('/api/admin/data');app.state=out.state;app.requests=out.requests||[];app.ratings=out.ratings||[];renderAll();saveIndicator('✓ '+msg);}

  $('#newService').addEventListener('click',()=>serviceModal());$('#newProfessional').addEventListener('click',()=>professionalModal());$('#newProduct').addEventListener('click',()=>productModal());$('#refreshRequests').addEventListener('click',()=>refreshData());$('#refreshRatings').addEventListener('click',()=>refreshData());
  $('#logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:JSON.stringify({})});}catch{}location.href='/acceso.html';});
  loadAll().catch(err=>{console.error(err);alert('No se pudo cargar el panel: '+err.message);});
})();
