/* ⚠️ 2026-08-12 撤掉「精读课」18 课（原 const LESSONS）。
   内容是转述、无页码、从未核对；6 课出自《从零开始学罗盘》，不在杨公五本体系内；
   第15课把「地盘立向·人盘消砂·天盘纳水」当口诀教，而 J6 明说那是民间三合派的做法、
   杨公只用地盘。全站其余内容是逐条核对的引文，这块是唯一没溯源的。
   三个作用都已另有着落：日课走知识图鉴 SRS；图示 visual() 图片题库还在用（保留）；
   判断题图片题库有 75 道。今日页改由「接着读 · 体系精讲」承接。
   ⚠️ TYPE_META/REL_CAT 不能删——scheduleKnowledge 用 REL_CAT 调 SRS 间隔。 */
const $=s=>document.querySelector(s);const todayKey=()=>{const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`};
const state=()=>{try{return JSON.parse(localStorage.getItem('guanshan_progress')||'{}')}catch(e){return{}}};
const save=s=>localStorage.setItem('guanshan_progress',JSON.stringify(s));
const srsState=()=>{try{return JSON.parse(localStorage.getItem('guanshan_srs')||'{}')}catch(e){return{}}};
const saveSrs=s=>localStorage.setItem('guanshan_srs',JSON.stringify(s));
const dayNo=()=>Math.floor(new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()).getTime()/864e5);
const CAT_VIS={基础入门:'embrace',龙砂水穴:'peaks',罗盘立向:'compass',理气水法:'jiesha',城市家居:'city',高级实务:'pass'};
function todayKnowledge(){const s=srsState(),now=dayNo(),due=LIBRARY.filter(x=>s[x.id]&&s[x.id].due<=now).sort((a,b)=>s[a.id].due-s[b.id].due);if(due.length)return due[0];let anchor=+localStorage.getItem('guanshan_anchor');if(!anchor){anchor=now;try{localStorage.setItem('guanshan_anchor',String(anchor))}catch(e){}}const fresh=LIBRARY.filter(x=>!s[x.id]),pool=fresh.length?fresh:LIBRARY.slice().sort((a,b)=>(s[a.id]?.due||0)-(s[b.id]?.due||0));return pool[((now-anchor)%pool.length+pool.length)%pool.length]}
function srsStats(){const s=srsState(),now=dayNo(),vals=Object.values(s);return{learned:vals.length,mastered:vals.filter(x=>x.level>=3).length,due:vals.filter(x=>x.due<=now).length,unclear:vals.filter(x=>x.level<2).length}}
const FIELD_ITEMS=['看后方：是否有靠、距离是否逼压','看前方：明堂是否开阔且有层次','看左右：龙虎是否环抱、协调','看道路与水：来去、弯曲、速度、聚散','看风口与形煞：直冲、尖角、强风','看现实条件：采光、噪声、安全、整洁'];
function renderReport(){const ss=srsStats(),img=imageState(),
  wrongTotal=Object.values(img).reduce((n,x)=>n+(x.wrong||0),0),
  /* ⚠️ 薄弱项原本挂「精读课」错题，那块已撤；改挂识形图片题库 */
  weak=Object.entries(img).filter(([,r])=>r.wrong).sort((a,b)=>b[1].wrong-a[1].wrong)[0],
  bad=weak?IMAGE_BANK.find(q=>q.id===+weak[0]):null,
  badges=[8,24,48,72,100].map((n,i)=>`<span class="badge ${ss.learned>=n?'earned':''}"><i>${ss.learned>=n?'◆':'◇'}</i>${['初识山水','形法入门','罗盘进阶','融会贯通','图鉴通关'][i]}<small>${n}项</small></span>`).join('');
  $('#report-content').innerHTML=`<div class="report-grid"><div><b>${ss.learned}</b><span>知识已学</span></div><div><b>${ss.due}</b><span>今日待复习</span></div><div><b>${wrongTotal}</b><span>累计错题</span></div></div><div class="weak"><b>${bad?'当前薄弱：'+bad.title+' · '+bad.mode:'当前状态：尚无错题'}</b><span>${bad?'这道图题错得最多，建议重看证据链。':'在「练」里做识形图片题后，这里会自动指出薄弱处。'}</span>${bad?`<button data-image-id="${weak[0]}">重做这道图题</button>`:''}</div><div class="badges">${badges}</div>`}
function renderField(){let f={};try{f=JSON.parse(localStorage.getItem('guanshan_field')||'{}')}catch(e){}$('#field-list').innerHTML=FIELD_ITEMS.map((x,i)=>`<label><input type="checkbox" data-field="${i}" ${f[i]?'checked':''}><span>${i+1}</span><b>${x}</b></label>`).join('');$('#field-progress').textContent=`${Object.values(f).filter(Boolean).length} / 6`;$('#field-notes').value=localStorage.getItem('guanshan_field_notes')||''}
const imageState=()=>{try{return JSON.parse(localStorage.getItem('guanshan_image_quiz')||'{}')}catch(e){return{}}};
const STAGE_DESC={基础识形:'轮廓、四象与龙脉基础',城市实景:'道路、楼宇与空间关系',综合判断:'证据链与现场行动',罗盘识读:'天池、二十四山与理气口诀'};
function renderImageBank(){const s=imageState(),done=Object.values(s).filter(x=>x.done).length,stages=[...new Set(IMAGE_BANK.map(x=>x.stage))];$('#image-progress').textContent=`${done} / ${IMAGE_BANK.length}`;$('#image-stages').innerHTML=stages.map((stage,i)=>{const items=IMAGE_BANK.filter(x=>x.stage===stage),n=items.filter(x=>s[x.id]?.done).length;return`<button data-image-stage="${stage}"><i>0${i+1}</i><span><b>${stage}</b><small>${STAGE_DESC[stage]||''}</small></span><em>${n} / ${items.length}</em></button>`}).join('');const recent=Object.entries(s).sort((a,b)=>(b[1].at||0)-(a[1].at||0)).slice(0,5).map(([id,r])=>{const q=IMAGE_BANK.find(x=>x.id===+id);return q?`<button data-image-id="${id}"><span>${r.correct?'✓':'×'}</span><b>${q.title} · ${q.mode}</b><small>${r.correct?'已掌握':'需要重练'}</small></button>`:''}).join('');$('#image-recent').innerHTML=recent?`<h3>最近练习</h3>${recent}`:''}
function nextImage(stage='',wrongOnly=false){const s=imageState(),pool=IMAGE_BANK.filter(x=>(!stage||x.stage===stage)&&(!wrongOnly||s[x.id]?.wrong));const q=pool.find(x=>!s[x.id]?.done)||pool[0];if(q)openImageQuestion(q.id);else{$('#image-content').innerHTML='<h2>这组已经完成</h2><p class="lesson-lead">可以选择其他阶段，或进入错图重练。</p>';toggleSheet('#image-sheet',true)}}
function openImageQuestion(id){const q=IMAGE_BANK.find(x=>x.id===+id);if(!q)return;$('#image-content').innerHTML=`<p class="lesson-kicker">${q.stage} · ${q.mode} · ${String(q.id).padStart(2,'0')} / ${IMAGE_BANK.length}</p><h2>${q.title}</h2><div class="image-question-visual">${q.photo?`<img src="${q.photo}" alt="${q.title}教材图例">`:visual(q.type)}</div><div class="image-prompt"><b>${q.mode}</b><p>${q.question}</p></div><div class="image-answers">${q.answers.map((a,i)=>`<button data-image-answer="${i}" data-image-question="${q.id}">${a}</button>`).join('')}</div><div class="image-explain" id="image-explain" aria-live="polite"></div><p class="source">出处：${q.source} · 示意图为重绘</p>${q.lec?`<button class="klec" data-klec="${q.lec}">读全文 · 体系精讲 ${q.lec}<i>›</i></button>`:''}`;toggleSheet('#image-sheet',true)}
function answerImage(btn){if(btn.dataset.answered)return;const q=IMAGE_BANK.find(x=>x.id===+btn.dataset.imageQuestion),n=+btn.dataset.imageAnswer,buttons=[...btn.parentNode.children],ok=n===q.correct;buttons.forEach((b,i)=>{b.dataset.answered='1';b.disabled=true;const isOk=i===q.correct,isNo=i===n&&!ok;b.classList.toggle('ok',isOk);b.classList.toggle('no',isNo);if(isOk)b.textContent='✓ '+b.textContent;else if(isNo)b.textContent='✗ '+b.textContent});const s=imageState(),old=s[q.id]||{attempts:0,wrong:0};s[q.id]={done:ok,correct:ok,attempts:old.attempts+1,wrong:old.wrong+(ok?0:1),at:Date.now()};localStorage.setItem('guanshan_image_quiz',JSON.stringify(s));$('#image-explain').innerHTML=`<b>${ok?'判断正确':'需要重看证据'}</b><p>${q.why}</p><button data-image-next="${q.stage}">下一题</button>`;renderImageBank()}
function visual(type,dark=false){const bg=dark?'#131719':'#e6e2d9',line=dark?'#b89a67':'#756b59',soft=dark?'#61706c':'#a69d8c',water=dark?'#647e84':'#7898a0';
 const wrap=x=>`<svg viewBox="0 0 420 220" role="img" aria-label="风水识形示意图"><rect width="420" height="220" fill="${bg}"/>${x}</svg>`;
 const ground=`<path d="M0 178 Q90 168 160 180 T420 176 V220 H0Z" fill="${soft}" opacity=".17"/>`;
 const home=`<path d="M188 153h44v31h-44zM183 153l27-20 27 20" fill="none" stroke="${line}" stroke-width="3"/>`;
 const mountain=(x,y,s=1)=>`<path d="M${x} ${y} Q${x+22*s} ${y-55*s} ${x+48*s} ${y} Q${x+70*s} ${y-34*s} ${x+92*s} ${y}" fill="none" stroke="${line}" stroke-width="3"/>`;
 if(type==='embrace')return wrap(ground+mountain(20,155,1.15)+mountain(292,155,1.1)+home+`<path d="M65 187 Q210 120 355 187" fill="none" stroke="${water}" stroke-width="8" opacity=".9"/><path d="M92 169 Q145 122 177 145M328 169 Q275 122 243 145" fill="none" stroke="${line}" stroke-width="2" opacity=".75"/>`);
 if(type==='four')return wrap(ground+home+`<path d="M150 165Q112 116 62 132M270 165Q308 116 358 132M160 120Q210 60 260 120" fill="none" stroke="${line}" stroke-width="4"/><text x="210" y="42" text-anchor="middle" fill="${line}">玄武</text><text x="52" y="112" fill="${line}">青龙</text><text x="326" y="112" fill="${line}">白虎</text><text x="210" y="207" text-anchor="middle" fill="${water}">朱雀 · 明堂</text>`);
 if(type==='hall')return wrap(home+`<path d="M150 184h120M110 201h200M55 216h310" stroke="${line}" stroke-width="2"/><text x="285" y="181" fill="${line}">内</text><text x="325" y="199" fill="${line}">中</text><text x="370" y="216" fill="${line}">外</text><path d="M110 120Q70 80 30 130M310 120Q350 80 390 130" fill="none" stroke="${soft}" stroke-width="5"/>`);
 if(type==='peaks')return wrap(ground+`<path d="M38 180Q85 48 130 180" fill="none" stroke="${line}" stroke-width="5"/><text x="85" y="205" text-anchor="middle" fill="${line}">木 · 高直</text><path d="M215 180L252 75L273 128L300 42L344 180" fill="none" stroke="${line}" stroke-width="5"/><text x="280" y="205" text-anchor="middle" fill="${line}">火 · 尖耸</text>`);
 if(type==='shapes')return wrap(ground+`<path d="M20 180L45 105H125L150 180" fill="none" stroke="${line}" stroke-width="5"/><path d="M155 180Q210 74 265 180" fill="none" stroke="${line}" stroke-width="5"/><path d="M275 180Q300 120 325 170Q350 98 400 180" fill="none" stroke="${line}" stroke-width="5"/><text x="85" y="205" text-anchor="middle" fill="${line}">土 · 方</text><text x="210" y="205" text-anchor="middle" fill="${line}">金 · 圆</text><text x="340" y="205" text-anchor="middle" fill="${line}">水 · 曲</text>`);
 if(type==='pass')return wrap(ground+`<path d="M0 165Q55 56 128 145Q170 182 210 151Q250 182 292 145Q365 56 420 165" fill="none" stroke="${line}" stroke-width="5"/><circle cx="210" cy="151" r="11" fill="none" stroke="${water}" stroke-width="3"/><text x="210" y="128" text-anchor="middle" fill="${water}">过峡</text><path d="M163 171Q185 150 202 163M257 171Q235 150 218 163" fill="none" stroke="${soft}" stroke-width="3"/>`);
 if(type==='goodbad')return wrap(` <path d="M20 180Q80 60 150 180" fill="none" stroke="${line}" stroke-width="5"/><circle cx="85" cy="105" r="28" fill="none" stroke="${soft}"/><text x="85" y="205" text-anchor="middle" fill="${line}">秀丽端正</text><path d="M230 180L252 126L267 145L283 75L300 132L321 92L348 180" fill="none" stroke="${line}" stroke-width="5"/><path d="M270 72l20 20M290 72l-20 20" stroke="${water}" stroke-width="3"/><text x="290" y="205" text-anchor="middle" fill="${line}">尖碎粗恶</text>`);
 if(type==='water')return wrap(home+`<path d="M20 190Q210 75 400 190" fill="none" stroke="${water}" stroke-width="14"/><text x="210" y="108" text-anchor="middle" fill="${line}">内弯 · 玉带</text><text x="210" y="213" text-anchor="middle" fill="${line}">外弯 · 反弓</text>`);
 if(type==='flow')return wrap(` <path d="M40 10Q160 70 80 125Q20 180 180 200" fill="none" stroke="${water}" stroke-width="12"/><circle cx="110" cy="123" r="34" fill="none" stroke="${line}" stroke-width="2"/><text x="110" y="128" text-anchor="middle" fill="${line}">聚</text><path d="M300 0L300 220" stroke="${water}" stroke-width="12"/><path d="M275 78l25 28 25-28M275 135l25 28 25-28" fill="none" stroke="${line}" stroke-width="3"/><text x="340" y="112" fill="${line}">直泄</text>`);
 if(type==='dragonTiger')return wrap(home+`<path d="M0 172Q62 65 172 155M420 172Q358 65 248 155" fill="none" stroke="${line}" stroke-width="6"/><path d="M112 111Q152 127 175 154M308 111Q268 127 245 154" fill="none" stroke="${water}" stroke-width="2"/><text x="65" y="195" fill="${line}">青龙</text><text x="325" y="195" fill="${line}">白虎</text>`);
 if(type==='backing')return wrap(ground+home+`<path d="M115 135Q210 45 305 135" fill="none" stroke="${line}" stroke-width="7"/><path d="M145 150h130" stroke="${soft}" stroke-dasharray="5 5"/><text x="210" y="31" text-anchor="middle" fill="${line}">稳而不压</text>`);
 const red=dark?'#cf7b6c':'#b8503f';
 if(type==='compass')return wrap(`<rect x="120" y="20" width="180" height="180" fill="none" stroke="${line}" stroke-width="3"/><circle cx="210" cy="110" r="82" fill="none" stroke="${line}" stroke-width="2.5"/><circle cx="210" cy="110" r="62" fill="none" stroke="${soft}" stroke-width="2"/><circle cx="210" cy="110" r="42" fill="none" stroke="${soft}" stroke-width="2"/><circle cx="210" cy="110" r="22" fill="${bg}" stroke="${line}" stroke-width="2"/><line x1="210" y1="14" x2="210" y2="206" stroke="${red}" stroke-width="1.6"/><line x1="110" y1="110" x2="310" y2="110" stroke="${red}" stroke-width="1.6"/><line x1="210" y1="126" x2="210" y2="97" stroke="${line}" stroke-width="2.6"/><circle cx="210" cy="96" r="2.8" fill="${red}"/><text x="210" y="152" text-anchor="middle" fill="${line}" font-size="11">天池</text><text x="252" y="70" fill="${soft}" font-size="12">内盘</text><text x="126" y="34" fill="${line}" font-size="12">外盘</text><text x="316" y="18" fill="${red}" font-size="12">天心十道</text>`);
 if(type==='compassMyth')return wrap(`<circle cx="112" cy="104" r="46" fill="none" stroke="${soft}" stroke-width="3"/><circle cx="112" cy="104" r="15" fill="none" stroke="${soft}" stroke-width="2"/><path d="M80 72 L144 136 M144 72 L80 136" stroke="${red}" stroke-width="4"/><text x="112" y="34" text-anchor="middle" fill="${red}" font-size="13">✗ 当法器</text><text x="112" y="180" text-anchor="middle" fill="${soft}" font-size="12">镇宅·招财·化煞</text><circle cx="308" cy="104" r="46" fill="none" stroke="${line}" stroke-width="3"/><circle cx="308" cy="104" r="15" fill="none" stroke="${line}" stroke-width="2"/><line x1="308" y1="58" x2="308" y2="150" stroke="${red}" stroke-width="1.6"/><line x1="262" y1="104" x2="354" y2="104" stroke="${red}" stroke-width="1.6"/><line x1="308" y1="118" x2="308" y2="92" stroke="${line}" stroke-width="3"/><text x="308" y="34" text-anchor="middle" fill="${line}" font-size="13">✓ 当工具</text><text x="308" y="180" text-anchor="middle" fill="${line}" font-size="12">测坐向·量方位</text>`);
 if(type==='plate')return wrap([['三合','地·人·天',74],['三元','六十四卦',210],['综合','三盘+卦',346]].map(m=>`<circle cx="${m[2]}" cy="98" r="40" fill="none" stroke="${line}" stroke-width="2.5"/><circle cx="${m[2]}" cy="98" r="28" fill="none" stroke="${soft}" stroke-width="2"/><circle cx="${m[2]}" cy="98" r="16" fill="none" stroke="${soft}" stroke-width="1.6"/><text x="${m[2]}" y="102" text-anchor="middle" fill="${line}" font-size="13">${m[0]}</text><text x="${m[2]}" y="170" text-anchor="middle" fill="${soft}" font-size="11">${m[1]}</text>`).join(''));
 if(type==='mount24'){const cx=210,cy=104,R=84,ms=['子','癸','丑','艮','寅','甲','卯','乙','辰','巽','巳','丙','午','丁','未','坤','申','庚','酉','辛','戌','乾','亥','壬'],G=['艮','巽','坤','乾'];let sp='',lb='';for(let i=0;i<24;i++){const a=(i*15-90)*Math.PI/180,x1=cx+Math.cos(a)*(R-14),y1=cy+Math.sin(a)*(R-14),x2=cx+Math.cos(a)*R,y2=cy+Math.sin(a)*R,lx=cx+Math.cos(a)*(R-30),ly=cy+Math.sin(a)*(R-30)+3.2,g=G.includes(ms[i]);sp+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${soft}" stroke-width="1.3"/>`;lb+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="${g?line:soft}" font-size="9">${ms[i]}</text>`}return wrap(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${line}" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="${R-40}" fill="none" stroke="${soft}" stroke-width="1.5"/>`+sp+lb+`<text x="${cx}" y="${cy-3}" text-anchor="middle" fill="${line}" font-size="12">二十四山</text><text x="${cx}" y="${cy+13}" text-anchor="middle" fill="${soft}" font-size="10">每山15°</text>`)}
 if(type==='jiesha')return wrap(ground+home+`<text x="210" y="205" text-anchor="middle" fill="${line}" font-size="12">坐山</text><path d="M232 165 L322 118" stroke="${water}" stroke-width="2.6"/><path d="M310 114 L324 117 L315 128" fill="none" stroke="${water}" stroke-width="2.6"/><path d="M336 120 L336 58 L362 58 L362 120" fill="none" stroke="${line}" stroke-width="3"/><path d="M336 78 L362 70 M338 94 L360 88" stroke="${water}" stroke-width="2"/><text x="349" y="48" text-anchor="middle" fill="${water}" font-size="11">劫煞方</text><text x="349" y="138" text-anchor="middle" fill="${soft}" font-size="10">破败·动象</text>`);
 if(type==='huangquan')return wrap(ground+home+`<line x1="210" y1="150" x2="210" y2="58" stroke="${line}" stroke-width="2" stroke-dasharray="5 4"/><text x="210" y="50" text-anchor="middle" fill="${line}" font-size="11">向</text><text x="210" y="205" text-anchor="middle" fill="${line}" font-size="11">坐</text><path d="M298 178 Q340 150 384 174" fill="none" stroke="${water}" stroke-width="9"/><text x="342" y="132" text-anchor="middle" fill="${water}" font-size="11">黄泉方 · 水</text><text x="342" y="156" text-anchor="middle" fill="${red}" font-size="14">凶</text>`);
 return wrap(ground+`<rect x="150" y="120" width="120" height="65" fill="none" stroke="${line}" stroke-width="3"/><path d="M130 120Q210 40 290 120M45 185Q210 130 375 185" fill="none" stroke="${soft}" stroke-width="4"/><circle cx="210" cy="150" r="13" fill="${water}"/><text x="210" y="25" text-anchor="middle" fill="${line}">先外后内 · 逐层观察</text>`);
}

function render(){const daily=todayKnowledge(),ss=srsStats(),record=srsState()[daily.id];
 $('#today').innerHTML=`<div class="today-top"><span class="today-label">今日知识精修 · ${daily.cat}</span><span class="today-time">约 5–10 分钟</span></div><h2>${daily.title}</h2><p class="today-desc">${daily.summary}</p><div class="today-visual">${visual(CAT_VIS[daily.cat],true)}</div><button class="start" data-knowledge="${daily.id}">${record?'开始系统复习':'开始今日新课'}</button><div class="study-metrics"><span><b>${ss.learned}</b>已学</span><span><b>${ss.mastered}</b>已巩固</span><span><b>${ss.due}</b>待复习</span><span><b>${ss.unclear}</b>强化中</span></div>`;
 renderNext();
 renderStreak();
}
/* 接着读 · 体系精讲：按 A→M 顺序找第一条未读的正文（note 是编者按，跳过）。
   接替原「精读课」在今日页的位置——区别是它读的是核对过引文的正文。 */
function nextLecture(){if(typeof LECTURES==='undefined')return null;const rd=readState();
  for(const c of LECTURES)for(const i of c.items){if(i.note)continue;
    if(!rd[lecKey(c.c,i.n||i.t)])return{c,i}}
  return null}
function renderNext(){const el=$('#next-lecture');if(!el||typeof LECTURES==='undefined')return;
  const rd=readState(),st=lecStats(),nx=nextLecture(),pct=st.total?Math.round(st.done/st.total*100):0;
  const grid=LECTURES.map(c=>{const real=c.items.filter(x=>!x.note),d=real.filter(x=>rd[lecKey(c.c,x.n||x.t)]).length;
    return`<span class="${d===real.length?'full':d?'part':''}" title="${c.name} ${d}/${real.length}">${c.c}</span>`}).join('');
  el.innerHTML=(nx
    ?`<div class="nx-top"><span>接着读 · ${nx.c.name}</span><em>${st.done} / ${st.total}</em></div>`
      +`<div class="nx-bar"><i style="width:${pct}%"></i></div>`
      +`<button class="nx-go" data-lec="${nx.c.c}:${nx.i.n||nx.i.t}"><b>${nx.i.n}　${nx.i.t}</b><small>${nx.i.nq?nx.i.nq+' 处教材原文':''}</small><i>›</i></button>`
    :`<div class="nx-top"><span>体系精讲</span><em>${st.done} / ${st.total}</em></div>`
      +`<div class="nx-bar"><i style="width:100%"></i></div>`
      +`<p class="nx-done">十三类正文已全部读完。可以去「学」里挑一类重读，或用「查」里的知识图鉴回查。</p>`)
    +`<div class="nx-grid">${grid}</div>`}
function renderStreak(){let hist={};try{hist=JSON.parse(localStorage.getItem('guanshan_history')||'{}')}catch(e){}let n=0,d=new Date();for(let k=0;k<90;k++){const key=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;if(hist[key]){n++;d.setDate(d.getDate()-1)}else if(k===0)d.setDate(d.getDate()-1);else break}$('#streak').innerHTML=`<b>${n}</b><span>连续学习</span>`}
// 每个 type 的作者数据集中一处：cat=关联知识库分类，why/how/bad=展开讲解三段。加新知识点只需在此登记一次。
const TYPE_META={
 embrace:{cat:'基础入门',why:'风水判断从真实环境出发。环抱会改变风速、视线与空间边界，水路的曲直又影响人流、车流和湿度，所以“藏风得水”既是传统术语，也是观察环境关系的总纲。',how:'站在住宅外先转一圈：看风从哪里来、在哪里变快；再看水路或道路从哪里来、在哪里转弯与停留。把观察到的证据写下来，再谈吉凶。',bad:'把“没有风”误当藏风，或把“看见水”直接当得水。真正要看的是适度流通、曲缓停聚与整体协调。'},
 four:{cat:'基础入门',why:'四象是把复杂环境转成前后左右四组关系。它的价值在于建立稳定观察次序，而不是把每个方向机械对应成某种结果。',how:'先确定住宅朝向，再站在中心向外看。分别拍下后、前、左、右四张照片，比较它们的高度、距离、走势和是否顾宅。',bad:'拿地图的东南西北代替住宅视角；或只记“左高右低”，忽略逼压、反背、距离与整体比例。'},
 hall:{cat:'龙砂水穴',why:'明堂承担承接与缓冲。过窄会产生压迫，过度空散又缺少边界；理想状态是从近到远逐步展开，同时仍能感到围合。',how:'从门前最近的可用空间开始，依次观察小区内部、道路广场和远方开阔面，记录每层是否平整、受冲、受压或外泄。',bad:'把所有空地都叫明堂；只追求越大越好；忽略停车场、高架、强风和快速车流对空间的真实影响。'},
 peaks:{cat:'龙砂水穴',why:'五星不是给山贴标签，而是训练你识别轮廓。先能稳定辨认“直、尖、方、圆、曲”，之后才有条件讨论不同星体的组合与结穴。',how:'把图片缩小或眯眼看，忽略植被与石纹，只描最大轮廓；再检查主体是否完整、端正、秀丽。',bad:'凭颜色、树种或一个局部尖角定星；山体混合时强迫归成单一星体。'},
 shapes:{cat:'龙砂水穴',why:'方、圆、曲是三种基本视觉语言。山体常为复合形，应先辨主星，再描述辅星与过渡，避免非黑即白。',how:'用手指沿山脊线移动：平台感强看土，圆弧收敛看金，连续波动看水；最后再判断主次。',bad:'把“土”理解成泥土、“金”理解成石头；五行山形判断看的是轮廓，不是材质。'},
 pass:{cat:'龙砂水穴',why:'过峡像文章中的收束和转折：前段山势的力量在狭处集中，再向后展开。是否连续、有护送，比单纯狭窄更重要。',how:'从卫星图与现场两个尺度寻找山脊收窄处，沿线确认前后来脉，并观察左右是否有夹护、风口是否过强。',bad:'看到两个山头之间的低处就叫过峡；忽略人工开挖、道路切断和完全脱脉。'},
 goodbad:{cat:'龙砂水穴',why:'秀恶判断是形法的第一层筛选。它不是审美偏好，而是观察完整性、稳定感、边缘形态以及对中心空间造成的压力。',how:'先不用任何术语，只写五个形容词描述眼前形体；再将它们归入完整/破碎、端正/歪斜、柔和/尖锐。',bad:'只因为山高、建筑贵或造型奇特就判吉；忽略距离后把远处小尖角夸大成严重形煞。'},
 water:{cat:'龙砂水穴',why:'弯曲水路的内外侧承受的动势不同。内弯形成包裹，外弯呈向外甩出的趋势；城市道路还要加入车速、坡度和防护条件。',how:'在地图上画出道路或河流中心线，标出住宅位于曲线内侧还是外侧，再到现场确认距离、高差和流速。',bad:'只看平面弧线，不看距离与高差；把轻微弯路也夸大成反弓。'},
 flow:{cat:'龙砂水穴',why:'“聚”是水势在空间中减速、回旋或交汇，“泄”是快速穿越、毫无收束。判断时要同时看形状、速度、去向和明堂承接。',how:'观察雨后水流、日常车流和人流：哪里会慢下来，哪里快速离开；这些真实动线比静态照片更有价值。',bad:'认为水越多越好；忽略噪声、污染、洪涝和安全等现实问题。'},
 dragonTiger:{cat:'龙砂水穴',why:'龙虎代表中心左右两侧的护卫关系。理想不是绝对对称，而是彼此协调、向内顾护且不让中心感到压迫。',how:'站在门前或阳台中心，比较左右建筑的高度、距离、朝向与边缘；特别留意尖角是否相冲、空缺是否受强风。',bad:'死背青龙必须高于白虎；脱离坐向看左右；把正常城市高差一概判凶。'},
 backing:{cat:'城市家居',why:'靠山的作用是稳定与承托，但尺度失衡会由“靠”变“压”。现代住宅还必须把采光、通风、消防间距纳入判断。',how:'观察后方建筑或山体的完整度、距离和高度；进入室内感受是否阴暗、潮湿、压迫，再作综合判断。',bad:'只要后面有高楼就判有靠；忽略贴墙、挡光、落石和结构安全。'},
 city:{cat:'城市家居',why:'城市风水是分层筛选：大环境决定上限，楼栋与户型决定日常体验，室内调整只能处理最后一层问题。',how:'按片区—小区—楼栋—楼层—户型—室内六层拍照记录，每层先排除一项最明显的问题。',bad:'一进门就讨论床、灶和摆件，却没有看道路、噪声、风口、采光与楼栋关系。'},
 compassMyth:{cat:'罗盘立向',why:'风水的核心是观察真实环境、测量方位再按理气推算，罗盘只是这套流程里的测量工具。把它当法器，等于用道具代替方法，既误导自己也偏离了风水的本义。',how:'拿到罗盘先问它能帮你测什么：坐山朝向、某座山峰或某条道路的方位。把这些数据记下来，才是罗盘的正确用法。',bad:'相信放角落镇宅、挂门口化煞、对月催桃花之类说法；或因为罗盘看起来神秘就不敢正常使用。'},
 compass:{cat:'罗盘立向',why:'天池提供方向基准，内盘承载理气内容，外盘与天心十道负责固定和读数。四者分工明确，任何一步错位，读出来的坐向都不可信。',how:'先把罗盘放平（有水平仪则调水平），转动内盘让磁针与海底红线南北重合，再读天心十道压在盘面的字。',bad:'磁针没和海底线重合就急着读数；或把手机、带磁外壳靠近天池，使磁针失灵却不自知。'},
 plate:{cat:'罗盘立向',why:'三种罗盘对应不同理气体系：三合重四大局消砂纳水，三元重六十四卦元运，综合盘把两套都收进来。选盘其实是在选你要学的那套方法。',how:'先确定跟谁学、学哪一派，再据此买盘；学三僚杨公风水，一般选综合盘或专业杨公盘。',bad:'只看外观差不多就凭感觉买，结果买到不是自己体系要用的盘，很多层内容根本用不上。'},
 mount24:{cat:'罗盘立向',why:'二十四山把一个圆周切成二十四个十五度的方位单位，是坐向、劫煞、黄泉等几乎所有理气规则的坐标基础。它由八卦、天干、地支拼成，理解来历才记得牢、用得活。',how:'先在纸上按上南下北标出后天八卦，四正卦位配天干、其余空位顺序装地支，就能自己把二十四山排出来。',bad:'把二十四个字当孤立符号死背；或不清楚每山只有十五度，测坐向时对不准边界。'},
 jiesha:{cat:'理气水法',why:'劫煞只认坐山，是因为它针对的是住宅背后所承之气受到的冲扰。定出劫煞方后，真正决定吉凶的是那个方位有没有动象或破败突兀之物，所以理气必须回到峦头验证。',how:'先测准坐山，按口诀查出劫煞方，站在住宅用罗盘对准该方，观察有无来去水、路口、变压器等动象，或古树、破庙、高楼逼压等破败突兀之象。',bad:'用朝向而非坐山取劫煞；或只背口诀报凶，不到现场看劫煞方实际有没有破败突兀之物。'},
 huangquan:{cat:'理气水法',why:'黄泉针对的是特定坐向与来去水的忌讳组合，庚丁与坤互为黄泉，故称反复黄泉。它被专门刻在罗盘上，是因为犯之易有意外伤亡，属于要优先排查的凶格。',how:'测准坐向后，看朝向是哪个字，对照反复黄泉表定出黄泉方，再观察该方有没有来水、去水或道路正压在黄泉字上。',bad:'一见黄泉就断大凶，忽略杨公还有救贫黄泉；或把不同黄泉体系混用、脱离真实水路凭字面下断。'}
};
const REL_CAT=Object.fromEntries(Object.entries(TYPE_META).map(([k,v])=>[k,v.cat]));
function toggleSheet(id,on){const el=$(id);el.classList.toggle('on',on);el.setAttribute('aria-hidden',on?'false':'true');document.body.style.overflow=on?'hidden':''}
const REFS={five:['五星辨形',[['木星','高直而上，顶部圆秀'],['火星','尖锐耸起，变化强烈'],['土星','方平厚重，形体稳定'],['金星','圆润饱满，收敛完整'],['水星','波曲连绵，流动多变']]],four:['四象定位',[['玄武','住宅后方，宜稳厚有靠'],['朱雀','住宅前方，宜明堂舒展'],['青龙','向外看左侧，宜环抱有情'],['白虎','向外看右侧，宜协调护卫']]],water:['水形吉凶',[['玉带','位于弯曲内侧，环抱兜收'],['反弓','位于弯曲外侧，动势外甩'],['聚水','曲折停聚、交汇有关栏'],['直泄','笔直快速、来去无收']]],check:['城市选宅六看',[['一看后靠','稳定完整，不可过近逼压'],['二看明堂','开阔有层次，不空散'],['三看龙虎','左右协调、环抱有情'],['四看道路','曲缓有收，避直冲反弓'],['五看风口','避天斩、穿堂、强风直灌'],['六看整体','整洁明亮，先外后内']]],mount24:['二十四山全图',[['北 · 壬子癸','坎卦，正北，子居中'],['东北 · 丑艮寅','艮卦，四维之一'],['东 · 甲卯乙','震卦，正东，卯居中'],['东南 · 辰巽巳','巽卦，四维之一'],['南 · 丙午丁','离卦，正南，午居中'],['西南 · 未坤申','坤卦，四维之一'],['西 · 庚酉辛','兑卦，正西，酉居中'],['西北 · 戌乾亥','乾卦，四维之一']]],huangquan:['反复黄泉对应表',[['甲山庚向 / 癸山丁向','黄泉方：坤'],['艮山坤向','黄泉方：庚、丁'],['乾山巽向','黄泉方：乙、丙'],['辛山乙向 / 壬山丙向','黄泉方：巽'],['巽山乾向','黄泉方：辛、壬'],['乙山辛向 / 丙山壬向','黄泉方：乾'],['庚山甲向 / 丁山癸向','黄泉方：艮'],['坤山艮向','黄泉方：甲、癸']]],jiesha:['二十四山劫煞',[['乙、壬','劫煞在申'],['酉、丁','劫煞在寅'],['子、癸','劫煞在巳'],['巳、午','劫煞在酉'],['卯、艮','劫煞在丁'],['乾','劫煞在卯'],['丙','劫煞在辛'],['甲','劫煞在丙'],['戌、辛','劫煞在丑'],['丑','劫煞在辰'],['寅、辰','劫煞在未'],['庚','劫煞在午'],['未、巽、申','劫煞在癸'],['坤、亥','劫煞在乙']]]};
function openRef(id){const r=REFS[id];$('#ref-content').innerHTML=`<p class="lesson-kicker">QUICK REFERENCE</p><h2>${r[0]}</h2><div class="ref-list">${r[1].map(x=>`<div class="ref-row"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('')}</div>`;toggleSheet('#ref-sheet',true)}
let libraryCat='全部',libraryQuery='';
const CAT_INFO={基础入门:['建立观察框架','先弄清基本概念、视角和学习顺序。'],龙砂水穴:['训练形势辨认','用图形与现场证据学习龙、砂、水、穴。'],罗盘立向:['掌握测量工具','从二十四山到分金，先测准再判断。'],理气水法:['理解方位规则','明确体系、起法和适用条件，避免口诀混用。'],城市家居:['落到真实生活','把传统形法转换到楼宇、道路与室内动线。'],高级实务:['综合案例验证','把多项证据放回完整现场交叉判断。']};
function renderLibrary(){const cats=['全部',...new Set(LIBRARY.map(x=>x.cat))],items=LIBRARY.filter(x=>(libraryCat==='全部'||x.cat===libraryCat)&&(!libraryQuery||`${x.title}${x.summary}${x.source}`.includes(libraryQuery)));$('#library-tabs').innerHTML=cats.map(c=>`<button class="${c===libraryCat?'on':''}" data-lib-cat="${c}">${c}</button>`).join('');if(libraryCat==='全部'&&!libraryQuery){$('#library-list').innerHTML=`<div class="map-branches">`+cats.slice(1).map(c=>`<button data-lib-cat="${c}"><b>${c}</b><span>${CAT_INFO[c][0]}</span><small>${LIBRARY.filter(x=>x.cat===c).length} 个知识点</small></button>`).join('')+`</div>`;$('#library-count').textContent=`共 ${LIBRARY.length} 项`;return}$('#library-list').innerHTML=items.map(x=>`<button class="library-item" data-knowledge="${x.id}"><span class="li-no">${String(x.id).padStart(2,'0')}</span><span><b>${x.title}</b><small>${x.cat} · ${x.source}</small></span><i>›</i></button>`).join('')||'<div class="today-desc">没有找到相关知识点</div>';$('#library-count').textContent=`${items.length} / ${LIBRARY.length}`}
/* 图鉴详情＝教材原话＋页码，外加精讲标出的要害/易错，最后给一条直达精讲的入口。
   ⚠️ 内容由 build_knowledge.py 生成；旧版是手写的「现场怎么用/判断顺序/常见误用」，
      无出处也从没被核对过，已废。 */
function openKnowledge(id){const x=LIBRARY.find(v=>v.id===id);if(!x)return;
  const g=(typeof KNOWLEDGE_DETAIL!=='undefined'&&KNOWLEDGE_DETAIL[id])||{q:[],key:[],warn:[]};
  const related=LIBRARY.filter(v=>v.cat===x.cat&&v.id!==x.id).slice(0,4),rec=srsState()[id];
  const quotes=(g.q||[]).map(([t,src])=>`<blockquote class="kq">${t}${src?`<cite>${src}</cite>`:''}</blockquote>`).join('');
  const notes=[...(g.key||[]).map(v=>`<div class="knote key">${v}</div>`),
               ...(g.warn||[]).map(v=>`<div class="knote warn">${v}</div>`)].join('');
  $('#ref-content').innerHTML=`<p class="lesson-kicker">KNOWLEDGE ${String(x.id).padStart(2,'0')} · ${x.cat}</p><h2>${x.title}</h2>`
    +`<div class="knowledge-tags"><span>${x.cat}</span><span>出处：${x.source}</span>${rec?`<span>已复习 ${rec.reviews||rec.level||1} 次</span>`:''}</div>`
    +`<div class="knowledge-card"><h3>一句话</h3><p>${x.summary}</p></div>`
    +(quotes?`<div class="knowledge-card"><h3>教材原话</h3>${quotes}</div>`:'')
    +(notes?`<div class="knowledge-card"><h3>要害与易错</h3>${notes}</div>`:'')
    +(x.lec?`<button class="klec" data-klec="${x.lec}">读全文 · 体系精讲 ${x.lec}<i>›</i></button>`:'')
    +`<div class="knowledge-card"><h3>相关知识</h3><p>${related.map(v=>v.title).join(' · ')}</p></div>`
    +`<div class="auto-review"><h3>复习由系统安排</h3><p>无需判断自己的感觉。系统会根据学习次数、到期情况和错题表现，自动决定下次复习时间。</p><button data-auto-review="${id}">完成本知识并安排复习</button></div>`;
  toggleSheet('#ref-sheet',true)}
function scheduleKnowledge(id){const s=srsState(),old=s[id]||{},reviews=(old.reviews??old.level??0)+1,intervals=[1,3,7,15,30],x=LIBRARY.find(v=>v.id===id),img=imageState(),recentWeak=Object.entries(img).some(([qid,r])=>{const q=IMAGE_BANK.find(v=>v.id===+qid);return q&&REL_CAT[q.type]===x.cat&&!r.correct}),interval=recentWeak?Math.max(1,Math.floor(intervals[Math.min(reviews-1,4)]/2)):intervals[Math.min(reviews-1,4)],level=Math.min(4,reviews-1);s[id]={level,reviews,due:dayNo()+interval,last:dayNo(),interval,auto:true};saveSrs(s);let h={};try{h=JSON.parse(localStorage.getItem('guanshan_history')||'{}')}catch(e){}h[todayKey()]=true;localStorage.setItem('guanshan_history',JSON.stringify(h));toggleSheet('#ref-sheet',false);render();renderLibrary();renderReport()}
document.body.addEventListener('click',e=>{const ar=e.target.closest('[data-auto-review]');if(ar){scheduleKnowledge(+ar.dataset.autoReview);return}const ia=e.target.closest('[data-image-answer]');if(ia){answerImage(ia);return}const iid=e.target.closest('[data-image-id]');if(iid){openImageQuestion(+iid.dataset.imageId);return}const ist=e.target.closest('[data-image-stage]');if(ist){nextImage(ist.dataset.imageStage);return}const im=e.target.closest('[data-image-mode]');if(im){nextImage('',im.dataset.imageMode==='wrong');return}const nx=e.target.closest('[data-image-next]');if(nx){toggleSheet('#image-sheet',false);nextImage(nx.dataset.imageNext);return}if(e.target.closest('[data-image-close]')){toggleSheet('#image-sheet',false);return}if(e.target.closest('[data-ref-close]')){toggleSheet('#ref-sheet',false);return}const lc=e.target.closest('[data-lib-cat]');if(lc){libraryCat=lc.dataset.libCat;renderLibrary();document.querySelector('#library-list').scrollIntoView({behavior:'smooth',block:'start'});return}const kn=e.target.closest('[data-knowledge]');if(kn){openKnowledge(+kn.dataset.knowledge);return}const r=e.target.closest('[data-ref]');if(r){openRef(r.dataset.ref);return}});
document.body.addEventListener('change',e=>{if(!e.target.matches('[data-field]'))return;let f={};try{f=JSON.parse(localStorage.getItem('guanshan_field')||'{}')}catch(x){}f[e.target.dataset.field]=e.target.checked;localStorage.setItem('guanshan_field',JSON.stringify(f));renderField()});
$('#field-notes').addEventListener('input',e=>localStorage.setItem('guanshan_field_notes',e.target.value));
$('#library-search').addEventListener('input',e=>{libraryQuery=e.target.value.trim();renderLibrary()});
/* ===== 教材精读（data/textbook.js 是 build.py 的产物，源在 Obsidian/学习/风水教材/）=====
   定位分工：教材＝从头系统读｜精读课＝视觉识形卡｜知识图鉴＝速查单个概念。
   三者不重写同一段内容，教材末尾用「延伸」链到图鉴，不复制。 */
const readState=()=>{try{return JSON.parse(localStorage.getItem('guanshan_read')||'{}')}catch(e){return{}}};
const saveRead=s=>localStorage.setItem('guanshan_read',JSON.stringify(s));
const tbKey=(b,n)=>`${b}-${n}`;
function tbStats(){const rd=readState();let done=0,total=0;TEXTBOOKS.forEach(b=>b.lessons.forEach(l=>{total++;if(rd[tbKey(b.id,l.n)])done++}));return{done,total}}
/* ===== 体系精讲（data/lectures.js 是 build_lectures.py 的产物）=====
   与「原文通读」的分工：精讲按龙穴砂水向的体系走，把五本教材讲同一件事的地方
   并到一起；原文通读是按书从头读讲稿。同一条知识在两处的角色不同，不是重复。 */
const lecKey=(c,n)=>`lec-${c}${n}`;
/* ⚠️ 带 note 的是「本类完成情况」这类编者按，不是可学条目。
   早先它们混进了分母，进度虚高 14 条（202 实为正文 188）。 */
function lecStats(){const rd=readState();let d=0,t=0;if(typeof LECTURES!=='undefined')LECTURES.forEach(c=>c.items.forEach(i=>{if(i.note)return;t++;if(rd[lecKey(c.c,i.n||i.t)])d++}));return{done:d,total:t}}
function renderLectures(){if(typeof LECTURES==='undefined'||!$('#lecture-list'))return;const rd=readState();
  $('#lecture-list').innerHTML=`<div class="tb-book lec-book"><div class="tb-book-head"><div><b>体系精讲</b><small>五本教材按体系整合 · 已成 ${LECTURES.length} 类</small></div><em>${lecStats().done} / ${lecStats().total}</em></div>`+
    LECTURES.map(c=>{const real=c.items.filter(i=>!i.note),done=real.filter(i=>rd[lecKey(c.c,i.n||i.t)]).length;
      return`<details class="tb-group"${done>0&&done<real.length?' open':''}><summary><b><i class="lec-code">${c.c}</i>${c.name}</b><span>${done} / ${real.length}</span></summary>`+
        c.items.map(i=>`<button class="tb-item${i.note?' note':''}${!i.note&&rd[lecKey(c.c,i.n||i.t)]?' done':''}" data-lec="${c.c}:${i.n||i.t}"><i>${i.n||'—'}</i><span>${i.t}</span><em>${i.note?'说明':(i.nq?i.nq+'引':'')}</em></button>`).join('')+`</details>`}).join('')+`</div>`}
function lecBlock(b){switch(b.t){
  case'lead':return`<p class="lec-lead">${b.v}</p>`;
  case'h':return`<h3 class="lec-h">${b.v}</h3>`;
  case'q':return`<blockquote class="lec-q">${b.v.map(x=>`<p>${x}</p>`).join('')}${b.src?`<cite>${b.src}</cite>`:''}</blockquote>`;
  case'note':return`<div class="lec-note ${b.k}">${b.v}</div>`;
  case'ul':return`<ul class="lec-ul">${b.v.map(x=>`<li>${x}</li>`).join('')}</ul>`;
  case'table':return`<div class="lec-tw"><table><thead><tr>${b.head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  case'img':return`<figure class="lec-fig"><img src="assets/lecimg/${b.f}" alt="${b.cap}" loading="lazy" decoding="async"><figcaption>${b.cap}<cite>${b.src}</cite></figcaption></figure>`;
  case'src':return`<p class="lec-src">出处：${b.v}</p>`;
  default:return`<p>${b.v}</p>`}}
function openLecture(code,no){const c=(typeof LECTURES!=='undefined')&&LECTURES.find(x=>x.c===code);if(!c)return;
  const idx=c.items.findIndex(i=>(i.n||i.t)===no);if(idx<0)return;const it=c.items[idx];
  const k=lecKey(code,it.n||it.t),isRead=!!readState()[k];
  const prev=c.items[idx-1],next=c.items[idx+1];
  $('#textbook-content').innerHTML=`<p class="lesson-kicker">体系精讲 · ${c.c} ${c.name} · 第 ${idx+1} / ${c.items.length} 条</p><h2>${it.t}</h2>`+
    `<div class="lec-doc">${it.blocks.map(lecBlock).join('')}</div>`+
    `<div class="tb-foot"><button class="tb-done${isRead?' done':''}" data-lec-done="${code}:${it.n||it.t}">${isRead?'✓ 已读完':'标记读完'}</button>`+
    `<div class="tb-nav">${prev?`<button data-lec="${code}:${prev.n||prev.t}">‹ ${prev.t}</button>`:'<span></span>'}${next?`<button data-lec="${code}:${next.n||next.t}">${next.t} ›</button>`:'<span></span>'}</div></div>`;
  toggleSheet('#textbook-sheet',true);const pn=document.querySelector('#textbook-sheet .sheet-panel');if(pn)pn.scrollTop=0}
document.body.addEventListener('click',e=>{
  const kl=e.target.closest('[data-klec]');if(kl){const m=kl.dataset.klec.match(/^([A-M])(\d+)$/);
    if(m){toggleSheet('#ref-sheet',false);showTab('book');openLecture(m[1],m[0]);}return}
  const le=e.target.closest('[data-lec]');if(le){const[c,n]=le.dataset.lec.split(':');openLecture(c,n);return}
  const ld=e.target.closest('[data-lec-done]');if(ld){const[c,n]=ld.dataset.lecDone.split(':');const rd=readState(),k=lecKey(c,n);
    if(rd[k])delete rd[k];else{rd[k]=1;let h={};try{h=JSON.parse(localStorage.getItem('guanshan_history')||'{}')}catch(x){}h[todayKey()]=true;localStorage.setItem('guanshan_history',JSON.stringify(h));renderStreak()}
    saveRead(rd);renderLectures();renderTextbook();syncDone(ld,rd[k])}});
function renderTextbook(){if(typeof TEXTBOOKS==='undefined'||!$('#textbook-list'))return;const rd=readState();
  $('#textbook-list').innerHTML=TEXTBOOKS.map(b=>{const done=b.lessons.filter(l=>rd[tbKey(b.id,l.n)]).length;
    return`<div class="tb-book"><div class="tb-book-head"><div><b>原文通读 · ${b.name}</b><small>${b.sub}</small></div><em>${done} / ${b.lessons.length}</em></div>`+
      b.groups.map(([g,a,z])=>{const ls=b.lessons.filter(l=>l.n>=a&&l.n<=z),gd=ls.filter(l=>rd[tbKey(b.id,l.n)]).length;
        return`<details class="tb-group"${gd<ls.length&&gd>0?' open':''}><summary><b>${g}</b><span>${gd} / ${ls.length}</span></summary>`+
          ls.map(l=>`<button class="tb-item${rd[tbKey(b.id,l.n)]?' done':''}" data-tb="${b.id}:${l.n}"><i>${l.n}</i><span>${l.t}</span><em>${l.c}字</em></button>`).join('')+`</details>`}).join('')+`</div>`}).join('');
  const s=tbStats(),l=lecStats();$('#textbook-progress').textContent=`${s.done+l.done} / ${s.total+l.total}`}
function openTextbook(bid,n){const b=TEXTBOOKS.find(x=>x.id===bid);if(!b)return;const l=b.lessons.find(x=>x.n===+n);if(!l)return;const rd=readState(),isRead=!!rd[tbKey(bid,l.n)];
  const grp=(b.groups.find(([,a,z])=>l.n>=a&&l.n<=z)||[''])[0];
  const body=l.p.map(p=>typeof p==='string'?`<p>${p}</p>`:`<blockquote class="verse">${p.v.map(v=>`<span>${v}</span>`).join('')}</blockquote>`).join('');
  const prev=b.lessons.find(x=>x.n===l.n-1),next=b.lessons.find(x=>x.n===l.n+1);
  /* 延伸＝双源：图鉴能搜到就链图鉴，搜不到就找**体系精讲**（五星山名这类只有精讲有）。
     两边都没有的词直接不显示——否则点过去是「没有找到相关知识点」的死链。
     ⚠️ 2026-08-12：原兜底源是「精读课」，那块已撤，改指精讲正文。 */
  const lecHit=h=>{if(typeof LECTURES==='undefined')return null;
    for(const c of LECTURES)for(const it of c.items){if(!it.note&&it.t.includes(h))return{c:c.c,n:it.n,t:it.t}}
    for(const c of LECTURES)for(const it of c.items){if(!it.note&&JSON.stringify(it.blocks).includes(h))return{c:c.c,n:it.n,t:it.t}}
    return null};
  const hits=l.hints.map(h=>{
    if(LIBRARY.some(x=>(x.title+x.summary+x.source).includes(h)))return{h,to:'lib'};
    const g=lecHit(h);return g?{h,to:'lec',g}:null}).filter(Boolean);
  /* ⚠️ 按目标条目去重：木/火/土/金/水常落在同一条精讲上，不去重就是五个按钮点进同一处。*/
  const seen={},hits2=hits.filter(x=>x.to==='lib'||(!seen[x.g.c+x.g.n]&&(seen[x.g.c+x.g.n]=1)));
  const links=hits2.length?`<div class="tb-links"><h3>延伸查阅</h3><p>本课涉及的概念，可在知识图鉴或体系精讲里看细节：</p><div>${hits2.map(x=>x.to==='lib'?`<button data-tb-link="${x.h}">${x.h}</button>`:`<button data-tb-lec="${x.g.c}:${x.g.n}">${x.g.c}${x.g.n} ${x.g.t}</button>`).join('')}</div></div>`:'';
  $('#textbook-content').innerHTML=`<p class="lesson-kicker">${b.name} · ${grp} · 第 ${l.n} / ${b.lessons.length} 课</p><h2>${l.t}</h2>`+
    (l.alt.length?`<p class="tb-alt">原稿另留标题：${l.alt.join(' / ')}</p>`:'')+
    `<div class="tb-doc">${body}</div>${links}`+
    `<div class="tb-foot"><button class="tb-done${isRead?' done':''}" data-tb-done="${bid}:${l.n}">${isRead?'✓ 已读完':'标记读完'}</button>`+
    `<div class="tb-nav">${prev?`<button data-tb="${bid}:${prev.n}">‹ 上一课</button>`:'<span></span>'}${next?`<button data-tb="${bid}:${next.n}">下一课 ›</button>`:'<span></span>'}</div></div>`+
    `<p class="source">出处：${b.source} · 讲稿整理，未改动原意</p>`;
  toggleSheet('#textbook-sheet',true);const pn=document.querySelector('#textbook-sheet .sheet-panel');if(pn)pn.scrollTop=0}
/* ⚠️ 标记读完【只就地改按钮】，别重渲染整篇（2026-08-15 用户报「又跑到最上面」）：
   openTextbook/openLecture 末尾有 `pn.scrollTop=0` —— 打开新一课时回顶部是对的，
   但按钮在文末 .tb-foot，读完顺手一点又重开一遍，人就被弹回最上面了。
   目录（#textbook-list / 精讲列表）是另一个容器，照常重渲染不影响 sheet 位置。 */
function syncDone(btn,on){if(!btn)return;btn.classList.toggle('done',!!on);btn.textContent=on?'✓ 已读完':'标记读完'}
function markRead(bid,n,btn){const rd=readState(),k=tbKey(bid,n);rd[k]=rd[k]?0:1;if(!rd[k])delete rd[k];saveRead(rd);
  if(rd[k]){let h={};try{h=JSON.parse(localStorage.getItem('guanshan_history')||'{}')}catch(e){}h[todayKey()]=true;localStorage.setItem('guanshan_history',JSON.stringify(h));renderStreak()}
  renderTextbook();syncDone(btn,rd[k])}
document.body.addEventListener('click',e=>{
  const tb=e.target.closest('[data-tb]');if(tb){const[b,n]=tb.dataset.tb.split(':');openTextbook(b,n);return}
  const td=e.target.closest('[data-tb-done]');if(td){const[b,n]=td.dataset.tbDone.split(':');markRead(b,+n,td);return}
  const tls=e.target.closest('[data-tb-lec]');if(tls){const[c,n]=tls.dataset.tbLec.split(':');toggleSheet('#textbook-sheet',false);showTab('book');openLecture(c,n);return}
  const tl=e.target.closest('[data-tb-link]');if(tl){libraryQuery=tl.dataset.tbLink;libraryCat='全部';$('#library-search').value=libraryQuery;renderLibrary();toggleSheet('#textbook-sheet',false);showTab('find');$('#library-list').scrollIntoView({behavior:'smooth',block:'start'});return}
  if(e.target.closest('[data-tb-close]')){toggleSheet('#textbook-sheet',false)}});
render();renderLibrary();renderReport();renderField();renderImageBank();renderLectures();renderTextbook();try{const _s=srsStats();parent.postMessage({type:'yst-progress',app:'fengshui',text:`已学 ${_s.learned} · 已巩固 ${_s.mastered} · 待复习 ${_s.due}`},'https://nevergiveup0618.github.io')}catch(e){}if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ---- 底部菜单（2026-08-11）----
   首页原来五个版块一路铺到底，用户反馈「太长了」，改成五个 tab。
   ⚠️ 返回键：sheet 开着时先关 sheet 并把 tab 状态补回去，别让返回键
      隔着弹层去切 tab —— 安卓上这是最容易踩的一步。 */
const TABS={today:'以图识形 · 由形察气',book:'体系精讲 · 原文通读',drill:'识形题库 · 实地勘察',find:'知识图鉴 · 识形速查',me:'学习报告 · 本机保存'};
let curTab='today';
function showTab(name,push=true){
  if(!TABS[name])name='today';
  curTab=name;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+name));
  document.querySelectorAll('.tabbar button').forEach(b=>b.classList.toggle('on',b.dataset.tab===name));
  const sub=$('#mast-sub');if(sub)sub.textContent=TABS[name];
  if(push){history.pushState({tab:name},'','#'+name);window.scrollTo(0,0)}
}
document.body.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab]');if(t){showTab(t.dataset.tab)}});
window.addEventListener('popstate',e=>{
  const open=document.querySelector('.sheet.on');
  if(open){toggleSheet('#'+open.id,false);history.pushState({tab:curTab},'','#'+curTab);return}
  showTab((e.state&&e.state.tab)||location.hash.slice(1)||'today',false)});
(function(){const t=location.hash.slice(1);showTab(TABS[t]?t:'today',false);
  history.replaceState({tab:curTab},'','#'+curTab)})();
