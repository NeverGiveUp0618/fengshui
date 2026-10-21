// 知识点练习测试：题库结构 + 出处页码在源 md 里确实讲过 + 页面 jsdom 跑一组。跑法：NODE_PATH=<八字象义/node_modules> node tests_kq.js
const fs=require('fs');const {KQ_CATS,KQ_DATA,KQ_OFF}=require('./data/kq.js');let bad=0;
const T=(n,c,x)=>{console.log(c?'ok':'FAIL',n,c?'':(x||''));if(!c)bad++};
const cats=new Set(KQ_CATS.map(c=>c[0]));
const badRow=KQ_DATA.map((q,i)=>[q,i]).filter(([q])=>q.length!==6||!cats.has(q[0])||q[3].length!==3||new Set([q[2],...q[3]]).size!==4||!q[4]||!q[5]).map(x=>x[1]);
T('每题六栏、四个选项互不相同、讲解出处齐全',!badRow.length,badRow);
const qs=KQ_DATA.map(q=>q[1]);T('题目不重复',qs.every((q,i)=>qs.indexOf(q)===i));
T('13 类都有题',KQ_CATS.every(c=>KQ_DATA.some(q=>q[0]===c[0])));
T('撤题序号都在范围内',[...KQ_OFF].every(i=>i>=0&&i<KQ_DATA.length));
// 正确答案不能总是最长的那个（凭长度可猜）
// 凭长度能猜：答案比三个干扰项都长 5 字以上的题不许超过 15 道（2026-10-20 从 272 道压到 8 道）
const longest=KQ_DATA.filter(q=>q[3].every(w=>q[2].length>w.length)).length;
const tooLong=KQ_DATA.map((q,i)=>[q,i]).filter(([q])=>q[3].every(w=>q[2].length>=w.length+5)).map(x=>x[1]);
console.log('  答案恰为最长选项：',longest,'/',KQ_DATA.length);
T('答案不靠长度就能猜（长出5字以上≤15题）',tooLong.length<=15,tooLong);
// 出处里的每个「书 p页」都在对应精讲 md 里出现过
const md=fs.readdirSync('content').filter(f=>/精讲/.test(f)).map(f=>fs.readFileSync('content/'+f,'utf8')).join('\n');
const miss=[];KQ_DATA.forEach((q,i)=>q[5].split('｜').forEach(seg=>{const m=seg.match(/^(初级|中级|家居|高级|第一课)\s*(.+)$/);if(!m){miss.push(i+':'+seg);return}
  const book=m[1];m[2].split(/[,，]/).forEach(p=>{p=p.trim().replace(/[–-].*$/,'');if(book==='第一课'){if(!md.includes('第一课 '+p))miss.push(i+':'+seg)}else{const n=p.replace(/^p/,'');if(!new RegExp(book+' p(?:[\\d,–-]*[,–-])?'+n+'(?!\\d)').test(md))miss.push(i+':'+book+' p'+n)}})}));
T('出处页码在精讲里都能找到',!miss.length,miss.slice(0,20).join(' '));
// 覆盖：精讲每一节（## X数字）至少有一道题的出处页码落在该节引用页上；G1 讲理气学习结构，按出题标准不出题
{const pages=t=>{const s=new Set();for(const m of t.matchAll(/(初级|中级|家居|高级|第一课)\s*((?:p?[\d]+(?:[–-]\d+)?[,，]?\s*)+|第\d+课)/g)){const b=m[1];if(b==='第一课'){s.add(b+m[2]);continue}m[2].replace(/p/g,'').split(/[,，\s]+/).filter(Boolean).forEach(x=>{const [a,c]=x.split(/[–-]/).map(Number);for(let n=a;n<=(c||a);n++)s.add(b+n)})}return s};
 const qp=KQ_DATA.filter((q,i)=>!KQ_OFF.has(i)).map(q=>[q[0],pages(q[5])]);const SKIP=['G1'];const none=[];
 fs.readdirSync('content').filter(f=>/精讲/.test(f)).forEach(f=>fs.readFileSync('content/'+f,'utf8').split(/\n(?=## [A-M]\d+)/).slice(1).forEach(s=>{const id=s.slice(3).split(/\s/)[0];const ps=pages(s);
   if(!SKIP.includes(id)&&!qp.some(([c,p])=>c===id[0]&&[...p].some(x=>ps.has(x))))none.push(id)}));
 T('精讲每节都有题',!none.length,none);}
// 页面冒烟
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('lianxi.html','utf8').replace('<script src="data/kq.js"></script>','<script>'+fs.readFileSync('data/kq.js','utf8')+'</script>')
  .replace('<script src="data/kq_sec.js"></script>','<script>'+fs.readFileSync('data/kq_sec.js','utf8')+'</script>');
// 对照表须是最新产物：题库或精讲改了没重跑 build_kq_links.js 就报
{const {KQ_SEC,KQ_SECQ}=require('./data/kq_sec.js');T('kq_sec.js 与题库同长（改题后要重跑 build_kq_links.js）',KQ_SEC.length===KQ_DATA.length);
 T('每题都归到精讲一节，且同章',KQ_SEC.every((s,i)=>s&&s[0][0]===KQ_DATA[i][0]));
 const imgs=[...new Set(KQ_SEC.flatMap(s=>(s[1]||[]).map(x=>x[0])))].filter(f=>!fs.existsSync('assets/lecimg/'+f));T('题下配图文件都在',!imgs.length,imgs.slice(0,5));
 T('除 G1 外每节都能「这节练一练」',Object.keys(require('./data/kq_sec.js').KQ_SECT).filter(k=>k!=='G1'&&!KQ_SECQ[k]).length===0);}
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://x/lianxi.html',beforeParse(w){w.scrollTo=()=>{}}});const w=dom.window,d=w.document;
T('首页题库数正确',d.getElementById('s-total').textContent==String(KQ_DATA.length-KQ_OFF.size));
T('13 个章节按钮',d.querySelectorAll('.ch').length===13);
d.querySelector('[data-mode=smart]').click();
let got=0;for(let k=0;k<10;k++){const o=d.querySelectorAll('.opt');if(o.length!==4)break;o[0].click();got++;
  const nb=d.getElementById('q-next');nb.disabled=false;nb.click()}
T('跑完一组 10 题进结果页',got===10&&d.getElementById('v-res').classList.contains('on'));
const st=JSON.parse(w.localStorage.getItem('guanshan_kq_v1'));T('作答记录已保存',Object.keys(st.q).length===10);
d.getElementById('r-home').click();T('没标记时不显示标记入口（CSS 不许盖掉 hidden）',/\.flagbar\[hidden\]\{display:none\}/.test(html));T('回首页显示已做 10',d.getElementById('s-done').textContent==='10');
// 全选 A 至少错几道：常混淆记下、弱项按钮可点
const s2=JSON.parse(w.localStorage.getItem('guanshan_kq_v1'));T('答错的记进常混淆',Object.keys(s2.cf).length===s2.w.length||Object.keys(s2.cf).length>0===s2.w.length>0);
T('每题记作答次数',Object.values(s2.q).every(r=>r.n===1));
// 节练：?sec 模式只出这一节的题；看原文链接、标记有问题
{const {KQ_SECQ}=require('./data/kq_sec.js');w.start('sec','B6');const set=new Set(KQ_SECQ.B6);
 const first=d.querySelectorAll('.opt');first[0].click();
 T('节练出的是本节题',set.size>0&&d.getElementById('q-tag').textContent.startsWith('B6'));
 const a=d.querySelector('.acts a');T('讲解下有「看原文」跳精讲',a&&/#lec=B\d+$/.test(a.getAttribute('href')));
 d.querySelector('.acts .flag').click();T('点「这题有问题」记下',Object.keys(JSON.parse(w.localStorage.getItem('guanshan_kq_v1')).f).length===1);}
// 造一段弱项与混淆记录，看首页与专练
{const S=JSON.parse(w.localStorage.getItem('guanshan_kq_v1'));const {KQ_SEC}=require('./data/kq_sec.js');
 const ids=KQ_DATA.map((q,i)=>i).filter(i=>!KQ_OFF.has(i)&&KQ_SEC[i][0]==='E6').slice(0,4);ids.forEach(i=>S.q[i]={b:0,d:0,t:1,n:2,c:0});
 S.cf={'x⇄y':{a:KQ_DATA[ids[0]][2],w:KQ_DATA[ids[0]][3][0],n:3,i:ids[0],t:1}};w.localStorage.setItem('guanshan_kq_v1',JSON.stringify(S));}
const dom2=new JSDOM(html,{runScripts:'dangerously',url:'http://x/lianxi.html',beforeParse(x){x.scrollTo=()=>{};x.localStorage.setItem('guanshan_kq_v1',w.localStorage.getItem('guanshan_kq_v1'))}});const d2=dom2.window.document;
T('弱项列出 E6',[...d2.querySelectorAll('#weak [data-sec]')].some(b=>b.dataset.sec==='E6'));
T('常混的几对显示',/混了 3 次/.test(d2.getElementById('pairs-box').textContent));
T('标记题入口显示',!d2.getElementById('flagbar').hidden);
d2.querySelector('[data-mode=mix]').click();T('常混淆专练能开',d2.querySelectorAll('.opt').length===4);
d2.getElementById('back').click();d2.querySelector('[data-mode=weak]').click();T('弱项专练能开',d2.querySelectorAll('.opt').length===4);
d2.getElementById('back').click();d2.getElementById('flagbar').click();T('标记清单页',d2.querySelectorAll('#flags [data-unflag]').length===1);
dom2.window.close();
// ?sec= 直达
{const d3=new JSDOM(html,{runScripts:'dangerously',url:'http://x/lianxi.html?sec=C19',beforeParse(x){x.scrollTo=()=>{}}}).window.document;T('?sec=C19 直接开练',d3.getElementById('v-quiz').classList.contains('on')&&d3.getElementById('q-tag').textContent.startsWith('C19'));}
w.close();
console.log(bad?'\n'+bad+' 项失败':'\n全部通过');process.exit(bad?1:0);
