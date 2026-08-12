const IMAGE_SEEDS=[
 {stage:'基础识形',title:'山环水抱',type:'embrace',source:'初级 p6｜家居 p15,20',lec:'A2',cite:'藏风：左右两边一定要有山环抱，龙虎环抱，前面要有案山，这样才能藏风〔初级 p6〕',label:'中心环境形成围合',term:'山环水抱',evidence:'左右环护，前方水势回抱',wrong:'只因看见水就判断为吉',action:'站在中心确认风、水与开口方向',result:'具备藏风聚气的基础条件'},
 {stage:'基础识形',title:'四象定位',type:'four',source:'初级 p98｜家居 p168,169',lec:'D2',cite:'风水上是以穴位前后左右来论"左青龙、右白虎、前朱雀、后玄武"。不是按照东南西北来论，不是根据天象论〔初级 p98〕',label:'以住宅向外看的四方关系',term:'四象',evidence:'后玄武、前朱雀、左青龙、右白虎',wrong:'直接套地图固定东南西北',action:'先定坐向，再站在中心向外观察',result:'建立统一的前后左右观察视角'},
 {stage:'基础识形',title:'三层明堂',type:'hall',photo:'assets/photos/mingtang-levels.jpg',source:'家居 p170',lec:'D4',cite:'明堂：站到大门口、阳台上能看到的左边、前方和右边的山形和水，这叫明堂〔家居 p170〕',label:'门前空间由近及远展开',term:'内、中、外明堂',evidence:'近、中、远三层承接空间清楚',wrong:'认为空地越大就一定越好',action:'从门前开始逐层记录聚散与逼压',result:'判断明堂是否有层次、能承接'},
 {stage:'基础识形',title:'木星与火星',type:'peaks',source:'初级 p32,34,35,37,38,39',lec:'B11',cite:'土星山峰顶就是平的，两边慢慢下来，底也是平的，就是一个等腰梯形。我们风水上就叫巨门土星〔初级 p32〕',label:'比较高直与尖耸轮廓',term:'木星与火星',evidence:'木星高直，火星尖锐炎上',wrong:'按山体颜色或树种判断五行',action:'眯眼忽略纹理，先描最大外轮廓',result:'先辨主星，再判断秀丽与粗恶'},
 {stage:'基础识形',title:'方圆曲三形',type:'shapes',source:'初级 p26,27｜家居 p39｜第一课 第18课',lec:'B10',cite:'只掌握这三点还不行，在观察龙的行止、剥换、过狭的时候，有个最重要的内容，那就是要观察这个山的外形。这个在风水上是非常重要的。风水上有一句话叫"一流地师观星斗，二流地师关水口，三流地师拿着罗盘到处走"〔初级 p26〕',label:'比较方平、圆润和波曲',term:'土、金、水三星',evidence:'土方平、金圆润、水波曲',wrong:'把材质当成五星依据',action:'沿山脊线辨认主体轮廓',result:'从基本轮廓进入复合星体判断'},
 {stage:'基础识形',title:'龙脉过峡',type:'pass',photo:'assets/photos/five-stars-pass.jpg',source:'初级 p20,22',lec:'B6',cite:'一是要观察龙是否有护卫。从这个地形看（如下图），从这个父母山后面一节这里开始剥换，最低的地方叫过峡，在南方叫什么叫垭口。在北方叫山坳，我们专业术语就叫过狭，就是我们人束气的脖子一样〔初级 p20〕',label:'两段山势之间收窄再展开',term:'过峡',evidence:'前后连续、中央束气、左右护送',wrong:'见到两个山头间低处就认过峡',action:'沿山脊确认来去连续和护送',result:'识别龙势是否真正收束传递'},
 {stage:'城市实景',title:'秀砂与恶砂',type:'goodbad',source:'家居 p172,173,174,175,177,178,179,180,181,182,183,190,191,195,196,197,199',lec:'D12',cite:'城市风水察砂的第一个标准：要四砂秀丽，不要粗恶破败。四砂就是我们讲的青龙、白虎、朱雀、玄武〔家居 p171,172〕',label:'完整圆秀与尖碎破损对比',term:'砂体秀恶',evidence:'轮廓完整度、端正度与压迫感不同',wrong:'只凭高低或价格判断',action:'先用五个形容词客观描述形体',result:'完成形法第一层筛选'},
 {stage:'城市实景',title:'玉带与反弓',type:'water',source:'中级 p76,77,78,79,80,81,82,84,85,86,87,88',lec:'E6',cite:'穴前是弯弯曲曲很多次，之玄水和九曲水一个意思。……九曲水一般都是向上当堂出去，不是一条直路出去。它是出去两步又回头看一下再出去再回头看一下又出去。叫欲走还留。就是想走还舍不得走，象谈恋爱一样〔中级 p76〕',label:'同一弯曲水路的内外两侧',term:'玉带与反弓',evidence:'内弯环抱，外弯动势向外甩',wrong:'不看距离、高差和车流强度',action:'地图标内外弯，再到现场复核',result:'结合动势判断环抱或受冲'},
 {stage:'城市实景',title:'聚水与直泄',type:'flow',source:'家居 p216,219,220',lec:'E3',cite:'水聚明堂多财帛，我们风水上又讲"山管人丁水管财"。水非常重要，我们去哪里找地，我们都是看龙穴、龙砂就是看水。目的就是水聚明堂〔家居 p216〕',label:'曲缓停聚与笔直快速对比',term:'聚与泄',evidence:'是否减速、回旋、交汇并有关栏',wrong:'认为水越多就越好',action:'观察雨水、车流和人流在哪里减速',result:'判断明堂能否承接真实动势'},
 {stage:'城市实景',title:'龙虎关系',type:'dragonTiger',source:'家居 p171',lec:'D5',cite:'有情就是我们看到的这个山峰，它是端庄秀丽的，它是来护卫我们的，他不是来加害我们的。这个叫有情〔家居 p171〕',label:'左右两侧向中心顾护',term:'龙虎环抱',evidence:'两侧走势内顾、协调且不逼压',wrong:'死背青龙必须高于白虎',action:'从中心比较左右距离、高度和朝向',result:'判断左右是否真正护卫中心'},
 {stage:'综合判断',title:'靠山与逼压',type:'backing',source:'初级 p98',lec:'D3',cite:'房屋四周的砂的作用：藏风得水。如果房屋四周没有砂，就是空旷无收，风直来直去，没有护卫，孤零零的，不收堂气，不藏风聚气，就不是好风水〔初级 p98〕',label:'后方有承托但保留合适距离',term:'有靠',evidence:'稳定完整、尺度适中且不挡光',wrong:'后楼越高越近就越好',action:'同时检查采光、通风与消防间距',result:'区分稳定承托与贴身逼压'},
 {stage:'综合判断',title:'城市选宅层级',type:'city',source:'家居 p119,120,122,123,124,125,126',lec:'B13',cite:'龙有大小之分……后面是干龙，干龙开帐之后也是干龙，到房子后面这里就称为枝龙。那么在风水上，这种枝龙能够结穴的往往是结人家，结村庄〔家居 p119〕',label:'从片区逐步缩小到住宅内部',term:'先外后内',evidence:'片区、小区、楼栋、楼层、户型、室内',wrong:'只凭门向、楼层或摆件判断整体',action:'每一层先排除最明显的一项问题',result:'形成可复核的分层筛选结论'},
 {stage:'罗盘识读',title:'罗盘的构成',type:'compass',photo:'assets/photos/luopan-structure.jpg',source:'初级 p172,173',lec:'J2',cite:'中间白色部分叫天池。能转动的叫内盘，外面正方形部分叫外盘〔初级 p172〕',label:'天池定向、内盘承理气、外盘配天心十道读数',term:'天池、内盘、外盘与天心十道',evidence:'中央天池是指南针，外圈方盘配十字红线',wrong:'磁针没和海底红线重合就直接读数',action:'先转内盘让磁针与海底红线南北重合再读数',result:'确认读盘的方向基准正确'},
 {stage:'罗盘识读',title:'地盘二十四山',type:'mount24',source:'中级 p149,150,151,152,156',lec:'G3',cite:'阳：甲、乙、丙、丁、戊（1，2，3，4，5为阳，生数）　阴：己、庚、辛、壬、癸（6，7，8，9，10为阴，成数）〔中级 p149〕',label:'八卦、天干、地支合成二十四山，每山十五度',term:'地盘二十四山',evidence:'整盘三百六十度平分二十四份，每山十五度',wrong:'把二十四个字当孤立符号死背',action:'按后天八卦定位、四正配天干、余位装地支',result:'用二十四山读出坐山朝向'},
 {stage:'罗盘识读',title:'反复黄泉',type:'huangquan',source:'中级 p186,187,188,195',lec:'H3',cite:'庚丁坤上是黄泉，坤上庚丁切莫言。　乙丙须防巽水先，巽向忌行乙丙上，　甲癸向上休见艮，艮逢甲癸祸连连，　辛壬水路怕当乾，乾向辛壬祸亦然〔中级 p186〕',label:'特定坐向在黄泉方见水主凶，庚丁与坤互为黄泉',term:'天干八路黄泉',evidence:'坐向与来去水的忌讳组合，犯之易有意外',wrong:'一见黄泉就断大凶，忽略救贫黄泉',action:'测准坐向后对照黄泉方查有无来去水或道路',result:'排查坐向是否犯反复黄泉'}
];
const IMAGE_MODES=[
 ['辨形','这幅图首先在训练哪个概念？','term'],
 ['找证据','支持判断的关键视觉证据是什么？','evidence'],
 ['排误判','下面哪一种做法属于常见误判？','wrong'],
 ['现场动作','到现场后，下一步最有效的动作是什么？','action'],
 ['综合结论','在不脱离现实条件的前提下，可得出什么结论？','result']
];
const IMAGE_BANK=IMAGE_SEEDS.flatMap((s,si)=>IMAGE_MODES.map((m,mi)=>{
 const correct=s[m[2]];
 // 干扰项池：排除本题、去重、并剔除与正解同值者，确保三个选项互不相同
 const pool=[...new Set(IMAGE_SEEDS.filter((_,i)=>i!==si).map(x=>x[m[2]]).filter(v=>v!==correct))];
 const d1=pool[(si*2+mi)%pool.length];
 let d2=pool[(si*3+mi*2+4)%pool.length];
 if(d2===d1)d2=pool[(si*3+mi*2+5)%pool.length];
 const answers=[correct,d1,d2],shift=(si+mi)%3;
 return{id:si*5+mi+1,stage:s.stage,title:s.title,mode:m[0],question:m[1],type:s.type,photo:s.photo||'',source:s.source,lec:s.lec,why:`${correct}。${s.label}。<br><b>教材原话：</b>${s.cite}`,answers:[...answers.slice(shift),...answers.slice(0,shift)],correct:(3-shift)%3};
}));
