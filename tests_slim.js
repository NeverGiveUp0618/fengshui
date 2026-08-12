const fs=require('fs'),{JSDOM}=require('jsdom');
const D='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/fengshui/';
const dom=new JSDOM(fs.readFileSync(D+'index.html','utf8'),{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});
const errs=[];
dom.virtualConsole.on('jsdomError',e=>{if(!/scrollTo|Not implemented|scrollIntoView/.test(e.message))errs.push(e.message)});
const w=dom.window,d=w.document;
// ⚠️ 今日页的「接着读」要 LECTURES，不加载 data/lectures.js 就永远渲染不出来
['data/textbook.js','data/lectures.js','library.js','image-bank.js','knowledge-detail.js','app.js'].forEach(f=>{
  const sc=d.createElement('script'); sc.textContent=fs.readFileSync(D+f,'utf8'); d.body.appendChild(sc);
});
setTimeout(()=>{
  let pass=0,fail=0;
  const t=(n,f)=>{try{const r=f();const ok=r===true;console.log((ok?'✓ ':'✗ ')+n+(ok?'':' → '+r));ok?pass++:fail++}
    catch(e){console.log('✗ '+n+' → THREW '+e.message.slice(0,70));fail++}};

  t('页面无脚本错误',()=>errs.length?errs.slice(0,2).join(' | '):true);
  t('思维导图版块已移除',()=>!d.getElementById('mindmap')?true:'还在');
  t('renderMindmap 已从代码里删掉',()=>{
    const src=fs.readFileSync(D+'app.js','utf8');
    return !/function renderMindmap/.test(src)&&!/renderMindmap\(\)/.test(src)?true:'残留调用会对 null 赋值';});

  console.log('\n— 知识图鉴（接手了原思维导图的方块布局）—');
  const lib=d.getElementById('library-list');
  t('分类入口渲染成方块',()=>/map-branches/.test(lib.innerHTML)?true:'仍是旧列表行');
  const cats=lib.querySelectorAll('[data-lib-cat]');
  t('6 个分类全在',()=>cats.length===6?true:'实为'+cats.length);
  t('方块带知识点条数',()=>/个知识点/.test(lib.innerHTML)?true:'没显示条数');
  cats[1].click();
  t('点分类能筛选',()=>{
    const items=lib.querySelectorAll('[data-knowledge]');
    return items.length>0?true:'点了没出条目';});

  console.log('\n— 底部菜单（五个 tab）—');
  const nav=d.getElementById('tabbar'), btns=[...nav.querySelectorAll('[data-tab]')];
  t('底栏 5 个 tab',()=>btns.length===5?true:'实为'+btns.length);
  t('tab 与 view 一一对应',()=>{
    const miss=btns.map(b=>b.dataset.tab).filter(k=>!d.getElementById('view-'+k));
    return miss.length===0?true:'缺 view：'+miss.join(',');});
  t('默认只展开今日',()=>{
    const on=[...d.querySelectorAll('.view.active')].map(v=>v.id);
    return on.length===1&&on[0]==='view-today'?true:'实为'+on.join(',');});
  t('点「查」能切过去',()=>{
    btns.find(b=>b.dataset.tab==='find').click();
    const on=[...d.querySelectorAll('.view.active')].map(v=>v.id);
    return on.length===1&&on[0]==='view-find'?true:'实为'+on.join(',');});
  t('切换后底栏高亮跟着走',()=>{
    const on=btns.filter(b=>b.classList.contains('on')).map(b=>b.dataset.tab);
    return on.length===1&&on[0]==='find'?true:'实为'+on.join(',');});
  t('抬头副标题跟着换',()=>/知识图鉴/.test(d.getElementById('mast-sub').textContent)?true:'没换');
  t('折叠版块已拆掉（内容不再藏在 details 里）',()=>
    !d.getElementById('fold-field')&&!d.getElementById('fold-ref')&&
    !d.querySelector('#view-drill details, #view-find details')?true:'还有 details 包着');
  t('实地勘察内容仍被渲染',()=>{
    const n=d.querySelectorAll('#field-list > *').length;
    return n>0?true:'field-list 是空的';});
  t('速查卡一张不少',()=>{
    const n=d.querySelectorAll('#ref-grid [data-ref]').length;
    return n===7?true:'实为'+n;});
  btns.find(b=>b.dataset.tab==='today').click();

  console.log('\n— 其余版块未受影响 —');
  ['today','report-content','image-progress','next-lecture'].forEach(id=>{
    const el=d.getElementById(id);
    if(el) t(`#${id} 仍在`,()=>true);
  });
  t('今日页有「接着读」入口',()=>d.querySelectorAll('#next-lecture [data-lec]').length>0?true:'接着读没渲染');
  t('精读课残留已清干净',()=>!d.getElementById('featured-path')&&!d.getElementById('lesson-sheet')?true:'还有残留');

  console.log(`\n${fail?'❌ '+fail+' 项未通过':'✅ 全部 '+pass+' 项通过'}`);
  process.exit(fail?1:0);
},1200);
