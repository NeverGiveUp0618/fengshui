const IMAGE_SEEDS=[
 {stage:'基础识形',title:'山环水抱',type:'embrace',source:'《风水第一课》藏风得水',label:'中心环境形成围合',term:'山环水抱',evidence:'左右环护，前方水势回抱',wrong:'只因看见水就判断为吉',action:'站在中心确认风、水与开口方向',result:'具备藏风聚气的基础条件'},
 {stage:'基础识形',title:'四象定位',type:'four',source:'《杨公风水初级合集》察砂',label:'以住宅向外看的四方关系',term:'四象',evidence:'后玄武、前朱雀、左青龙、右白虎',wrong:'直接套地图固定东南西北',action:'先定坐向，再站在中心向外观察',result:'建立统一的前后左右观察视角'},
 {stage:'基础识形',title:'三层明堂',type:'hall',photo:'assets/photos/mingtang-levels.jpg',source:'《家居风水高级课程合集》明堂图例',label:'门前空间由近及远展开',term:'内、中、外明堂',evidence:'近、中、远三层承接空间清楚',wrong:'认为空地越大就一定越好',action:'从门前开始逐层记录聚散与逼压',result:'判断明堂是否有层次、能承接'},
 {stage:'基础识形',title:'木星与火星',type:'peaks',source:'《杨公风水初级合集》地理五星',label:'比较高直与尖耸轮廓',term:'木星与火星',evidence:'木星高直，火星尖锐炎上',wrong:'按山体颜色或树种判断五行',action:'眯眼忽略纹理，先描最大外轮廓',result:'先辨主星，再判断秀丽与粗恶'},
 {stage:'基础识形',title:'方圆曲三形',type:'shapes',source:'《杨公风水初级合集》地理五星',label:'比较方平、圆润和波曲',term:'土、金、水三星',evidence:'土方平、金圆润、水波曲',wrong:'把材质当成五星依据',action:'沿山脊线辨认主体轮廓',result:'从基本轮廓进入复合星体判断'},
 {stage:'基础识形',title:'龙脉过峡',type:'pass',photo:'assets/photos/five-stars-pass.jpg',source:'《杨公风水初级合集》龙的过峡',label:'两段山势之间收窄再展开',term:'过峡',evidence:'前后连续、中央束气、左右护送',wrong:'见到两个山头间低处就认过峡',action:'沿山脊确认来去连续和护送',result:'识别龙势是否真正收束传递'},
 {stage:'城市实景',title:'秀砂与恶砂',type:'goodbad',source:'《家居风水高级课程合集》察砂',label:'完整圆秀与尖碎破损对比',term:'砂体秀恶',evidence:'轮廓完整度、端正度与压迫感不同',wrong:'只凭高低或价格判断',action:'先用五个形容词客观描述形体',result:'完成形法第一层筛选'},
 {stage:'城市实景',title:'玉带与反弓',type:'water',source:'《风水第一课》观水',label:'同一弯曲水路的内外两侧',term:'玉带与反弓',evidence:'内弯环抱，外弯动势向外甩',wrong:'不看距离、高差和车流强度',action:'地图标内外弯，再到现场复核',result:'结合动势判断环抱或受冲'},
 {stage:'城市实景',title:'聚水与直泄',type:'flow',source:'《家居风水高级课程合集》城市观水',label:'曲缓停聚与笔直快速对比',term:'聚与泄',evidence:'是否减速、回旋、交汇并有关栏',wrong:'认为水越多就越好',action:'观察雨水、车流和人流在哪里减速',result:'判断明堂能否承接真实动势'},
 {stage:'城市实景',title:'龙虎关系',type:'dragonTiger',source:'《杨公风水初级合集》察砂',label:'左右两侧向中心顾护',term:'龙虎环抱',evidence:'两侧走势内顾、协调且不逼压',wrong:'死背青龙必须高于白虎',action:'从中心比较左右距离、高度和朝向',result:'判断左右是否真正护卫中心'},
 {stage:'综合判断',title:'靠山与逼压',type:'backing',source:'《家居风水高级课程合集》城市点穴',label:'后方有承托但保留合适距离',term:'有靠',evidence:'稳定完整、尺度适中且不挡光',wrong:'后楼越高越近就越好',action:'同时检查采光、通风与消防间距',result:'区分稳定承托与贴身逼压'},
 {stage:'综合判断',title:'城市选宅层级',type:'city',source:'《家居风水高级课程合集》城市寻龙',label:'从片区逐步缩小到住宅内部',term:'先外后内',evidence:'片区、小区、楼栋、楼层、户型、室内',wrong:'只凭门向、楼层或摆件判断整体',action:'每一层先排除最明显的一项问题',result:'形成可复核的分层筛选结论'}
];
const IMAGE_MODES=[
 ['辨形','这幅图首先在训练哪个概念？','term'],
 ['找证据','支持判断的关键视觉证据是什么？','evidence'],
 ['排误判','下面哪一种做法属于常见误判？','wrong'],
 ['现场动作','到现场后，下一步最有效的动作是什么？','action'],
 ['综合结论','在不脱离现实条件的前提下，可得出什么结论？','result']
];
const IMAGE_BANK=IMAGE_SEEDS.flatMap((s,si)=>IMAGE_MODES.map((m,mi)=>{
 const correct=s[m[2]],pool=IMAGE_SEEDS.filter((_,i)=>i!==si).map(x=>x[m[2]]),d1=pool[(si+mi*2)%pool.length],d2=pool[(si+mi*3+4)%pool.length],answers=[correct,d1,d2],shift=(si+mi)%3;
 return{id:si*5+mi+1,stage:s.stage,title:s.title,mode:m[0],question:m[1],type:s.type,photo:s.photo||'',source:s.source,why:`${correct}。${s.label}；判断时仍需结合距离、尺度与现场条件。`,answers:[...answers.slice(shift),...answers.slice(0,shift)],correct:(3-shift)%3};
}));
