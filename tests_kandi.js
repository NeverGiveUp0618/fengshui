// 勘地本测试：理气引擎按教材原例断言 + 页面 jsdom 冒烟。跑法：NODE_PATH=<八字象义/node_modules> node tests_kandi.js
const K=require("./data/kandi.js");let bad=0;
function t(name,p,want){const h=K.kdCheck(p).map(x=>x.name);const ok=h.includes(want);if(!ok){bad++;console.log('FAIL',name,h)}else console.log('ok',name)}
function n(name,p,nowant){const h=K.kdCheck(p).map(x=>x.name);if(h.includes(nowant)){bad++;console.log('FAIL(not)',name,h)}else console.log('ok',name)}
// 教材原例
t('乾山巽向卯水=劫煞 中p248',{zuo:'乾',lai:[{d:'卯'}]},'二十四山劫煞');
t('子山午向巳方喷泉=劫煞 中p200',{zuo:'子',dong:[{d:'巳',type:'喷泉'}]},'二十四山劫煞');
t('子山午向楼 卫生间巳=劫煞 家p426',{zuo:'子',dong:[{d:'巳'}]},'二十四山劫煞');
t('庚山甲向卯水=隔壁口 初p165',{zuo:'庚',lai:[{d:'卯'}]},'羊刃禄堂（隔壁口）');
t('未山丑向艮水=隔壁口 中p200',{zuo:'未',lai:[{d:'艮'}]},'羊刃禄堂（隔壁口）');
t('未山丑向癸去水=隔壁口',{zuo:'未',qu:[{d:'癸'}]},'羊刃禄堂（隔壁口）');
t('巳山亥向走壬水=隔壁口 中p201',{zuo:'巳',qu:[{d:'壬'}]},'羊刃禄堂（隔壁口）');
t('子山午向辰水=八煞 中p196',{zuo:'子',lai:[{d:'辰'}]},'坐山八煞');
t('巽山乾向酉方=八煞(用水代门) 中p202',{zuo:'巽',lai:[{d:'酉'}]},'坐山八煞');
t('酉山卯向坤龙=龙上八煞 中p195',{zuo:'酉',long:'坤'},'龙上八煞');
t('坤山艮向寅水=向上八煞',{zuo:'坤',lai:[{d:'寅'}]},'向上八煞');
t('曾氏总祠申龙辛山乙向走寅水=串珠 中p210',{zuo:'辛',long:'申',qu:[{d:'寅'}]},'串珠理（城门诀）');
t('甲山庚向辛峰=河图 中p223',{zuo:'甲',feng:[{d:'辛'}]},'河图四大局');
t('甲山庚向丑峰=贵人 中p257',{zuo:'甲',feng:[{d:'丑'}]},'贵人峰');
t('子山午向乙峰=贵人 中p257',{zuo:'子',feng:[{d:'乙'}]},'贵人峰');
if(bad)process.exit(1);
const {JSDOM}=require('jsdom');const fs=require('fs');
const root=__dirname;
const html=fs.readFileSync(root+'/kandi.html','utf8').replace('<script src="data/kandi.js"></script>','<script>'+fs.readFileSync(root+'/data/kandi.js','utf8')+'</script>');
const d=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/'});const w=d.window,doc=w.document;
w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
const q=s=>doc.querySelector(s);let bad2=0;const ok=(c,m)=>{console.log(c?'ok':'FAIL',m);if(!c)bad2++};
ok(doc.querySelectorAll('.q').length===w.eval('KD_CHECK.length'),'清单全部渲染 '+doc.querySelectorAll('.q').length);
ok(doc.querySelectorAll('#steps-list .step').length===13,'13步');
q('.q .qt').click();ok(q('.q').classList.contains('open'),'点开答案');
q('.q [data-set="2"]').click();ok(q('#n2').textContent==='1','标记会');
ok(JSON.parse(w.localStorage.getItem('guanshan_kd_check')).A0===2,'写盘');
q('#demo-case').click();ok(q('#auto')&&q('#auto').textContent.includes('串珠'),'示范案例第9步出串珠');
// 新案例走一遍
q('#case-back').click();q('#new-case').click();
w.eval('curStep=8;renderEditor()');
const z=q('select[data-k="zuo"]');z.value='乾';z.dispatchEvent(new w.Event('input',{bubbles:true}));
ok(q('#xiang').textContent==='乾山巽向','向自动算');
q('[data-add="lai"]').click();const s=q('select[data-list="lai"]');s.value='卯';s.dispatchEvent(new w.Event('input',{bubbles:true}));
w.eval('curStep=9;renderEditor()');ok(q('#auto').textContent.includes('劫煞'),'乾山巽向卯水→劫煞');
const tg=doc.querySelector('[data-tag]');
w.eval('curStep=2;renderEditor()');const c=doc.querySelector('input[data-tag="guoxia"]');c.checked=true;c.dispatchEvent(new w.Event('input',{bubbles:true}));
ok(w.eval('cur.p.guoxia[0]')==='有护卫','标签勾选');
const saved=JSON.parse(w.localStorage.getItem('guanshan_kd_cases'));ok(saved.length===2&&saved[0].p.zuo==='乾','案例持久化');
n('酉山卯向巽水不报劫煞',{zuo:'酉',lai:[{d:'巽'}]},'二十四山劫煞');process.exit(bad||bad2?1:0)
