import fs from 'node:fs';
import vm from 'node:vm';

const ctx = {};
vm.createContext(ctx);
vm.runInContext(`${fs.readFileSync(new URL('../library.js', import.meta.url), 'utf8')};this.items=LIBRARY`, ctx);
const items = ctx.items;
const requiredCategories = {
  基础入门: ['风水的定义','藏风与得水','形法与理气','四象定位'],
  龙砂水穴: ['观龙行止','龙的剥换','龙的过峡','五星山形','北斗九星','廖家九星','砂的定义','明堂层次','观水总纲','水口关栏','点穴步骤','二十四凶穴','立向形法原则'],
  罗盘立向: ['罗盘基本结构','二十四山','坐山朝向','骑线与兼向','三针四线','演海分金','二十八宿分金','卦爻分金','罗盘现场测量'],
  理气水法: ['八煞黄泉','二十四山劫煞','羊刃禄堂','反复黄泉','三元阴阳交媾','先后天水法','河图洛书四大局','纳甲水法','辅星水法','十二长生水法','三元不败与驳杂','八条歌总断'],
  城市家居: ['城市寻龙','城市察砂六标准','城市观水','城市点穴五要','室内峦头','罗盘现场测量','内六事布局','外六事布局','商业风水','选宅检查流程'],
  高级实务: ['论地与综合审局','高山龙结穴做法','平洋龙结穴做法','裁剪五法','阳宅案例复盘','阴宅案例复盘','九不葬']
};
const titles = new Set(items.map(x => x.title));
const missing = Object.entries(requiredCategories).flatMap(([cat,names]) => names.filter(name => !titles.has(name)).map(name => `${cat}/${name}`));
const duplicates = items.filter((x,i) => items.findIndex(y => y.title === x.title) !== i).map(x => x.title);
const invalid = items.filter(x => !x.cat || !x.title || x.summary.length < 18 || !x.source);
if (missing.length || duplicates.length || invalid.length) {
  console.error({missing,duplicates,invalid:invalid.map(x=>x.title)});
  process.exit(1);
}
console.log(JSON.stringify({total:items.length,categories:Object.fromEntries(Object.keys(requiredCategories).map(cat=>[cat,items.filter(x=>x.cat===cat).length])),required_topics:'complete',duplicates:0,invalid:0},null,2));
