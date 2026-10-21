// 知识点练习 → 体系精讲的对照表：每题落在哪一节、配哪几张教材图。产物 data/kq_sec.js，题库或精讲改了就重跑：node build_kq_links.js
// 归节口径与 tests_kq.js「精讲每节都有题」一致：出处页码和该节引用页有交集；同类里交集最多的那节胜，平手取靠前的。
const fs=require('fs'),vm=require('vm');
const {KQ_DATA,KQ_OFF}=require('./data/kq.js');
const ctx={};vm.runInNewContext(fs.readFileSync('data/lectures.js','utf8')+';this.L=LECTURES',ctx);const L=ctx.L;
const pages=t=>{const s=new Set();for(const m of String(t).matchAll(/(初级|中级|家居|高级|第一课)\s*((?:p?[\d]+(?:[–-]\d+)?[,，]?\s*)+|第\d+课)/g)){const b=m[1];if(b==='第一课'){s.add(b+m[2]);continue}m[2].replace(/p/g,'').split(/[,，\s]+/).filter(Boolean).forEach(x=>{const [a,c]=x.split(/[–-]/).map(Number);for(let n=a;n<=(c||a);n++)s.add(b+n)})}return s};
const secs={};
fs.readdirSync('content').filter(f=>/精讲/.test(f)).forEach(f=>fs.readFileSync('content/'+f,'utf8').split(/\n(?=## [A-M]\d+)/).slice(1).forEach(s=>{const id=s.slice(3).split(/\s/)[0];secs[id]=pages(s)}));
const items={};L.forEach(c=>c.items.forEach(it=>{if(it.n)items[it.n]=it}));
const SEC=KQ_DATA.map(q=>{const qp=pages(q[5]);let best=null,bn=0;
  for(const id in secs){if(id[0]!==q[0])continue;const n=[...qp].filter(x=>secs[id].has(x)).length;if(n>bn){bn=n;best=id}}
  if(!best)return null;const it=items[best];
  const imgs=it?it.blocks.filter(b=>b.t==='img'&&[...pages(b.src)].some(x=>qp.has(x))).slice(0,2).map(b=>[b.f,b.cap]):[];
  return imgs.length?[best,imgs]:[best]});
const T={};Object.keys(items).forEach(n=>T[n]=items[n].t);
// 这节练一练：凡出处页码与该节有交集的题都算（比主归节宽，否则 25 节一道都练不到）
const N={};KQ_DATA.forEach((q,i)=>{if(KQ_OFF.has(i))return;const qp=pages(q[5]);for(const id in secs)if(id[0]===q[0]&&[...qp].some(x=>secs[id].has(x)))(N[id]=N[id]||[]).push(i)});
fs.writeFileSync('data/kq_sec.js','/* 本文件由 build_kq_links.js 生成，勿手改。KQ_SEC[题号]=[精讲节号,[[图,图注]…]]；KQ_SECT=节号→标题；KQ_SECQ=节号→这节能练的在用题号（精讲页「这节练一练」用） */\nconst KQ_SEC='+JSON.stringify(SEC)+';\nconst KQ_SECT='+JSON.stringify(T)+';\nconst KQ_SECQ='+JSON.stringify(N)+';\nif(typeof module!=="undefined")module.exports={KQ_SEC,KQ_SECT,KQ_SECQ};\n');
const miss=SEC.map((s,i)=>s?null:i).filter(x=>x!==null);
console.log('无题可练的节',Object.keys(T).filter(k=>!N[k]).join(' ')||'无');console.log('题',SEC.length,'未归节',miss.length,miss.join(','),'带图',SEC.filter(s=>s&&s[1]).length);
