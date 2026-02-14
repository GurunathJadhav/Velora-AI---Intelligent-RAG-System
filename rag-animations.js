/* ===== Velora AI RAG Flowchart - Continuous Animations =====
   Example: User ingests "https://aseuro.com" then asks
   "What services does Aseuro offer?" to the Velora AI RAG system.
================================================================ */

const allCanvases = {};
const canvasDefaults = {};
function setupCanvas(id, fallbackH){
  const el = document.getElementById(id);
  if(!el) return null;
  const box = el.parentElement;
  // Use actual computed height (CSS media queries may override inline style)
  const computedH = box.offsetHeight || fallbackH;
  el.width = box.offsetWidth * 2;
  el.height = computedH * 2;
  el.style.width = box.offsetWidth + 'px';
  el.style.height = computedH + 'px';
  const ctx = el.getContext('2d');
  ctx.scale(2,2);
  allCanvases[id] = {el, ctx, w: box.offsetWidth, h: computedH, active: true};
  canvasDefaults[id] = fallbackH;
  return allCanvases[id];
}
let resizeTimer;
window.addEventListener('resize', ()=>{
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(()=>{
    Object.keys(canvasDefaults).forEach(id=>setupCanvas(id, canvasDefaults[id]));
  }, 200);
});
window.addEventListener('load', ()=>{
  setupCanvas('c1',200); setupCanvas('c2',180); setupCanvas('c3',200);
  setupCanvas('c4',200); setupCanvas('c5',250); setupCanvas('c6',240);
  setupCanvas('c7',220); setupCanvas('c8',340); setupCanvas('c9',200);
  setupCanvas('c10',220); setupCanvas('c11',360); setupCanvas('c12',220);
  startAnimLoop();
});

/* ===== UTILITIES ===== */
const VB='#38bdf8',VP='#a78bfa',VG='#34d399',VC='#22d3ee',VR='#f87171',VI='#e2e8f0',VM='#94a3b8',VY='#fbbf24',VPK='#f472b6';
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function drawArr(c,x1,y1,x2,y2,color){
  c.beginPath();c.strokeStyle=color;c.lineWidth=2;c.shadowColor=color;c.shadowBlur=6;
  c.moveTo(x1,y1);c.lineTo(x2,y2);
  const a=Math.atan2(y2-y1,x2-x1),s=8;
  c.lineTo(x2-s*Math.cos(a-.4),y2-s*Math.sin(a-.4));c.moveTo(x2,y2);
  c.lineTo(x2-s*Math.cos(a+.4),y2-s*Math.sin(a+.4));c.stroke();c.shadowBlur=0;
}

/* =====================================================
   STEP 1: DATA SOURCES
   Velora AI: URLs (Playwright) + File uploads
===================================================== */
function draw1(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  // URL Sources (left)
  const urls=[
    {l:'https://aseuro.com',d:'Company website',c:VB},
    {l:'https://aseuro.com/about',d:'About page (recursive)',c:VC},
    {l:'https://aseuro.com/services',d:'Services page (recursive)',c:VP}
  ];
  // File Sources (right)
  const files=[
    {l:'company_report.pdf',d:'PyPDFLoader',c:VG},
    {l:'team_data.csv',d:'CSVLoader',c:VY},
    {l:'notes.txt',d:'TextLoader',c:VPK}
  ];

  // URL column
  ctx.fillStyle=VB+'10';ctx.strokeStyle=VB+'33';ctx.lineWidth=1;
  rr(ctx,8,4,w*.46,h-8,10);ctx.fill();ctx.stroke();
  ctx.fillStyle=VB;ctx.font='bold 9px Inter';ctx.fillText('🌐 URL SOURCES (Playwright)',14,20);
  urls.forEach((u,i)=>{
    const y=30+i*44;
    const pulse=.7+Math.sin(t*2+i)*.3;ctx.globalAlpha=pulse;
    ctx.fillStyle=u.c+'15';ctx.strokeStyle=u.c+'44';ctx.lineWidth=1;
    rr(ctx,14,y,w*.42,36,6);ctx.fill();ctx.stroke();
    ctx.font='bold 10px JetBrains Mono';ctx.fillStyle=u.c;ctx.fillText(u.l,20,y+15);
    ctx.font='9px Inter';ctx.fillStyle=VM;ctx.fillText(u.d,20,y+29);
    ctx.globalAlpha=1;
    // particle
    const px=14+w*.42+5+(t*40+i*18)%35;
    ctx.beginPath();ctx.fillStyle=u.c;ctx.shadowColor=u.c;ctx.shadowBlur=5;
    ctx.arc(Math.min(px,w*.52),y+18,2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  });

  // File column
  ctx.fillStyle=VG+'10';ctx.strokeStyle=VG+'33';ctx.lineWidth=1;
  rr(ctx,w*.52,4,w*.46,h-8,10);ctx.fill();ctx.stroke();
  ctx.fillStyle=VG;ctx.font='bold 9px Inter';ctx.fillText('📄 FILE UPLOADS',w*.54+6,20);
  files.forEach((f,i)=>{
    const y=30+i*44;const x=w*.54+6;
    const pulse=.7+Math.sin(t*2+i+3)*.3;ctx.globalAlpha=pulse;
    ctx.fillStyle=f.c+'15';ctx.strokeStyle=f.c+'44';ctx.lineWidth=1;
    rr(ctx,x,y,w*.4,36,6);ctx.fill();ctx.stroke();
    ctx.font='bold 10px Inter';ctx.fillStyle=f.c;ctx.fillText(f.l,x+8,y+15);
    ctx.font='9px Inter';ctx.fillStyle=VM;ctx.fillText(f.d,x+8,y+29);
    ctx.globalAlpha=1;
  });
}

/* =====================================================
   STEP 2: INGESTION PIPELINE
   Playwright → HTML → BeautifulSoup → Document
===================================================== */
function draw2(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const stages=[
    {l:'Playwright',s:'headless Chromium\npage.goto(url)',c:VB,done:'HTML fetched'},
    {l:'HTML Content',s:'page.content()\nfull DOM rendered',c:VP,done:'Raw HTML'},
    {l:'BS4 Parser',s:'_extract_structured\n_content(html, url)',c:VG,done:'Clean text'},
    {l:'Document',s:'Document(text,\n{source: url})',c:VC,done:'LangChain Doc'}
  ];
  const sw=Math.min(155,(w-50)/4-10), sh=100, cy=h/2+5;
  const activeIdx=Math.floor(t*1.0)%4;
  stages.forEach((s,i)=>{
    const x=10+i*(sw+14), y=cy-sh/2;
    const on=i<=activeIdx;
    ctx.fillStyle=on?s.c+'18':'rgba(30,40,70,.2)';
    ctx.strokeStyle=on?s.c+'66':'rgba(56,78,135,.25)';ctx.lineWidth=on?2:1;
    rr(ctx,x,y,sw,sh,10);ctx.fill();ctx.stroke();
    if(on&&i===activeIdx){ctx.shadowColor=s.c;ctx.shadowBlur=10;rr(ctx,x,y,sw,sh,10);ctx.stroke();ctx.shadowBlur=0;}
    ctx.font='bold 11px Inter';ctx.fillStyle=on?s.c:VM+'88';ctx.fillText(s.l,x+10,y+18);
    const lines=s.s.split('\n');
    lines.forEach((ln,j)=>{ctx.font='9px JetBrains Mono';ctx.fillStyle=VM;ctx.fillText(ln,x+10,y+34+j*13);});
    if(on){ctx.fillStyle=VG+'bb';ctx.font='bold 9px Inter';ctx.fillText('\u2713 '+s.done,x+10,y+sh-10);}
    if(i<3){const ax=x+sw+2;drawArr(ctx,ax,cy,ax+10,cy,on?s.c+'88':VM+'33');}
  });
  // Traveling pulse
  const pulseX=10+(t*70)%(w-20);
  ctx.beginPath();ctx.fillStyle=VB;ctx.shadowColor=VB;ctx.shadowBlur=12;
  ctx.arc(pulseX,cy,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
}

/* =====================================================
   STEP 3: PREPROCESSING (BeautifulSoup)
   Raw HTML → Structured clean text
===================================================== */
function draw3(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const mid=w/2;
  // LEFT: Raw HTML
  ctx.fillStyle=VR+'08';ctx.strokeStyle=VR+'44';ctx.lineWidth=1.5;
  rr(ctx,10,10,mid-22,h-20,12);ctx.fill();ctx.stroke();
  ctx.fillStyle=VR;ctx.font='bold 10px Inter';ctx.fillText('\u274C RAW HTML (aseuro.com)',20,28);
  const dirty=[
    {t:'<script>analytics.track(..)</script>',y:46,bad:true},
    {t:'<style>.nav{display:flex}</style>',y:64,bad:true},
    {t:'<noscript>Enable JS</noscript>',y:82,bad:true},
    {t:'<h1>Aseuro Technologies</h1>',y:100,bad:false},
    {t:'<p>IT consulting & cloud...</p>',y:118,bad:false},
    {t:'<img alt="team photo" src=..>',y:136,bad:false},
    {t:'<iframe src="ads.js"></iframe>',y:154,bad:true}
  ];
  dirty.forEach(d=>{
    ctx.font='9px JetBrains Mono';ctx.fillStyle=d.bad?VR+'66':VG+'88';ctx.fillText(d.t,20,d.y);
    if(d.bad){ctx.beginPath();ctx.strokeStyle=VR+'55';ctx.lineWidth=1;
      ctx.moveTo(20,d.y-3);ctx.lineTo(20+ctx.measureText(d.t).width,d.y-3);ctx.stroke();}
  });
  // Beam
  const bx=mid+Math.sin(t*2)*8;
  ctx.beginPath();ctx.strokeStyle=VG;ctx.lineWidth=3;ctx.shadowColor=VG;ctx.shadowBlur=18;
  ctx.setLineDash([6,4]);ctx.moveTo(bx,6);ctx.lineTo(bx,h-6);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;
  // RIGHT: Clean
  ctx.fillStyle=VG+'08';ctx.strokeStyle=VG+'44';ctx.lineWidth=1.5;
  rr(ctx,mid+10,10,mid-22,h-20,12);ctx.fill();ctx.stroke();
  ctx.fillStyle=VG;ctx.font='bold 10px Inter';ctx.fillText('\u2705 STRUCTURED OUTPUT',mid+20,28);
  const clean=[
    {t:'# Aseuro Technologies',y:48},
    {t:'**Desc:** IT consulting firm',y:66},
    {t:'**Keywords:** cloud, DevOps',y:84},
    {t:'IT consulting & cloud...',y:104},
    {t:'- Digital transformation',y:122},
    {t:'- Cloud migration services',y:138},
    {t:'[Image: team photo]',y:156},
    {t:'source: "aseuro.com"',y:174}
  ];
  const prog=Math.min(clean.length,Math.floor(t*1.5)%(clean.length+2));
  clean.forEach((s,i)=>{
    ctx.font=s.t.startsWith(' ')||s.t.startsWith('[')?'9px JetBrains Mono':'10px Inter';
    ctx.fillStyle=i<prog?(s.t.startsWith('source')?VC:VG+'dd'):VM+'33';
    ctx.fillText(s.t,mid+20,s.y);
  });
}

/* =====================================================
   STEP 4: TEXT CHUNKING (Animated)
   RecursiveCharacterTextSplitter(400, 50)
===================================================== */
function draw4(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);

  // --- Cycle: 8-second loop ---
  const cycle=t%8;
  const nc=4;

  // --- Source document bar (top) ---
  const docW=w-30, docH=28, docX=15, docY=8;
  ctx.fillStyle=VB+'10';ctx.strokeStyle=VB+'44';ctx.lineWidth=1.5;
  rr(ctx,docX,docY,docW,docH,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=VB;ctx.font='bold 10px Inter';ctx.textAlign='center';
  ctx.fillText('Aseuro page content (~1800 chars)',w/2,26);

  // --- Animated splitter blade scanning across document ---
  const bladePhase=Math.min(1,cycle/2.0); // 0→1 over first 2 seconds
  const bladeX=docX+bladePhase*docW;
  if(bladePhase<1){
    // Blade line
    ctx.beginPath();ctx.strokeStyle=VP;ctx.lineWidth=2;ctx.shadowColor=VP;ctx.shadowBlur=14;
    ctx.moveTo(bladeX,docY-2);ctx.lineTo(bladeX,docY+docH+2);ctx.stroke();ctx.shadowBlur=0;
    // Blade glow trail
    const grd=ctx.createLinearGradient(bladeX-60,0,bladeX,0);
    grd.addColorStop(0,'rgba(167,139,250,0)');grd.addColorStop(1,'rgba(167,139,250,0.15)');
    ctx.fillStyle=grd;ctx.fillRect(Math.max(docX,bladeX-60),docY,Math.min(60,bladeX-docX),docH);
    // Separator markers on the doc
    for(let i=1;i<nc;i++){
      const sx=docX+(docW/nc)*i;
      if(sx<bladeX){
        ctx.beginPath();ctx.strokeStyle=VR+'88';ctx.lineWidth=2;ctx.setLineDash([3,3]);
        ctx.moveTo(sx,docY+2);ctx.lineTo(sx,docY+docH-2);ctx.stroke();ctx.setLineDash([]);
      }
    }
  } else {
    // All separators shown
    for(let i=1;i<nc;i++){
      const sx=docX+(docW/nc)*i;
      ctx.beginPath();ctx.strokeStyle=VR+'88';ctx.lineWidth=2;ctx.setLineDash([3,3]);
      ctx.moveTo(sx,docY+2);ctx.lineTo(sx,docY+docH-2);ctx.stroke();ctx.setLineDash([]);
    }
  }

  // Splitter label with pulsing opacity
  const labelAlpha=.5+Math.sin(t*3)*.3;
  ctx.globalAlpha=labelAlpha;
  ctx.fillStyle=VP;ctx.font='bold 9px Inter';
  ctx.fillText('\u2193 RecursiveCharacterTextSplitter(chunk_size=400, overlap=50)',w/2,52);
  ctx.globalAlpha=1;

  // --- Chunks data ---
  const chunks=[
    {title:'Chunk 1',text:'"Aseuro Technologies\nis an IT consulting\nfirm offering..."',c:VB,chars:'382'},
    {title:'Chunk 2',text:'"Cloud migration\nservices, DevOps,\nand infrastructure"',c:VP,chars:'396'},
    {title:'Chunk 3',text:'"Digital transform-\nation solutions for\nenterprise clients"',c:VG,chars:'374'},
    {title:'Chunk 4',text:'"Contact us at\ninfo@aseuro.com\nMumbai, India"',c:VY,chars:'312'}
  ];
  const cw=(w-50)/nc-8;
  const startY=62, ch=h-startY-14;

  chunks.forEach((ck,i)=>{
    // --- Cascading reveal: each chunk appears 0.5s apart after blade finishes ---
    const revealStart=2.0+i*0.5;
    const revealProg=Math.max(0,Math.min(1,(cycle-revealStart)/0.6));

    if(revealProg<=0) return;

    const targetX=18+i*(cw+12);
    // Slide in from above
    const slideY=startY-30*(1-revealProg);
    const x=targetX;
    const y=slideY;

    ctx.globalAlpha=revealProg;

    // Chunk card with glow on active
    const isActive=cycle>=revealStart&&cycle<revealStart+1.5;
    if(isActive){ctx.shadowColor=ck.c;ctx.shadowBlur=12;}
    ctx.fillStyle=ck.c+'12';ctx.strokeStyle=ck.c+(isActive?'88':'55');ctx.lineWidth=isActive?2:1.5;
    rr(ctx,x,y,cw,ch,8);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;

    // Title
    ctx.font='bold 11px Inter';ctx.fillStyle=ck.c;ctx.textAlign='center';
    ctx.fillText(ck.title,x+cw/2,y+18);

    // Char count with animated counter effect
    const displayChars=Math.floor(parseInt(ck.chars)*Math.min(1,(cycle-revealStart)/1.0));
    ctx.font='9px JetBrains Mono';ctx.fillStyle=VM;
    ctx.fillText(displayChars+'/400 chars',x+cw/2,y+32);

    // Content lines — typewriter reveal
    const textProg=Math.max(0,(cycle-revealStart-0.3)/1.2);
    const lines=ck.text.split('\n');
    lines.forEach((l,j)=>{
      const lineProg=Math.max(0,Math.min(1,(textProg-j*0.25)*3));
      if(lineProg>0){
        const showChars=Math.floor(l.length*lineProg);
        ctx.font='9px JetBrains Mono';ctx.fillStyle=VI+'99';
        ctx.fillText(l.substring(0,showChars),x+cw/2,y+50+j*14);
      }
    });

    // --- Overlap zone (pulsing) between chunks ---
    if(i<nc-1&&revealProg>=1){
      const ox=x+cw-3;
      const overlapPulse=.15+Math.sin(t*4+i*1.5)*.12;
      ctx.fillStyle='rgba(167,139,250,'+overlapPulse+')';
      rr(ctx,ox,y+4,14,ch-8,4);ctx.fill();
      // Glowing border
      ctx.strokeStyle=VP+(Math.sin(t*3+i)>.3?'77':'33');ctx.lineWidth=1;
      rr(ctx,ox,y+4,14,ch-8,4);ctx.stroke();
      // Vertical label
      ctx.save();ctx.translate(ox+7,y+ch/2);ctx.rotate(-Math.PI/2);
      ctx.fillStyle=VP+'bb';ctx.font='bold 7px Inter';ctx.fillText('50 overlap',0,0);ctx.restore();
    }

    ctx.globalAlpha=1;

    // --- Particle stream from doc to chunk ---
    if(revealProg>0&&revealProg<1){
      const docCenterX=docX+(docW/nc)*(i+0.5);
      for(let p=0;p<3;p++){
        const pp=(cycle-revealStart+p*0.15)%0.6/0.6;
        const px=docCenterX+(x+cw/2-docCenterX)*pp;
        const py=(docY+docH)+(y-(docY+docH))*pp;
        ctx.beginPath();ctx.fillStyle=ck.c;ctx.shadowColor=ck.c;ctx.shadowBlur=6;
        ctx.arc(px,py,2.5-pp*1.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      }
    }
  });

  // --- Separator labels on the doc (after blade pass) ---
  if(bladePhase>=1){
    const seps=['\\n\\n','"\\n"','" "','""'];
    for(let i=1;i<nc;i++){
      const sx=docX+(docW/nc)*i;
      const sepPulse=.5+Math.sin(t*2+i)*.3;
      ctx.globalAlpha=sepPulse;
      ctx.fillStyle=VR;ctx.font='bold 7px JetBrains Mono';
      ctx.fillText(seps[i-1]||'',sx,docY-2);
      ctx.globalAlpha=1;
    }
  }

  // --- Progress counter (bottom right) ---
  const totalRevealed=Math.min(nc,Math.floor(Math.max(0,cycle-2.0)/0.5)+1);
  if(cycle>=2.0){
    ctx.fillStyle='rgba(0,0,0,.4)';rr(ctx,w-120,h-22,108,18,6);ctx.fill();
    ctx.fillStyle=VG;ctx.font='bold 9px JetBrains Mono';ctx.textAlign='right';
    ctx.fillText('\u2713 '+Math.min(totalRevealed,nc)+'/'+nc+' chunks created',w-18,h-9);
  }
  ctx.textAlign='left';
}

/* =====================================================
   STEP 5: EMBEDDING MODEL
   all-MiniLM-L6-v2 → 384-dim vectors
===================================================== */
function draw5(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  // Input text
  ctx.fillStyle=VB+'12';ctx.strokeStyle=VB+'44';ctx.lineWidth=1;
  rr(ctx,10,10,w*.22,35,8);ctx.fill();ctx.stroke();
  ctx.font='9px JetBrains Mono';ctx.fillStyle=VB;
  ctx.fillText('"Aseuro is an IT',18,25);ctx.fillText('consulting firm"',18,38);
  // Neural network
  const layers=[3,5,6,5,3,1];
  const netStartX=w*.26, netW=w*.48;
  const gap=netW/(layers.length+1);
  const lx=[],ly=[];
  for(let l=0;l<layers.length;l++){
    lx[l]=[];ly[l]=[];const n=layers[l],yg=(h-50)/(n+1);
    for(let i=0;i<n;i++){lx[l].push(netStartX+gap*(l+1));ly[l].push(yg*(i+1)+20);}
  }
  const activeL=Math.floor(t*1.5)%layers.length;
  // connections
  for(let l=0;l<layers.length-1;l++){
    for(let i=0;i<layers[l];i++){
      for(let j=0;j<layers[l+1];j++){
        const on=l<=activeL;
        ctx.beginPath();ctx.strokeStyle=on?VB+'22':'rgba(56,78,135,.08)';ctx.lineWidth=on?1:.4;
        ctx.moveTo(lx[l][i],ly[l][i]);ctx.lineTo(lx[l+1][j],ly[l+1][j]);ctx.stroke();
      }
    }
  }
  // activation pulse
  if(activeL<layers.length){
    const px=netStartX+gap*(activeL+1);
    ctx.beginPath();ctx.strokeStyle=VB+'33';ctx.lineWidth=2;ctx.shadowColor=VB;ctx.shadowBlur=12;
    ctx.moveTo(px,15);ctx.lineTo(px,h-20);ctx.stroke();ctx.shadowBlur=0;
  }
  // nodes
  const lbls=['Tokens','L1','L2','L3','Pool','Out'];
  for(let l=0;l<layers.length;l++){
    const on=l<=activeL;
    for(let i=0;i<layers[l];i++){
      ctx.beginPath();const col=l===layers.length-1?VG:VB;
      ctx.fillStyle=on?col:'rgba(56,78,135,.4)';ctx.shadowColor=on?col:'transparent';ctx.shadowBlur=on?8:0;
      ctx.arc(lx[l][i],ly[l][i],on?6:3.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    }
    ctx.fillStyle=on?VB:VM+'66';ctx.font='bold 8px Inter';ctx.textAlign='center';
    ctx.fillText(lbls[l],netStartX+gap*(l+1),h-6);
  }
  // Model label
  ctx.fillStyle=VP+'22';ctx.strokeStyle=VP+'44';ctx.lineWidth=1;
  rr(ctx,netStartX,h-25,netW,16,4);ctx.fill();ctx.stroke();
  ctx.fillStyle=VP;ctx.font='bold 7px Inter';
  ctx.fillText('all-MiniLM-L6-v2',netStartX+netW/2,h-15);
  // Output vector
  ctx.fillStyle=VG+'12';ctx.strokeStyle=VG+'55';ctx.lineWidth=1.5;
  rr(ctx,w*.78,h/2-35,w*.2,70,8);ctx.fill();ctx.stroke();
  ctx.fillStyle=VG;ctx.font='bold 11px Inter';ctx.fillText('384-dim',w*.88,h/2-18);
  ctx.font='8px JetBrains Mono';ctx.fillStyle=VG+'bb';
  ctx.fillText('[0.042,',w*.88,h/2-2);
  ctx.fillText('-0.318,',w*.88,h/2+12);
  ctx.fillText('0.156,',w*.88,h/2+24);
  ctx.fillText('...]',w*.88,h/2+36);
  ctx.textAlign='left';
}

/* =====================================================
   STEP 6: UPSTASH VECTOR DATABASE
===================================================== */
function draw6(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  // LEFT: Vector store
  ctx.fillStyle=VM;ctx.font='bold 10px Inter';ctx.fillText('UPSTASH VECTOR — namespace: "aseuro"',12,16);
  const entries=[
    {id:'uuid5_001',src:'aseuro.com',ns:'aseuro',dim:'384'},
    {id:'uuid5_002',src:'aseuro.com/about',ns:'aseuro',dim:'384'},
    {id:'uuid5_003',src:'aseuro.com/services',ns:'aseuro',dim:'384'},
    {id:'uuid5_004',src:'report.pdf',ns:'aseuro',dim:'384'},
    {id:'uuid5_005',src:'team_data.csv',ns:'aseuro',dim:'384'}
  ];
  const fillCount=Math.floor(t*1.5)%6;
  entries.forEach((e,i)=>{
    const y=28+i*30;
    const on=i<fillCount;
    ctx.fillStyle=on?VP+'18':'rgba(56,78,135,.1)';ctx.strokeStyle=on?VP+'55':'rgba(56,78,135,.2)';ctx.lineWidth=1;
    rr(ctx,12,y,w*.42,24,4);ctx.fill();ctx.stroke();
    if(on){
      ctx.font='8px JetBrains Mono';ctx.fillStyle=VP;ctx.fillText(e.id,18,y+15);
      ctx.fillStyle=VM;ctx.fillText(e.src,90,y+15);ctx.fillText(e.dim+'d',w*.34,y+15);
    }
  });
  // RIGHT: Metadata details
  const gx=w*.48;
  ctx.fillStyle=VM;ctx.font='bold 10px Inter';ctx.fillText('VECTOR METADATA',gx,16);
  const meta=[
    {k:'id',v:'uuid5(content+source)',c:VP},
    {k:'vector',v:'384-dim float[]',c:VB},
    {k:'metadata.text',v:'"Aseuro is an IT..."',c:VG},
    {k:'metadata.namespace',v:'"aseuro"',c:VC},
    {k:'metadata.url',v:'"https://aseuro.com"',c:VY},
    {k:'ttl',v:'86400 (24 hours)',c:VR}
  ];
  meta.forEach((m,i)=>{
    const y=28+i*30;
    const on=i<fillCount;
    ctx.fillStyle=on?m.c+'12':'rgba(56,78,135,.06)';ctx.strokeStyle=on?m.c+'44':'rgba(56,78,135,.15)';ctx.lineWidth=1;
    rr(ctx,gx,y,w-gx-12,24,4);ctx.fill();ctx.stroke();
    if(on){
      ctx.font='bold 9px JetBrains Mono';ctx.fillStyle=m.c;ctx.fillText(m.k,gx+8,y+15);
      ctx.font='9px JetBrains Mono';ctx.fillStyle=VM;ctx.fillText(m.v,gx+w*.22,y+15);
    }
  });
  // Upload pulse
  const py=28+(fillCount%6)*30+12;
  ctx.beginPath();ctx.fillStyle=VG;ctx.shadowColor=VG;ctx.shadowBlur=10;
  ctx.arc(w*.44,py,4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
}

/* =====================================================
   STEP 7: USER QUERY + QUERY EXPANSION
   "What services does Aseuro offer?" → synonym expansion
===================================================== */
const fullQ='What services does Aseuro offer?';
function draw7(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  // Search box
  ctx.fillStyle='rgba(56,78,135,.12)';ctx.strokeStyle=VB+'44';ctx.lineWidth=1.5;
  rr(ctx,15,8,w-30,34,10);ctx.fill();ctx.stroke();
  const idx=Math.min(Math.floor(t*6)%(fullQ.length+10),fullQ.length);
  const typed=fullQ.substring(0,idx);
  ctx.font='13px JetBrains Mono';ctx.fillStyle=VI;ctx.fillText('> '+typed,28,30);
  if(Math.floor(t*3)%2===0){const tw=ctx.measureText('> '+typed).width;ctx.fillStyle=VB;ctx.fillRect(30+tw,18,2,16);}

  if(idx>15){
    // QueryExpander
    ctx.fillStyle=VP;ctx.font='bold 9px Inter';ctx.textAlign='center';
    ctx.fillText('\u2193 QueryExpander (synonym map)',w/2,56);
    const variations=[
      {q:'"What services does Aseuro offer?"',c:VB,label:'Original'},
      {q:'"What offerings does Aseuro offer?"',c:VP,label:'Var 1: services→offerings'},
      {q:'"What solutions does Aseuro offer?"',c:VG,label:'Var 2: services→solutions'}
    ];
    ctx.textAlign='left';
    variations.forEach((v,i)=>{
      const y=66+i*32;
      const show=idx>20+i*5;
      if(show){
        ctx.fillStyle=v.c+'12';ctx.strokeStyle=v.c+'33';ctx.lineWidth=1;
        rr(ctx,15,y,w-30,26,6);ctx.fill();ctx.stroke();
        ctx.font='9px JetBrains Mono';ctx.fillStyle=v.c;ctx.fillText(v.q,22,y+11);
        ctx.font='8px Inter';ctx.fillStyle=VM;ctx.fillText(v.label,22,y+22);
      }
    });
    // Embedding
    if(idx>fullQ.length){
      ctx.textAlign='center';ctx.fillStyle=VC;ctx.font='bold 9px Inter';
      ctx.fillText('\u2193 all-MiniLM-L6-v2 → 3 query vectors (384d each)',w/2,168);
      ctx.fillStyle=VG+'12';ctx.strokeStyle=VG+'44';ctx.lineWidth=1.5;
      rr(ctx,w*.1,176,w*.8,32,8);ctx.fill();ctx.stroke();
      ctx.fillStyle=VG;ctx.font='11px JetBrains Mono';
      ctx.fillText('q_vec1=[0.034,-0.218,...]  q_vec2=[0.051,-0.197,...]  q_vec3=[0.029,-0.242,...]',w/2,196);
      ctx.textAlign='left';
    }
  }
}

/* =====================================================
   STEP 8: SIMILARITY SEARCH (Animated)
   Upstash .query() with namespace filter
===================================================== */
function draw8(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const cycle=t%10;

  // Background
  ctx.fillStyle='rgba(56,78,135,.04)';rr(ctx,4,4,w-8,h-8,14);ctx.fill();

  // Title
  ctx.fillStyle=VM;ctx.font='bold 10px Inter';ctx.textAlign='center';
  ctx.fillText('UPSTASH VECTOR SPACE — namespace="aseuro" (384-dim)',w/2,18);

  // --- LEFT: Query cluster ---
  const qx=55, qy=h*.38;
  // Pulsing search ring
  const ringR=18+Math.sin(t*3)*4;
  ctx.beginPath();ctx.strokeStyle=VB+'33';ctx.lineWidth=1.5;
  ctx.arc(qx,qy,ringR,0,Math.PI*2);ctx.stroke();
  // Main query dot
  ctx.beginPath();ctx.fillStyle=VB;ctx.shadowColor=VB;ctx.shadowBlur=14;
  ctx.arc(qx,qy,11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.font='bold 11px Inter';ctx.fillStyle='#fff';ctx.fillText('Q',qx,qy+4);
  // Variation dots
  const v1x=qx-14,v1y=qy-22,v2x=qx+16,v2y=qy-18,v3x=qx+8,v3y=qy+24;
  [{x:v1x,y:v1y,c:VP},{x:v2x,y:v2y,c:VC},{x:v3x,y:v3y,c:VG}].forEach(d=>{
    ctx.beginPath();ctx.fillStyle=d.c;ctx.arc(d.x,d.y,4,0,Math.PI*2);ctx.fill();
  });
  // Query label (below, no overlap)
  ctx.textAlign='left';
  ctx.font='bold 9px Inter';ctx.fillStyle=VB;ctx.fillText('"What services',14,qy+46);
  ctx.fillText('does Aseuro offer?"',14,qy+58);
  ctx.font='8px Inter';ctx.fillStyle=VM;ctx.fillText('3 query variations',14,qy+72);

  // --- RIGHT: Stored vectors with clear spacing ---
  const vecs=[
    {x:w*.38,y:55, s:.94,l:'services page',       top:true, c:VG},
    {x:w*.56,y:90, s:.91,l:'about page',           top:true, c:VB},
    {x:w*.42,y:155,s:.87,l:'consulting chunk',     top:true, c:VC},
    {x:w*.62,y:200,s:.72,l:'team data',             top:false,c:VP},
    {x:w*.78,y:55, s:.48,l:'contact page',          top:false,c:VM},
    {x:w*.82,y:140,s:.35,l:'csv row 5',             top:false,c:VM},
    {x:w*.72,y:260,s:.29,l:'pdf appendix',          top:false,c:VM},
    {x:w*.88,y:210,s:.15,l:'unrelated chunk',       top:false,c:VM}
  ];

  // --- Animated search beams (query → top matches) ---
  vecs.forEach((v,i)=>{
    if(!v.top) return;
    const beamProg=Math.max(0,Math.min(1,(cycle-0.5-i*0.6)/1.2));
    if(beamProg<=0) return;
    // Animated dashed beam
    const ex=qx+(v.x-qx)*beamProg, ey=qy+(v.y-qy)*beamProg;
    ctx.beginPath();ctx.strokeStyle=v.c+'55';ctx.lineWidth=2;
    ctx.shadowColor=v.c;ctx.shadowBlur=8;ctx.setLineDash([5,4]);
    ctx.moveTo(qx+11,qy);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.setLineDash([]);ctx.shadowBlur=0;
    // Traveling particle on beam
    const pp=(t*2+i)%1;
    const px=qx+(v.x-qx)*pp, py=qy+(v.y-qy)*pp;
    ctx.beginPath();ctx.fillStyle=v.c;ctx.shadowColor=v.c;ctx.shadowBlur=6;
    ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  });

  // --- Draw all vector dots and labels ---
  vecs.forEach((v,i)=>{
    const isRevealed=v.top?cycle>0.5+i*0.6:true;
    if(!isRevealed) return;
    // Dot
    const dotR=v.top?8:v.s>0.5?5:3.5;
    ctx.beginPath();
    ctx.fillStyle=v.top?v.c:v.s>0.5?VP+'66':VM+'44';
    if(v.top){ctx.shadowColor=v.c;ctx.shadowBlur=10;}
    ctx.arc(v.x,v.y,dotR,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // Label (right of dot, never overlapping)
    ctx.textAlign='left';ctx.font=v.top?'bold 9px Inter':'8px Inter';
    ctx.fillStyle=v.top?v.c:VM;
    ctx.fillText(v.l,v.x+dotR+6,v.y+4);
    // Score badge for top matches (above dot)
    if(v.top){
      const scoreRevealed=cycle>1.5+i*0.6;
      if(scoreRevealed){
        const sw=38,sh=16;
        ctx.fillStyle=v.c+'22';ctx.strokeStyle=v.c+'55';ctx.lineWidth=1;
        rr(ctx,v.x-sw/2,v.y-dotR-sh-4,sw,sh,4);ctx.fill();ctx.stroke();
        ctx.textAlign='center';ctx.font='bold 9px JetBrains Mono';ctx.fillStyle=v.c;
        ctx.fillText(v.s.toFixed(2),v.x,v.y-dotR-sh/2+1);
      }
    }
  });

  // --- Bottom: API call + dedup info ---
  const bottomY=h-42;
  ctx.fillStyle='rgba(0,0,0,.45)';rr(ctx,12,bottomY,w-24,34,8);ctx.fill();
  ctx.textAlign='center';ctx.font='bold 9px JetBrains Mono';ctx.fillStyle=VG;
  ctx.fillText('index.query(vector, top_k=20, filter="namespace=\'aseuro\'")',w/2,bottomY+14);
  ctx.font='8px Inter';ctx.fillStyle=VM;
  ctx.fillText('Deduplicates across 3 variation queries — returns unique text chunks only',w/2,bottomY+28);
  ctx.textAlign='left';
}

/* =====================================================
   STEP 9: RE-RANKING
   cross-encoder/ms-marco-MiniLM-L-6-v2
===================================================== */
function draw9(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const items=[
    {l:'Services: "IT consulting, cloud migration..."',s:.94,ns:.97,c:VG},
    {l:'Consulting: "digital transformation..."',s:.87,ns:.93,c:VB},
    {l:'About: "Aseuro Technologies offers..."',s:.91,ns:.89,c:VP},
    {l:'Team: "experienced professionals..."',s:.72,ns:.58,c:VM},
    {l:'Contact: "Mumbai, India office..."',s:.48,ns:.32,c:'#64748b'}
  ];
  // Labels
  ctx.fillStyle=VM;ctx.font='bold 9px Inter';
  ctx.fillText('Bi-Encoder (MiniLM)',10,16);ctx.textAlign='center';
  ctx.fillText('\u2192 CrossEncoder(ms-marco) \u2192',w/2,16);
  ctx.textAlign='right';ctx.fillText('Re-Ranked',w-10,16);ctx.textAlign='left';
  const prog=(Math.sin(t*1.0)+1)/2;
  const sorted=[...items].sort((a,b)=>b.ns-a.ns);
  const barH=26,barGap=6,startY=28;
  for(let i=0;i<sorted.length;i++){
    const origIdx=items.indexOf(sorted[i]);
    const y=startY+(origIdx*(1-prog)+i*prog)*(barH+barGap);
    const maxW=w-100;
    ctx.fillStyle=sorted[i].c+'12';rr(ctx,80,y,maxW,barH,6);ctx.fill();
    const fillW=sorted[i].ns*maxW;
    ctx.fillStyle=sorted[i].c+'44';rr(ctx,80,y,fillW*prog,barH,6);ctx.fill();
    ctx.strokeStyle=sorted[i].c+'55';ctx.lineWidth=1;rr(ctx,80,y,fillW,barH,6);ctx.stroke();
    ctx.font='9px Inter';ctx.fillStyle=VI+'cc';ctx.fillText(sorted[i].l.substring(0,38)+'...',86,y+16);
    // Rank badge
    ctx.fillStyle=sorted[i].c+'33';ctx.beginPath();ctx.arc(68,y+barH/2,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=sorted[i].c;ctx.font='bold 9px Inter';ctx.textAlign='center';
    ctx.fillText('#'+(i+1),68,y+barH/2+3);ctx.textAlign='left';
  }
}

/* =====================================================
   STEP 10: PROMPT CONSTRUCTION
   System + Chat History + Context + Question
===================================================== */
function draw10(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const blocks=[
    {l:'SYSTEM',s:'"You are Velora AI, a professional AI analyst..."',c:VP,y:8},
    {l:'CHAT HISTORY',s:'MessagesPlaceholder(last 10 msgs)',c:VPK,y:46},
    {l:'CONTEXT [1]',s:'"Aseuro Technologies offers IT consulting, cloud..."',c:VB,y:84},
    {l:'CONTEXT [2]',s:'"Digital transformation solutions for enterprise..."',c:VC,y:118},
    {l:'QUESTION',s:'"What services does Aseuro offer?"',c:VG,y:156}
  ];
  const prog=Math.min(1,(t%5)/3.5);
  const bw=w*.84,bh=30;
  blocks.forEach((b,i)=>{
    const delay=i*.14;
    const p=Math.max(0,Math.min(1,(prog-delay)*2.5));
    const startX=-bw-30, targetX=(w-bw)/2;
    const x=startX+(targetX-startX)*p;
    if(p>0){
      ctx.globalAlpha=p;
      ctx.fillStyle=b.c+'12';ctx.strokeStyle=b.c+'44';ctx.lineWidth=1.5;
      rr(ctx,x,b.y,bw,bh,8);ctx.fill();ctx.stroke();
      ctx.font='bold 9px Inter';ctx.fillStyle=b.c;ctx.fillText(b.l,x+10,b.y+12);
      ctx.font='9px JetBrains Mono';ctx.fillStyle=VM;
      const maxChars=Math.floor(bw/6)-12;
      ctx.fillText(b.s.substring(0,maxChars),x+10,b.y+24);
      ctx.globalAlpha=1;
    }
  });
  if(prog>.85){
    ctx.fillStyle=VG+'22';ctx.strokeStyle=VG+'66';ctx.lineWidth=2;
    rr(ctx,w*.78,h/2-14,w*.2,28,10);ctx.fill();ctx.stroke();
    ctx.fillStyle=VG;ctx.font='bold 11px Inter';ctx.textAlign='center';
    ctx.fillText('\u2713 READY',w*.88,h/2+4);ctx.textAlign='left';
  }
}

/* =====================================================
   STEP 11: LLM GENERATION (Animated)
   Llama-3.2-3B-Instruct via HuggingFace
===================================================== */
function draw11(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);

  // ---- SECTION 1: Transformer header (top 45%) ----
  const attnH=h*.42;
  ctx.fillStyle='rgba(56,78,135,.06)';ctx.strokeStyle='rgba(56,78,135,.22)';ctx.lineWidth=1;
  rr(ctx,10,8,w-20,attnH,12);ctx.fill();ctx.stroke();

  // Model title
  ctx.fillStyle=VP;ctx.font='bold 10px Inter';ctx.textAlign='center';
  ctx.fillText('LLAMA 3.2-3B-INSTRUCT',w/2,24);
  ctx.font='8px Inter';ctx.fillStyle=VM;
  ctx.fillText('HuggingFace Inference API',w/2,36);

  // --- Attention visualization (well-spaced) ---
  const qT=['What','services','Aseuro','offer'];
  const cT=['consulting','cloud','digital','enterprise'];
  const tokBoxW=68, tokBoxH=22, tokGap=6;
  const qColX=30;  // left column x
  const cColX=w-30-tokBoxW; // right column x
  const tokStartY=48;

  // Query tokens (left)
  ctx.fillStyle=VB;ctx.font='bold 8px Inter';ctx.textAlign='center';
  ctx.fillText('QUERY',qColX+tokBoxW/2,tokStartY-4);
  qT.forEach((tok,i)=>{
    const y=tokStartY+i*(tokBoxH+tokGap);
    ctx.fillStyle=VB+'15';ctx.strokeStyle=VB+'44';ctx.lineWidth=1;
    rr(ctx,qColX,y,tokBoxW,tokBoxH,5);ctx.fill();ctx.stroke();
    ctx.font='10px JetBrains Mono';ctx.fillStyle=VB;ctx.textAlign='center';
    ctx.fillText(tok,qColX+tokBoxW/2,y+tokBoxH/2+4);
  });

  // Context tokens (right)
  ctx.fillStyle=VG;ctx.font='bold 8px Inter';ctx.textAlign='center';
  ctx.fillText('CONTEXT',cColX+tokBoxW/2,tokStartY-4);
  cT.forEach((tok,i)=>{
    const y=tokStartY+i*(tokBoxH+tokGap);
    ctx.fillStyle=VG+'15';ctx.strokeStyle=VG+'44';ctx.lineWidth=1;
    rr(ctx,cColX,y,tokBoxW,tokBoxH,5);ctx.fill();ctx.stroke();
    ctx.font='10px JetBrains Mono';ctx.fillStyle=VG;ctx.textAlign='center';
    ctx.fillText(tok,cColX+tokBoxW/2,y+tokBoxH/2+4);
  });

  // Attention lines (between columns, in the middle)
  const lineStartX=qColX+tokBoxW+4;
  const lineEndX=cColX-4;
  for(let i=0;i<qT.length;i++){
    const qMidY=tokStartY+i*(tokBoxH+tokGap)+tokBoxH/2;
    for(let j=0;j<cT.length;j++){
      const cMidY=tokStartY+j*(tokBoxH+tokGap)+tokBoxH/2;
      const isDiag=i===j;
      const wt=isDiag?0.45+Math.sin(t*2.5)*.2:0.04+Math.sin(t*2+i+j)*.03;
      ctx.beginPath();ctx.strokeStyle='rgba(167,139,250,'+wt+')';ctx.lineWidth=isDiag?3:1;
      if(isDiag){ctx.shadowColor=VP;ctx.shadowBlur=6;}
      ctx.moveTo(lineStartX,qMidY);ctx.lineTo(lineEndX,cMidY);ctx.stroke();
      ctx.shadowBlur=0;
    }
  }

  // Attention label
  ctx.textAlign='center';ctx.font='bold 8px Inter';ctx.fillStyle=VP+'aa';
  ctx.fillText('MULTI-HEAD ATTENTION',w/2,tokStartY+4*(tokBoxH+tokGap)+6);

  // Config badges row (below attention, inside transformer box)
  const cfgY=attnH-4;
  ctx.fillStyle=VY+'12';ctx.strokeStyle=VY+'33';ctx.lineWidth=1;
  rr(ctx,w*.2,cfgY,w*.6,16,4);ctx.fill();ctx.stroke();
  ctx.fillStyle=VY;ctx.font='bold 8px JetBrains Mono';
  ctx.fillText('temperature=0.1    max_new_tokens=1000    timeout=300s',w/2,cfgY+11);

  // ---- SECTION 2: Decoding area (bottom 55%) ----
  const decY=attnH+18;
  const decH=h-decY-8;
  ctx.fillStyle=VG+'05';ctx.strokeStyle=VG+'22';ctx.lineWidth=1;
  rr(ctx,10,decY,w-20,decH,10);ctx.fill();ctx.stroke();

  // Section title
  ctx.fillStyle=VG;ctx.font='bold 10px Inter';ctx.textAlign='center';
  ctx.fillText('AUTO-REGRESSIVE TOKEN DECODING',w/2,decY+16);

  // Response tokens — proper wrapping with generous margins
  const resp='Aseuro Technologies offers a comprehensive suite of IT consulting services including cloud migration DevOps and digital transformation solutions for enterprise clients.'.split(' ');
  const tokCycle=t%12;
  const numToks=Math.min(resp.length,Math.floor(tokCycle*2.2));
  const marginX=24, maxLineW=w-marginX*2;
  let tx=marginX, ty=decY+30;

  for(let i=0;i<numToks;i++){
    ctx.font='10px JetBrains Mono';
    const tw2=ctx.measureText(resp[i]).width+12;
    if(tx+tw2>marginX+maxLineW){tx=marginX;ty+=24;}
    // Active token (last one) gets glow
    const isLast=i===numToks-1;
    if(isLast){ctx.shadowColor=VG;ctx.shadowBlur=8;}
    ctx.fillStyle=VG+'12';ctx.strokeStyle=isLast?VG+'88':VG+'33';
    ctx.lineWidth=isLast?1.5:1;
    rr(ctx,tx,ty,tw2,19,4);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;
    ctx.textAlign='left';ctx.fillStyle=VG;ctx.fillText(resp[i],tx+6,ty+14);
    tx+=tw2+4;
  }
  // Blinking cursor
  if(numToks<resp.length&&Math.floor(t*3)%2===0){
    ctx.fillStyle=VG;ctx.fillRect(tx+2,ty+3,2,15);
  }
  // Token counter
  if(numToks>0){
    ctx.textAlign='right';ctx.font='bold 8px JetBrains Mono';ctx.fillStyle=VM;
    ctx.fillText(numToks+'/'+resp.length+' tokens',w-18,h-10);
  }
  ctx.textAlign='left';
}
const genResponse='Aseuro Technologies offers a comprehensive suite of IT consulting services, including cloud migration, DevOps automation, and digital transformation solutions designed for enterprise clients across various industries.';
let genIdx=0;
function animateGenText(active){
  if(!active){genIdx=0;return;}
  const el=document.getElementById('genText');if(!el)return;
  genIdx=Math.min(genIdx+1,genResponse.length);
  el.textContent=genResponse.substring(0,genIdx)+(genIdx<genResponse.length?'\u2588':'');
}

/* =====================================================
   STEP 12: FINAL OUTPUT
   {summary: "...", extracted_data: {}}
===================================================== */
function draw12(c,t){
  const {ctx,w,h}=c; ctx.clearRect(0,0,w,h);
  const prog=Math.min(1,(t%6)/4);
  // Answer
  const aw=(w*.55)*prog,ah=h-30;
  ctx.fillStyle=VG+'08';ctx.strokeStyle=VG+'44';ctx.lineWidth=1.5;
  rr(ctx,12,12,aw,ah,12);ctx.fill();ctx.stroke();
  if(prog>.15){
    ctx.fillStyle=VG;ctx.font='bold 12px Inter';ctx.fillText('\u2713 response.summary',24,34);
    const lines=['Aseuro Technologies offers','IT consulting, cloud migration,','DevOps, and digital','transformation solutions.'];
    lines.forEach((l,i)=>{
      if(prog>.2+i*.12){ctx.font='10px Inter';ctx.fillStyle=VI+'bb';ctx.fillText(l,24,55+i*18);}
    });
    // Format badge
    if(prog>.7){
      ctx.fillStyle=VG+'22';ctx.strokeStyle=VG+'55';ctx.lineWidth=1;
      rr(ctx,24,135,150,22,6);ctx.fill();ctx.stroke();
      ctx.fillStyle=VG;ctx.font='bold 9px Inter';ctx.fillText('\u2713 Plain text, no JSON',32,150);
    }
  }
  // Response structure
  const fields=[
    {l:'summary:',v:'"Aseuro offers IT..."',c:VG},
    {l:'extracted_data:',v:'{}',c:VP},
    {l:'source_type:',v:'"local"',c:VC}
  ];
  if(prog>.35){ctx.fillStyle=VM;ctx.font='bold 9px Inter';ctx.textAlign='center';ctx.fillText('RESPONSE STRUCTURE',w*.78,28);ctx.textAlign='left';}
  fields.forEach((fi,i)=>{
    const delay=.35+i*.15;
    if(prog>delay){
      const cx2=w*.58,cy=40+i*50;
      const p=Math.min(1,(prog-delay)*3);ctx.globalAlpha=p;
      ctx.fillStyle=fi.c+'10';ctx.strokeStyle=fi.c+'44';ctx.lineWidth=1.5;
      rr(ctx,cx2,cy,w-cx2-12,36,8);ctx.fill();ctx.stroke();
      ctx.font='bold 10px JetBrains Mono';ctx.fillStyle=fi.c;ctx.fillText(fi.l,cx2+8,cy+15);
      ctx.font='10px JetBrains Mono';ctx.fillStyle=VM;ctx.fillText(fi.v,cx2+8,cy+29);
      // trace line
      ctx.beginPath();ctx.strokeStyle=fi.c+'33';ctx.lineWidth=1;ctx.setLineDash([3,3]);
      ctx.moveTo(cx2,cy+18);ctx.lineTo(12+aw,55+i*18);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=1;
    }
  });
}

/* ===== ANIMATION LOOP (all canvases, global responsive scaling) ===== */
const drawFns={c1:draw1,c2:draw2,c3:draw3,c4:draw4,c5:draw5,c6:draw6,c7:draw7,c8:draw8,c9:draw9,c10:draw10,c11:draw11,c12:draw12};
const DESIGN_W = 860; // reference width all draw functions were designed for
let startTime=performance.now();
function startAnimLoop(){
  let genTimer=0;
  function frame(){
    const t=(performance.now()-startTime)/1000;
    for(const id in allCanvases){
      const c=allCanvases[id];
      if(!drawFns[id]) continue;
      const realW=c.w, realH=c.h;
      const s=Math.min(1, realW/DESIGN_W); // scale factor (1.0 on desktop, <1 on smaller)
      c.ctx.save();
      c.ctx.clearRect(0,0,realW,realH);
      c.ctx.scale(s,s);
      // Pass virtual (design-sized) dimensions to draw functions
      const virtualC = {ctx:c.ctx, w:realW/s, h:realH/s, el:c.el, active:c.active};
      drawFns[id](virtualC,t);
      c.ctx.restore();
    }
    genTimer++;
    if(genTimer%3===0) animateGenText(true);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
