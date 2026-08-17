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
['data/textbook.js','data/lectures.js','library.js','image-bank.js','knowledge-detail.js','app.js'].forEach(f=>{
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
  t('总进度显示 0 / 215（精讲正文188＋通读27）',()=>d.getElementById('textbook-progress').textContent.trim()==='0 / 215'?true:
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
  t('首页总进度跟着变 1 / 215',()=>d.getElementById('textbook-progress').textContent.trim()==='1 / 215'?true:
    '实为'+d.getElementById('textbook-progress').textContent);
  t('目录里该课打了勾',()=>d.querySelector('[data-tb="fs01:18"]').classList.contains('done')?true:'没打勾');
  t('计入连续学习（写了 history）',()=>{const h=JSON.parse(w.localStorage.getItem('guanshan_history')||'{}');
    return Object.keys(h).length>0?true:'没记';});
  d.querySelector('[data-tb="fs01:18"]').click();
  d.getElementById('textbook-content').querySelector('[data-tb-done]').click();
  t('再点一次可取消已读',()=>{const rd=JSON.parse(w.localStorage.getItem('guanshan_read')||'{}');
    return !rd['fs01-18']?true:'取消不掉';});

  /* ⚠️ 2026-08-15 回归锁（用户报过：「标记读完后页面又跑到最上面」）
     根因：markRead 里重开整篇，而 openTextbook 末尾有 pn.scrollTop=0。
     两条一起锁：① 位置不动（用户可见的行为）② 正文节点没被重建
     ——② 是因为「重渲染再补回滚动」也会闪一下，那不算修好。*/
  d.querySelector('[data-tb="fs01:18"]').click();
  const _panel=d.querySelector('#textbook-sheet .sheet-panel');
  const _h2=d.getElementById('textbook-content').querySelector('h2');
  _panel.scrollTop=420;
  d.getElementById('textbook-content').querySelector('[data-tb-done]').click();
  t('标记读完后停在原位置，不弹回顶部',()=>_panel.scrollTop===420?true:'scrollTop 被改成了 '+_panel.scrollTop);
  t('标记读完没有重建正文（否则会闪）',()=>d.getElementById('textbook-content').querySelector('h2')===_h2?true:'正文被整篇重渲染了');
  t('位置不动但目录进度照常更新',()=>d.querySelector('[data-tb="fs01:18"]').classList.contains('done')?true:'目录没跟上');
  d.getElementById('textbook-content').querySelector('[data-tb-done]').click();

  console.log('\n— 与图鉴互链（教材不复制图鉴内容）—');
  d.querySelector('[data-tb="fs01:18"]').click();
  const links=d.getElementById('textbook-content').querySelectorAll('[data-tb-link],[data-tb-lesson]');
  t('第18课列出了延伸概念',()=>links.length>0?true:'一个都没有');
  t('延伸词确实出现在本课正文里',()=>{
    const l=book.lessons.find(x=>x.n===18),txt=l.p.map(p=>typeof p==='string'?p:p.v.join('')).join('');
    // ⚠️ 精讲类延伸的按钮文字是条目名（不是原词），所以只校验图鉴类那支
    const bad=[...links].filter(b=>b.dataset.tbLink).map(b=>b.dataset.tbLink).filter(h=>!txt.includes(h));
    return bad.length===0?true:'凭空出现的词：'+bad.join(',');});
  t('精讲延伸已按条目去重（五个星名常落在同一条）',()=>{
    const ls=[...links].filter(b=>b.dataset.tbLec).map(b=>b.dataset.tbLec);
    return ls.length===new Set(ls).size?true:'重复指向同一条：'+ls.join(',');});
  /* 死链是这个功能最容易坏的地方：词写成「火星山」而图鉴条目叫「五星山形」，
     就会点出一片「没有找到相关知识点」。逐课全查一遍。
     ⚠️ 2026-08-12：兜底源由已撤的「精读课」改为体系精讲正文。*/
  t('全站延伸链接无死链（图鉴或精讲至少命中一个）',()=>{
    const LIB=G('LIBRARY'),L=G('LECTURES'),dead=[];
    const inLec=h=>L.some(c=>c.items.some(i=>!i.note&&
      (i.t.includes(h)||JSON.stringify(i.blocks).includes(h))));
    TB.forEach(b=>b.lessons.forEach(l=>l.hints.forEach(h=>{
      if(!LIB.some(x=>(x.title+x.summary+x.source).includes(h))&&!inLec(h))
        dead.push(`第${l.n}课:${h}`);})));
    return dead.length===0?true:'死链 '+dead.length+' 处：'+dead.slice(0,5).join(' ');});
  /* ⚠️ 2026-08-12：图鉴重建后自己也覆盖了五星山名，所以这里不再规定
     必须落到哪一边——只要求每个延伸词都能落到「图鉴或精讲」之一。*/
  t('第20课（土星山）的延伸词都有去处',()=>{
    d.querySelector('[data-tb="fs01:20"]').click();
    const box=d.getElementById('textbook-content');
    const n=box.querySelectorAll('[data-tb-link],[data-tb-lec]').length;
    const l=TB[0].lessons.find(x=>x.n===20);
    return n>0||l.hints.length===0?true:'一个延伸都没渲染出来';});
  t('点延伸能打开对应的层',()=>{
    const box=d.getElementById('textbook-content');
    const lec=box.querySelector('[data-tb-lec]'),lib=box.querySelector('[data-tb-link]');
    if(lec){lec.click();return d.getElementById('textbook-sheet').classList.contains('on')?true:'精讲没打开';}
    if(lib){lib.click();return d.querySelectorAll('#library-list [data-knowledge]').length>0?true:'图鉴没筛出';}
    return '第20课没有可点的延伸';});
  const tbc=d.querySelector('[data-tb-close]');if(tbc)tbc.click();
  d.querySelector('[data-tb="fs01:18"]').click();
  const libLink=d.getElementById('textbook-content').querySelector('[data-tb-link]');
  if(libLink)libLink.click();
  t('点图鉴延伸能筛出条目',()=>{
    if(!libLink)return '第18课没有图鉴类延伸';
    const items=d.querySelectorAll('#library-list [data-knowledge]');
    return items.length>0?true:'点了没筛出东西';});
  t('点延伸后关闭了阅读层',()=>!sheet.classList.contains('on')?true:'还开着');

  console.log('\n— 不与既有版块重复 —');
  t('精读课已全站撤除',()=>{
    const src=fs.readFileSync(D+'app.js','utf8');
    const left=['LESSONS.','openLesson','answerQuestion','wrongState'].filter(x=>src.includes(x));
    return left.length===0&&!d.getElementById('lesson-sheet')&&!d.getElementById('featured-path')
      ?true:'还剩：'+left.join(',')+(d.getElementById('featured-path')?' #featured-path':'');});
  t('教材版块没有复制图鉴',()=>{
    const n=d.querySelectorAll('#textbook-list [data-knowledge]').length;
    return n===0?true:'教材里混进了'+n+'个图鉴条目';});
  t('今日页改成「接着读」并指向真实条目',()=>{
    const go=d.querySelector('#next-lecture [data-lec]');
    if(!go)return '#next-lecture 里没有可点的条目';
    const [c,n]=go.dataset.lec.split(':');
    const cat=G('LECTURES').find(x=>x.c===c);
    return cat&&cat.items.some(i=>String(i.n)===n&&!i.note)?true:'指向了不存在或说明性的条目';});
  t('接着读跳过说明性小节',()=>{
    const grid=d.querySelectorAll('#next-lecture .nx-grid span').length;
    return grid===13?true:'类格实为'+grid;});
  t('图鉴 100 条仍在',()=>{const L=G('LIBRARY');return L&&L.length===100?true:'实为'+((L||[]).length);});

  console.log('\n— 体系精讲 —');
  const LEC=G('LECTURES');
  t('LECTURES 已加载',()=>Array.isArray(LEC)&&LEC.length===13?true:'实为'+(LEC||[]).length);
  t('A–M 十三类全部完成',()=>LEC.map(x=>x.c).join('')==='ABCDEFGHIJKLM'?true:LEC.map(x=>x.c).join(''));
  t('共 202 条',()=>{const n=LEC.reduce((a,c)=>a+c.items.length,0);return n===202?true:'实为'+n;});
  t('每条正文都有块',()=>{const bad=LEC.flatMap(c=>c.items).filter(i=>!i.blocks||!i.blocks.length);
    return bad.length===0?true:bad.map(x=>x.t).join(',');});
  t('正文条目都带教材引文',()=>{
    const bad=LEC.flatMap(c=>c.items).filter(i=>i.nq===0&&!/未收入|进度|未展开|归属说明|完成情况/.test(i.t));
    return bad.length===0?true:'无引文：'+bad.map(x=>x.n||x.t).join(',');});
  t('引文都带出处',()=>{
    const qs=LEC.flatMap(c=>c.items).flatMap(i=>i.blocks.filter(b=>b.t==='q'));
    const bad=qs.filter(q=>!q.src);
    return bad.length<=8?true:bad.length+' 处引文没出处';});
  t('出处格式是「书名+页码/课号」',()=>{
    const qs=LEC.flatMap(c=>c.items).flatMap(i=>i.blocks.filter(b=>b.t==='q'&&b.src));
    const bad=qs.filter(q=>!/^(初级|中级|家居|高级|第一课)/.test(q.src));
    return bad.length===0?true:'异常出处：'+bad.slice(0,3).map(q=>q.src).join('｜');});
  const lecList=d.getElementById('lecture-list');
  t('首页精讲目录已渲染',()=>lecList&&lecList.querySelectorAll('[data-lec]').length===202?true:
    '实为'+(lecList?lecList.querySelectorAll('[data-lec]').length:0));
  t('十三类分组都在',()=>lecList.querySelectorAll('.tb-group').length===13?true:
    '实为'+lecList.querySelectorAll('.tb-group').length);
  lecList.querySelector('[data-lec="A:A1"]').click();
  const lc=d.getElementById('textbook-content');
  t('点开能读 A1',()=>/风水是什么/.test(lc.querySelector('h2').textContent)?true:
    lc.querySelector('h2').textContent);
  t('一句话结论渲染成 lec-lead',()=>lc.querySelectorAll('.lec-lead').length>0?true:'没有');
  t('引文渲染成 blockquote 且带 cite',()=>{
    const q=lc.querySelectorAll('.lec-q');
    return q.length>=3&&[...q].some(x=>x.querySelector('cite'))?true:'引文块 '+q.length;});
  t('cite 里是真出处（含书名与页码）',()=>{
    const c=lc.querySelector('.lec-q cite');
    return c&&/(初级|中级|家居|高级|第一课)/.test(c.textContent)?true:(c?c.textContent:'没有 cite');});
  t('全站解析出足量 ⚠️/⭐/📎 提示',()=>{
    const n=LEC.flatMap(c=>c.items).flatMap(i=>i.blocks).filter(b=>b.t==='note').length;
    return n>=30?true:'只有'+n+' 个';});
  t('三种提示类型都有（warn/key/ref）',()=>{
    const ks=new Set(LEC.flatMap(c=>c.items).flatMap(i=>i.blocks).filter(b=>b.t==='note').map(b=>b.k));
    return ['warn','key','ref'].every(k=>ks.has(k))?true:'实为 '+[...ks].join(',');});
  t('⚠️ 提示渲染进 DOM（A3 不藏风那条有）',()=>{
    d.querySelector('[data-lec="A:A3"]').click();
    const n=d.getElementById('textbook-content').querySelectorAll('.lec-note').length;
    return n>0?true:'A3 里没渲染出 note';});
  d.querySelector('[data-lec="A:A1"]').click();
  t('有上下条导航',()=>lc.querySelectorAll('.tb-nav [data-lec]').length>=1?true:'没有');
  lc.querySelector('[data-lec-done]').click();
  t('精讲读完标记写盘',()=>{const rd=JSON.parse(w.localStorage.getItem('guanshan_read')||'{}');
    return rd['lec-AA1']?true:'没写入';});
  /* 精讲侧同一个坑（openLecture 末尾也有 pn.scrollTop=0），一并锁住 */
  d.querySelector('[data-lec="A:A1"]').click();
  const _lp=d.querySelector('#textbook-sheet .sheet-panel');
  const _lh2=d.getElementById('textbook-content').querySelector('h2');
  _lp.scrollTop=360;
  d.getElementById('textbook-content').querySelector('[data-lec-done]').click();
  t('精讲标记读完也停在原位置',()=>_lp.scrollTop===360?true:'scrollTop 被改成了 '+_lp.scrollTop);
  t('精讲标记读完没有重建正文',()=>d.getElementById('textbook-content').querySelector('h2')===_lh2?true:'正文被整篇重渲染了');
  d.getElementById('textbook-content').querySelector('[data-lec-done]').click();
  t('总进度含精讲（188+27=215）',()=>/\/ 215$/.test(d.getElementById('textbook-progress').textContent.trim())?true:
    '实为'+d.getElementById('textbook-progress').textContent);
  t('B 类有表格块（五星各论）',()=>{
    const b=LEC.find(x=>x.c==='B');
    return b.items.some(i=>i.blocks.some(x=>x.t==='table'))?true:'没解析出表格';});

  t('C 类已补齐（无未展开条目）',()=>{
    const c=LEC.find(x=>x.c==='C');
    const bad=c.items.filter(i=>/未展开|待整合/.test(i.t));
    return bad.length===0?true:'仍有：'+bad.map(x=>x.t).join(',');});
  t('二十四凶穴 24 种都在正文里',()=>{
    const c=LEC.find(x=>x.c==='C'),txt=JSON.stringify(c.items);
    const miss=['死块','吐穴','露胎','白虎捶胸','青龙钻怀','背主','反肘','欺主','无辅',
      '断颈缠头','无实','操戈','擎拳','相斗','覆体','龙虎成冈','假抱','斜飞','边活边死',
      '龙衔虎','仰瓦','绷面','吹胎','破头'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('穴上九星九个都在',()=>{
    const c=LEC.find(x=>x.c==='C'),txt=JSON.stringify(c.items);
    const miss=['太阳','太阴','金水','天财','紫气','天罡','孤曜','燥火','扫荡'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('五星结穴五种都在',()=>{
    const c=LEC.find(x=>x.c==='C'),txt=JSON.stringify(c.items);
    const miss=['木星结穴','火星结穴','土星结穴','金星结穴','水星结穴'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});

  const sw=fs.readFileSync(D+'sw.js','utf8');
  t('E 类吉凶水 34 目都在（19吉＋15凶）',()=>{
    const c=LEC.find(x=>x.c==='E'),txt=JSON.stringify(c.items);
    const ji=['金城水','木城水','水城水','火城水','土城水','九曲水','游渚水','拱背水','暗拱水',
      '仓板水','朝拜水','入口水','聚天心','田源水','簸箕水','金钗水','排衙水','天梯水','玉阶水'];
    const xiong=['冲心水','射肋水','分流水','破天心','斜流水','裹头水','漏腮水','倾卸水','淋头水',
      '牵牛水','割脚水','穿臂水','反弓水','瀑面水','直倾水'];
    const miss=[...ji,...xiong].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺 '+miss.length+' 目：'+miss.join(',');});
  t('F 类立向两原则都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='F').items);
    return /后承龙气/.test(txt)&&/前收堂气/.test(txt)?true:'缺原则';});
  t('G 类五行五种分法都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='G').items);
    const miss=['干支五行','正体五行','双山五行','小玄空五行','纳音五行'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('G 类六种阴阳分法都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='G').items);
    const miss=['天干阴阳','地支阴阳','先天八卦','纳甲阴阳','后天八卦','挨星阴阳'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('十三类都无未展开条目',()=>{
    const bad=LEC.flatMap(c=>c.items.filter(i=>/未展开|待整合/.test(i.t)).map(i=>c.c+i.t));
    return bad.length===0?true:'仍有：'+bad.join(',');});

  t('H 类主口诀都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='H').items);
    const miss=['双龙双水','反复黄泉','救贫黄泉','隔八相生','八煞','劫煞','羊刃禄堂',
      '阴阳夫妇交媾','太乙数','串珠','贫单绝','先后天水法','河图四大局','纳甲','归元水',
      '翻卦掌','辅星山法','辅星水法','五鬼运财','三吉六秀','贵人峰','赖公拨砂','十二长生水法'
      ].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});

  t('I 类八宅玄空都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='I').items);
    const miss=['八宅','东四宅','西四宅','玄空','三元九运','紫白','三元不败','驳杂'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('J 类罗盘与分金都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='J').items);
    const miss=['天池','内盘','外盘','一百二十分金','三针','四线','七甲子','演海分金','地盘'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});

  t('K 类内外六事与立极点都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='K').items);
    const miss=['内六事','外六事','立极点','穿堂煞','玄关','门楼','子午斜流'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});

  t('L 类八条歌八歌都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='L').items);
    const miss=['八条歌','净阴净阳','五雷打丁','指迷赋','地母卦','武曲宿','破军金','廉贞鬼',
      '艮丙垣','巨门宫','禄存坠'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('M 类论地28目都在',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='M').items);
    const miss=['富地','贵地','文贵','武贵','横财','晚成','旺丁','少丁','寿考','损少丁',
      '寡母','孤寡','贫穷','离乡','外死','瞽目','愚顽','疯癫','投河','自缢','官事','被火',
      '被贼','翻棺','生水','地漏','天白','认龙立向'].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});

  t('B 类九星八星各论都补齐了',()=>{
    const txt=JSON.stringify(LEC.find(x=>x.c==='B').items);
    const miss=['巨门','禄存','文曲','廉贞','武曲','破军','左辅','右弼',
      '鹤爪禄存','上山蛇','土腹流金','帐幕','顺结','闪结','横结','逆结','五不葬'
      ].filter(n=>!txt.includes(n));
    return miss.length===0?true:'缺：'+miss.join(',');});
  t('这轮补的四处欠账都在',()=>{
    const at=c=>JSON.stringify(LEC.find(x=>x.c===c).items);
    const want=[['A','类象'],['A','整体观'],['C','葬深'],['C','五色土'],
      ['D','单提'],['D','五十七图'],['E','听水'],['E','咆哮']];
    const miss=want.filter(([c,n])=>!at(c).includes(n)).map(x=>x.join(':'));
    return miss.length===0?true:'缺：'+miss.join(' ');});
  t('全 13 类都不再有「未展开条目」',()=>{
    const bad=LEC.filter(c=>JSON.stringify(c.items).includes('以下暂未展开')).map(c=>c.c);
    return bad.length===0?true:'还挂着：'+bad.join(',');});

  t('说明性小节不计进度分母',()=>{
    const note=LEC.flatMap(c=>c.items.filter(i=>i.note));
    if(note.length!==14)return '说明条实为'+note.length+'条';
    const real=LEC.flatMap(c=>c.items.filter(i=>!i.note)).length;
    return real===188?true:'正文实为'+real+'条';});
  t('每条说明性小节都标了 note',()=>{
    const bad=LEC.flatMap(c=>c.items).filter(i=>
      /未收入|完成情况|归属说明|待整合/.test(i.t)&&!i.note).map(i=>i.t);
    return bad.length===0?true:'漏标：'+bad.join(',');});

  t('教材版块住进「学」tab',()=>d.querySelector('#view-book #lecture-list')?true:'不在 view-book 里');

  console.log('\n— 知识图鉴：每条都要能回查精讲 —');
  const LIB=G('LIBRARY'),KD=G('KNOWLEDGE_DETAIL');
  const lecByCode={};LEC.forEach(c=>c.items.forEach(i=>{if(!i.note)lecByCode[i.n]=i}));
  t('图鉴仍是 100 条且 id 连续（id 是 SRS 进度的键，动了就废）',()=>
    LIB.length===100&&LIB.every((x,i)=>x.id===i+1)?true:'条数或 id 变了');
  t('每条都挂了精讲条目，且该条目真实存在',()=>{
    const bad=LIB.filter(x=>!x.lec||!lecByCode[x.lec]).map(x=>x.id+' '+x.title);
    return bad.length===0?true:'缺或指错：'+bad.slice(0,5).join('；');});
  t('摘要就是精讲的「一句话」，没有另起炉灶',()=>{
    const strip=t=>t.replace(/<[^>]+>/g,'').trim();
    const bad=LIB.filter(x=>{const b=lecByCode[x.lec].blocks.find(b=>b.t==='lead');
      return b&&strip(b.v)!==x.summary}).map(x=>x.id+' '+x.title);
    return bad.length===0?true:'与精讲不一致：'+bad.slice(0,5).join('；');});
  t('出处都带真实页码，不再是书名标签',()=>{
    const bad=LIB.filter(x=>!/p\d+|第\d+课/.test(x.source)).map(x=>x.id+' '+x.title+'←'+x.source);
    return bad.length===0?true:'无页码：'+bad.slice(0,5).join('；');});
  /* ⚠️ 别拿 JSON.stringify 去比：里面的引号是转义的，多行引文的拼接符也不同。
     照 build_knowledge.py 的同一套算法把候选原话还原出来，比集合。*/
  t('详情里的教材原话确实出自所挂的精讲条目',()=>{
    const strip=t=>t.replace(/<[^>]+>/g,'').trim();
    const bad=[];
    LIB.forEach(x=>{const d0=KD[x.id];
      if(!d0||!d0.q.length){bad.push(x.id+' 无原话');return}
      const pool=new Set(lecByCode[x.lec].blocks.filter(b=>b.t==='q')
        .map(b=>strip(b.v.join('　'))));
      d0.q.forEach(([txt])=>{
        let ok=false;pool.forEach(v=>{if(v===txt||v.startsWith(txt.slice(0,-1)))ok=true});
        if(!ok)bad.push(x.id+' '+txt.slice(0,14));});});
    return bad.length===0?true:bad.length+' 处对不上：'+bad.slice(0,4).join('；');});
  t('查无实据的旧条目已改掉',()=>{
    const gone=['九不葬','十种证穴','五鬼闹判官','二十八宿分金','卦爻分金'];
    const left=gone.filter(n=>LIB.some(x=>x.title===n));
    return left.length===0?true:'还在：'+left.join(',');});

  console.log('\n— 识形图片题库：也要能回查 —');
  const IB=G('IMAGE_BANK'),SEED=G('IMAGE_SEEDS');
  t('仍是 15 题种 × 5 问法 = 75 题（id 是答题记录的键）',()=>
    SEED.length===15&&IB.length===75&&IB.every((q,i)=>q.id===i+1)?true:'题种/题数/ id 变了');
  t('每题出处都带真实页码',()=>{
    const bad=IB.filter(q=>!/p\d+|第\d+课/.test(q.source)).map(q=>q.id+' '+q.title);
    return bad.length===0?true:'无页码：'+bad.slice(0,4).join('；');});
  t('每题都挂了真实存在的精讲条目',()=>{
    const bad=IB.filter(q=>!q.lec||!lecByCode[q.lec]).map(q=>q.id+' '+q.title);
    return bad.length===0?true:'缺或指错：'+bad.slice(0,4).join('；');});
  t('解析里的教材原话出自所挂条目',()=>{
    const strip=x=>x.replace(/<[^>]+>/g,'').trim();
    const bad=[];
    SEED.forEach(sd=>{const cite=strip(sd.cite||'').replace(/〔[^〕]*〕$/,'');
      if(!cite){bad.push(sd.title+' 无原话');return}
      const pool=lecByCode[sd.lec].blocks.filter(b=>b.t==='q').map(b=>strip(b.v.join('　')));
      if(!pool.some(v=>v.startsWith(cite)))bad.push(sd.title);});
    return bad.length===0?true:'对不上：'+bad.join('；');});
  t('不再引用体系外的《从零开始学罗盘》',()=>{
    const bad=IB.filter(q=>/从零开始学罗盘/.test(q.source)).length;
    return bad===0?true:bad+' 题仍引散册';});

  console.log('\n— 知识点清单页 —');
  t('zhishi.html 存在',()=>fs.existsSync(D+'zhishi.html')?true:'没有');
  t('data/index.js 存在',()=>fs.existsSync(D+'data/index.js')?true:'没有');
  t('清单数据 1110 个知识点、13 类',()=>{
    const src=fs.readFileSync(D+'data/index.js','utf8');
    const m=src.match(/const FSINDEX=([\s\S]+);\n$/);
    if(!m)return '解析不出 FSINDEX';
    const D2=JSON.parse(m[1]);
    const n=D2.cats.reduce((a,c)=>a+c.n,0);
    return (D2.cats.length===13&&n===1110)?true:`实为 ${D2.cats.length} 类 ${n} 个`;});
  t('清单页引了数据文件',()=>/data\/index\.js/.test(fs.readFileSync(D+'zhishi.html','utf8'))?true:'没引');
  t('清单页有返回观山的链接',()=>/class="back" href="\.\/"/.test(fs.readFileSync(D+'zhishi.html','utf8'))?true:'没有返回入口');
  t('首页有清单入口',()=>/zhishi\.html/.test(fs.readFileSync(D+'index.html','utf8'))?true:'首页没入口');
  /* 277KB 的清单数据**不该**进 sw 预缓存，否则每次装 PWA 都先拖它 */
  t('sw 预缓存了 zhishi.html',()=>/zhishi\.html/.test(sw)?true:'没有');
  t('sw 没有预缓存 277KB 的 data/index.js（按需加载）',()=>
    !/data\/index\.js/.test(sw)?true:'被塞进 ASSETS 了，会拖慢首次安装');

  console.log('\n— 精讲配图（A–M 全库）—');
  const Dcat=LEC.find(c=>c.c==='D');
  const allImgs=[];LEC.forEach(c=>c.items.forEach(i=>i.blocks.forEach(b=>{if(b.t==='img')allImgs.push([c.c,i.n,b])})));

  /* ⚠️ L/M 门槛只设 1 张：教材本身就没配图（候选各 2 张与 9 张，多数还是别类的重复），
     不是漏做。G/K 反而很多——理气基础全是图表、家居全是实例。*/
  t('A–G·K 八类都有足量配图，L/M 至少各一张',()=>{const by={};allImgs.forEach(x=>by[x[0]]=(by[x[0]]||0)+1);
    const miss=['A','B','C','D','E','F','G','K'].filter(c=>!(by[c]>=8));
    const thin=['L','M'].filter(c=>!(by[c]>=1));
    if(miss.length)return '这些类配图过少：'+miss.join('')+' 实际 '+JSON.stringify(by);
    return thin.length?'L/M 一张都没有：'+thin.join(''):true;});
  t('配图文件都真实存在',()=>{const miss=allImgs.filter(x=>!fs.existsSync(D+'assets/lecimg/'+x[2].f));
    return miss.length?miss.length+' 张缺失，如 '+miss[0][2].f:true;});
  t('每张图都有说明与出处',()=>{const bad=allImgs.filter(x=>!x[2].cap||!/^(初级|中级|高级|家居|第一课)\s*p\d+/.test(x[2].src||''));
    return bad.length?bad.length+' 张缺 cap/src，如 '+(bad[0][2].f):true;});
  /* ⚠️ 图片文件名必须纯 ASCII：中文名要 percent-encode 才能取，
     GitHub Pages 扛得住，但手机端（尤其微信 X5 内核）容易在编码上出岔子。
     第一版就是中文名，上线前改的——别改回去。*/
  t('图片文件名是纯 ASCII',()=>{const bad=allImgs.filter(x=>!/^[\x21-\x7e]+$/.test(x[2].f));
    return bad.length?bad.length+' 张是非 ASCII 名，如 '+bad[0][2].f:true;});
  t('图名与出处对得上（防映射表改了文件名没改页码）',()=>{
    const SLUG={chuji:'初级',zhongji:'中级',gaoji:'高级',jiaju:'家居',diyike:'第一课'};
    const bad=allImgs.filter(x=>{const m=x[2].f.match(/^([a-z]+)-p(\d+)-x/);
      return !m||x[2].src!==SLUG[m[1]]+' p'+m[2]});
    return bad.length?bad.length+' 张对不上，如 '+bad[0][2].f:true;});

  /* ⭐ 这套东西的价值在「图跟着讲解走」，不是堆在文末。
     ⚠️ 别断言「紧跟同页引文」——落点有三种都是对的：精确同页、就近±3页、
     以及**插在引文之前**（引子图、页码比引文小的图）。真正要防的退化是
     图掉进条目末尾兜底位置，那才是「没配上」。*/
  /* tail_ok＝映射表里写了 '末尾'、人工确认过的；tail＝没人管它、掉队了。只报后者。*/
  t('没有图意外掉到条目末尾',()=>{
    const bad=allImgs.filter(x=>x[2].how==='tail').map(x=>x[1]+'「'+x[2].cap+'」('+x[2].src+')');
    return bad.length?bad.length+' 张掉到末尾：'+bad.join('、'):true;});
  t('落点方式都是已知的五种',()=>{const ok=['exact','near','anchor','tail','tail_ok'];
    const bad=allImgs.filter(x=>!ok.includes(x[2].how));
    return bad.length?'有图的 how 字段异常：'+bad[0][2].f:true;});
  t('多数图精确落在同页引文（≥60%）',()=>{const n=allImgs.filter(x=>x[2].how==='exact').length;
    return n/allImgs.length>=0.6?true:`只有 ${n}/${allImgs.length} 张精确落位，页码对齐可能坏了`;});

  /* ⭐ 教材里成套的图表（九星／二十四凶穴／五城水／吉水凶水／吉凶砂）是这套配图最大的价值，
     少一张就是残的。张数写死在这里，掉图会立刻红。*/
  t('成套图表没有缺张',()=>{
    const n=(c,no)=>{const it=LEC.find(x=>x.c===c).items.find(i=>i.n===no);
      return it?it.blocks.filter(b=>b.t==='img').length:-1};
    const want=[['C','C11',9,'穴上九星'],['C','C19',23,'二十四凶穴'],
                ['B','B12',11,'九星与贪狼十二形'],['B','B19',7,'破军与他星合名'],
                ['G','G3',3,'先后天八卦与洛书九宫'],['K','K2',13,'入户门与门尺'],
                ['E','E5',5,'五城水'],['E','E6',14,'吉水'],['E','E7',15,'凶水'],
                ['D','D16',8,'吉凶砂五十七图']];
    const bad=want.filter(([c,no,k])=>n(c,no)!==k)
                  .map(([c,no,k,name])=>`${no} ${name} 应 ${k} 张、实为 ${n(c,no)}`);
    return bad.length?bad.join('；'):true;});

  t('带小节锚点的图落在指定小节里',()=>{
    const want={'山峰端正':'二、端正与歪斜','砂的顺与逆':'五、顺砂与逆砂',
                '山的高低与逼压':'三、高低与逼压','建筑逼压实例':'三、高低与逼压',
                '山的秀丽与粗恶':'一、秀丽与粗恶','山的端正与歪斜':'二、端正与歪斜'};
    const it=Dcat.items.find(i=>i.n==='D6');let sec='',bad=[];
    it.blocks.forEach(b=>{if(b.t==='h')sec=b.v.replace(/<[^>]+>/g,'');
      if(b.t==='img'&&want[b.cap]&&sec!==want[b.cap])bad.push(`${b.cap} 落在「${sec||'开头'}」应在「${want[b.cap]}」`)});
    return bad.length?bad.join('；'):true;});

  t('图真渲染进 DOM（含 lazy）',()=>{w.eval('openLecture("D","D12")');
    const figs=d.querySelectorAll('#textbook-content .lec-fig img');
    if(!figs.length)return'D12 正文里一张图都没渲染出来';
    if(![...figs].every(i=>i.getAttribute('loading')==='lazy'))return'有图没带 loading=lazy（53 张一次全载会拖垮手机）';
    if(![...figs].every(i=>/^assets\/lecimg\//.test(i.getAttribute('src'))))return'图片路径不对';
    return true;});
  t('图注带出处标签',()=>{const c=d.querySelector('#textbook-content .lec-fig figcaption cite');
    return c&&/p\d+/.test(c.textContent)?true:'图注里没有页码出处';});

  /* ⚠️ 同 data/index.js 那条：预缓存会让每次装 PWA 都先拖 3MB 图。
     sw 是网络优先＋缓存回退，看过的自然有离线副本。*/
  /* ⚠️ 这条原先写作 /lecimg/.test(sw)，被缓存名 'guanshan-v36-lecimg' 里的
     同名字串误伤成红。要查的是 ASSETS 里的**路径**，不是全文出现过这四个字母。*/
  t('配图没有进 sw 预缓存',()=>/assets\/lecimg/.test(sw)?'lecimg 被写进 ASSETS 了，装 PWA 会先拖 3MB':true);
  t('加图没有改变进度分母',()=>{const n=LEC.reduce((s,c)=>s+c.items.filter(i=>!i.note).length,0);
    return n===188?true:'正文条数变成 '+n+'（应为 188，图不该计进条目数）';});
  t('图不计入字数（img 块没有 v 键）',()=>Dcat.items.every(i=>typeof i.c==='number'&&i.c>0)?true:'字数统计坏了');
  t('build_images.py 与映射表都在',()=>fs.existsSync(D+'build_images.py')&&fs.existsSync(D+'_map_lecimg.py')?true:'缺脚本或映射表');

  console.log('\n— 工程 —');

  /* ⚠️ 别把版本号写死（这条原来是 /guanshan-v34/，每 bump 一次就得回来改测试，
     改法还是再写死一遍——治标不治本）。改成【递增基线】：
     忘了 bump 会红，bump 了永远绿。以后只在需要抬底线时改这个数。*/
  const SW_MIN=39;
  t('sw 版本已 bump（≥v'+SW_MIN+'）',()=>{const m=sw.match(/guanshan-v(\d+)/);
    if(!m)return'sw 里找不到 guanshan-vN 版本号';
    return +m[1]>=SW_MIN?true:'还是 v'+m[1]+'，没 bump（基线 v'+SW_MIN+'）';});
  t('sw 缓存了 data/lectures.js',()=>/data\/lectures\.js/.test(sw)?true:'没加进 ASSETS');
  t('build_lectures.py 在项目里',()=>fs.existsSync(D+'build_lectures.py')?true:'不见了');
  t('sw 缓存了 data/textbook.js',()=>/data\/textbook\.js/.test(sw)?true:'没加进 ASSETS');
  t('index.html 引了 data/textbook.js',()=>/data\/textbook\.js/.test(fs.readFileSync(D+'index.html','utf8'))?true:'没引');
  t('产物文件带「勿手改」标记',()=>/勿手改/.test(fs.readFileSync(D+'data/textbook.js','utf8'))?true:'没标');
  t('build.py 在项目里',()=>fs.existsSync(D+'build.py')?true:'不见了');

  console.log(`\n${fail?'❌ '+fail+' 项未通过':'✅ 全部 '+pass+' 项通过'}`);
  process.exit(fail?1:0);
},1500);
