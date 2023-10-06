/**
 * UNAecho开发备注：
 * 人物技能信息
 * name : 技能名称
 * type : 技能类型
 * owner : 得意技职业
 * target : 技能作用对象，用于烧技能等情况的判断。有以下几种数值：
 * 1、玩家：指技能作用对象仅为自己，比如明镜止水。
 * 2、己方：指技能作用对象为友方，如补血魔法。
 * 3、敌人：指技能作用对象为敌人，如乱射。
 * 4、其它：指技能作用对象为非战斗中使用的特殊类型，如生产系技能、服务系技能，或者战斗被动技能，如调教、暗杀等。
 * cost : 对应职业的得意技学习处
 * fieldCost : 技能所占栏位数量
 * npcMainMap : 导师所在主地图，用于路由。如果是【其它】则代表常规走路是无法抵达的，需要针对其写特殊抵达函数。
 * npcMap : 导师所在地图或房间，可能是string类型的地图名称，也可能是number类型的地图index。多数配合cga.travel.autopilot使用。
 * npcpos : 导师坐标，正常是一维int数组。如果为null，则代表需要特殊处理，如狩猎技能的猎人拉修是随机出现的
 * description : 职业描述
 * notes : 其他说明
 * remark : 自行备用
 */
const skillInfos = [
	{
		name : '暗黑骑士之力',
		type : '战斗防御技能',
		owner :  '暗黑骑士',
		target : '玩家',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 1000,
		npcpos : [196, 193],
		description : '用自己的身体掩护比自己弱的伙伴',
		notes : '持有远程武器时不可用。使用后护卫队友不会减少装备耐久并可触发自然反击',
		remark : '',
	},
	{
		name : '防御魔法攻击',
		type : '战斗防御技能',
		owner :  '',
		target : '玩家',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '治愈的广场',
		npcpos : [36, 6],
		description : '可减轻来自魔法的打击',
		notes : '使用后无法闪躲物理攻击',
		remark : '',
	},
	{
		name : '护卫',
		type : '战斗防御技能',
		owner :  '格斗士',
		target : '己方',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '公寓',
		npcpos : [24, 12],
		description : '当所选对手成为直接攻击的对象时，将代替他受伤',
		notes : '只可护卫近程攻击（含因果报应反弹的攻击）',
		remark : '',
	},
	{
		name : '骑士之誉',
		type : '战斗防御技能',
		owner :  '骑士',
		target : '己方',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '雪拉威森塔62楼',
		npcpos : [24, 12],
		description : '当所选对手成为直接攻击的对象时，将代替他受伤',
		notes : '只可护卫近程攻击（含因果报应反弹的攻击），使用后护卫队友不会减少装备耐久并可触发自然反击',
		remark : '',
	},
	{
		name : '圣盾',
		type : '战斗防御技能',
		owner :  '',
		target : '玩家',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '伊尔村',
		npcMap : '旧金山酒吧',
		npcpos : [23, 16],
		description : '能减轻受到来自物理和魔法的打击',
		notes : '只有在装备盾的时候可以使用',
		remark : '',
	},
	{
		name : '阳炎',
		type : '战斗防御技能',
		owner :  '忍者',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '客房',
		npcpos : [9, 3],
		description : '减少防御力以提升回避率',
		notes : '',
		remark : '',
	},
	{
		name : '暗杀',
		type : '战斗辅助技能',
		owner :  '忍者',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '乌克兰村',
		npcMap : '乌克兰村忍者之家三楼',
		npcpos : [, ],
		description : '使用普通攻击时，随机将目标一击击倒，无法对队友、邪魔系、BOSS战使用。仅忍者、士兵可以习得。',
		notes : '装备弓、回力镖、小刀时无法使用',
		remark : '',
	},
	{
		name : '捷舞',
		type : '战斗辅助技能',
		owner :  '舞者',
		target : '敌人',
		cost : 2000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '贵宾室',
		npcpos : [, ],
		description : '让释放对象增加防御力',
		notes : '与其他辅助舞蹈效果不可叠加',
		remark : '',
	},
	{
		name : '抗毒',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [11, 7],
		description : '对中毒状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '抗昏睡',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [11, 9],
		description : '对昏睡状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '抗混乱',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [14, 7],
		description : '对混乱状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '抗酒醉',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [11, 15],
		description : '对酒醉状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '抗石化',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [11, 13],
		description : '对石化状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '抗遗忘',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15010,
		npcpos : [16, 9],
		description : '对遗忘状态的抵抗增加并减少中咒后的回合数',
		notes : '',
		remark : '',
	},
	{
		name : '明镜止水',
		type : '战斗辅助技能',
		owner :  '',
		target : '玩家',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '改造僵尸牢房',
		npcpos : [, ],
		description : '回复自身生命力；技能与生命值上限越高，回复的生命值越高',
		notes : '',
		remark : '',
	},
	{
		name : '黏巴达舞',
		type : '战斗辅助技能',
		owner :  '舞者',
		target : '己方',
		cost : 2000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '贵宾室',
		npcpos : [, ],
		description : '让释放对象增加攻击力',
		notes : '与其他辅助舞蹈效果不可叠加',
		remark : '',
	},
	{
		name : '啪啦啪啦舞',
		type : '战斗辅助技能',
		owner :  '舞者',
		target : '己方',
		cost : 2000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '贵宾室',
		npcpos : [, ],
		description : '让释放对象增加敏捷',
		notes : '与其他辅助舞蹈效果不可叠加',
		remark : '',
	},
	{
		name : '骑乘',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '？？？',
		npcMap : '？？？',
		npcpos : [238, 206],
		description : '可骑乘宠物行走与战斗',
		notes : '装备宠物水晶必须与技能等级相同',
		remark : '',
	},
	{
		name : '跳舞',
		type : '战斗辅助技能',
		owner :  '舞者',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '波雷波雷号船舱',
		npcpos : [28, 21],
		description : '使双方都有50%概率受到技能影响；BOSS战不可用',
		notes : '',
		remark : '',
	},
	{
		name : '虚死为上',
		type : '战斗辅助技能',
		owner :  '',
		target : '其它',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '光之路',
		npcpos : [224, 79],
		description : '逃跑失败时随机发动装死脱离战斗',
		notes : '',
		remark : '',
	},
	{
		name : '羊头狗肉',
		type : '战斗辅助技能',
		owner :  '',
		target : '己方',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '雪拉威森塔43楼',
		npcpos : [133, 58],
		description : '复制队友生命与魔力值外的其他能力',
		notes : '不可复制装备能力',
		remark : '',
	},
	{
		name : '战栗袭心',
		type : '战斗辅助技能',
		owner :  '',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '民家',
		npcpos : [28, 48],
		description : '可以减少目标单位魔力值，等级越高减少比例越大',
		notes : '装备弓箭、回力标和小刀时不可使用',
		remark : '',
	},
	{
		name : '补血魔法',
		type : '战斗辅助魔法',
		owner :  '传教士',
		target : '己方',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 1208,
		npcpos : [14, 10],
		description : '这是可恢复单体生命力的技能',
		notes : '只能于战斗时使用',
		remark : '',
	},
	{
		name : '强力补血魔法',
		type : '战斗辅助魔法',
		owner :  '传教士',
		target : '己方',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 1208,
		npcpos : [19, 12],
		description : '这是可恢复对象及周边的人的生命力的技能',
		notes : '只能于战斗时使用',
		remark : '',
	},
	{
		name : '超强补血魔法',
		type : '战斗辅助魔法',
		owner :  '传教士',
		target : '己方',
		cost : 15000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '静谧之间',
		npcpos : [14, 4],
		description : '这是可恢复对象全体生命力的技能',
		notes : '只能于战斗时使用',
		remark : '',
	},
	{
		name : '恢复魔法',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '奇利村',
		npcMap : '冯奴的家',
		npcpos : [10, 4],
		description : '使用后，生命力可于每回合回复若干',
		notes : '',
		remark : '',
	},
	{
		name : '强力恢复魔法',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '静谧之间',
		npcpos : [, ],
		description : '使用后，对象及周边的人生命力于每次行动可回复若干',
		notes : '',
		remark : '',
	},
	{
		name : '超强恢复魔法',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 15000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '静谧之间',
		npcpos : [, ],
		description : '全体人员生命力于每次行动可回复若干',
		notes : '',
		remark : '',
	},
	{
		name : '洁净魔法',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '冯奴的家',
		npcpos : [7, 4],
		description : '回复对象异常状态',
		notes : '',
		remark : '',
	},
	{
		name : '攻击反弹',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '罗连斯研究塔最上层',
		npcpos : [, ],
		description : '将物理攻击所受到的打击反击回去',
		notes : '击倒法尔肯后才可学习；远程攻击不可反弹，但可使攻击无效化',
		remark : '',
	},
	{
		name : '攻击无效',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '击倒海贼头目后随机传送的房间内',
		npcpos : [, ],
		description : '受到物理攻击时，损伤将为0',
		notes : '',
		remark : '',
	},
	{
		name : '攻击吸收',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '击倒露比与巫师亚莉安娜对话后传送的房间',
		npcpos : [, ],
		description : '吸收来自物理攻击之打击，并用来补血',
		notes : '',
		remark : '',
	},
	{
		name : '魔法反弹',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '罗连斯研究塔最上层',
		npcpos : [, ],
		description : '将魔法攻击所受到的打击反击回去',
		notes : '击倒法尔肯后才可学习',
		remark : '',
	},
	{
		name : '魔法无效',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '击倒海贼头目后随机传送的房间内',
		npcpos : [, ],
		description : '受到魔法攻击时，损伤将为0',
		notes : '',
		remark : '',
	},
	{
		name : '魔法吸收',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '击倒露比与巫师冯其对话后传送的房间',
		npcpos : [, ],
		description : '吸收来自魔法攻击之打击，并用来补血',
		notes : '',
		remark : '',
	},
	{
		name : '气绝回复',
		type : '战斗辅助魔法',
		owner :  '传教士',
		target : '己方',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '亚留特村',
		npcMap : 2400,
		npcpos : [48, 72],
		description : '让昏迷不醒的对象单体复活',
		notes : '可回复战斗中队友的掉魂状态',
		remark : '',
	},
	{
		name : '神圣光芒',
		type : '战斗辅助魔法',
		owner :  '教团骑士',
		target : '己方',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '曙光骑士团营地',
		npcMap : '曙光营地指挥部',
		npcpos : [11, 8],
		description : '对自己或队友进行治疗',
		notes : '只有战斗中可以使用',
		remark : '',
	},
	{
		name : '神圣之力',
		type : '战斗辅助魔法',
		owner :  '教团骑士',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '曙光骑士团营地',
		npcMap : '曙光营地指挥部',
		npcpos : [8, 3],
		description : '使自己受到物理攻击时，损伤变为0',
		notes : '只有战斗中可以使用',
		remark : '',
	},
	{
		name : '洁净魔法-教团骑士',
		type : '战斗辅助魔法',
		owner :  '巫师',
		target : '己方',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '曙光骑士团营地',
		npcMap : '曙光营地指挥部',
		npcpos : [7, 4],
		description : '回复对象异常状态',
		notes : '教团骑士可学习洁净魔法，但并非得意技。',
		remark : '',
	},
	{
		name : '崩击',
		type : '战斗攻击技能',
		owner :  '格斗士',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '伊尔村',
		npcMap : '装备店',
		npcpos : [12, 4],
		description : '这招能给处于防御中的敌人很大的打击',
		notes : '装备弓、回力镖、小刀时无法使用',
		remark : '破防招数',
	},
	{
		name : '毒击',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '布拉基姆高地虫洞',
		npcpos : [, ],
		description : '附加中毒效果的攻击',
		notes : '参考任务《魔导士抄本》，装备剑、斧、枪和空手时无法使用',
		remark : '',
	},
	{
		name : '反击',
		type : '战斗攻击技能',
		owner :  '格斗士',
		target : '玩家',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '后台',
		npcpos : [39, 13],
		description : '受到物理攻击时可进行反击。',
		notes : '装备弓、回力镖、小刀时无法使用',
		remark : '',
	},
	{
		name : '混乱攻击',
		type : '战斗攻击技能',
		owner :  '格斗士',
		target : '敌人',
		cost : 4400,
		fieldCost : 1,
		npcMainMap : '奇利村',
		npcMap : 23603,
		npcpos : [20, 14],
		description : '在攻击时除了损伤敌方以外还追加状态异常的攻击',
		notes : '只有空手才能使用；限定格斗士、士兵学习',
		remark : '',
	},
	{
		name : '戒骄戒躁',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '布拉基姆高地',
		npcpos : [, ],
		description : '牺牲行动速度来换取攻击力和必杀机率上升的武技',
		notes : '装备杖、弓、投掷武器、小刀时不能使用此技',
		remark : '',
	},
	{
		name : '连击',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '冒险者旅馆',
		npcpos : [37, 7],
		description : '可同时进行两次以上的攻击、其中一次的打击力会比较低，每次的伤害总和约等于一次普通攻击的伤害。',
		notes : '装备弓、回力镖、小刀时无法使用',
		remark : '',
	},
	{
		name : '乱射',
		type : '战斗攻击技能',
		owner :  '弓箭手',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '加纳村',
		npcMap : '索奇亚',
		npcpos : [528, 327],
		description : '以超快速度给与复数敌人打击',
		notes : '只有装备弓才能使用；限定弓箭手、士兵学习',
		remark : '',
	},
	{
		name : '气功弹',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 1401,
		npcpos : [15, 56],
		description : '合掌集气，便可以无视前后列关系以气功弹对复数敌人进行攻击',
		notes : '只有没装武器时才能使用；所有职业伤害加成一致。',
		remark : '',
	},
	{
		name : '乾坤一掷',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '安其摩酒吧',
		npcpos : [11, 13],
		description : '这是牺牲命中率来使出必杀的一击之战斗系技能',
		notes : '装备回力镖、小刀时无法使用',
		remark : '',
	},
	{
		name : '吸血攻击',
		type : '战斗攻击技能',
		owner :  '暗黑骑士',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '主地图',
		npcpos : [193, 188],
		description : '攻击敌人时，给与对方的打击将有N%可回复自己的生命力',
		notes : '装备弓箭、回力镖、小刀时无法使用；吸收的生命值不超过攻击对象当前的生命值；道具服限定暗黑骑士学习；怀旧服限定骑士学习',
		remark : '',
	},
	{
		name : '迅速果断',
		type : '战斗攻击技能',
		owner :  '剑士',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '布拉基姆高地虫洞',
		npcpos : [232, 57],
		description : '牺牲下一回合行动，给予快速而强烈的攻击',
		notes : '装备弓箭、回力镖、小刀时不可使用',
		remark : '',
	},
	{
		name : '一击必中',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '？？？',
		npcpos : [319, 134],
		description : '牺牲行动速度来换取攻击力和必杀机率上升',
		notes : '可以使用的武器只有弓、小刀、回力镖',
		remark : '',
	},
	{
		name : '一石二鸟',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '布拉基姆高地',
		npcpos : [, ],
		description : '撞飞敌人的攻击',
		notes : '装备杖、弓箭、回力镖、小刀无法使用',
		remark : '《技能大师的宴会》',
	},
	{
		name : '因果报应',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '雪拉威森塔52层',
		npcpos : [109, 54],
		description : '使出浑身的力气投出回力镖，但其反作用力也伤到了自己',
		notes : '装备回力镖时才可用；反弹伤害不损耗装备耐久。反弹伤害可被护卫、骑士之誉、暗黑骑士之力及物理制御魔法抵挡',
		remark : '《大小宝箱》',
	},
	{
		name : '诸刃',
		type : '战斗攻击技能',
		owner :  '',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '冒险者旅馆',
		npcpos : [31, 23],
		description : '牺牲防御力和精神力来提升攻击力的战斗技能',
		notes : '装备回力镖、小刀时无法使用',
		remark : '',
	},
	{
		name : '陨石魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '魔女之家',
		npcpos : [22, 9],
		description : '呼唤陨石，攻击单体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '强力陨石魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '亚留特村',
		npcMap : '亚留特村',
		npcpos : [33, 65],
		description : '呼唤复数的陨石，攻击对手及周边的人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '超强陨石魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '加纳村',
		npcMap : '传承者之家',
		npcpos : [15, 7],
		description : '呼唤复数陨石，攻击全体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '冰冻魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '魔女之家',
		npcpos : [21, 8],
		description : '冻结水份，攻击单体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '强力冰冻魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '亚留特村',
		npcMap : '亚留特村',
		npcpos : [56, 53],
		description : '冻结水份攻击对手及周边的人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '超强冰冻魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '加纳村',
		npcMap : '传承者之家',
		npcpos : [13, 7],
		description : '冻结水份攻击全体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '火焰魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '魔女之家',
		npcpos : [22, 17],
		description : '以魔法之火攻击单体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '强力火焰魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '赛杰利亚酒吧',
		npcpos : [12, 4],
		description : '以魔法之火攻击对手及周边的人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '超强火焰魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '加纳村',
		npcMap : '传承者之家',
		npcpos : [16, 9],
		description : '以魔法之火攻击全体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '风刃魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '魔女之家',
		npcpos : [21, 14],
		description : '呼唤龙卷风攻击单体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '强力风刃魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '民家',
		npcpos : [8, 7],
		description : '呼唤龙卷风攻击对手及周边的人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '超强风刃魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '加纳村',
		npcMap : '传承者之家',
		npcpos : [16, 11],
		description : '呼唤龙卷风攻击全体敌人',
		notes : '魔法释放建议精神、魔攻见《魔法、精神、魔攻关系表》',
		remark : '',
	},
	{
		name : '吸血魔法',
		type : '属性攻击魔法',
		owner :  '魔术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '罗连斯研究塔·最上层',
		npcpos : [29, 8],
		description : '攻击敌人，并把给对方的打击的一半用来回复自己的生命力',
		notes : '吸血魔法伤害值取决于水晶属性',
		remark : '《没落的村庄》',
	},
	{
		name : '精神风暴',
		type : '属性攻击魔法',
		owner :  '',
		target : '敌人',
		cost : 6000,
		fieldCost : 1,
		npcMainMap : '艾尔莎岛',
		npcMap : '雪拉威森塔92层',
		npcpos : [66, 109],
		description : '对一横列给与物理打击的魔法',
		notes : '伤害受精神值与攻击目标数量影响，物理与魔法两种制御魔法对其皆有效',
		remark : '《解咒之药》',
	},
	{
		name : '中毒魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '圣拉鲁卡村',
		npcpos : [39, 40],
		description : '对敌方单体下毒',
		notes : '进入中毒状态，每次行动减少一定比例的生命。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力中毒魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [10, 13],
		description : '对敌方及周边的人下毒',
		notes : '进入中毒状态，每次行动减少一定比例的生命。技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强中毒魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '对敌方全体下毒',
		notes : '进入中毒状态，每次行动减少一定比例的生命。技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '混乱魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '科特利亚酒吧',
		npcpos : [, ],
		description : '混乱敌方单体',
		notes : '进入混乱状态，随机攻击任意目标、防御、换位或什么都不做。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力混乱魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [13, 11],
		description : '混乱敌方及周边的人',
		notes : '进入混乱状态，随机攻击任意目标、防御、换位或什么都不做。技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强混乱魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '混乱全体敌人',
		notes : '进入混乱状态，随机攻击任意目标、防御、换位或什么都不做。技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '遗忘魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '法兰城',
		npcpos : [167, 19],
		description : '让敌方单体忘掉技能',
		notes : '进入遗忘状态，随机遗忘技能栏内指令或技能。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力遗忘魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [15, 9],
		description : '让敌方及周边的人忘掉技能',
		notes : '进入遗忘状态，随机遗忘技能栏内指令或技能。技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强遗忘魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '让全体敌人忘掉技能',
		notes : '进入遗忘状态，随机遗忘技能栏内指令或技能。技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '酒醉魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '安其摩酒吧',
		npcpos : [, ],
		description : '灌醉敌方单体',
		notes : '进入酒醉状态，每次行动减少一定比例的魔力。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力酒醉魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [9, 10],
		description : '灌醉敌方及周边的人',
		notes : '进入酒醉状态，每次行动减少一定比例的魔力。技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强酒醉魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '灌醉全体敌人',
		notes : '进入酒醉状态，每次行动减少一定比例的魔力。技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '昏睡魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '公寓',
		npcpos : [, ],
		description : '让敌人睡着',
		notes : '进入昏睡状态无法行动，被攻击后技能效果失效。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力昏睡魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [11, 6],
		description : '对敌方及周边的人进行催眠',
		notes : '被攻击后会清醒；技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强昏睡魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '对敌方全体进行催眠',
		notes : '被攻击后会清醒；技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '石化魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '法兰城',
		npcpos : [120, 64],
		description : '石化敌方单体',
		notes : '进入石化状态不能行动，被攻击时受到伤害降低。技能等级影响行动数与成功率',
		remark : '',
	},
	{
		name : '强力石化魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 15009,
		npcpos : [12, 8],
		description : '石化敌方及周边的人',
		notes : '进入石化状态不能行动，被攻击时受到伤害降低。技能等级影响行动数与成功率',
		remark : '《就职咒术师》',
	},
	{
		name : '超强石化魔法',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '圣餐之间',
		npcpos : [, ],
		description : '石化全体敌人',
		notes : '进入石化状态不能行动，被攻击时受到伤害降低。技能等级影响行动数与成功率',
		remark : '《开启者》',
	},
	{
		name : '大地的祈祷',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '战胜海贼头目后随机传送到的房间内',
		npcpos : [, ],
		description : '使用后敌我双方拥有地属性者物理及魔法收到的伤害减少',
		notes : '使用后减少敌我双方拥有地属性者受到的伤害，最多减少35%，大地之怒、自爆技能和物理攻击必杀的部分造成的伤害无法减免',
		remark : '《海贼指挥部》',
	},
	{
		name : '海洋的祈祷',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '战胜海贼头目后随机传送到的房间内',
		npcpos : [, ],
		description : '使用后敌我双方拥有水属性者物理及魔法收到的伤害减少',
		notes : '使用后减少敌我双方拥有水属性者受到的伤害，最多减少35%，大地之怒、自爆技能和物理攻击必杀的部分造成的伤害无法减免',
		remark : '《海贼指挥部》',
	},
	{
		name : '火焰的祈祷',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '战胜海贼头目后随机传送到的房间内',
		npcpos : [, ],
		description : '使用后敌我双方拥有火属性者物理及魔法收到的伤害减少',
		notes : '使用后减少敌我双方拥有火属性者受到的伤害，最多减少35%，大地之怒、自爆技能和物理攻击必杀的部分造成的伤害无法减免',
		remark : '《海贼指挥部》',
	},
	{
		name : '云群的祈祷',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '战胜海贼头目后随机传送到的房间内',
		npcpos : [, ],
		description : '使用后敌我双方拥有风属性者物理及魔法收到的伤害减少',
		notes : '使用后减少敌我双方拥有风属性者受到的伤害，最多减少35%，大地之怒、自爆技能和物理攻击必杀的部分造成的伤害无法减免',
		remark : '《海贼指挥部》',
	},
	{
		name : '单体即死',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '玩家',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '封印之间',
		npcpos : [, ],
		description : '时道服技能。有一定几率能让目标即死。咒术师得意技，仅咒术师可学习和使用',
		notes : 'BOSS战不可用',
		remark : '《国王的秘密》',
	},
	{
		name : '属性反转',
		type : '状态变化魔法',
		owner :  '咒术师',
		target : '敌人',
		cost : 10000,
		fieldCost : 1,
		npcMainMap : '其它',
		npcMap : '战胜海贼头目后与头目对话',
		npcpos : [, ],
		description : '构成属性会反转',
		notes : '使指定目标属性反转（火←→地；风←→水）',
		remark : '《海贼指挥部》',
	},
	{
		name : '调教',
		type : '其他特殊技能',
		owner :  '驯兽师',
		target : '其它',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 1105,
		npcpos : [11, 5],
		description : '增加限定等级内宠物忠诚度的最大值。宠物技能发动时可减少耗魔。',
		notes : '最多使宠物等级（舍去小数）=调教等级*12.5，（80忠诚度）完全听话。',
		remark : '',
	},
	{
		name : '完美调教术',
		type : '其他特殊技能',
		owner :  '驯兽师',
		target : '其它',
		cost : 80000,
		fieldCost : 1,
		npcMainMap : '圣骑士营地',
		npcMap : 44694,
		npcpos : [41, 71],
		description : '无视宠物等级，忠诚度固定为100',
		notes : '不减少宠物技能耗魔，使用【转职保证书】的情况下转职为其他职业后依然有效。',
		remark : '',
	},
	{
		name : '宠物强化',
		type : '其他特殊技能',
		owner :  '饲养师',
		target : '其它',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '饲养师之家',
		npcpos : [, ],
		description : '能够提升宠物每次战斗后获得的经验比例',
		notes : '经验比例随技能等级提高而增加',
		remark : '',
	},
	{
		name : '变身',
		type : '其他特殊技能',
		owner :  '仙人',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '返回仙人的家的途中',
		npcMap : '返回仙人的家的途中',
		npcpos : [, ],
		description : '变身为其他可组队角色的宠物，若失败没变化或变成已登录图鉴的宠物或随机变成地上物品',
		notes : '100步内有效，人物等级与名称不会改变',
		remark : '',
	},
	{
		name : '变装',
		type : '其他特殊技能',
		owner :  '侦探',
		target : '其它',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '汉克的房间',
		npcMap : '汉克的房间',
		npcpos : [, ],
		description : '变身为其他组队角色外形，若失败会随机变成特定NPC造型',
		notes : '100步内有效，登出后效果消失',
		remark : '',
	},
	{
		name : '武器修理',
		type : '其他特殊技能',
		owner :  '武器修理工',
		target : '其它',
		cost : 100,
		fieldCost : 2,
		npcMainMap : '法兰城',
		npcMap : '小村正之洞窟',
		npcpos : [14, 12],
		description : '可以修理耐久下降的武器',
		notes : '修理武器成功率随技能等级、智力、灵巧提高而提升。Lv.5开始，每次升级，耐力+3，灵巧+3，智力-2。修理后耐久=(满耐久+现在所剩耐久)/2，而NPC修理后是(满耐久+现在所剩耐久)/3.',
		remark : '',
	},
	{
		name : '防具修理',
		type : '其他特殊技能',
		owner :  '防具修理工',
		target : '其它',
		cost : 100,
		fieldCost : 2,
		npcMainMap : '法兰城',
		npcMap : '小备前之洞窟',
		npcpos : [26, 4],
		description : '可以修理耐久下降的防具',
		notes : '修理防具成功率随技能等级、智力、灵巧提高而提升。Lv.5开始，每次升级，耐力+3，灵巧+3，智力-2。修理后耐久=(满耐久+现在所剩耐久)/2，而NPC修理后是(满耐久+现在所剩耐久)/3.',
		remark : '',
	},
	{
		name : '急救',
		type : '其他特殊技能',
		owner :  '护士',
		target : '其它',
		cost : 100,
		fieldCost : 2,
		npcMainMap : '法兰城',
		npcMap : 1111,
		npcpos : [12, 30],
		description : '非战斗时，可回复单一人物或宠物生命力',
		notes : '耐力、智力的增加，不影响成功率,只增加回复生命力数值。Lv.5开始，每次升级，耐力+3，灵巧-2，智力+3。专属【天使之饰】比【急救箱】效果好，二者同时佩戴时会被【急救箱】覆盖。',
		remark : '',
	},
	{
		name : '治疗',
		type : '其他特殊技能',
		owner :  '医师',
		target : '其它',
		cost : 100,
		fieldCost : 2,
		npcMainMap : '法兰城',
		npcMap : 1111,
		npcpos : [10, 5],
		description : '可以治疗受伤状态',
		notes : '治疗成功率随技能等级提高而提升，医生比非医生成功率高。Lv.5开始，每次升级，耐力+1，灵巧-2，智力+5。',
		remark : '',
	},
	{
		name : '鉴定',
		type : '其他特殊技能',
		owner :  '鉴定士',
		target : '其它',
		cost : 100,
		fieldCost : 2,
		npcMainMap : '法兰城',
		npcMap : '凯蒂夫人的店',
		npcpos : [, ],
		description : '可以鉴定不明的物品',
		notes : '鉴定几率随技能等级、智力、灵巧提高而提升，Lv.5开始，每次升级，耐力-2，灵巧+1，智力+5。',
		remark : '',
	},
	{
		name : '精灵的盟约',
		type : '其他特殊技能',
		owner :  '封印师',
		target : '敌人',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '客房',
		npcpos : [, ],
		description : '能够提高封印野生宠物的成功率',
		notes : '非封印师职业封印1级宠物，成功率上限4%（封顶）',
		remark : '',
	},
	{
		name : '窃盗',
		type : '其他特殊技能',
		owner :  '盗贼',
		target : '敌人',
		cost : 5000,
		fieldCost : 1,
		npcMainMap : '哥拉尔',
		npcMap : '头目的房间',
		npcpos : [, ],
		description : '可从魔物身上偷到特殊物品',
		notes : '参考《就职盗贼》任务；不可对队友使用，PK时不可使用',
		remark : '',
	},
	{
		name : '狩猎',
		type : '生产制作技能',
		owner :  '猎人',
		target : '其它',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : 100,
		npcpos : null,// 随机
		description : '可由怪兽身上得到皮肉',
		notes : '随着技能等级的提高可以狩猎到各种不同的食材',
		remark : '',
	},
	{
		name : '伐木',
		type : '生产制作技能',
		owner :  '樵夫',
		target : '其它',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '山男的家',
		npcpos : [10, 7],
		description : '可以得到木材',
		notes : '随著技能等级的提高可以砍伐到各种不同的花木',
		remark : '',
	},
	{
		name : '挖掘',
		type : '生产制作技能',
		owner :  '矿工',
		target : '其它',
		cost : 100,
		fieldCost : 1,
		npcMainMap : '法兰城',
		npcMap : '基尔的家',
		npcpos : [9, 2],
		description : '可在矿坑中挖矿',
		notes : '随著技能等级的提高可以挖掘到各种不同的矿物',
		remark : '',
	},
	{
		name : '狩猎体验',
		type : '生产制作技能',
		owner :  '其它',
		target : '其它',
		cost : 0,
		fieldCost : 3,
		npcMainMap : '伊尔村',
		npcMap : 2000,
		npcpos : [48, 76],
		description : '只能狩猎到鹿皮和传说中的鹿皮',
		notes : '只能狩猎到鹿皮和传说中的鹿皮',
		remark : '',
	},
	{
		name : '伐木体验',
		type : '生产制作技能',
		owner :  '其它',
		target : '其它',
		cost : 0,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : '职业介绍所',
		npcpos : [8, 11],
		description : '只能砍伐到竹子和孟宗竹',
		notes : '只能砍伐到竹子和孟宗竹',
		remark : '',
	},
	{
		name : '挖掘体验',
		type : '生产制作技能',
		owner :  '其它',
		target : '其它',
		cost : 0,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '赛杰利亚酒吧',
		npcpos : [16, 10],
		description : '只能挖到铜和碎石头',
		notes : '只能挖到铜和碎石头',
		remark : '',
	},
	{
		name : '锻造体验',
		type : '生产制作技能',
		owner :  '其它',
		target : '其它',
		cost : 0,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : '职业介绍所',
		npcpos : [9, 5],
		description : '制造最基本的武器与防具来取得制造工就职的资格',
		notes : '制造最基本的武器与防具来取得制造工就职的资格',
		remark : '',
	},
	{
		name : '料理',
		type : '生产制作技能',
		owner :  '厨师',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : 1502,
		npcpos : [12, 6],
		description : '调和食物作料理',
		notes : '随着技能等级的提高可以制作回复更高魔力的料理。灵巧、智力的提升可以增加制造多一个的几率。Lv.5开始，每次升级，耐力-2，灵巧+3，智力+3。',
		remark : '生产技能所获经验对照表:https://www.molibaike.com/Article/Detail/04cbdee4-ca04-4715-863d-ca469b0622b4',
	},
	{
		name : '制药',
		type : '生产制作技能',
		owner :  '药剂师',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : 1111,
		npcpos : [12, 5],
		description : '将香草等物品调和成药物',
		notes : '随着技能等级的提高可以制作回复更高生命力的药水。灵巧、智力的提升可以增加制造双份的几率。Lv.5开始，每次升级，耐力-2，灵巧+2，智力+4。',
		remark : '生产技能所获经验对照表:https://www.molibaike.com/Article/Detail/04cbdee4-ca04-4715-863d-ca469b0622b4',
	},
	{
		name : '造盾',
		type : '生产制作技能',
		owner :  '造盾工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [30, 31],
		description : '用矿石来造盾',
		notes : '随着技能等级的提高可以制作更高等级的盾',
		remark : '',
	},
	{
		name : '造斧',
		type : '生产制作技能',
		owner :  '造斧工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [24, 32],
		description : '可用矿石作出斧头来',
		notes : '随着技能等级的提高可以制作更高等级的斧',
		remark : '',
	},
	{
		name : '造弓',
		type : '生产制作技能',
		owner :  '造弓工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [24, 15],
		description : '可用木材作出弓来',
		notes : '随着技能等级的提高可以制作更高等级的弓',
		remark : '',
	},
	{
		name : '造铠',
		type : '生产制作技能',
		owner :  '铠甲工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : '小备前之洞窟',
		npcpos : [7, 7],
		description : '可用矿石作出铠来',
		notes : '随着技能等级的提高可以制作更高等级的铠甲',
		remark : '',
	},
	{
		name : '造枪',
		type : '生产制作技能',
		owner :  '造枪工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [39, 34],
		description : '可用矿石作出枪来',
		notes : '随着技能等级的提高可以制作更高等级的枪',
		remark : '',
	},
	{
		name : '造头盔',
		type : '生产制作技能',
		owner :  '头盔工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [15, 27],
		description : '可用矿石作出头盔来',
		notes : '随着技能等级的提高可以制作更高等级的头盔',
		remark : '',
	},
	{
		name : '造投掷武器',
		type : '生产制作技能',
		owner :  '投掷武器工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [31, 17],
		description : '可用木材作出回力镖来',
		notes : '随着技能等级的提高可以制作更高等级的投掷武器',
		remark : '',
	},
	{
		name : '造小刀',
		type : '生产制作技能',
		owner :  '小刀工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [31, 36],
		description : '可用矿石作出小刀来',
		notes : '随着技能等级的提高可以制作更高等级的小刀',
		remark : '',
	},
	{
		name : '造杖',
		type : '生产制作技能',
		owner :  '造杖工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [37, 20],
		description : '可用木材作出杖来',
		notes : '随着技能等级的提高可以制作更高等级的杖',
		remark : '',
	},
	{
		name : '制长袍',
		type : '生产制作技能',
		owner :  '长袍工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [12, 18],
		description : '可用布作出长袍来',
		notes : '随着技能等级的提高可以制作更高等级的长袍',
		remark : '',
	},
	{
		name : '制长靴',
		type : '生产制作技能',
		owner :  '制靴工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [19, 30],
		description : '可用皮作出靴子来',
		notes : '随着技能等级的提高可以制作更高等级的靴',
		remark : '',
	},
	{
		name : '制帽子',
		type : '生产制作技能',
		owner :  '帽子工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [11, 25],
		description : '可用布作出帽子来',
		notes : '随着技能等级的提高可以制作更高等级的帽子',
		remark : '',
	},
	{
		name : '制鞋',
		type : '生产制作技能',
		owner :  '制鞋工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [23, 24],
		description : '可用皮作出鞋子来',
		notes : '随着技能等级的提高可以制作更高等级的鞋',
		remark : '',
	},
	{
		name : '制衣服',
		type : '生产制作技能',
		owner :  '裁缝工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '圣拉鲁卡村',
		npcMap : '地下工房',
		npcpos : [13, 18],
		description : '可用布作出衣服来',
		notes : '随着技能等级的提高可以制作更高等级的衣服',
		remark : '',
	},
	{
		name : '铸剑',
		type : '生产制作技能',
		owner :  '铸剑工',
		target : '其它',
		cost : 100,
		fieldCost : 3,
		npcMainMap : '法兰城',
		npcMap : '小村正之洞窟',
		npcpos : [15, 6],
		description : '可用矿石作出剑来',
		notes : '随着技能等级的提高可以制作更高等级的剑',
		remark : '小村正之洞窟在芙蕾雅岛地图上标注的名称为科目拉萨洞窟',
	},
];

module.exports.skillInfos = skillInfos

/**
 * 输入技能名称，返回技能对象
 * @param {string} skillname 技能全称，如：气功弹
 * @returns obj
 */
 module.exports.getSkillObj = function(skillname) {
	var result = null
	if(!skillname){
		throw new Error('错误，请输入技能全称，如：气功弹')
	}else{
		result = skillInfos.find((s) => {
			if(s.name == skillname){
				return true
			}
			return false
		});
	}
	
	if(!result){
		throw new Error('错误,请检查输入技能全称是否有误,例如[超强冰冻魔法]输入成了[超强冰冻]')
	}

	return result
};