/* 教材精读模块测试
   跑法：NODE_PATH=<有 jsdom 的 node_modules> node tests_textbook.js
   ⚠️ 验的是实物证据（真插进 DOM 的节点、真写进 localStorage 的键），
   不是「函数被调用过」——jsdom 缺 API 时断言会悄悄走进 fallback 分支假绿。*/
const fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom');
const D=__dirname+'/';
const dom=new JSDOM(fs.readFileSync(D+'index.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
const errs=[];
dom.virtualConsole.on('jsdomError',e=>{if(!/scrollTo|Not implemented|scrollIntoView/.test(e.message))errs.push(e.message)});
const w=dom.window,d=w.document;
['data/textbook.js','library.js','image-bank.js','knowledge-detail.js','app.js'].forEach(f=>{
  const sc=d.createElement('script'); sc.textContent=fs.readFileSync(D+f,'utf8'); d.body.appendChild(sc);
});
setTimeout(()=>{
  let pass=0,fail=0;
  const t=(n,f)=>{try{const r=f();const ok=r===true;console.log((ok?'✓ ':'✗ ')+n+(ok?'':' → '+r));ok?pass++:fail++}
    catch(e){console.log('✗ '+n+' → THREW '+e.message.slice(0,90));fail++}};
  /* ⚠️ 顶层 const 不会挂到 window 上（LIBRARY/LESSONS/TEXTBOOKS 都是 const），
     w.TEXTBOOKS 恒为 undefined。必须用 w.eval 在全局作用域取。*/
  const G=s=>{try{return w.eval(s)}catch(e){return undefined}};
  const TB=G('TEXTBOOKS'), book=TB&&TB[0];

  console.log('— 数据层 —');
  t('页面无脚本错误',()=>errs.length?errs.slice(0,2).join(' | '):true);
  t('TEXTBOOKS 已加载',()=>Array.isArray(TB)&&TB.length>0?true:'没加载到');
  t('风水第一课 27 课齐全',()=>book.lessons.length===27?true:'实为'+book.lessons.length);
  t('课号连续 1..27',()=>{const ns=book.lessons.map(l=>l.n);
    return JSON.stringify(ns)===JSON.stringify([...Array(27)].map((_,i)=>i+1))?true:'实为'+ns.join(',');});
  t('每课都有正文且不少于 200 字',()=>{
    const bad=book.lessons.filter(l=>!l.p||!l.p.length||l.c<200);
    return bad.length===0?true:'异常课：'+bad.map(l=>l.n+'('+l.c+'字)').join(' ');});
  t('全书 2 万字量级',()=>{const s=book.lessons.reduce((n,l)=>n+l.c,0);
    return s>19000&&s<22000?true:'实为'+s;});
  t('标题没混进课号前缀',()=>{const bad=book.lessons.filter(l=>/^\d+[、.]/.test(l.t));
    return bad.length===0?true:bad.map(l=>l.t).join(',');});

  console.log('\n— 口诀保真（硬折行不能把韵文粘成一坨）—');
  t('第18课含 verse 段落',()=>{const l=book.lessons.find(x=>x.n===18);
    return l.p.some(p=>typeof p==='object'&&p.v)?true:'口诀被当普通段落了';});
  t('五星口诀是完整四句、未粘连',()=>{const l=book.lessons.find(x=>x.n===18);
    const v=l.p.find(p=>typeof p==='object'&&p.v);
    if(!v)return '没找到 verse';
    if(v.v.length!==4)return '实为'+v.v.length+'句：'+v.v.join('/');
    return v.v[0]==='地理先须辨五星'&&v.v[3]==='千变万化此中生'?true:'内容不对：'+v.v.join('/');});
  t('口诀后面的讲解没被吸进韵文',()=>{const l=book.lessons.find(x=>x.n===18);
    const v=l.p.find(p=>typeof p==='object'&&p.v);
    return v.v.every(x=>!/说的意思是/.test(x))?true:'「说的意思是」粘进口诀了';});

  console.log('\n— 首页目录 —');
  const list=d.getElementById('textbook-list');
  t('教材版块已渲染',()=>list&&list.innerHTML.length>100?true:'空的');
  t('6 个分组全在',()=>{const n=list.querySelectorAll('.tb-group').length;
    return n===6?true:'实为'+n;});
  t('27 课全部可点',()=>{const n=list.querySelectorAll('[data-tb]').length;
    return n===27?true:'实为'+n;});
  t('进度显示 0 / 27',()=>d.getElementById('textbook-progress').textContent.trim()==='0 / 27'?true:
    '实为'+d.getElementById('textbook-progress').textContent);

  console.log('\n— 阅读页 —');
  list.querySelector('[data-tb="fs01:18"]').click();
  const sheet=d.getElementById('textbook-sheet'),cont=d.getElementById('textbook-content');
  t('点课打开了阅读弹层',()=>sheet.classList.contains('on')?true:'没打开');
  t('标题是第18课',()=>/贪狼木/.test(cont.querySelector('h2').textContent)?true:
    '实为'+cont.querySelector('h2').textContent);
  t('正文段落真的插进了 DOM',()=>{const n=cont.querySelectorAll('.tb-doc p').length;
    return n>=5?true:'只有'+n+'段';});
  t('口诀渲染成 4 个 span 分行',()=>{const sp=cont.querySelectorAll('.tb-doc .verse span');
    return sp.length===4?true:'实为'+sp.length;});
  t('正文与源一致（抽查一句）',()=>/尖奇砂曜多生贵/.test(cont.textContent)?true:'关键句没出现');
  t('有上一课/下一课导航',()=>{const nav=cont.querySelectorAll('.tb-nav [data-tb]');
    return nav.length===2?true:'实为'+nav.length;});
  t('第1课没有「上一课」',()=>{list.querySelector('[data-tb="fs01:1"]').click();
    const nav=d.getElementById('textbook-content').querySelectorAll('.tb-nav [data-tb]');
    return nav.length===1&&/下一课/.test(nav[0].textContent)?true:'导航不对：'+nav.length;});
  t('第27课没有「下一课」',()=>{list.querySelector('[data-tb="fs01:27"]').click();
    const nav=d.getElementById('textbook-content').querySelectorAll('.tb-nav [data-tb]');
    return nav.length===1&&/上一课/.test(nav[0].textContent)?true:'导航不对：'+nav.length;});
  t('标注了出处',()=>/风水第一课/.test(d.getElementById('textbook-content').querySelector('.source').textContent)?true:'没写出处');

  console.log('\n— 读完标记 —');
  d.querySelector('[data-tb="fs01:18"]').click();
  d.getElementById('textbook-content').querySelector('[data-tb-done]').click();
  t('写进了 localStorage',()=>{const rd=JSON.parse(w.localStorage.getItem('guanshan_read')||'{}');
    return rd['fs01-18']?true:'没写入：'+JSON.stringify(rd);});
  t('按钮变成已读完',()=>{const b=d.getElementById('textbook-content').querySelector('[data-tb-done]');
    return b.classList.contains('done')&&/已读完/.test(b.textContent)?true:'状态没变：'+b.textContent;});
  t('首页进度跟着变 1 / 27',()=>d.getElementById('textbook-progress').textContent.trim()==='1 / 27'?true:
    '实为'+d.getElementById('textbook-progress').textContent);
  t('目录里该课打了勾',()=>d.querySelector('[data-tb="fs01:18"]').classList.contains('done')?true:'没打勾');
  t('计入连续学习（写了 history）',()=>{const h=JSON.parse(w.localStorage.getItem('guanshan_history')||'{}');
    return Object.keys(h).length>0?true:'没记';});
  d.querySelector('[data-tb="fs01:18"]').click();
  d.getElementById('textbook-content').querySelector('[data-tb-done]').click();
  t('再点一次可取消已读',()=>{const rd=JSON.parse(w.localStorage.getItem('guanshan_read')||'{}');
    return !rd['fs01-18']?true:'取消不掉';});

  console.log('\n— 与图鉴互链（教材不复制图鉴内容）—');
  d.querySelector('[data-tb="fs01:18"]').click();
  const links=d.getElementById('textbook-content').querySelectorAll('[data-tb-link],[data-tb-lesson]');
  t('第18课列出了延伸概念',()=>links.length>0?true:'一个都没有');
  t('延伸词确实出现在本课正文里',()=>{
    const l=book.lessons.find(x=>x.n===18),txt=l.p.map(p=>typeof p==='string'?p:p.v.join('')).join('');
    const bad=[...links].map(b=>b.dataset.tbLink||b.dataset.tbWord).filter(h=>!txt.includes(h));
    return bad.length===0?true:'凭空出现的词：'+bad.join(',');});
  t('精读课延伸已按课去重（五个星名只对两门课）',()=>{
    const ls=[...links].filter(b=>b.dataset.tbLesson).map(b=>b.dataset.tbLesson);
    return ls.length===new Set(ls).size?true:'重复指向同一课：'+ls.join(',');});
  /* 死链是这个功能最容易坏的地方：词写成「火星山」而图鉴条目叫「五星山形」、
     精读课叫「木星与火星」，就会点出一片「没有找到相关知识点」。逐课全查一遍。*/
  t('全站延伸链接无死链（图鉴或精读课至少命中一个）',()=>{
    const LIB=G('LIBRARY'),LES=G('LESSONS'),dead=[];
    TB.forEach(b=>b.lessons.forEach(l=>l.hints.forEach(h=>{
      const inLib=LIB.some(x=>(x.title+x.summary+x.source).includes(h));
      const inLes=LES.some(x=>(x.title+x.sub+x.lead).includes(h));
      if(!inLib&&!inLes)dead.push(`第${l.n}课:${h}`);})));
    return dead.length===0?true:'死链 '+dead.length+' 处：'+dead.slice(0,5).join(' ');});
  t('五星山名链到了精读课（图鉴里没有这些条目）',()=>{
    d.querySelector('[data-tb="fs01:20"]').click();   // 第20课 土星山
    const b=[...d.getElementById('textbook-content').querySelectorAll('[data-tb-lesson]')];
    return b.some(x=>/土星/.test(x.textContent))?true:'土星没链到精读课';});
  t('点精读课延伸能打开精读课弹层',()=>{
    const b=[...d.getElementById('textbook-content').querySelectorAll('[data-tb-lesson]')][0];
    b.click();
    return d.getElementById('lesson-sheet').classList.contains('on')?true:'没打开精读课';});
  d.getElementById('lesson-sheet').querySelector('[data-close]').click();
  d.querySelector('[data-tb="fs01:18"]').click();
  const libLink=d.getElementById('textbook-content').querySelector('[data-tb-link]');
  if(libLink)libLink.click();
  t('点图鉴延伸能筛出条目',()=>{
    if(!libLink)return '第18课没有图鉴类延伸';
    const items=d.querySelectorAll('#library-list [data-knowledge]');
    return items.length>0?true:'点了没筛出东西';});
  t('点延伸后关闭了阅读层',()=>!sheet.classList.contains('on')?true:'还开着');

  console.log('\n— 不与既有版块重复 —');
  t('教材版块没有复制精读课',()=>{
    const n=d.querySelectorAll('#textbook-list [data-open]').length;
    return n===0?true:'教材里混进了'+n+'个精读课入口';});
  t('教材版块没有复制图鉴',()=>{
    const n=d.querySelectorAll('#textbook-list [data-knowledge]').length;
    return n===0?true:'教材里混进了'+n+'个图鉴条目';});
  t('精读课 18 课仍在',()=>{const n=d.querySelectorAll('#featured-path [data-open]').length;
    return n>0?true:'精读课没了';});
  t('图鉴 100 条仍在',()=>{const L=G('LIBRARY');return L&&L.length===100?true:'实为'+((L||[]).length);});

  console.log('\n— 工程 —');
  const sw=fs.readFileSync(D+'sw.js','utf8');
  t('sw 版本已 bump',()=>/guanshan-v18/.test(sw)?true:'还是旧版本号');
  t('sw 缓存了 data/textbook.js',()=>/data\/textbook\.js/.test(sw)?true:'没加进 ASSETS');
  t('index.html 引了 data/textbook.js',()=>/data\/textbook\.js/.test(fs.readFileSync(D+'index.html','utf8'))?true:'没引');
  t('产物文件带「勿手改」标记',()=>/勿手改/.test(fs.readFileSync(D+'data/textbook.js','utf8'))?true:'没标');
  t('build.py 在项目里',()=>fs.existsSync(D+'build.py')?true:'不见了');

  console.log(`\n${fail?'❌ '+fail+' 项未通过':'✅ 全部 '+pass+' 项通过'}`);
  process.exit(fail?1:0);
},1500);
