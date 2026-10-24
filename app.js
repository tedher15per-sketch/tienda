"use strict";
/* append/replaceChildren ignoran null y false (permite hijos condicionales) */
for(const m of ["append","prepend","replaceChildren"]){const o=Element.prototype[m];Element.prototype[m]=function(...k){return o.apply(this,k.flat().filter(x=>x!=null&&x!==false))}}
/* ---------- utilidades ---------- */
const ICONS={
 chart:'<path d="M4 20V11M10 20V4M16 20v-7M21 20H3"/>',
 cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 10v4M18 10v4"/>',
 box:'<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
 bag:'<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
 truck:'<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 book:'<path d="M5 3h12a2 2 0 012 2v16H7a2 2 0 01-2-2V3z"/><path d="M9 7h6M9 11h6M5 17a2 2 0 012-2h12"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a5.5 5.5 0 013.5 6"/>',
 store:'<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18"/><path d="M9 20v-6h6v6"/>',
 receipt:'<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
 scan:'<path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
 alert:'<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17.5v.5"/>',
 check:'<path d="M5 12l5 5 9-10"/>', edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/>'
};
function ic(n){const s=document.createElement('span');s.className='ic';s.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(ICONS[n]||'')+'</svg>';return s}
document.querySelectorAll('[data-ic]').forEach(e=>e.replaceWith(ic(e.dataset.ic)));
function h(tag,attrs,...kids){const el=document.createElement(tag);
 if(attrs)for(const k in attrs){const v=attrs[k];if(v==null||v===false)continue;
  if(k==='class')el.className=v;else if(k==='style')el.style.cssText=v;
  else if(k.startsWith('on')&&typeof v==='function')el.addEventListener(k.slice(2),v);
  else if(k==='value'||k==='checked'||k==='disabled'||k==='selected')el[k]=v;
  else el.setAttribute(k,v===true?'':String(v));}
 for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;el.append(c instanceof Node?c:document.createTextNode(String(c)))}
 return el}
const $=(s,r=document)=>r.querySelector(s);
const MXN=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
const fmt=n=>MXN.format(+n||0);
const r2=n=>Math.round((+n||0)*100)/100, r3=n=>Math.round((+n||0)*1000)/1000;
const sum=(a,f)=>a.reduce((t,x)=>t+(+f(x)||0),0);
const ymd=ts=>{const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const hhmm=ts=>new Date(ts).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
const dshort=ts=>new Date(ts).toLocaleDateString('es-MX',{day:'numeric',month:'short'});
const when=ts=>ymd(ts)===ymd(Date.now())?'Hoy '+hhmm(ts):dshort(ts)+' '+hhmm(ts);
const folio=()=>(Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,4)).toUpperCase();
const qtyTxt=(q,u)=>(u==='kg'||u==='lt'?(+q).toLocaleString('es-MX',{maximumFractionDigits:3}):String(+q))+' '+(u||'pza');
const step=u=>(u==='kg'||u==='lt')?0.25:1;
const initial=s=>(String(s||'?').trim()[0]||'?').toUpperCase();
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function toast(msg,kind){const t=h('div',{class:kind||''},msg);$('#toast').append(t);setTimeout(()=>t.remove(),kind==='bad'?4200:2400)}
function buzz(){try{navigator.vibrate&&navigator.vibrate(25)}catch(e){}}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Copiado')}catch(e){toast('Selecciona el texto y cópialo manualmente')}}

const CATS=['Abarrotes','Bebidas','Lácteos','Botanas','Panadería','Dulces','Frutas y verduras','Carnes frías','Limpieza','Higiene personal','Mascotas','Otros'];
const UNITS=[['pza','Pieza'],['kg','Kilo'],['lt','Litro'],['paq','Paquete']];
const ROLE_LABEL={admin:'Dueño',cajero:'Cajero',almacen:'Almacén',cliente:'Cliente'};
const VIEWS_BY_ROLE={admin:['resumen','vender','inventario','pedidos','compras','fiado','personal'],cajero:['vender','pedidos','fiado','inventario'],almacen:['inventario','compras'],cliente:['tienda','mispedidos']};
const VIEW_META={resumen:['Resumen','chart'],vender:['Vender','cash'],inventario:['Inventario','box'],pedidos:['Pedidos','bag'],compras:['Compras','truck'],fiado:['Fiado','book'],personal:['Personal','users'],tienda:['Tienda','store'],mispedidos:['Mis pedidos','receipt']};
const PAY={efectivo:'Efectivo',tarjeta:'Tarjeta',transferencia:'Transferencia',fiado:'Fiado'};
const OSTAT={nuevo:'Nuevo',preparando:'Preparando',listo:'Listo',entregado:'Entregado',cancelado:'Cancelado'};

/* ---------- estado ---------- */
const S={db:null,uid:null,email:'',readOnly:false,noDb:false,ready:false,
 config:{name:'Mi Tiendita'},staff:new Map(),requests:[],myRequest:null,products:new Map(),sales:[],orders:[],myOrders:[],purchases:[],fiados:[],
 loaded:{},subs:{},realRole:null,viewAs:null,view:null,viewUpdate:null,modalUpdate:null,
 cart:[],clientCart:lsGet('mt_ccart',[]),posSearch:'',posCat:'',invSearch:'',invFilter:'todos',invCat:'',orderFilter:'activos',shopSearch:'',shopCat:'',fiadoSearch:''};
const role=()=>S.viewAs||S.realRole;
const isStaff=()=>['admin','cajero','almacen'].includes(role());
const canInv=()=>['admin','almacen'].includes(role());
const prods=()=>[...S.products.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'es'));
const isLow=p=>(+p.minStock||0)>0&&(+p.stock||0)<=(+p.minStock||0);
function expDays(p){if(!p.expiry)return null;const d=new Date(p.expiry+'T00:00:00');const t=new Date();t.setHours(0,0,0,0);return Math.round((d-t)/864e5)}
function stockPill(p){const s=+p.stock||0;if(s<=0)return h('span',{class:'pill bad'},'Agotado');if(isLow(p))return h('span',{class:'pill warn'},qtyTxt(s,p.unit));return h('span',{class:'pill ok'},qtyTxt(s,p.unit))}
function expPill(p){const d=expDays(p);if(d===null)return null;if(d<0)return h('span',{class:'pill bad'},'Caducado');if(d<=7)return h('span',{class:'pill warn'},d===0?'Caduca hoy':'Caduca en '+d+' d');return null}
function thumb(p,big){const c='thumb'+(big?' big':'');if(p&&p.photo)return h('img',{class:c,src:p.photo,alt:'',loading:'lazy',onerror:e=>{e.target.replaceWith(h('div',{class:c},initial(p.name)))}});return h('div',{class:c,'aria-hidden':'true'},initial(p&&p.name))}
function findByCode(code){code=String(code||'').trim();if(!code)return null;for(const p of S.products.values())if(p.barcode&&String(p.barcode)===code)return p;return null}

/* ---------- render ---------- */
let raf=0;function schedule(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;render()})}
function render(){
 $('#storeName').textContent=S.config.name||'Mi Tiendita';
 const chip=$('#roleChip');
 if(!S.ready){chip.textContent='Abriendo…';return}
 chip.textContent=(!S.uid&&!S.noDb)?'Entrar':(S.viewAs?'Viendo como ':'')+ROLE_LABEL[role()];
 const views=VIEWS_BY_ROLE[role()];
 if(!views.includes(S.view)){const saved=lsGet('mt_view_'+role(),null);S.view=views.includes(saved)?saved:views[0];S.mounted=null}
 const nav=$('#nav');nav.replaceChildren(...views.map(v=>{const [l,i]=VIEW_META[v];const b=badgeFor(v);
  return h('button',{type:'button','aria-current':v===S.view?'page':null,onclick:()=>go(v)},ic(i),h('span',null,l),b?h('span',{class:'badge num'},b):null)}));
 if(S.mounted!==S.view+'|'+role()){
  S.mounted=S.view+'|'+role();const main=$('#main');main.replaceChildren();
  const top=h('div',{class:'stack',style:'margin-bottom:16px'});main.append(top);S.bannerEl=top;
  const root=h('div',{class:'stack'});main.append(root);S.viewUpdate=VIEWS[S.view](root)||null;window.scrollTo(0,0)}
 drawBanner();
 try{S.viewUpdate&&S.viewUpdate()}catch(e){console.error(e)}
 try{S.modalUpdate&&S.modalUpdate()}catch(e){console.error(e)}
}
function drawBanner(){const b=S.bannerEl;if(!b)return;b.replaceChildren();
 if(S.noDb)b.append(h('div',{class:'banner warn'},ic('alert'),h('div',null,'Falta conectar la base de datos: llena SUPABASE_URL y SUPABASE_ANON_KEY en config.js (ver README).')));
 else if(S.readOnly)b.append(h('div',{class:'banner warn'},ic('alert'),h('div',null,'Tu rol no permite guardar ese cambio. Si trabajas en la tienda, pide al dueño que te asigne el puesto correcto.')));
 if(S.viewAs)b.append(h('div',{class:'banner info'},ic('users'),h('div',{style:'flex:1'},'Estás viendo la app como ',h('b',null,ROLE_LABEL[S.viewAs]),'. Los cambios sí se guardan.'),h('button',{class:'btn ghost',style:'min-height:0;padding:0 6px;color:inherit',onclick:()=>setViewAs(null)},'Volver a Dueño')));
 if(!b.childNodes.length)b.style.display='none';else b.style.display=''}
function badgeFor(v){if(v==='pedidos'){const n=S.orders.filter(o=>o.status==='nuevo').length;return n||null}
 if(v==='personal'){return S.requests.length||null}
 if(v==='inventario'&&canInv()){const n=prods().filter(p=>isLow(p)||(expDays(p)!==null&&expDays(p)<=3)).length;return n||null}
 if(v==='mispedidos'){const n=S.myOrders.filter(o=>o.status==='listo').length;return n||null}return null}
function go(v){S.view=v;lsSet('mt_view_'+role(),v);S.mounted=null;schedule()}
function setViewAs(r){S.viewAs=(r&&r!=='admin')?r:null;ensureSubs();S.view=null;S.mounted=null;closeModal();schedule()}

/* ---------- modal ---------- */
function openModal(title,mount){stopLive();const sh=$('#sheet');sh.replaceChildren();
 const body=h('div',{class:'stack'});
 sh.append(h('div',{class:'grabber'}),h('div',{class:'sheet-head'},h('h2',null,title),h('button',{class:'icon-btn',type:'button','aria-label':'Cerrar',onclick:closeModal},ic('x'))),body);
 $('#modal').hidden=false;S.modalUpdate=mount(body)||null;if(S.modalUpdate)S.modalUpdate();sh.scrollTop=0}
function closeModal(){stopLive();$('#modal').hidden=true;S.modalUpdate=null;$('#sheet').replaceChildren()}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal()});
function confirmInline(container,text,label,action){container.replaceChildren(h('div',{class:'banner warn',style:'flex-direction:column'},h('div',null,text),h('div',{class:'row'},h('button',{class:'btn danger',onclick:action},label),h('button',{class:'btn',onclick:()=>container.replaceChildren()},'No, regresar'))))}

/* ---------- escritura ---------- */
async function save(fn,okMsg){if(!S.db){toast('La base de datos no está disponible.','bad');return false}
 try{await fn();if(okMsg)toast(okMsg);return true}catch(e){handleErr(e);return false}}
function handleErr(e){const c=e&&e.code;console.warn(e);
 if(c==='invalid_argument'){toast('No se guardó: tu rol no tiene permiso para esto.','bad')}
 else if(c==='quota_exceeded')toast('La base de datos está llena. Borra ventas o pedidos antiguos.','bad');
 else if(c==='resource_exhausted')toast('Demasiadas operaciones seguidas. Espera unos segundos.','bad');
 else toast('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.','bad')}
async function adjustStock(pid,delta,reason){const p=S.products.get(pid);if(!p)return;
 if(S.db.stockAdd){await S.db.stockAdd(pid,r3(delta),{d:r3(delta),r:reason,at:Date.now(),by:S.uid||''});return}
 const stock=r3((+p.stock||0)+delta);const log=[{d:r3(delta),r:reason,at:Date.now(),by:S.uid||''},...(p.log||[])].slice(0,25);
 await S.db.doc('products/'+pid).update({stock,log,updatedAt:Date.now()})}
async function applyStockMany(items,sign,reason){const by=new Map();for(const i of items)by.set(i.pid,(by.get(i.pid)||0)+sign*(+i.qty||0));
 await Promise.all([...by].map(([pid,d])=>adjustStock(pid,d,reason)))}

/* ---------- escáner ---------- */
let qrEngine=null,live=null;
async function decodeImage(file){
 if('BarcodeDetector' in window){try{const bd=new BarcodeDetector();const bmp=await createImageBitmap(file);const r=await bd.detect(bmp);if(r&&r[0])return r[0].rawValue}catch(e){}}
 if(window.Html5Qrcode){try{qrEngine=qrEngine||new Html5Qrcode('qr-work',{verbose:false});return await qrEngine.scanFile(file,false)}catch(e){return null}}
 return null}
async function stopLive(){if(!live)return;const l=live;live=null;try{await l.stop()}catch(e){}try{l.clear()}catch(e){}}
/* opts.continuous: la cámara queda abierta y cada código llama onCode (para cobrar en serie). onCode puede regresar un texto para la lista. */
function openScanner(title,onCode,opts){opts=opts||{};openModal(title,body=>{
 const status=h('div',{class:'muted small',style:'text-align:center;min-height:1.2em'});
 const reader=h('div',{id:'reader',class:'reader'});
 const seen=h('div',{class:'list'});
 let lastCode='',lastAt=0;
 const done=code=>{if(!code)return;const now=Date.now();if(code===lastCode&&now-lastAt<2000)return;lastCode=code;lastAt=now;buzz();
  if(opts.continuous){const label=onCode(code);seen.prepend(h('div',{class:'li'},ic(label?'check':'alert'),h('div',{class:'grow'},h('div',{class:'t'},label||'Código '+code+' no registrado')),h('span',{class:'mono small muted'},hhmm(now))));while(seen.childNodes.length>6)seen.lastChild.remove()}
  else{closeModal();onCode(code)}};
 const liveOk=!!(window.Html5Qrcode&&navigator.mediaDevices&&window.isSecureContext);
 const handleFile=async f=>{if(!f)return;status.textContent='Leyendo código…';const code=await decodeImage(f);if(code){status.textContent='';done(String(code).trim())}else status.textContent='No encontré un código en la foto. Acércate, enfoca y evita reflejos.'};
 const manual=h('input',{class:'input mono',id:'scan-manual',inputmode:'numeric',placeholder:'7501234567890',autocomplete:'off',onkeydown:e=>{if(e.key==='Enter'&&e.target.value.trim()){const v=e.target.value.trim();e.target.value='';done(v)}}});
 if(liveOk)body.append(reader,h('div',{class:'laser',style:'margin:-2px auto 0'}));
 body.append(
  h('label',{class:liveOk?'btn block':'scan-drop'},ic('camera'),liveOk?'Tomar foto del código':h('div',{style:'font-size:17px'},'Tomar foto del código'),h('input',{type:'file',accept:'image/*',capture:'environment',style:'position:absolute;width:1px;height:1px;opacity:0',onchange:e=>handleFile(e.target.files[0])})),
  status,
  h('div',{class:'field'},h('span',null,'O escribe el código / usa lectora USB o Bluetooth'),h('div',{class:'row',style:'flex-wrap:nowrap'},manual,h('button',{class:'btn primary',onclick:()=>{const v=manual.value.trim();if(v){manual.value='';done(v)}}},'Buscar'))),
  opts.continuous?h('div',{class:'stack',style:'gap:6px'},h('span',{class:'eyebrow'},'Escaneados'),seen,h('button',{class:'btn hot block',onclick:closeModal},'Listo')):null);
 if(liveOk)setTimeout(async()=>{try{await stopLive();live=new Html5Qrcode('reader',{verbose:false});
   await live.start({facingMode:'environment'},{fps:12,qrbox:(w,hh)=>({width:Math.floor(Math.min(w*0.86,340)),height:Math.floor(Math.min(hh*0.55,190))})},t=>done(String(t).trim()),()=>{})}
  catch(e){console.warn(e);live=null;reader.replaceWith(h('div',{class:'banner warn'},ic('alert'),h('div',null,'No se pudo abrir la cámara. Da permiso de cámara al navegador o usa “Tomar foto”.')))}},80);
 else if(matchMedia('(pointer:fine)').matches)setTimeout(()=>manual.focus(),50)})}
function globalScan(){openScanner('Escanear',code=>{const p=findByCode(code);
 if(role()==='cliente'){if(p){addClient(p,1);toast(p.name+' agregado a tu pedido')}else toast('No tenemos ese producto en la tienda','bad');return}
 if(S.view==='vender'){addByCode(code);return}
 if(p){openProduct(p.id);return}
 if(canInv()){toast('Código nuevo: da de alta el producto');openProductForm(null,code)}else toast('Ese código no está en el inventario','bad')})}
function posScan(){openScanner('Cobrar escaneando',code=>{const p=findByCode(code);if(!p){toast('Código '+code+' no registrado','bad');return null}addToCart(p);S.posUpd&&S.posUpd();return p.name+' · '+fmt(p.price)},{continuous:true})}
$('#scanBtn').addEventListener('click',globalScan);
$('#roleChip').addEventListener('click',openRoleMenu);

/* ---------- VISTAS ---------- */
const VIEWS={};
function empty(title,text,...actions){return h('div',{class:'empty'},h('h3',null,title),h('p',null,text),actions.length?h('div',{class:'row',style:'justify-content:center'},actions):null)}
function panel(title,content,extra){return h('section',{class:'panel'},h('h3',null,h('span',null,title),extra||null),content)}
function kpi(label,value,onclick){return h(onclick?'button':'div',{class:'kpi',type:onclick?'button':null,onclick},h('b',null,value),h('span',null,label))}
function notLoaded(k){return !S.loaded[k]}

/* RESUMEN */
VIEWS.resumen=root=>{const body=h('div',{class:'stack'});root.append(body);return()=>{
 body.replaceChildren();const today=ymd(Date.now());const st=S.sales.filter(s=>ymd(s.at)===today);const tot=sum(st,s=>s.total);
 const pend=S.orders.filter(o=>['nuevo','preparando','listo'].includes(o.status)).length;
 const all=prods();const low=all.filter(isLow);const exp=all.filter(p=>{const d=expDays(p);return d!==null&&d<=7}).sort((a,b)=>expDays(a)-expDays(b));
 const debt=sum(S.fiados,f=>Math.max(0,f.balance||0));
 body.append(h('div',{class:'head'},h('div',null,h('div',{class:'eyebrow'},new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'})),h('h1',{class:'display'},'Así va la tienda')),
   h('div',{class:'row'},h('button',{class:'btn hot',onclick:()=>go('vender')},ic('cash'),'Abrir caja'))));
 if(S.requests.length)body.append(h('button',{class:'banner info',style:'border:0;text-align:left;width:100%',onclick:()=>go('personal')},ic('users'),h('div',null,S.requests.length===1?'1 persona pidió acceso como personal. Revísalo en Personal.':S.requests.length+' personas pidieron acceso como personal.')));
 body.append(h('div',{class:'kpis'},kpi('Ventas de hoy',fmt(tot)),kpi('Tickets de hoy',st.length),kpi('Ticket promedio',st.length?fmt(tot/st.length):'—'),kpi('Pedidos por atender',pend,()=>go('pedidos')),kpi('Fiado por cobrar',fmt(debt),()=>go('fiado'))));
 const alerts=h('div',{class:'list'});
 if(notLoaded('products'))alerts.append(h('p',{class:'muted'},'Cargando inventario…'));
 else if(!low.length&&!exp.length)alerts.append(h('p',{class:'muted',style:'margin:0'},'Todo en orden: nada agotándose ni por caducar esta semana.'));
 [...exp.map(p=>[p,expPill(p)]),...low.filter(p=>!exp.includes(p)).map(p=>[p,stockPill(p)])].slice(0,8).forEach(([p,pill])=>alerts.append(
  h('button',{class:'li',onclick:()=>openProduct(p.id)},thumb(p),h('div',{class:'grow'},h('div',{class:'t'},p.name),h('div',{class:'s'},isLow(p)?'Mínimo '+qtyTxt(p.minStock,p.unit)+' · hay '+qtyTxt(p.stock,p.unit):'Caduca el '+p.expiry)),pill)));
 const lowBtn=low.length&&canInv()?h('button',{class:'btn ghost',style:'min-height:0;padding:0',onclick:suggestPurchase},'Pedir al proveedor'):null;
 body.append(h('div',{class:'grid2'},panel('Ventas · últimos 7 días',weekChart()),panel('Necesita atención',alerts,lowBtn)));
 body.append(h('div',{class:'grid2'},panel('Lo más vendido hoy',topList(st)),panel('Últimas ventas',recentSales())))}};
function weekChart(){const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);days.push(d)}
 const vals=days.map(d=>sum(S.sales.filter(s=>ymd(s.at)===ymd(+d)),s=>s.total));const max=Math.max(...vals,1);
 const W=340,H=170,top=24,bot=26,left=8,bw=(W-left*2)/7;let g='';
 for(let k=1;k<=3;k++){const y=top+(H-top-bot)*k/3;g+=`<line x1="${left}" x2="${W-left}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="2 4"/>`}
 vals.forEach((v,i)=>{const bh=(H-top-bot)*v/max;const x=left+i*bw+bw*0.18;const w=bw*0.64;const y=H-bot-bh;const isT=i===6;
  g+=`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(bh,v?2:0)}" rx="5" fill="${isT?'var(--accent)':'var(--green)'}" opacity="${isT?1:.75}"/>`;
  if(v>0)g+=`<text x="${x+w/2}" y="${y-6}" text-anchor="middle" font-size="10.5" font-family="IBM Plex Mono,monospace" fill="var(--ink)">${v>=1000?'$'+(v/1000).toFixed(1)+'k':'$'+Math.round(v)}</text>`;
  const lab=days[i].toLocaleDateString('es-MX',{weekday:'short'}).replace('.','');
  g+=`<text x="${x+w/2}" y="${H-8}" text-anchor="middle" font-size="11" font-weight="${isT?700:500}" fill="${isT?'var(--ink)':'var(--muted)'}">${isT?'hoy':lab}</text>`});
 const d=h('div',{class:'chart'});d.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ventas por día de la última semana">${g}</svg>`;
 if(!sum(vals,v=>v))d.append(h('p',{class:'muted small',style:'margin:6px 0 0'},'Aún no hay ventas registradas. Cobra la primera desde Vender.'));return d}
function topList(st){const m=new Map();st.forEach(s=>(s.items||[]).forEach(i=>{const c=m.get(i.pid)||{name:i.name,qty:0,amt:0,unit:i.unit};c.qty+=+i.qty;c.amt+=i.qty*i.price;m.set(i.pid,c)}));
 const top=[...m.values()].sort((a,b)=>b.amt-a.amt).slice(0,6);if(!top.length)return h('p',{class:'muted',style:'margin:0'},'Cuando vendas, aquí verás los productos que más dinero dejan hoy.');
 const mx=top[0].amt||1;return h('div',null,top.map(t=>h('div',{class:'bar-row'},h('div',{style:'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'},t.name,h('span',{class:'muted small'},' · '+qtyTxt(r3(t.qty),t.unit))),h('div',{class:'b'},h('i',{style:'width:'+(100*t.amt/mx)+'%'})),h('span',{class:'mono small'},fmt(t.amt)))))}
function recentSales(){const s=S.sales.slice(0,8);if(!s.length)return h('p',{class:'muted',style:'margin:0'},'Sin ventas todavía.');
 return h('div',{class:'list'},s.map(x=>h('button',{class:'li',onclick:()=>showTicket(x)},h('span',{class:'mono small muted'},'#'+x.folio),h('div',{class:'grow'},h('div',{class:'t'},when(x.at)),h('div',{class:'s'},(x.items||[]).length+' artículos'+(x.origin==='pedido'?' · pedido':''))),h('span',{class:'pill '+(x.payment==='fiado'?'hot':'neutral')},PAY[x.payment]||x.payment),h('b',{class:'mono'},fmt(x.total)))))}

/* VENDER */
VIEWS.vender=root=>{
 const inp=h('input',{class:'input',id:'pos-search',placeholder:'Escanea con lectora, o busca por nombre o código',autocomplete:'off',value:S.posSearch,
  oninput:e=>{S.posSearch=e.target.value;upd()},onkeydown:e=>{if(e.key==='Enter'){const v=e.target.value.trim();if(!v)return;const p=findByCode(v);
   if(p){addToCart(p);e.target.value='';S.posSearch='';upd();return}const f=posFiltered();if(f.length===1){addToCart(f[0]);e.target.value='';S.posSearch='';upd()}else if(/^\d{6,}$/.test(v)){toast('Código '+v+' no registrado','bad');e.target.select()}}}});
 const chips=h('div',{class:'chips'});
 const tiles=h('div',{class:'tiles'});const aside=h('aside',{class:'panel'});
 const bar=h('div',{class:'paybar pos-bar'});
 root.append(h('div',{class:'head'},h('h1',{class:'display'},'Vender'),h('span',{class:'muted small'},'Atiende: '+ROLE_LABEL[role()])),
  h('div',{class:'searchbar'},h('div',{class:'wrap'},ic('search'),inp),h('button',{class:'btn hot',onclick:posScan},ic('camera'),h('span',null,'Cámara'))),
  chips,h('div',{class:'pos'},h('div',{class:'stack'},tiles),aside),bar);
 if(matchMedia('(pointer:fine)').matches)setTimeout(()=>inp.focus(),30);
 function upd(){
  const cats=[...new Set(prods().map(p=>p.category).filter(Boolean))];
  chips.replaceChildren(...['',...cats].map(c=>h('button',{type:'button','aria-pressed':String(S.posCat===c),onclick:()=>{S.posCat=c;upd()}},c||'Todo')));
  const list=posFiltered();tiles.replaceChildren();
  if(notLoaded('products'))tiles.append(h('p',{class:'muted'},'Cargando productos…'));
  else if(!S.products.size)tiles.append(empty('Sin productos todavía','Da de alta tu primer producto escaneando su código.',canInv()?h('button',{class:'btn primary',onclick:()=>openProductForm()},ic('plus'),'Nuevo producto'):null));
  else if(!list.length)tiles.append(h('p',{class:'muted'},'Nada coincide con “'+S.posSearch+'”.'));
  list.slice(0,48).forEach(p=>tiles.append(h('button',{class:'tile',onclick:()=>{addToCart(p);upd()}},h('div',{class:'n'},p.name),h('div',{class:'row',style:'gap:6px'},stockPill(p)),h('div',{class:'p'},fmt(p.price),h('span',{class:'muted small'},' /'+(p.unit||'pza'))))));
  aside.replaceChildren(h('h3',null,h('span',null,'Ticket actual'),S.cart.length?h('button',{class:'btn ghost',style:'min-height:0;padding:0',onclick:()=>{S.cart=[];upd()}},'Vaciar'):null),cartBox(S.cart,upd,true));
  const tot=sum(S.cart,i=>i.qty*i.price);bar.hidden=!S.cart.length;
  bar.replaceChildren(h('button',{class:'btn hot',onclick:openCheckout},'Cobrar '+fmt(tot)+' · '+S.cart.length+(S.cart.length===1?' producto':' productos')))}
 S.posUpd=upd;return upd};
function posFiltered(){const q=S.posSearch.trim().toLowerCase();return prods().filter(p=>(!S.posCat||p.category===S.posCat)&&(!q||String(p.name).toLowerCase().includes(q)||String(p.barcode||'').includes(q)))}
function addToCart(p,qty){qty=qty||1;const l=S.cart.find(i=>i.pid===p.id);if(l)l.qty=r3(l.qty+qty);else S.cart.push({pid:p.id,name:p.name,price:+p.price||0,unit:p.unit||'pza',qty});buzz();
 if((+p.stock||0)<(l?l.qty:qty))toast('Ojo: '+p.name+' no tiene suficiente existencia')}
function addByCode(code){const p=findByCode(code);if(p){addToCart(p);toast(p.name+' · '+fmt(p.price));schedule()}else{toast('Código '+code+' no registrado','bad');if(canInv())openProductForm(null,code)}}
function cartBox(cart,onChange,withBtn){const box=h('div');
 if(!cart.length){box.append(h('p',{class:'muted',style:'margin:0'},'Escanea o toca un producto para agregarlo.'));return box}
 cart.forEach((l,ix)=>box.append(h('div',{class:'cart-line'},
  h('div',{style:'min-width:0'},h('div',{style:'font-weight:600'},l.name),h('div',{class:'muted small mono'},fmt(l.price)+' × '+qtyTxt(l.qty,l.unit))),
  h('b',{class:'mono',style:'text-align:right'},fmt(l.qty*l.price)),
  h('div',{class:'qty'},h('button',{type:'button','aria-label':'Quitar uno',onclick:()=>{l.qty=r3(l.qty-step(l.unit));if(l.qty<=0)cart.splice(ix,1);onChange()}},ic('minus')),
   h('span',{class:'mono'},qtyTxt(l.qty,l.unit)),h('button',{type:'button','aria-label':'Agregar uno',onclick:()=>{l.qty=r3(l.qty+step(l.unit));onChange()}},ic('plus'))),
  h('button',{class:'btn ghost',style:'min-height:0;padding:0;justify-self:end',onclick:()=>{cart.splice(ix,1);onChange()}},'Quitar'))));
 const tot=sum(cart,i=>i.qty*i.price);box.append(h('div',{class:'totline'},h('span',{class:'eyebrow'},'Total'),h('b',null,fmt(tot))));
 if(withBtn)box.append(h('button',{class:'btn hot block',style:'margin-top:12px;min-height:52px;font-size:16px',onclick:openCheckout},'Cobrar'));return box}
function openCheckout(m0,f0){if(!S.cart.length)return;let method=typeof m0==='string'?m0:'efectivo',fiadoId=f0||'';
 openModal('Cobrar',body=>{
  const items=h('div');const tot=()=>r2(sum(S.cart,i=>i.qty*i.price));
  const recv=h('input',{class:'input mono',id:'co-recv',type:'number',inputmode:'decimal',min:'0',step:'0.5',placeholder:'0.00',oninput:drawChange});
  const change=h('div',{class:'totline'});const payBox=h('div',{class:'stack',style:'gap:10px'});
  const go_=h('button',{class:'btn hot block',style:'min-height:54px;font-size:17px',onclick:async()=>{
   if(method==='fiado'&&!fiadoId){toast('Elige a quién se le fía','bad');return}
   go_.disabled=true;const r=+recv.value||0;const ok=await createSale(method,{received:method==='efectivo'?r:null,fiadoId:method==='fiado'?fiadoId:null});if(!ok)go_.disabled=false}},'Confirmar venta');
  function drawItems(){items.replaceChildren(cartBox(S.cart,()=>{drawItems();drawChange();S.posUpd&&S.posUpd();if(!S.cart.length)closeModal()}))}
  function drawChange(){const r=+recv.value||0;const c=r-tot();change.replaceChildren(h('span',{class:'eyebrow'},'Cambio'),h('b',{style:'color:'+(c<0?'var(--bad)':'var(--ok)')},r?fmt(Math.max(c,0)):'—'));if(r&&c<0)change.append(h('span',{class:'small',style:'color:var(--bad)'},'Faltan '+fmt(-c)))}
  function drawPay(){payBox.replaceChildren();
   if(method==='efectivo'){const bills=[20,50,100,200,500];payBox.append(h('div',{class:'field'},h('span',null,'Recibido'),recv),h('div',{class:'chips'},h('button',{type:'button',onclick:()=>{recv.value=tot();drawChange()}},'Exacto'),bills.map(b=>h('button',{type:'button',onclick:()=>{recv.value=b;drawChange()}},'$'+b))),change);drawChange()}
   else if(method==='fiado'){const sel=h('select',{class:'input',id:'co-fiado',onchange:e=>{fiadoId=e.target.value;drawPay()}},h('option',{value:''},'Elige cliente…'),S.fiados.slice().sort((a,b)=>String(a.name).localeCompare(b.name)).map(f=>h('option',{value:f.id,selected:f.id===fiadoId},f.name+' · debe '+fmt(f.balance))));
    payBox.append(h('div',{class:'field'},h('span',null,'Cliente del cuaderno'),sel),h('button',{class:'btn',onclick:()=>openFiadoForm(id=>openCheckout('fiado',id))},ic('plus'),'Cliente nuevo'));
    const f=S.fiados.find(x=>x.id===fiadoId);if(f&&f.limit&&(f.balance+tot())>f.limit)payBox.append(h('div',{class:'banner warn'},ic('alert'),h('div',null,'Con esta venta pasa su límite de '+fmt(f.limit)+'.')))}
   else payBox.append(h('p',{class:'muted',style:'margin:0'},method==='tarjeta'?'Cobra en la terminal y confirma cuando salga aprobado.':'Confirma cuando veas la transferencia en tu banca.'))}
  const seg=h('div',{class:'seg'},Object.keys(PAY).map(k=>h('button',{type:'button','aria-pressed':String(k===method),onclick:e=>{method=k;seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===e.currentTarget)));drawPay()}},PAY[k])));
  body.append(items,h('div',{class:'field'},h('span',null,'Forma de pago'),seg),payBox,go_);drawItems();drawPay()})}
async function createSale(payment,extra){const items=S.cart.map(i=>({pid:i.pid,name:i.name,qty:i.qty,price:i.price,unit:i.unit}));const total=r2(sum(items,i=>i.qty*i.price));const id=folio();
 const sale={folio:id,items,total,payment,cashier:S.uid||'',at:Date.now(),origin:'mostrador'};if(extra.received)sale.received=extra.received;if(extra.fiadoId)sale.fiadoId=extra.fiadoId;
 const ok=await save(async()=>{await S.db.doc('sales/'+id).set(sale);await applyStockMany(items,-1,'Venta #'+id);if(payment==='fiado')await fiadoMove(extra.fiadoId,'cargo',total,'Venta #'+id)});
 if(ok){S.cart=[];S.posUpd&&S.posUpd();showTicket(sale)}return ok}
function showTicket(s){openModal('Ticket #'+s.folio,body=>{const lines=(s.items||[]).map(i=>h('div',null,h('div',null,i.name),h('div',{class:'l'},h('span',null,qtyTxt(i.qty,i.unit)+' × '+fmt(i.price)),h('span',null,fmt(i.qty*i.price)))));
 const chg=s.received?s.received-s.total:null;const f=s.fiadoId?S.fiados.find(x=>x.id===s.fiadoId):null;
 const t=h('div',{class:'ticket'},h('div',{class:'c big'},S.config.name||'Mi Tiendita'),h('div',{class:'c'},'Folio #'+s.folio),h('div',{class:'c'},new Date(s.at).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'})),h('hr'),lines,h('hr'),
  h('div',{class:'l big'},h('span',null,'TOTAL'),h('span',null,fmt(s.total))),h('div',{class:'l'},h('span',null,'Pago'),h('span',null,PAY[s.payment]||s.payment)),
  s.received?h('div',{class:'l'},h('span',null,'Recibido'),h('span',null,fmt(s.received))):null,chg!=null?h('div',{class:'l'},h('span',null,'Cambio'),h('span',null,fmt(chg))):null,
  f?h('div',{class:'l'},h('span',null,'Fiado a'),h('span',null,f.name)):null,h('hr'),h('div',{class:'c'},'¡Gracias por su compra!'));
 const txt=[S.config.name||'Mi Tiendita','Folio #'+s.folio,new Date(s.at).toLocaleString('es-MX'),'',...(s.items||[]).map(i=>qtyTxt(i.qty,i.unit)+' '+i.name+'  '+fmt(i.qty*i.price)),'','TOTAL '+fmt(s.total),'Pago: '+(PAY[s.payment]||s.payment)].join('\n');
 body.append(t,h('div',{class:'row'},h('button',{class:'btn',onclick:()=>copy(txt)},ic('copy'),'Copiar ticket'),S.view==='vender'?h('button',{class:'btn primary',style:'flex:1',onclick:()=>{closeModal();const i=$('#pos-search');i&&i.focus()}},'Nueva venta'):null))})}

/* INVENTARIO */
VIEWS.inventario=root=>{
 const inp=h('input',{class:'input',id:'inv-search',placeholder:'Buscar por nombre o código',value:S.invSearch,oninput:e=>{S.invSearch=e.target.value;upd()}});
 const chips=h('div',{class:'chips'});const head=h('div',{class:'row'});const list=h('div',{class:'panel',style:'padding:6px 14px'});
 root.append(h('div',{class:'head'},h('h1',{class:'display'},'Inventario'),head),h('div',{class:'searchbar'},h('div',{class:'wrap'},ic('search'),inp),h('button',{class:'icon-btn','aria-label':'Escanear',onclick:globalScan},ic('scan'))),chips,list);
 function upd(){const all=prods();
  head.replaceChildren(canInv()?h('button',{class:'btn primary',onclick:()=>openProductForm()},ic('plus'),'Nuevo producto'):null,
   role()==='admin'&&all.some(p=>p.example)?h('button',{class:'btn ghost',onclick:clearExamples},'Quitar ejemplos'):null);
  const lowN=all.filter(isLow).length,expN=all.filter(p=>{const d=expDays(p);return d!==null&&d<=7}).length;const cats=[...new Set(all.map(p=>p.category).filter(Boolean))];
  chips.replaceChildren(...[['todos','Todos ('+all.length+')'],['bajo','Stock bajo ('+lowN+')'],['cad','Por caducar ('+expN+')']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(S.invFilter===k),onclick:()=>{S.invFilter=k;upd()}},l)),
   ...cats.map(c=>h('button',{type:'button','aria-pressed':String(S.invCat===c),onclick:()=>{S.invCat=S.invCat===c?'':c;upd()}},c)));
  const q=S.invSearch.trim().toLowerCase();
  const f=all.filter(p=>(!q||String(p.name).toLowerCase().includes(q)||String(p.barcode||'').includes(q))&&(!S.invCat||p.category===S.invCat)&&(S.invFilter!=='bajo'||isLow(p))&&(S.invFilter!=='cad'||(expDays(p)!==null&&expDays(p)<=7)));
  list.replaceChildren();
  if(notLoaded('products')){list.append(h('p',{class:'muted'},'Cargando inventario…'));return}
  if(!all.length){list.style.padding='0';list.style.border='0';list.append(empty('Tu inventario está vacío','Escanea el código de un producto con la cámara del celular y llena precio y existencia. Si el producto no trae código, déjalo vacío.',canInv()?h('button',{class:'btn primary',onclick:globalScan},ic('camera'),'Escanear primer producto'):null));return}
  list.style.padding='6px 14px';list.style.border='';
  if(!f.length){list.append(h('p',{class:'muted'},'Ningún producto coincide.'));return}
  const valor=sum(f,p=>(+p.cost||0)*Math.max(0,+p.stock||0));
  list.append(h('div',{class:'spread small muted',style:'padding:8px 4px'},h('span',null,f.length+' productos'),role()==='admin'?h('span',null,'Valor a costo: ',h('b',{class:'mono'},fmt(valor))):null));
  f.forEach(p=>list.append(h('button',{class:'li inv-row',onclick:()=>openProduct(p.id)},thumb(p),
   h('div',{style:'min-width:0'},h('div',{class:'t'},p.name,p.example?h('span',{class:'pill neutral',style:'margin-left:6px'},'ejemplo'):null),h('div',{class:'s mono'},(p.barcode||'sin código')+' · '+(p.category||'—'))),
   h('span',{class:'mono price'},fmt(p.price)),h('div',{class:'row',style:'gap:4px;justify-content:flex-end'},expPill(p),stockPill(p)))))}
 return upd};
async function clearExamples(){const ex=prods().filter(p=>p.example);openModal('Quitar ejemplos',b=>{b.append(h('p',null,'Se borrarán '+ex.length+' productos marcados como ejemplo. Tus productos reales no se tocan.'),
 h('button',{class:'btn danger block',onclick:async()=>{closeModal();await save(async()=>{for(const p of ex)await S.db.doc('products/'+p.id).delete()},'Ejemplos borrados')}},'Borrar '+ex.length+' ejemplos'))})}
function openProduct(id){openModal('Producto',body=>{
 const top=h('div');const adj=h('div');const logBox=h('div');const actions=h('div',{class:'row'});const conf=h('div');
 const qty=h('input',{class:'input mono',id:'adj-qty',type:'number',inputmode:'decimal',min:'0',step:'any',placeholder:'Cantidad'});
 const reason=h('select',{class:'input',id:'adj-reason'},['Compra a proveedor','Merma o caducado','Devolución','Conteo físico','Consumo interno'].map(r=>h('option',null,r)));
 body.append(top,adj,logBox,actions,conf);
 if(canInv())adj.append(h('section',{class:'panel stack',style:'gap:10px'},h('h3',{style:'margin:0'},'Mover existencia'),h('div',{class:'form-grid'},h('label',{class:'field'},h('span',null,'Cantidad'),qty),h('label',{class:'field'},h('span',null,'Motivo'),reason)),
  h('div',{class:'row'},h('button',{class:'btn primary',onclick:()=>mv(1)},ic('plus'),'Entrada'),h('button',{class:'btn',onclick:()=>mv(-1)},ic('minus'),'Salida'),h('button',{class:'btn ghost',onclick:()=>mv(0)},'Fijar conteo exacto'))));
 async function mv(sign){const p=S.products.get(id);const q=+qty.value;if(!(q>=0)||qty.value===''){toast('Escribe una cantidad','bad');return}
  const delta=sign===0?q-(+p.stock||0):sign*q;if(!delta){toast('Sin cambios');return}
  if(await save(()=>adjustStock(id,delta,sign===0?'Conteo físico':reason.value),'Existencia actualizada'))qty.value=''}
 return()=>{const p=S.products.get(id);if(!p){top.replaceChildren(h('p',{class:'muted'},'Este producto ya no existe.'));adj.hidden=true;logBox.replaceChildren();actions.replaceChildren();return}
  adj.hidden=false;const margin=p.price&&p.cost?Math.round(100*(p.price-p.cost)/p.price):null;
  top.replaceChildren(h('div',{class:'row',style:'align-items:flex-start;flex-wrap:nowrap;gap:16px'},thumb(p,true),h('div',{style:'min-width:0;flex:1'},h('h3',{style:'font-size:20px'},p.name),h('div',{class:'mono small muted'},p.barcode||'sin código'),
   h('div',{class:'row',style:'gap:6px;margin-top:8px'},h('span',{class:'pill green'},p.category||'Sin categoría'),expPill(p),p.example?h('span',{class:'pill neutral'},'ejemplo'):null))),
   h('div',{class:'kpis',style:'margin-top:14px'},kpi('Existencia',qtyTxt(p.stock||0,p.unit)),kpi('Precio venta',fmt(p.price)),role()!=='cajero'?kpi('Costo · margen',fmt(p.cost)+(margin!=null?' · '+margin+'%':'')):null,kpi('Mínimo',qtyTxt(p.minStock||0,p.unit))));
  logBox.replaceChildren(panel('Movimientos recientes',(p.log&&p.log.length)?h('div',{class:'list'},p.log.map(l=>h('div',{class:'li'},h('span',{class:'pill '+(l.d>0?'ok':'bad'),style:'min-width:64px;justify-content:center'},(l.d>0?'+':'')+qtyTxt(l.d,p.unit)),h('div',{class:'grow'},h('div',{class:'t',style:'font-weight:500'},l.r),h('div',{class:'s'},when(l.at)))))):h('p',{class:'muted',style:'margin:0'},'Sin movimientos todavía.')));
  actions.replaceChildren(S.view==='vender'||role()==='cajero'?h('button',{class:'btn hot',onclick:()=>{addToCart(p);closeModal();schedule()}},ic('cash'),'Agregar al ticket'):null,
   canInv()?h('button',{class:'btn',onclick:()=>openProductForm(p)},ic('edit'),'Editar'):null,
   role()==='admin'?h('button',{class:'btn ghost danger',style:'border-color:transparent',onclick:()=>confirmInline(conf,'¿Borrar “'+p.name+'”? Las ventas pasadas se conservan.','Sí, borrar',async()=>{closeModal();await save(()=>S.db.doc('products/'+id).delete(),'Producto borrado')})},'Borrar'):null)}})}
function openProductForm(p,presetCode){const isNew=!p;p=p||{};let photo=p.photo||'';
 openModal(isNew?'Nuevo producto':'Editar producto',body=>{
  const f={};const mk=(k,attrs)=>f[k]=h('input',Object.assign({class:'input',id:'pf-'+k},attrs));
  mk('barcode',{class:'input mono',inputmode:'numeric',value:presetCode||p.barcode||'',placeholder:'Escanea o escribe'});
  mk('name',{value:p.name||'',placeholder:'Ej. Refresco de cola 600 ml',required:true});
  mk('price',{class:'input mono',type:'number',inputmode:'decimal',step:'0.5',min:'0',value:p.price!=null?p.price:''});
  mk('cost',{class:'input mono',type:'number',inputmode:'decimal',step:'0.5',min:'0',value:p.cost!=null?p.cost:''});
  mk('stock',{class:'input mono',type:'number',inputmode:'decimal',step:'any',min:'0',value:p.stock!=null?p.stock:''});
  mk('minStock',{class:'input mono',type:'number',inputmode:'decimal',step:'any',min:'0',value:p.minStock!=null?p.minStock:''});
  mk('expiry',{type:'date',value:p.expiry||''});
  f.category=h('select',{class:'input',id:'pf-cat'},CATS.map(c=>h('option',{selected:(p.category||'Abarrotes')===c},c)));
  f.unit=h('select',{class:'input',id:'pf-unit'},UNITS.map(([v,l])=>h('option',{value:v,selected:(p.unit||'pza')===v},l)));
  const marg=h('div',{class:'small muted'});const updM=()=>{const pr=+f.price.value,c=+f.cost.value;marg.textContent=pr&&c?'Ganancia por unidad '+fmt(pr-c)+' · margen '+Math.round(100*(pr-c)/pr)+'%':''};f.price.oninput=updM;f.cost.oninput=updM;updM();
  const ph=h('div',{class:'row'});
  function drawPhoto(status){ph.replaceChildren(photo?h('img',{class:'thumb big',src:photo,alt:''}):h('div',{class:'thumb big'},initial(f.name.value)),
   canInv()&&DB.configured?h('label',{class:'btn'},ic('camera'),photo?'Cambiar foto':'Tomar foto',h('input',{type:'file',accept:'image/*',capture:'environment',style:'display:none',onchange:upPhoto})):h('span',{class:'muted small',style:'max-width:30ch'},'Las fotos las suben el dueño y almacén.'),status?h('span',{class:'muted small'},status):null)}
  async function upPhoto(e){const file=e.target.files[0];if(!file)return;drawPhoto('Subiendo…');
   try{const blob=await shrink(file);photo=await Photos.upload(blob);drawPhoto()}catch(err){console.warn(err);drawPhoto();toast('No se pudo subir la foto. Revisa el bucket “productos” en Supabase.','bad')}}
  drawPhoto();
  const err=h('div');
  body.append(ph,h('div',{class:'form-grid'},
   h('label',{class:'field full'},h('span',null,'Código de barras'),h('div',{class:'row',style:'flex-wrap:nowrap'},f.barcode,h('button',{class:'icon-btn',type:'button','aria-label':'Escanear código',onclick:()=>scanInto()},ic('camera')))),
   h('label',{class:'field full'},h('span',null,'Nombre'),f.name),
   h('label',{class:'field'},h('span',null,'Categoría'),f.category),h('label',{class:'field'},h('span',null,'Se vende por'),f.unit),
   h('label',{class:'field'},h('span',null,'Precio de venta'),f.price),h('label',{class:'field'},h('span',null,'Costo'),f.cost),
   h('div',{class:'full'},marg),
   h('label',{class:'field'},h('span',null,isNew?'Existencia inicial':'Existencia'),f.stock),h('label',{class:'field'},h('span',null,'Avisarme cuando queden'),f.minStock),
   h('label',{class:'field full'},h('span',null,'Caducidad (opcional)'),f.expiry)),err,
   h('button',{class:'btn primary block',style:'min-height:50px',onclick:submit},isNew?'Guardar producto':'Guardar cambios'));
  function scanInto(){const sheet=$('#sheet');const kept=[...sheet.childNodes];
   openScanner('Escanear código',code=>{const dup=findByCode(code);if(dup&&dup.id!==p.id){toast('Ese código ya es de '+dup.name,'bad');openProduct(dup.id);return}
    sheet.replaceChildren(...kept);$('#modal').hidden=false;f.barcode.value=code;buzz();setTimeout(()=>f.name.focus(),30)})}
  async function submit(){const name=f.name.value.trim();const code=f.barcode.value.trim();err.replaceChildren();
   if(!name){err.append(h('div',{class:'banner warn'},'Ponle nombre al producto.'));return}
   if(f.price.value===''){err.append(h('div',{class:'banner warn'},'Falta el precio de venta.'));return}
   const dup=code&&findByCode(code);if(dup&&dup.id!==p.id){err.append(h('div',{class:'banner warn'},'El código '+code+' ya pertenece a “'+dup.name+'”.'));return}
   const id=p.id||S.db.collection('products').doc().id;const stock=r3(f.stock.value);const prev=isNew?0:(+p.stock||0);
   const doc={name,barcode:code,category:f.category.value,unit:f.unit.value,price:r2(f.price.value),cost:r2(f.cost.value),stock,minStock:r3(f.minStock.value),expiry:f.expiry.value||'',photo,example:!!p.example&&!isNew,updatedAt:Date.now(),
    log:isNew?(stock?[{d:stock,r:'Alta de producto',at:Date.now(),by:S.uid||''}]:[]):(stock!==prev?[{d:r3(stock-prev),r:'Edición manual',at:Date.now(),by:S.uid||''},...(p.log||[])].slice(0,25):(p.log||[]))};
   if(await save(()=>S.db.doc('products/'+id).set(doc),isNew?'Producto dado de alta':'Cambios guardados'))openProduct(id)}
  if(isNew&&!presetCode)setTimeout(()=>f.barcode.focus(),40);else if(isNew)setTimeout(()=>f.name.focus(),40)})}
async function shrink(file){try{const bmp=await createImageBitmap(file);const m=900;const sc=Math.min(1,m/Math.max(bmp.width,bmp.height));const c=document.createElement('canvas');c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
 return await new Promise(r=>c.toBlob(b=>r(b||file),'image/jpeg',.82))}catch(e){return file}}

/* PEDIDOS (personal) */
VIEWS.pedidos=root=>{const chips=h('div',{class:'chips'});const grid=h('div',{class:'ogrid'});
 root.append(h('div',{class:'head'},h('h1',{class:'display'},'Pedidos'),h('span',{class:'muted small'},'Pedidos que hacen los clientes desde la app')),chips,grid);
 return()=>{const groups={activos:o=>['nuevo','preparando','listo'].includes(o.status),entregados:o=>o.status==='entregado',cancelados:o=>o.status==='cancelado'};
  chips.replaceChildren(...[['activos','Por atender'],['entregados','Entregados'],['cancelados','Cancelados']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(S.orderFilter===k),onclick:()=>{S.orderFilter=k;S.mounted=null;schedule()}},l+' ('+S.orders.filter(groups[k]).length+')')));
  const list=S.orders.filter(groups[S.orderFilter]);const rank={nuevo:0,preparando:1,listo:2};
  if(S.orderFilter==='activos')list.sort((a,b)=>(rank[a.status]-rank[b.status])||(a.at-b.at));
  grid.replaceChildren();
  if(notLoaded('orders')){grid.append(h('p',{class:'muted'},'Cargando pedidos…'));return}
  if(!list.length){grid.append(empty(S.orderFilter==='activos'?'Sin pedidos pendientes':'Nada por aquí','Cuando un cliente pida desde la sección Tienda, su pedido aparece aquí al instante.'));return}
  list.forEach(o=>grid.append(orderCard(o)))}};
function orderCard(o){const next={nuevo:['preparando','Empezar a preparar'],preparando:['listo','Marcar como listo'],listo:['entregado',o.type==='domicilio'?'Entregado y cobrado':'Recogido y cobrado']}[o.status];
 const conf=h('div');
 return h('article',{class:'ocard status-'+o.status},
  h('div',{class:'spread'},h('div',null,h('div',{style:'font-weight:700;font-size:16px'},o.customerLabel||'Cliente'),h('div',{class:'small muted mono'},'#'+o.folio+' · '+when(o.at))),h('span',{class:'pill '+(o.status==='nuevo'?'hot':o.status==='listo'?'green':o.status==='cancelado'?'bad':'warn')},OSTAT[o.status])),
  h('div',{class:'row small',style:'gap:6px'},h('span',{class:'pill neutral'},o.type==='domicilio'?'A domicilio':'Recoge en tienda'),h('span',{class:'pill neutral'},'Paga: '+(PAY[o.payMethod]||o.payMethod||'—')),o.phone?h('button',{class:'pill neutral',style:'border:0',onclick:()=>copy(o.phone)},ic('copy'),h('span',{class:'mono'},o.phone)):null),
  o.type==='domicilio'&&o.address?h('div',{class:'small',style:'user-select:all'},o.address):null,
  h('ul',{class:'items'},(o.items||[]).map(i=>h('li',null,qtyTxt(i.qty,i.unit)+' · '+i.name))),
  o.note?h('div',{class:'small',style:'font-style:italic'},'“'+o.note+'”'):null,
  h('div',{class:'spread'},h('b',{class:'mono',style:'font-size:18px'},fmt(o.total)),h('div',{class:'row',style:'gap:6px'},
   next&&isStaff()?h('button',{class:'btn '+(next[0]==='entregado'?'hot':'primary'),onclick:()=>advanceOrder(o,next[0])},next[1]):null,
   ['nuevo','preparando','listo'].includes(o.status)&&isStaff()?h('button',{class:'btn ghost',onclick:()=>confirmInline(conf,'¿Cancelar el pedido de '+(o.customerLabel||'este cliente')+'?','Sí, cancelar',()=>save(()=>S.db.doc('orders/'+o.id).update({status:'cancelado',updatedAt:Date.now()}),'Pedido cancelado'))},'Cancelar'):null)),conf)}
async function advanceOrder(o,st){if(st!=='entregado'){await save(()=>S.db.doc('orders/'+o.id).update({status:st,updatedAt:Date.now()}),'Pedido: '+OSTAT[st]);return}
 const id=folio();const sale={folio:id,items:o.items,total:o.total,payment:o.payMethod==='tarjeta'?'tarjeta':o.payMethod==='transferencia'?'transferencia':'efectivo',cashier:S.uid||'',at:Date.now(),origin:'pedido',orderId:o.id};
 await save(async()=>{await S.db.doc('orders/'+o.id).update({status:'entregado',saleFolio:id,updatedAt:Date.now()});await S.db.doc('sales/'+id).set(sale);await applyStockMany(o.items||[],-1,'Pedido #'+o.folio)},'Pedido entregado y registrado como venta')}

/* COMPRAS */
VIEWS.compras=root=>{const list=h('div',{class:'ogrid'});
 root.append(h('div',{class:'head'},h('div',null,h('h1',{class:'display'},'Compras'),h('p',{class:'muted',style:'margin:4px 0 0'},'Órdenes de compra a tus proveedores. Al recibirlas, la existencia sube sola.')),
  h('div',{class:'row'},h('button',{class:'btn',onclick:suggestPurchase},ic('alert'),'Sugerir por stock bajo'),h('button',{class:'btn primary',onclick:()=>newPurchase([])},ic('plus'),'Nueva orden'))),list);
 return()=>{list.replaceChildren();if(notLoaded('purchases')){list.append(h('p',{class:'muted'},'Cargando…'));return}
  if(!S.purchases.length){list.append(empty('Sin órdenes de compra','Toca “Sugerir por stock bajo” y la app arma el pedido al proveedor con lo que se está acabando.'));return}
  S.purchases.forEach(p=>list.append(h('button',{class:'ocard',style:'text-align:left',onclick:()=>openPurchase(p.id)},
   h('div',{class:'spread'},h('div',null,h('div',{style:'font-weight:700'},p.supplier||'Proveedor sin nombre'),h('div',{class:'small muted mono'},'#'+p.folio+' · '+when(p.at))),h('span',{class:'pill '+(p.status==='recibida'?'ok':p.status==='enviada'?'warn':'neutral')},{borrador:'Borrador',enviada:'Enviada',recibida:'Recibida'}[p.status])),
   h('div',{class:'spread'},h('span',{class:'muted small'},(p.items||[]).length+' productos'),h('b',{class:'mono'},fmt(sum(p.items||[],i=>i.qty*i.cost)))))))}};
async function newPurchase(items){const id=folio();const doc={folio:id,supplier:'',note:'',items,status:'borrador',at:Date.now(),by:S.uid||''};
 if(await save(()=>S.db.doc('purchases/'+id).set(doc)))openPurchase(id,doc)}
function suggestPurchase(){const low=prods().filter(isLow);if(!low.length){toast('Nada está por debajo del mínimo');return}
 newPurchase(low.map(p=>({pid:p.id,name:p.name,unit:p.unit||'pza',qty:Math.max(1,Math.ceil((+p.minStock||1)*2-(+p.stock||0))),cost:+p.cost||0})))}
function openPurchase(id,fallback){const src=fallback||S.purchases.find(x=>x.id===id);if(!src)return;const P=JSON.parse(JSON.stringify(src));P.id=id;const edit=P.status==='borrador';
 openModal('Orden #'+P.folio,body=>{const conf=h('div');
  const sup=h('input',{class:'input',id:'po-sup',value:P.supplier||'',placeholder:'Ej. Distribuidora del barrio',disabled:!edit,oninput:e=>P.supplier=e.target.value});
  const note=h('input',{class:'input',id:'po-note',value:P.note||'',placeholder:'Entrega el martes, pagar contra entrega…',disabled:!edit,oninput:e=>P.note=e.target.value});
  const items=h('div');const total=h('div',{class:'totline'});const adder=h('div');const wa=h('div');
  function drawItems(){items.replaceChildren();if(!P.items.length)items.append(h('p',{class:'muted'},'Agrega productos a la orden.'));
   P.items.forEach((it,ix)=>items.append(h('div',{class:'cart-line'},h('div',{style:'min-width:0;font-weight:600'},it.name),h('b',{class:'mono'},fmt(it.qty*it.cost)),
    edit?h('div',{class:'row',style:'gap:6px;flex-wrap:nowrap'},h('input',{class:'input mono',style:'width:84px',type:'number',min:'0',step:'any','aria-label':'Cantidad',value:it.qty,oninput:e=>{it.qty=r3(e.target.value);drawTot()}}),h('span',{class:'small muted'},it.unit+' a'),
     h('input',{class:'input mono',style:'width:92px',type:'number',min:'0',step:'0.5','aria-label':'Costo',value:it.cost,oninput:e=>{it.cost=r2(e.target.value);drawTot()}})):h('span',{class:'mono small muted'},qtyTxt(it.qty,it.unit)+' × '+fmt(it.cost)),
    edit?h('button',{class:'btn ghost',style:'min-height:0;padding:0;justify-self:end',onclick:()=>{P.items.splice(ix,1);drawItems()}},'Quitar'):h('span'))));drawTot()}
  function drawTot(){total.replaceChildren(h('span',{class:'eyebrow'},'Total estimado'),h('b',null,fmt(sum(P.items,i=>i.qty*i.cost))));drawWa()}
  function drawWa(){const t=['Pedido '+(S.config.name||'Mi Tiendita')+' #'+P.folio,...P.items.map(i=>'• '+qtyTxt(i.qty,i.unit)+' '+i.name),P.note?'Nota: '+P.note:''].filter(Boolean).join('\n');
   wa.replaceChildren(h('div',{class:'spread'},h('span',{class:'eyebrow'},'Texto para WhatsApp'),h('button',{class:'btn ghost',style:'min-height:0;padding:0',onclick:()=>copy(t)},ic('copy'),'Copiar')),h('pre',{class:'copytext'},t))}
  if(edit){const q=h('input',{class:'input',id:'po-add',placeholder:'Agregar producto por nombre…',oninput:()=>res()});const out=h('div',{class:'list'});
   const add=p=>{const ex=P.items.find(i=>i.pid===p.id);if(ex)ex.qty=r3(ex.qty+1);else P.items.push({pid:p.id,name:p.name,unit:p.unit||'pza',qty:1,cost:+p.cost||0});q.value='';res();drawItems()};
   function res(){out.replaceChildren();const v=q.value.trim().toLowerCase();if(!v)return;prods().filter(p=>String(p.name).toLowerCase().includes(v)).slice(0,5).forEach(p=>out.append(h('button',{class:'li',onclick:()=>add(p)},thumb(p),h('div',{class:'grow'},h('div',{class:'t'},p.name),h('div',{class:'s'},'Hay '+qtyTxt(p.stock||0,p.unit))),ic('plus'))))}
   adder.append(h('div',{class:'row',style:'flex-wrap:nowrap'},q,h('button',{class:'icon-btn','aria-label':'Escanear',onclick:()=>{openScanner('Agregar a la orden',code=>{const p=findByCode(code);if(p)add(p);else toast('Código no registrado','bad');openPurchase(id,P)})}},ic('scan'))),out)}
  const acts=h('div',{class:'row'});
  if(edit)acts.append(h('button',{class:'btn primary',onclick:()=>save(()=>S.db.doc('purchases/'+id).set(strip(P)),'Orden guardada')},'Guardar'),
   h('button',{class:'btn hot',onclick:async()=>{P.status='enviada';P.sentAt=Date.now();if(await save(()=>S.db.doc('purchases/'+id).set(strip(P)),'Orden marcada como enviada'))closeModal()}},'Marcar enviada'),
   h('button',{class:'btn ghost',onclick:()=>confirmInline(conf,'¿Borrar esta orden?','Sí, borrar',async()=>{closeModal();await save(()=>S.db.doc('purchases/'+id).delete(),'Orden borrada')})},'Borrar'));
  if(P.status==='enviada')acts.append(h('button',{class:'btn hot',onclick:async()=>{const ok=await save(async()=>{await S.db.doc('purchases/'+id).update({status:'recibida',receivedAt:Date.now()});
    await applyStockMany(P.items,1,'Compra #'+P.folio);for(const it of P.items){const p=S.products.get(it.pid);if(p&&it.cost&&it.cost!==p.cost)await S.db.doc('products/'+it.pid).update({cost:it.cost})}},'Mercancía recibida: existencias actualizadas');if(ok)closeModal()}},ic('check'),'Recibir mercancía'),
   h('button',{class:'btn',onclick:()=>save(()=>S.db.doc('purchases/'+id).update({status:'borrador'}),'Regresó a borrador').then(()=>closeModal())},'Volver a borrador'));
  if(P.status==='recibida')acts.append(h('span',{class:'pill ok'},'Recibida '+(P.receivedAt?when(P.receivedAt):'')));
  body.append(h('div',{class:'form-grid'},h('label',{class:'field'},h('span',null,'Proveedor'),sup),h('label',{class:'field'},h('span',null,'Nota'),note)),adder,items,total,wa,acts,conf);drawItems()})}
function strip(P){const o=Object.assign({},P);delete o.id;return o}

/* FIADO */
VIEWS.fiado=root=>{const inp=h('input',{class:'input',id:'fi-search',placeholder:'Buscar cliente',value:S.fiadoSearch,oninput:e=>{S.fiadoSearch=e.target.value;upd()}});const list=h('div',{class:'stack'});const sumBox=h('div');
 root.append(h('div',{class:'head'},h('div',null,h('h1',{class:'display'},'Cuaderno de fiado'),h('p',{class:'muted',style:'margin:4px 0 0'},'Quién debe, cuánto y desde cuándo. Los cargos se anotan solos al cobrar con “Fiado”.')),h('button',{class:'btn primary',onclick:()=>openFiadoForm()},ic('plus'),'Cliente nuevo')),sumBox,h('div',{class:'searchbar'},h('div',{class:'wrap'},ic('search'),inp)),list);
 function upd(){const all=S.fiados.slice().sort((a,b)=>(b.balance||0)-(a.balance||0));const debt=sum(all,f=>Math.max(0,f.balance||0));
  sumBox.replaceChildren(h('div',{class:'kpis'},kpi('Total por cobrar',fmt(debt)),kpi('Clientes con deuda',all.filter(f=>(f.balance||0)>0).length)));
  const q=S.fiadoSearch.trim().toLowerCase();const f=all.filter(x=>!q||String(x.name).toLowerCase().includes(q));list.replaceChildren();
  if(notLoaded('fiados')){list.append(h('p',{class:'muted'},'Cargando…'));return}
  if(!all.length){list.append(empty('El cuaderno está limpio','Agrega a tus clientes de confianza con un límite de crédito y cóbrales con la opción Fiado en la caja.'));return}
  const box=h('div',{class:'panel',style:'padding:6px 14px'});
  f.forEach(x=>{const pct=x.limit?Math.min(100,100*(x.balance||0)/x.limit):0;box.append(h('button',{class:'li',onclick:()=>openFiado(x.id)},h('div',{class:'thumb'},initial(x.name)),
   h('div',{class:'grow'},h('div',{class:'t'},x.name),h('div',{class:'s'},x.limit?'Límite '+fmt(x.limit)+' · usado '+Math.round(pct)+'%':'Sin límite'),x.limit?h('div',{class:'b',style:'height:5px;border-radius:3px;background:var(--surface-2);margin-top:4px;overflow:hidden'},h('i',{style:'display:block;height:100%;width:'+pct+'%;background:'+(pct>=90?'var(--bad)':'var(--warn)')})):null),
   h('b',{class:'mono',style:'color:'+((x.balance||0)>0?'var(--bad)':'var(--ok)')},fmt(x.balance||0))))});list.append(box)}
 return upd};
function openFiadoForm(after){openModal('Cliente de fiado',body=>{const n=h('input',{class:'input',id:'nf-name',placeholder:'Doña Lupe (la del 4)'});const ph=h('input',{class:'input mono',id:'nf-phone',inputmode:'tel',placeholder:'55 1234 5678'});const lim=h('input',{class:'input mono',id:'nf-lim',type:'number',min:'0',step:'50',placeholder:'500'});
 body.append(h('div',{class:'form-grid'},h('label',{class:'field full'},h('span',null,'Nombre o apodo'),n),h('label',{class:'field'},h('span',null,'Teléfono'),ph),h('label',{class:'field'},h('span',null,'Límite de crédito'),lim)),
  h('button',{class:'btn primary block',onclick:async()=>{if(!n.value.trim()){toast('Escribe el nombre','bad');return}const id=S.db.collection('fiados').doc().id;
   if(await save(()=>S.db.doc('fiados/'+id).set({name:n.value.trim(),phone:ph.value.trim(),limit:r2(lim.value),balance:0,entries:[],updatedAt:Date.now()}),'Cliente agregado al cuaderno')){if(after){S.fiados.push({id,name:n.value.trim(),balance:0,limit:r2(lim.value)});after(id)}else openFiado(id)}}},'Agregar al cuaderno'));setTimeout(()=>n.focus(),40)})}
async function fiadoMove(id,t,amt,note){const f=S.fiados.find(x=>x.id===id);const bal=f?(f.balance||0):0;const entries=[{t,amt:r2(amt),note,at:Date.now(),by:S.uid||''},...((f&&f.entries)||[])].slice(0,80);
 await S.db.doc('fiados/'+id).update({balance:r2(bal+(t==='cargo'?amt:-amt)),entries,updatedAt:Date.now()})}
function openFiado(id){openModal('Cuenta de fiado',body=>{const head=h('div');const ent=h('div');const conf=h('div');
 const amt=h('input',{class:'input mono',id:'fa-amt',type:'number',min:'0',step:'0.5',inputmode:'decimal',placeholder:'Monto'});
 body.append(head,h('section',{class:'panel stack',style:'gap:10px'},h('label',{class:'field'},h('span',null,'Registrar movimiento'),amt),h('div',{class:'row'},
  h('button',{class:'btn primary',onclick:async()=>{const a=+amt.value;if(!(a>0))return toast('Escribe el monto','bad');if(await save(()=>fiadoMove(id,'abono',a,'Abono'),'Abono registrado'))amt.value=''}},ic('check'),'Abonó'),
  h('button',{class:'btn',onclick:async()=>{const a=+amt.value;if(!(a>0))return toast('Escribe el monto','bad');if(await save(()=>fiadoMove(id,'cargo',a,'Cargo manual'),'Cargo anotado'))amt.value=''}},ic('plus'),'Anotar cargo'))),ent,conf);
 return()=>{const f=S.fiados.find(x=>x.id===id);if(!f){head.replaceChildren(h('p',{class:'muted'},'Esta cuenta ya no existe.'));ent.replaceChildren();return}
  head.replaceChildren(h('div',{class:'spread'},h('div',null,h('h3',{style:'font-size:20px'},f.name),f.phone?h('div',{class:'mono small muted',style:'user-select:all'},f.phone):null),h('div',{style:'text-align:right'},h('div',{class:'eyebrow'},'Debe'),h('div',{class:'bignum',style:'color:'+((f.balance||0)>0?'var(--bad)':'var(--ok)')},fmt(f.balance||0)))));
  ent.replaceChildren(panel('Historial',(f.entries&&f.entries.length)?h('div',{class:'list'},f.entries.map(e=>h('div',{class:'li'},h('span',{class:'pill '+(e.t==='abono'?'ok':'hot'),style:'min-width:64px;justify-content:center'},e.t==='abono'?'Abono':'Cargo'),h('div',{class:'grow'},h('div',{class:'t',style:'font-weight:500'},e.note||''),h('div',{class:'s'},when(e.at))),h('b',{class:'mono'},(e.t==='abono'?'−':'+')+fmt(e.amt))))):h('p',{class:'muted',style:'margin:0'},'Sin movimientos.'),
   role()==='admin'?h('button',{class:'btn ghost',style:'min-height:0;padding:0',onclick:()=>confirmInline(conf,'¿Borrar la cuenta de '+f.name+'?','Sí, borrar',async()=>{closeModal();await save(()=>S.db.doc('fiados/'+id).delete(),'Cuenta borrada')})},'Borrar cuenta'):null))}})}

/* PERSONAL */
VIEWS.personal=root=>{const nm=h('input',{class:'input',id:'cfg-name',value:S.config.name||'Mi Tiendita'});const reqs=h('div');const staff=h('div');
 root.append(h('div',{class:'head'},h('h1',{class:'display'},'Personal y tienda')),
  h('div',{class:'grid2'},
   panel('Nombre de la tienda',h('div',{class:'stack',style:'gap:10px'},nm,h('button',{class:'btn primary',onclick:()=>save(()=>S.db.doc('config/store').set(Object.assign({},S.config,{name:nm.value.trim()||'Mi Tiendita'})),'Nombre guardado')},'Guardar'))),
   panel('Cómo sumar a tu equipo',h('ol',{style:'margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px'},
    h('li',null,'Mándales el enlace de la app: ',h('button',{class:'pill neutral',style:'border:0',onclick:()=>copy(location.origin)},ic('copy'),h('span',{class:'mono'},location.host))),
    h('li',null,'Crean su cuenta con correo y contraseña. Entran como clientes y tocan “¿Trabajas en la tienda?” para pedir puesto de Cajero o Almacén.'),
    h('li',null,'Tú apruebas la solicitud aquí y su menú cambia al instante.')))),
  panel('Solicitudes de acceso',reqs),panel('Tu equipo',staff),
  panel('Probar la app con otro rol',h('div',{class:'row'},['cajero','almacen','cliente'].map(r=>h('button',{class:'btn',onclick:()=>setViewAs(r)},'Ver como '+ROLE_LABEL[r])))));
 return()=>{reqs.replaceChildren();if(!S.requests.length)reqs.append(h('p',{class:'muted',style:'margin:0'},'No hay solicitudes pendientes.'));
  S.requests.forEach(r=>reqs.append(h('div',{class:'li'},h('div',{class:'thumb'},initial(r.label)),h('div',{class:'grow'},h('div',{class:'t'},r.label||'Sin nombre'),h('div',{class:'s'},'Quiere ser '+ROLE_LABEL[r.role]+' · '+when(r.at))),
   h('button',{class:'btn primary',onclick:()=>save(async()=>{await S.db.doc('staff/'+r.id).set({role:r.role,label:r.label||'',at:Date.now()});await S.db.doc('requests/'+r.id).delete()},'Acceso aprobado')},'Aprobar'),
   h('button',{class:'btn ghost',onclick:()=>save(()=>S.db.doc('requests/'+r.id).delete(),'Solicitud rechazada')},'Rechazar'))));
  staff.replaceChildren();const ids=[...S.staff.keys()];
  if(!ids.length)staff.append(h('p',{class:'muted',style:'margin:0'},'Aún no hay cajeros ni almacenistas. Tú, como dueño, tienes acceso a todo.'));
  ids.forEach(uid=>{const s=S.staff.get(uid);const nameEl=h('div',{class:'t'},(s.label||'Integrante')+(uid===S.uid?' (tú)':''));nameEl.dataset.uid=uid;
   staff.append(h('div',{class:'li'},h('div',{class:'thumb'},initial(s.label)),h('div',{class:'grow'},nameEl,h('div',{class:'s'},'Desde '+dshort(s.at||Date.now()))),
    h('select',{class:'input',style:'width:auto','aria-label':'Rol',onchange:e=>save(()=>S.db.doc('staff/'+uid).update({role:e.target.value}),'Rol actualizado')},['admin','cajero','almacen'].map(r=>h('option',{value:r,selected:s.role===r},r==='admin'?'Encargado (todo)':ROLE_LABEL[r]))),
    h('button',{class:'btn ghost',onclick:()=>save(()=>S.db.doc('staff/'+uid).delete(),'Acceso retirado')},'Quitar')))});
  }};

/* TIENDA (cliente) */
VIEWS.tienda=root=>{const inp=h('input',{class:'input',id:'shop-search',placeholder:'¿Qué necesitas? Leche, huevo, tortillas…',value:S.shopSearch,oninput:e=>{S.shopSearch=e.target.value;upd()}});
 const chips=h('div',{class:'chips'});const grid=h('div',{class:'cards'});const bar=h('div',{class:'paybar'});
 root.append(h('div',{class:'shop-hero'},h('h1',{class:'display'},S.config.name||'Mi Tiendita'),h('p',null,'Arma tu pedido y lo recoges en el mostrador o te lo llevamos a la puerta.')),
  h('div',{class:'searchbar'},h('div',{class:'wrap'},ic('search'),inp)),chips,grid,bar);
 function upd(){const all=prods();const cats=[...new Set(all.map(p=>p.category).filter(Boolean))];
  chips.replaceChildren(...['',...cats].map(c=>h('button',{type:'button','aria-pressed':String(S.shopCat===c),onclick:()=>{S.shopCat=c;upd()}},c||'Todo')));
  const q=S.shopSearch.trim().toLowerCase();const f=all.filter(p=>(!S.shopCat||p.category===S.shopCat)&&(!q||String(p.name).toLowerCase().includes(q)));
  grid.replaceChildren();if(notLoaded('products'))grid.append(h('p',{class:'muted'},'Cargando productos…'));
  else if(!all.length)grid.append(empty('La tienda está acomodando sus anaqueles','Pronto verás aquí los productos disponibles.'));
  f.forEach(p=>{const inC=S.clientCart.find(i=>i.pid===p.id);const out=(+p.stock||0)<=0;
   grid.append(h('div',{class:'pcard'},h('div',{class:'img'},p.photo?h('img',{src:p.photo,alt:'',loading:'lazy'}):initial(p.name)),h('div',{class:'n'},p.name),
    h('div',{class:'spread'},h('b',{class:'mono'},fmt(p.price)),h('span',{class:'small muted'},'/'+(p.unit||'pza'))),
    out?h('span',{class:'pill bad',style:'justify-content:center'},'Agotado'):inC?h('div',{class:'stepper'},h('button',{type:'button','aria-label':'Menos',onclick:()=>{addClient(p,-step(p.unit));upd()}},ic('minus')),h('b',{class:'mono small'},qtyTxt(inC.qty,inC.unit)),h('button',{type:'button','aria-label':'Más',onclick:()=>{addClient(p,step(p.unit));upd()}},ic('plus'))):
     h('button',{class:'btn primary',style:'min-height:38px;padding:6px',onclick:()=>{addClient(p,step(p.unit));upd()}},ic('plus'),'Agregar')))});
  const tot=sum(S.clientCart,i=>i.qty*i.price);bar.hidden=!S.clientCart.length;bar.replaceChildren(h('button',{class:'btn hot',onclick:openClientCheckout},'Ver mi pedido · '+fmt(tot)))}
 S.shopUpd=upd;return upd};
function addClient(p,d){const l=S.clientCart.find(i=>i.pid===p.id);if(l){l.qty=r3(l.qty+d);if(l.qty<=0)S.clientCart.splice(S.clientCart.indexOf(l),1)}else if(d>0)S.clientCart.push({pid:p.id,name:p.name,price:+p.price||0,unit:p.unit||'pza',qty:d});lsSet('mt_ccart',S.clientCart);buzz();schedule()}
function openClientCheckout(){if(!S.uid){toast('Entra a tu cuenta para enviar el pedido');openLogin();return}let type='recoger',pay='efectivo';const me=lsGet('mt_me',{});
 openModal('Tu pedido',body=>{const items=h('div');const draw=()=>{items.replaceChildren(cartBox(S.clientCart,()=>{lsSet('mt_ccart',S.clientCart);draw();S.shopUpd&&S.shopUpd();if(!S.clientCart.length)closeModal()}))};
  const nm=h('input',{class:'input',id:'co-name',value:me.name||'',placeholder:'Tu nombre'});const ph=h('input',{class:'input mono',id:'co-phone',inputmode:'tel',value:me.phone||'',placeholder:'55 1234 5678'});
  const addr=h('textarea',{class:'input',id:'co-addr',rows:'2',placeholder:'Calle, número, referencias'});addr.value=me.address||'';const note=h('input',{class:'input',id:'co-note',placeholder:'Ej. tortillas recién hechas, sin bolsa…'});
  const addrBox=h('label',{class:'field full',hidden:true},h('span',null,'Dirección de entrega'),addr);
  const seg=(opts,cur,set)=>{const s=h('div',{class:'seg'},opts.map(([k,l])=>h('button',{type:'button','aria-pressed':String(k===cur),onclick:e=>{set(k);s.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===e.currentTarget)))}},l)));return s};
  const send=h('button',{class:'btn hot block',style:'min-height:54px;font-size:17px',onclick:async()=>{
   if(!nm.value.trim()||!ph.value.trim()){toast('Escribe tu nombre y teléfono','bad');return}if(type==='domicilio'&&!addr.value.trim()){toast('Falta la dirección','bad');return}
   lsSet('mt_me',{name:nm.value.trim(),phone:ph.value.trim(),address:addr.value.trim()});send.disabled=true;const id=folio();
   const o={folio:id,customer:S.uid||'',customerLabel:nm.value.trim(),phone:ph.value.trim(),type,address:type==='domicilio'?addr.value.trim():'',note:note.value.trim(),payMethod:pay,items:S.clientCart.map(i=>({pid:i.pid,name:i.name,qty:i.qty,price:i.price,unit:i.unit})),total:r2(sum(S.clientCart,i=>i.qty*i.price)),status:'nuevo',at:Date.now()};
   if(await save(()=>S.db.doc('orders/'+id).set(o),'¡Pedido enviado a la tienda!')){S.clientCart=[];lsSet('mt_ccart',[]);closeModal();go('mispedidos')}else send.disabled=false}},'Enviar pedido');
  body.append(items,h('div',{class:'field'},h('span',null,'Entrega'),seg([['recoger','Recojo en tienda'],['domicilio','A domicilio']],type,k=>{type=k;addrBox.hidden=k!=='domicilio'})),
   h('div',{class:'form-grid'},h('label',{class:'field'},h('span',null,'Nombre'),nm),h('label',{class:'field'},h('span',null,'Teléfono'),ph),addrBox,h('label',{class:'field full'},h('span',null,'Nota para la tienda'),note)),
   h('div',{class:'field'},h('span',null,'¿Cómo pagas?'),seg([['efectivo','Efectivo'],['tarjeta','Tarjeta'],['transferencia','Transferencia']],pay,k=>pay=k)),send);draw()})}

/* MIS PEDIDOS */
VIEWS.mispedidos=root=>{const list=h('div',{class:'stack'});const foot=h('div');root.append(h('div',{class:'head'},h('h1',{class:'display'},'Mis pedidos')),list,foot);
 return()=>{list.replaceChildren();const mine=S.myOrders.slice().sort((a,b)=>b.at-a.at);
  if(!S.uid)list.append(empty('Entra para pedir','Crea tu cuenta o entra con tu correo para hacer pedidos y seguir su avance.',h('button',{class:'btn primary',onclick:()=>openLogin()},'Entrar o crear cuenta')));
  else if(!mine.length)list.append(empty('Aún no has pedido nada','Arma tu pedido en la Tienda y aquí sigues su avance en tiempo real.',h('button',{class:'btn primary',onclick:()=>go('tienda')},ic('store'),'Ir a la tienda')));
  const steps=['nuevo','preparando','listo','entregado'];
  mine.forEach(o=>{const ix=steps.indexOf(o.status);const conf=h('div');
   list.append(h('article',{class:'ocard'},h('div',{class:'spread'},h('div',null,h('div',{style:'font-weight:700'},'Pedido #'+o.folio),h('div',{class:'small muted'},when(o.at)+' · '+(o.type==='domicilio'?'A domicilio':'Recoger en tienda'))),h('b',{class:'mono'},fmt(o.total))),
    o.status==='cancelado'?h('span',{class:'pill bad'},'Cancelado'):h('div',null,h('div',{class:'track'},steps.map((s,i)=>h('i',{class:i<=ix?'on':''}))),h('div',{class:'track-l'},['Recibido','Preparando',o.type==='domicilio'?'En camino':'Listo','Entregado'].map(t=>h('span',null,t)))),
    o.status==='listo'&&o.type!=='domicilio'?h('div',{class:'banner info'},ic('check'),h('div',null,'¡Tu pedido está listo! Pasa al mostrador.')):null,
    h('ul',{class:'items'},(o.items||[]).map(i=>h('li',null,qtyTxt(i.qty,i.unit)+' · '+i.name))),
    o.status==='nuevo'?h('button',{class:'btn ghost',style:'align-self:flex-start',onclick:()=>confirmInline(conf,'¿Cancelar tu pedido?','Sí, cancelar',()=>save(()=>S.db.doc('orders/'+o.id).update({status:'cancelado',updatedAt:Date.now()}),'Pedido cancelado'))},'Cancelar pedido'):null,conf))});
  foot.replaceChildren(staffRequestCard())}};
function staffRequestCard(){if(S.viewAs)return h('span');if(!S.uid)return h('button',{class:'btn ghost',onclick:()=>openLogin()},ic('users'),'¿Trabajas en la tienda? Entra para pedir acceso');
 if(S.myRequest)return h('div',{class:'banner info'},ic('users'),h('div',null,'Pediste acceso como ',h('b',null,ROLE_LABEL[S.myRequest.role]),'. En cuanto el dueño lo apruebe, tu menú cambia solo.'));
 return h('button',{class:'btn ghost',onclick:openStaffRequest},ic('users'),'¿Trabajas en la tienda? Pide acceso de personal')}
function openStaffRequest(){openModal('Acceso de personal',body=>{let r='cajero';const n=h('input',{class:'input',id:'sr-name',placeholder:'Tu nombre'});
 const s=h('div',{class:'seg'},[['cajero','Cajero'],['almacen','Almacén']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(k===r),onclick:e=>{r=k;s.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===e.currentTarget)))}},l)));
 body.append(h('p',{class:'muted',style:'margin:0'},'El dueño verá tu solicitud en la sección Personal.'),h('label',{class:'field'},h('span',null,'Nombre'),n),h('div',{class:'field'},h('span',null,'Puesto'),s),
  h('button',{class:'btn primary block',onclick:async()=>{if(!n.value.trim())return toast('Escribe tu nombre','bad');if(await save(()=>S.db.doc('requests/'+S.uid).set({label:n.value.trim(),role:r,at:Date.now()}),'Solicitud enviada'))closeModal()}},'Enviar solicitud'))})}
const AUTH_ERR={'Invalid login credentials':'Correo o contraseña incorrectos.','Email not confirmed':'Confirma tu correo: revisa tu bandeja (y spam).','User already registered':'Ese correo ya tiene cuenta. Entra con tu contraseña.'};
function openLogin(){let mode='in';openModal('Tu cuenta',body=>{
 const email=h('input',{class:'input',id:'lg-email',type:'email',autocomplete:'email',placeholder:'tucorreo@ejemplo.com'});
 const pass=h('input',{class:'input',id:'lg-pass',type:'password',autocomplete:'current-password',placeholder:'Mínimo 6 caracteres'});
 const name=h('input',{class:'input',id:'lg-name',autocomplete:'name',placeholder:'Tu nombre'});
 const nameF=h('label',{class:'field',hidden:true},h('span',null,'Nombre'),name);
 const err=h('div');const btn=h('button',{class:'btn primary block',style:'min-height:50px',type:'submit'},'Entrar');
 const seg=h('div',{class:'seg'},[['in','Entrar'],['up','Crear cuenta']].map(([k,l])=>h('button',{type:'button','aria-pressed':String(k===mode),onclick:e=>{mode=k;seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===e.currentTarget)));nameF.hidden=k!=='up';btn.textContent=k==='up'?'Crear cuenta':'Entrar';pass.autocomplete=k==='up'?'new-password':'current-password';err.replaceChildren()}},l)));
 const form=h('form',{class:'stack',style:'gap:12px',onsubmit:async e=>{e.preventDefault();err.replaceChildren();const em=email.value.trim(),pw=pass.value;
  if(!em||pw.length<6){err.append(h('div',{class:'banner warn'},'Escribe tu correo y una contraseña de al menos 6 caracteres.'));return}
  btn.disabled=true;try{if(mode==='in'){await Auth.signIn(em,pw);location.reload()}
   else{const r=await Auth.signUp(em,pw,name.value.trim());if(r.session)location.reload();else{form.replaceChildren(h('div',{class:'banner info'},ic('check'),h('div',null,'Listo. Te mandamos un correo a '+em+' para confirmar tu cuenta. Después entra con tu contraseña.')))}}}
  catch(x){btn.disabled=false;err.append(h('div',{class:'banner warn'},AUTH_ERR[x&&x.message]||('No se pudo: '+((x&&x.message)||'error'))))}}},
  seg,nameF,h('label',{class:'field'},h('span',null,'Correo'),email),h('label',{class:'field'},h('span',null,'Contraseña'),pass),err,btn,
  h('button',{type:'button',class:'btn ghost',onclick:async()=>{const em=email.value.trim();if(!em){toast('Escribe tu correo primero','bad');return}try{await Auth.reset(em);toast('Te mandamos un enlace para cambiar tu contraseña')}catch(x){toast('No se pudo enviar el correo','bad')}}},'Olvidé mi contraseña'));
 body.append(form);setTimeout(()=>email.focus(),40)})}
function openNewPassword(){openModal('Nueva contraseña',body=>{const p=h('input',{class:'input',id:'np-pass',type:'password',autocomplete:'new-password',placeholder:'Mínimo 6 caracteres'});
 body.append(h('label',{class:'field'},h('span',null,'Escribe tu nueva contraseña'),p),h('button',{class:'btn primary block',onclick:async()=>{if(p.value.length<6)return toast('Mínimo 6 caracteres','bad');const {error}=await DB.client.auth.updateUser({password:p.value});if(error)toast('No se pudo cambiar','bad');else{toast('Contraseña actualizada');closeModal()}}},'Guardar contraseña'))})}
function openRoleMenu(){if(!S.ready)return;if(S.noDb){toast('Primero configura Supabase en config.js','bad');return}if(!S.uid){openLogin();return}
 openModal('Tu cuenta',body=>{
 body.append(h('div',{class:'li'},h('div',{class:'thumb'},initial(S.email)),h('div',{class:'grow'},h('div',{class:'t'},S.email),h('div',{class:'s'},'Puesto: '+ROLE_LABEL[S.realRole]))));
 if(S.realRole==='admin')body.append(h('div',{class:'field'},h('span',null,'Ver la app como'),h('div',{class:'row'},['admin','cajero','almacen','cliente'].map(r=>h('button',{class:'btn'+(role()===r?' primary':''),onclick:()=>setViewAs(r)},ROLE_LABEL[r])))));
 else if(S.realRole==='cliente')body.append(staffRequestCard());
 body.append(h('button',{class:'btn danger',onclick:async()=>{await Auth.signOut();location.reload()}},'Cerrar sesión'))})}
/* ---------- datos ---------- */
function onErr(k){return e=>{console.warn('sub '+k,e);S.loaded[k]=true;schedule()}}
const SUBS={
 products:()=>S.db.collection('products').onSnapshot(q=>{S.products=new Map(q.docs.map(d=>[d.id,Object.assign({id:d.id},d.data())]));S.loaded.products=true;schedule()},onErr('products')),
 sales:()=>S.db.collection('sales').orderBy('at','desc').limit(600).onSnapshot(q=>{S.sales=q.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded.sales=true;schedule()},onErr('sales')),
 orders:()=>S.db.collection('orders').orderBy('at','desc').limit(300).onSnapshot(q=>{S.orders=q.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded.orders=true;schedule()},onErr('orders')),
 purchases:()=>S.db.collection('purchases').orderBy('at','desc').limit(200).onSnapshot(q=>{S.purchases=q.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded.purchases=true;schedule()},onErr('purchases')),
 fiados:()=>S.db.collection('fiados').onSnapshot(q=>{S.fiados=q.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded.fiados=true;schedule()},onErr('fiados')),
 staffAll:()=>S.db.collection('staff').onSnapshot(q=>{S.staff=new Map(q.docs.map(d=>[d.id,d.data()]));schedule()},onErr('staffAll')),
 requests:()=>S.db.collection('requests').onSnapshot(q=>{S.requests=q.docs.map(d=>Object.assign({id:d.id},d.data()));schedule()},onErr('requests')),
 myorders:()=>S.uid?S.db.collection('orders').where('customer','==',S.uid).onSnapshot(q=>{S.myOrders=q.docs.map(d=>Object.assign({id:d.id},d.data()));S.loaded.myorders=true;schedule()},onErr('myorders')):null};
const NEED={admin:['products','sales','orders','purchases','fiados','requests','staffAll','myorders'],cajero:['products','sales','orders','fiados','myorders'],almacen:['products','purchases','myorders'],cliente:['products','myorders']};
function ensureSubs(){if(!S.db||!S.realRole)return;const need=new Set([...NEED[S.realRole],...NEED[role()]]);need.forEach(k=>{if(!S.subs[k]){try{S.subs[k]=SUBS[k]()||true}catch(e){console.warn(e)}}})}
function resolveRole(){const r=S.myStaff&&S.myStaff.role;S.realRole=VIEWS_BY_ROLE[r]?r:'cliente';if(S.realRole!=='admin')S.viewAs=null;S.ready=true;ensureSubs();S.mounted=null;schedule()}
(async function boot(){
 if(!window.DB||!DB.configured){S.noDb=true;S.loaded={products:true,sales:true,orders:true,purchases:true,fiados:true,myorders:true};S.realRole='cliente';S.ready=true;schedule();return}
 S.db=DB;
 let ses=null;try{ses=await Auth.session()}catch(e){}
 if(ses){S.uid=ses.user.id;S.email=ses.user.email||''}
 Auth.onChange((ev,s)=>{if(ev==='PASSWORD_RECOVERY')openNewPassword();else if(ev==='SIGNED_OUT'&&S.uid)location.reload();else if(ev==='SIGNED_IN'&&s&&s.user&&s.user.id!==S.uid)location.reload()});
 DB.doc('config/store').onSnapshot(s=>{S.config=s.exists?Object.assign({name:'Mi Tiendita'},s.data()):{name:'Mi Tiendita'};document.title=(S.config.name||'Mi Tiendita')+' · Mostrador';schedule()},()=>{});
 if(!S.uid){resolveRole();return}
 let first=true;
 DB.doc('staff/'+S.uid).onSnapshot(s=>{const prev=S.myStaff&&S.myStaff.role;S.myStaff=s.exists?s.data():null;const now=S.myStaff&&S.myStaff.role;if(first||prev!==now){first=false;resolveRole()}},()=>{if(first){first=false;resolveRole()}});
 DB.doc('requests/'+S.uid).onSnapshot(s=>{S.myRequest=s.exists?s.data():null;schedule()},()=>{});
 setTimeout(()=>{if(!S.ready)resolveRole()},8000);
})();
