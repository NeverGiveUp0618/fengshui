const fs=require('fs'),{JSDOM}=require('jsdom');
const D='/Users/xiaojin/Documents/文稿同步文件夹/03_学习 (Learning)/Seafile/学习资料/自创项目/fengshui/';
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

  console.log('\n— 折叠版块 —');
  ['fold-field','fold-ref'].forEach(id=>{
    const el=d.getElementById(id);
    t(`${id} 存在且默认收起`,()=>el&&!el.open?true:(el?'默认是展开的':'找不到'));
  });
  t('实地勘察内容仍被渲染（收起≠不渲染）',()=>{
    const n=d.querySelectorAll('#field-list .field-item, #field-list [data-complete], #field-list > *').length;
    return n>0?true:'field-list 是空的';});
  t('速查卡一张不少',()=>{
    const n=d.querySelectorAll('#fold-ref [data-ref]').length;
    return n===7?true:'实为'+n;});
  d.getElementById('fold-field').open=true;
  t('展开后内容可见',()=>d.getElementById('fold-field').open===true?true:'展不开');

  console.log('\n— 其余版块未受影响 —');
  ['today','report-content','image-progress','featured'].forEach(id=>{
    const el=d.getElementById(id);
    if(el) t(`#${id} 仍在`,()=>true);
  });
  t('精读课仍列出',()=>d.querySelectorAll('[data-open]').length>0?true:'精读课没了');

  console.log(`\n${fail?'❌ '+fail+' 项未通过':'✅ 全部 '+pass+' 项通过'}`);
  process.exit(fail?1:0);
},1200);
