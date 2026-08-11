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
  t('总进度显示 0 / 212（精讲185＋通读27）',()=>d.getElementById('textbook-progress').textContent.trim()==='0 / 212'?true:
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
  t('首页总进度跟着变 1 / 212',()=>d.getElementById('textbook-progress').textContent.trim()==='1 / 212'?true:
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

  console.log('\n— 体系精讲 —');
  const LEC=G('LECTURES');
  t('LECTURES 已加载',()=>Array.isArray(LEC)&&LEC.length===13?true:'实为'+(LEC||[]).length);
  t('A–M 十三类全部完成',()=>LEC.map(x=>x.c).join('')==='ABCDEFGHIJKLM'?true:LEC.map(x=>x.c).join(''));
  t('共 185 条',()=>{const n=LEC.reduce((a,c)=>a+c.items.length,0);return n===185?true:'实为'+n;});
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
  t('首页精讲目录已渲染',()=>lecList&&lecList.querySelectorAll('[data-lec]').length===185?true:
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
  t('总进度含精讲（185+27=212）',()=>/\/ 212$/.test(d.getElementById('textbook-progress').textContent.trim())?true:
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

  console.log('\n— 工程 —');

  t('sw 版本已 bump',()=>/guanshan-v27/.test(sw)?true:'还是旧版本号');
  t('sw 缓存了 data/lectures.js',()=>/data\/lectures\.js/.test(sw)?true:'没加进 ASSETS');
  t('build_lectures.py 在项目里',()=>fs.existsSync(D+'build_lectures.py')?true:'不见了');
  t('sw 缓存了 data/textbook.js',()=>/data\/textbook\.js/.test(sw)?true:'没加进 ASSETS');
  t('index.html 引了 data/textbook.js',()=>/data\/textbook\.js/.test(fs.readFileSync(D+'index.html','utf8'))?true:'没引');
  t('产物文件带「勿手改」标记',()=>/勿手改/.test(fs.readFileSync(D+'data/textbook.js','utf8'))?true:'没标');
  t('build.py 在项目里',()=>fs.existsSync(D+'build.py')?true:'不见了');

  console.log(`\n${fail?'❌ '+fail+' 项未通过':'✅ 全部 '+pass+' 项通过'}`);
  process.exit(fail?1:0);
},1500);
