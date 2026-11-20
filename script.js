/* ===== A. SETUP ===== */
const $=s=>document.querySelector(s), c=$('#c'), x=c.getContext('2d');
const bg=document.createElement('canvas'), bx=bg.getContext('2d');   // capa estática (cielo, montañas, lago, bote)
const R=(a,b)=>a+Math.random()*(b-a);
let W,H,D,HZ,T=0,last=0;
let st='hold';                 // estados: hold → rise → sky → heart → text → letter
let lan=[], pts=[], main, hold=0, down=false, lf=1;
let rip=[], star=null, spk=[], noteL=null, noteTO, deck=[], sndOn=false, au;
/* ★ MENSAJES: cada farol toma uno al azar (sin repetir hasta agotarlos). Cámbialos por los tuyos. */
const MSGS=["Eres mi lugar favorito","Contigo todo es hogar","Gracias por quedarte","Te elegiría otra vez","Tu risa es mi canción favorita",
"Mi deseo eres tú","Eres mi calma","Haces el mundo más bonito","Contigo, todos los días","Eres mi casualidad favorita",
"Te pienso en cada estrella","Eres lo mejor que me pasó","Quiero otra vida contigo","Tu abrazo es mi refugio","Mi corazón te reconoce",
"Eres mi razón para sonreír","Aquí estoy, siempre","Contigo el tiempo se detiene","Te quiero más de lo que digo","Eres mi mejor aventura",
"Cada farol lleva tu nombre","Eres mi paz","Qué suerte encontrarte","Mi lugar seguro eres tú","Te amo en cada amanecer"];
const nextMsg=()=>{if(!deck.length)deck=MSGS.slice().sort(()=>Math.random()-.5);return deck.pop()};  // faroles, partículas, farol principal, progreso de pulsación, opacidad faroles

/* sprite de brillo: se dibuja una vez y se reutiliza (mucho más rápido que crear gradientes por frame) */
const glow=document.createElement('canvas'); glow.width=glow.height=64;
{const g=glow.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
 r.addColorStop(0,'rgba(255,200,110,1)');r.addColorStop(.35,'rgba(255,150,60,.35)');r.addColorStop(1,'rgba(255,120,40,0)');
 g.fillStyle=r;g.fillRect(0,0,64,64);}

/* ===== B. ESCENA ESTÁTICA ===== */
function resize(){
  D=Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight; HZ=H*.58;   // HZ = línea del horizonte
  for(const k of [c,bg]){k.width=W*D;k.height=H*D}
  x.setTransform(D,0,0,D,0,0); bx.setTransform(D,0,0,D,0,0);
  paintBg(); makeRip(); if(main){main.S=Math.min(W,H)*.055;main.rf=H*.33;if(st==='hold'){main.x=W/2;main.y=H*.54}}
}
function paintBg(){
  let g=bx.createLinearGradient(0,0,0,HZ);                                   // cielo: índigo → violeta → magenta → naranja en el horizonte
  [[0,'#0b0a2c'],[.4,'#241368'],[.68,'#5a2a8c'],[.86,'#b8408a'],[1,'#ff8f6e']].forEach(([o,col])=>g.addColorStop(o,col));
  bx.fillStyle=g; bx.fillRect(0,0,W,HZ);
  for(let i=0;i<150;i++){bx.fillStyle=`rgba(255,240,230,${R(.15,.7)})`;bx.fillRect(R(0,W),R(0,HZ*.7),R(.6,1.4),R(.6,1.4))}
  const ridge=(col,amp,f,ph,base)=>{                                          // cordillera: dos senos multiplicados = picos irregulares
    bx.fillStyle=col; bx.beginPath(); bx.moveTo(0,HZ+2);
    for(let px=0;px<=W;px+=5) bx.lineTo(px,HZ-base-H*amp*(.5+.5*Math.sin(px/W*f+ph)*Math.cos(px/W*f*.37+ph*2)));
    bx.lineTo(W,HZ+2); bx.fill();
  };
  ridge('rgba(160,105,175,.55)',.05,7,1,H*.012);                              // montañas lejanas (lavanda, neblina)
  ridge('#3b2470',.035,9,3,H*.004);                                           // montañas cercanas
  g=bx.createLinearGradient(0,HZ,0,H);                                        // lago
  [[0,'#a2428a'],[.12,'#7a2f8a'],[.4,'#3a1a6a'],[1,'#0f0a2c']].forEach(([o,col])=>g.addColorStop(o,col));
  bx.fillStyle=g; bx.fillRect(0,HZ,W,H-HZ);
  for(let i=0;i<280;i++){                                                     // vetas horizontales de reflejo (más fuertes cerca del horizonte)
    const d=Math.random()**1.7, y=HZ+H*.02+d*(H-HZ), al=.04+.26*(1-d);
    bx.fillStyle=Math.random()<.8?`rgba(255,140,175,${al})`:`rgba(20,10,50,${al*1.6})`;
    bx.fillRect(R(-.1,.9)*W,y,R(.08,.5)*W*(.6+.4*(1-d)),R(1,2.4));
  }
  bx.fillStyle='#120a2a'; bx.beginPath(); bx.moveTo(0,HZ+H*.012);            // orilla oscura con copas de árboles
  for(let px=0;px<=W;px+=4) bx.lineTo(px,HZ-H*.004-Math.abs(Math.sin(px*.11))*H*.004-R(0,H*.003));
  bx.lineTo(W,HZ+H*.012); bx.fill();

  const cx=W/2, by=H*.76, u=Math.min(W*.21,H*.13);                            // BOTE: canoa de puntas levantadas
  bx.fillStyle='rgba(8,4,22,.4)'; bx.beginPath(); bx.ellipse(cx,by+u*.5,u*.95,u*.1,0,0,7); bx.fill();   // sombra en el agua
  bx.fillStyle='#0a0618'; bx.beginPath(); bx.moveTo(cx-u,by-.25*u);
  bx.quadraticCurveTo(cx,by+.1*u,cx+u,by-.28*u);                              // borde superior (ligeramente hundido)
  bx.bezierCurveTo(cx+.7*u,by+.38*u,cx-.7*u,by+.38*u,cx-u,by-.25*u); bx.fill();   // casco
  bx.beginPath(); bx.ellipse(cx-.1*u,by-.17*u,.2*u,.27*u,0,0,7);             // PAREJA: dos torsos + dos cabezas pegadas
  bx.ellipse(cx+.1*u,by-.14*u,.17*u,.23*u,0,0,7);
  bx.arc(cx-.07*u,by-.52*u,.085*u,0,7); bx.moveTo(cx+.16*u,by-.43*u); bx.arc(cx+.08*u,by-.43*u,.08*u,0,7); bx.fill();
}

/* ===== C. FAROLES ===== */
const mk=(y,a=0)=>({x:R(0,W),y,v:R(.15,.5),b:R(.6,1),ph:R(0,6.3),a,boost:0,m:nextMsg()});
function drawLantern(l,mirror){
  const s=l.S||l.b*Math.min(W,H)*.04*(.35+.65*Math.max(0,l.y/HZ)), k=l.lit??1;   // s = media altura del farol
  let a=l.a*lf; if(mirror) a*=Math.max(0,1-(HZ-l.y)/(HZ*.55));                   // el reflejo se desvanece con la altura
  if(a<=.01||s<.5)return;
  x.save(); x.globalAlpha=a;
  if(mirror){                                                                    // REFLEJO: mancha vertical que ondula
    const ry=(l.rf?l.y+l.rf:2*HZ-l.y)+H*.015, w=Math.sin(T/500+l.ph*3)*s*.25;
    x.globalCompositeOperation='lighter';
    x.drawImage(glow,l.x-s*1.1+w,ry-s*2.6,s*2.2,s*5.2); x.restore(); return;
  }
  x.translate(l.x,l.y);
  x.globalCompositeOperation='lighter'; x.globalAlpha=a*(.35+.65*k)*(.88+.12*Math.sin(T/230+l.ph*5));
  x.drawImage(glow,-s*3.2,-s*3.2,s*6.4,s*6.4);                                   // halo
  x.globalCompositeOperation='source-over'; x.globalAlpha=a;
  const m=(p,q)=>Math.round(p+(q-p)*k);                                          // k: apagado → encendido
  const top=`rgb(${m(70,255)},${m(40,150)},${m(60,50)})`, bot=`rgb(${m(110,255)},${m(60,225)},${m(60,140)})`;
  if(s>3){const g=x.createLinearGradient(0,-s,0,s);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g}else x.fillStyle=bot;
  x.beginPath(); x.moveTo(-.55*s,-.95*s); x.quadraticCurveTo(0,-1.2*s,.55*s,-.95*s);   // cuerpo ovalado: más ancho arriba, boca abajo
  x.bezierCurveTo(.95*s,-.5*s,.8*s,.4*s,.55*s,.95*s); x.lineTo(-.55*s,.95*s);
  x.bezierCurveTo(-.8*s,.4*s,-.95*s,-.5*s,-.55*s,-.95*s); x.fill();
  if(s>3){x.fillStyle=`rgba(255,245,200,${.9*k})`;x.beginPath();x.ellipse(0,.5*s,.22*s,.32*s,0,0,7);x.fill()}   // llama
  x.restore();
}
function stepLantern(l,dt){
  l.y-=(l.v+l.boost)*dt*.06*H/800;  l.x+=Math.sin(T/900+l.ph)*.25;  l.boost*=.97;  l.a=Math.min(1,l.a+.02);
  if(l.y<-30){l.y=R(HZ,HZ+H*.08);l.x=R(0,W);l.a=0;l.m=nextMsg()}                            // reaparece desde el agua
}

/* ===== D. PARTÍCULAS (corazón y texto) ===== */
const N=1100;
function heartTargets(){
  const k=Math.min(W,H*.8)*.026, out=[];
  for(let i=0;i<N;i++){const t=R(0,6.283), j=1+R(-.07,.07);
    out.push([W/2+16*Math.sin(t)**3*k*j, H*.38-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*k*j]);}
  return out;
}
async function textTargets(txt){
  try{await document.fonts.load('100px "Great Vibes"')}catch(e){}
  const o=document.createElement('canvas'); o.width=W; o.height=220; const q=o.getContext('2d');
  let fs=200; q.font=`${fs}px "Great Vibes",cursive`; fs*=Math.min(1,W*.9/q.measureText(txt).width);
  q.font=`${fs}px "Great Vibes",cursive`; q.textAlign='center'; q.textBaseline='middle'; q.fillStyle='#fff'; q.fillText(txt,W/2,110);
  const d=q.getImageData(0,0,W,220).data, a=[];
  for(let py=0;py<220;py+=3)for(let px=0;px<W;px+=3) if(d[(py*W+px)*4+3]>128) a.push([px,H*.38-110+py]);
  a.sort(()=>Math.random()-.5);
  return Array.from({length:N},(_,i)=>a[i%a.length]||[W/2,H/3]);
}
function retarget(t){
  if(!pts.length) pts=t.map((p,i)=>{const s=lan[i%lan.length]||{x:R(0,W),y:R(0,HZ)};return{x:s.x,y:s.y,ph:R(0,6.3),r:R(.8,2)}});
  pts.forEach((p,i)=>{p.tx=t[i][0];p.ty=t[i][1]});
}

/* ===== E. UI: texto, botón, carta ===== */
const msg=$('#msg'), go=$('#go'), card=$('#card');
function say(t){msg.style.opacity=0; setTimeout(()=>{msg.textContent=t; msg.style.opacity=t?1:0},400)}

/* ===== E2. EXTRAS ANIMADOS ===== */
const mist=document.createElement('canvas'); mist.width=256; mist.height=64;      // sprite de neblina (elipse difusa)
{const g=mist.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);
 r.addColorStop(0,'rgba(255,170,200,.35)');r.addColorStop(1,'rgba(255,170,200,0)');g.scale(1,.25);g.fillStyle=r;g.fillRect(0,0,256,256)}
function makeRip(){rip=Array.from({length:70},()=>{const d=Math.random()**1.6;
  return{x:R(0,W*1.2),y:HZ+H*.02+d*(H-HZ),w:R(.05,.22)*W,h:R(1,2),sp:R(.004,.016),ph:R(0,6.3),a:.05+.22*(1-d)}})}
function scene(dt){
  for(let i=0;i<3;i++){const mx=((T*.006*(i+1)+i*W*.55)%(W*1.5))-W*.4; x.globalAlpha=.7; x.drawImage(mist,mx,HZ-H*.045,W*.9,H*.09)}  // neblina a la deriva
  x.globalAlpha=1;
  for(const r of rip){const rx=((r.x+T*r.sp)%(W*1.2))-W*.1, a=r.a*(.5+.5*Math.sin(T/600+r.ph));                           // ondas del lago
    x.fillStyle=`rgba(255,175,205,${a})`; x.fillRect(rx,r.y,r.w,r.h)}
  if(!star&&st!=='letter'&&Math.random()<.0015) star={x:R(W*.4,W),y:R(HZ*.05,HZ*.35),l:1};                              // estrella fugaz
  if(star){star.x-=dt*.45;star.y+=dt*.2;star.l-=dt/900;
    x.strokeStyle=`rgba(255,240,220,${Math.max(0,star.l)})`;x.lineWidth=1.5;x.beginPath();x.moveTo(star.x,star.y);x.lineTo(star.x+60,star.y-27);x.stroke();
    if(star.l<=0)star=null}
}
function burst(px,py){for(let i=0;i<20;i++){const a=R(0,6.283),v=R(.03,.13);spk.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1})}}
function sparks(dt){
  x.globalCompositeOperation='lighter';
  spk=spk.filter(q=>q.l>0);
  for(const q of spk){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=.00008*dt;q.l-=dt/1000;x.globalAlpha=Math.max(0,q.l);x.drawImage(glow,q.x-7,q.y-7,14,14)}
  x.globalAlpha=1; x.globalCompositeOperation='source-over';
}
const note=$('#note');
function wish(l){noteL=l;note.textContent=l.m;note.classList.add('on');clearTimeout(noteTO);noteTO=setTimeout(()=>{note.classList.remove('on');noteL=null},4800)}
function pad(on){                                                                   // pad ambiental con WebAudio (4 senos + filtro con LFO)
  if(!au){au=new (window.AudioContext||window.webkitAudioContext)();const o=au.createGain();o.gain.value=0;
    const f=au.createBiquadFilter();f.type='lowpass';f.frequency.value=700;f.connect(o);o.connect(au.destination);
    [220,277.2,329.6,440].forEach((fr,i)=>{const q=au.createOscillator(),g=au.createGain();q.frequency.value=fr;q.detune.value=i*3;g.gain.value=.05;q.connect(g);g.connect(f);q.start()});
    const lfo=au.createOscillator(),lg=au.createGain();lfo.frequency.value=.12;lg.gain.value=200;lfo.connect(lg);lg.connect(f.frequency);lfo.start();au.out=o}
  au.resume(); au.out.gain.linearRampToValueAtTime(on?.8:0,au.currentTime+1.5);
}
$('#fs').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(err){}};

/* ===== F. INTERACCIÓN ===== */
c.addEventListener('pointerdown',e=>{
  if(st==='hold'){down=true;return}
  if(st!=='sky')return;
  let best=null,bd=48;                                                         // ¿tocó un farol cercano?
  for(const l of lan){const d=Math.hypot(l.x-e.clientX,l.y-e.clientY); if(d<bd){bd=d;best=l}}
  if(!best){best=mk(e.clientY,1);best.x=e.clientX;lan.push(best)}
  best.boost=3; wish(best); burst(best.x,best.y);
});
addEventListener('pointerup',()=>down=false);
addEventListener('pointercancel',()=>down=false);

go.onclick=async()=>{
  go.classList.remove('on'); say(''); st='heart'; retarget(heartTargets());
  setTimeout(async()=>{st='text'; retarget(await textTargets('Mi amor'))},3800);
  setTimeout(()=>{st='letter'; card.classList.add('on')},8200);
};
$('#back').onclick=()=>{
  card.classList.remove('on'); st='sky';
  pts.forEach(p=>{p.tx=R(0,W);p.ty=-60});
  setTimeout(()=>{pts=[]},2500);
  say('Toca un farol'); setTimeout(()=>go.classList.add('on'),1500);
};

/* ===== G. BUCLE PRINCIPAL ===== */
function frame(now){
  const dt=Math.min(50,now-last||16); last=now; T=now;
  x.globalCompositeOperation='source-over'; x.drawImage(bg,0,0,W,H); scene(dt);

  if(st==='hold'){                                    // mantener pulsado → el farol se enciende
    hold=down?Math.min(1,hold+dt/1200):Math.max(0,hold-dt/700);
    main.a=1; main.lit=.1+.9*hold;
    if(hold>=1) st='rise';
  }
  if(st==='rise'){                                    // sube y arranca el cielo lleno de faroles
    main.y-=dt*.1; main.lit=1;
    if(main.y<H*.3){
      st='sky'; main.S=0;main.b=1.4;main.v=.3;main.rf=0; lan.push(main); say('Y estas también.');
      for(let i=0;i<150;i++){const l=mk(HZ*(1-Math.random()**1.6));l.b=.3+Math.random()**3*1.5;lan.push(l)}
      setTimeout(()=>say('Toca un farol'),2800); setTimeout(()=>go.classList.add('on'),4200);
    }
  }
  if(st==='heart'||st==='text'||st==='letter') lf=Math.max(0,lf-dt/1500); else lf=Math.min(1,lf+dt/1500);

  if(st==='hold'||st==='rise'){ main.x=W/2+Math.sin(T/700)*3; drawLantern(main,true); drawLantern(main); }
  else lan.forEach(l=>{stepLantern(l,dt); drawLantern(l,true); drawLantern(l)});

  if(pts.length){                                     // partículas: easing hacia su objetivo + temblor
    x.globalCompositeOperation='lighter'; x.globalAlpha=.9;
    for(const p of pts){
      p.x+=(p.tx-p.x)*.05+Math.sin(T/300+p.ph)*.25; p.y+=(p.ty-p.y)*.05+Math.cos(T/330+p.ph)*.25;
      const s=p.r*7; x.drawImage(glow,p.x-s/2,p.y-s/2,s,s);
    }
    x.globalAlpha=1;
  }
  sparks(dt);
  if(noteL&&st!=='sky'){note.classList.remove('on');noteL=null}
  if(noteL) note.style.transform=`translate(${Math.min(W-90,Math.max(90,noteL.x))}px,${Math.max(70,noteL.y-40)}px) translate(-50%,-100%)`;  // la nota sigue al farol
  requestAnimationFrame(frame);
}

/* ===== MUSICA AUTOMATICA ===== */
const musica = document.getElementById('musica');
musica.volume = 0.4;
musica.play().catch(() => {
  console.log('El navegador bloqueó la reproducción automática. Puede requerir una interacción.');
});

/* ===== H. ARRANQUE ===== */
addEventListener('resize',resize);
main={x:0,y:0,S:15,a:1,lit:.1,m:'Mi deseo eres tú'};
resize(); main.x=W/2; main.y=H*.54;
say('Mantén pulsado para encenderlo');
requestAnimationFrame(frame);
