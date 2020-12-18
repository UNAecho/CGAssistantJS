// 注意:tutorwalk是一个list,一般从顺序是从tutorlocation所到达的大地图开始,一直走到导师面前的坐标.
// teacherlist同理，是学技能的walklist

// CE:里谢里雅堡东门出口，ESWN，东南西北。
var CE = [65, 53, '法兰城']
var CS = [41, 98, '法兰城']
var CW = [17, 53, '法兰城']
var CN = [41, 14, '法兰城']

// tutorpos : 就职、转职、晋阶导师的具体坐标,用来进行脚本的turnto对话
// teacherpos : 对应职业的得意技学习处

const Professions = [
	{
		jobmainname: '暗黑骑士',
		skill:'',
		titles: ['见习暗黑骑士', '暗黑骑士', '高阶暗黑骑士', '暗黑领主', '暗黑之魂', '漆黑之影'],
		category: '物理系',
		tutorlocation: '法兰城',
		tutorwalk:[
			CE,
			[194, 191],
			],
		tutorpos : [195, 191],
		teacherwalk:[
			CE,
			[195, 193],
			],
		teacherpos : [196 ,193],
	}, {
		jobmainname: '盗贼',
		skill:'',
		titles: ['见习盗贼', '盗贼', '小偷', '欺诈师', '偷窃高手', '盗贼头目'],
		category: '物理系',
		tutorlocation: '哥拉尔镇',
		tutorwalk:[
			[13, 9],
			],
		tutorpos : [13, 8],
		teacherwalk:[
			[15, 10],
			],
		teacherpos : [16 ,10],
	}, {
		jobmainname: '格斗士',
		skill:'混乱攻击',
		titles: ['见习格斗士', '格斗士', '格斗专家', '格斗家师范', '格斗王', '斗圣'],
		category: '物理系',
        tutorlocation: '奇利村',
		tutorwalk:[
			[7, 6, 3214],
			[7, 1, 3212],
			[1, 8, '奇利村'],
			[79, 76, '索奇亚'],
			[356, 334, '角笛大风穴'],
			[133, 26, '索奇亚'],
			[380, 324, '大厅'],
			[22, 23],
			],
		tutorpos : [20, 16],
		teacherwalk:[
			[7, 6, 3214],
			[7, 6, '村长的家'],
			[1, 8, '奇利村'],
			[79, 76, '索奇亚'],
			[356, 334, '角笛大风穴'],
			[133, 26, '索奇亚'],
			[380, 324, '大厅'],
			[22, 23],
			],
		teacherpos : [20 ,14],
	}, {
		jobmainname: '弓箭手',
		skill:'乱射',
		titles: ['见习弓箭手', '弓箭手', '王宫弓箭手', '弓术师范', '弓术大师', '神射手'],
		category: '物理系',
        tutorlocation: '法兰城',
		tutorwalk:[
			CS,
			[190, 133, '弓箭手公会'],
			[7, 5]
			],
		tutorpos : [6, 4],
		teacherwalk:[
			[153, 100, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		teacherpos : [8 ,4],
	}, {
		jobmainname: '教团骑士',
		skill:'',
		titles: ['见习教团骑士', '教团骑士', '高阶教团骑士', '圣骑士', '光明骑士', '仲裁者'],
		category: '物理系',
        tutorlocation: '曙光骑士团营地',
	}, {
		jobmainname: '骑士',
		skill:'护卫',
		titles: ['见习骑士', '骑士', '王宫骑士', '近卫骑士', '枪术大师', '枪圣'],
		category: '物理系',
        tutorlocation: '法兰城',
		tutorwalk:[
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[67, 71, '客房'],
			[10, 4]
			],
		tutorpos : [11, 4],
        teacherlocation: '法兰城',
		teacherwalk:[
			CS,
			[182, 132, '公寓'],
			[32, 71, '客房'],
			[23, 12]
			],
		teacherpos : [24 ,12],
	}, {
		jobmainname: '忍者',
		skill:'暗杀',
		titles: ['初级忍者', '中级忍者', '上级忍者', '影', '忍术大师', '鬼'],
		category: '物理系',
        tutorlocation: '法兰城'
	}, {
		jobmainname: '士兵',
		skill:'',
		titles: ['见习士兵', '士兵', '王宫士兵', '士兵长', '重战士', '指挥官'],
		category: '物理系',
        tutorlocation: '法兰城'
	}, {
		jobmainname: '舞者',
		skill:'',
		titles: ['见习舞者', '串场艺人', '舞者', '超级巨星', '天王巨星', '舞圣'],
		category: '物理系',
        tutorlocation: '法兰城'
	}, {
		jobmainname: '战斧斗士',
		skill:'',
		titles: ['见习战斧斗士', '战斧斗士', '王宫战斧斗士', '战斧师范', '战斧大师', '斧圣'],
		category: '物理系',
		tutorlocation: '法兰城',
		tutorwalk:[
			[15, 6, '竞技场'],
			[35, 8, '后台'],
			[20, 23]
			],
		tutorpos : [20, 22],
		//TODO
		teacherwalk:[
			[153, 100, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		teacherpos : [8 ,4],
	}, {
		jobmainname: '剑士',
		skill:'',
		titles: ['见习剑士', '剑士', '王宫剑士', '剑术师范', '剑术大师', '剑圣'],
		category: '物理系',
        tutorlocation: '法兰城'
	}, {
		jobmainname: '传教士',
		skill:'气绝回复',
		titles: ['见习传教士', '传教士', '牧师', '主教', '大主教', '圣使'],
		category: '魔法系',
		tutorlocation: '法兰城',
		tutorwalk:[
			CN,
			[154, 29, '大圣堂的入口'],
			[14, 7, '礼拜堂'],
			[23, 0,'大圣堂里面'],
			[16, 9]
			],
		tutorpos : [17, 9],
		//TODO
		teacherwalk:[
			[153, 100, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		teacherpos : [8 ,4],
	}, {
		jobmainname: '魔术师',
		skill:'',
		titles: ['见习魔术师', '魔术师', '王宫魔法师', '魔导士', '大魔术师', '狂魔导师'],
		category: '魔法系',
        tutorlocation: '法兰城'
	}, {
		jobmainname: '巫师',
		skill:'',
		titles: ['见习巫师', '巫师', '王宫巫师', '巫术大师', '巫王', '幻之巫王'],
		category: '魔法系',
        tutorlocation: '索奇亚'
	}, {
		jobmainname: '咒术师',
		skill:'',
		titles: ['见习咒术师', '咒术师', '王宫咒术师', '降头师', '咒术大师', '咒缚者'],
		category: '魔法系',
        tutorlocation: '莎莲娜海底洞窟',
		tutorwalk:[
			CW,
			[22, 88, '芙蕾雅'],
			[201, 166],
		],
		// 咒术师房间导师坐标，地图index3:15011
		tutorpos : [11, 10],
		teacherwalk:[
			CW,
			[22, 88, '芙蕾雅'],
			[201, 166],
		],
		teacherpos : [],
	},  {
		jobmainname: '',
		skill:'抗毒',
		titles: ['抗毒'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [11, 7],
	}, {
		jobmainname: '',
		skill:'抗昏睡',
		titles: ['抗昏睡'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [11, 9],
	}, {
		jobmainname: '',
		skill:'抗混乱',
		titles: ['抗混乱'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [14, 7],
	}, {
		jobmainname: '',
		skill:'抗酒醉',
		titles: ['抗酒醉'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [11, 15],
	}, {
		jobmainname: '',
		skill:'抗石化',
		titles: ['抗石化'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [11, 13],
	},  {
		jobmainname: '',
		skill:'抗遗忘',
		titles: ['抗遗忘'],
		category: '一职多技能系',
        teacherlocation: '杰诺瓦镇',
		teacherwalk:[
			[14, 6, '村长的家'],
			[1, 9, '杰诺瓦镇'],
			[24, 40, '莎莲娜'],
			[196, 443, '莎莲娜海底洞窟 地下1楼'],
			[14, 41, '莎莲娜海底洞窟 地下2楼'],
			[32, 21],
		],
		teacherpos : [16, 9],
	}, {
		jobmainname: '封印师',
		skill:'精灵的盟约',
		titles: ['见习封印师', '封印师', '王宫封印师', '封印术师范', '封印大师', '召唤师'],
		category: '魔物系',
        tutorlocation: '法兰城',
		tutorwalk:[
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		tutorpos : [10, 4],
		teacherwalk:[
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		teacherpos : [8 ,4],
	}, {
		jobmainname: '饲养师',
		skill:'宠物强化',
		titles: ['见习饲养师', '饲养师', '王宫饲养师', '高级饲养师', '饲养大师', '星之饲养师'],
		category: '魔物系',
        tutorlocation: '法兰城',
		tutorwalk:[
			CN,
			[122, 36, '饲养师之家'],
			[13, 10]
			],
		tutorpos : [13, 9],
        teacherlocation: '法兰城',
		teacherwalk:[
			CN,
			[122, 36, '饲养师之家'],
			[14, 5]
			],
		teacherpos : [14 ,3],
	}, {
		jobmainname: '驯兽师',
		skill:'调教',
		titles: ['见习驯兽师', '驯兽师', '王宫驯兽师', '驯兽师范', '驯兽大师', '兽王'],
		category: '魔物系',
        tutorlocation: '法兰城',
		tutorwalk:[
			CW,
			[73, 60, '职业公会'],
			[13, 10]
			],
		tutorpos : [13, 8],
		teacherlocation: '法兰城',
		teacherwalk:[
			CS,
			[219, 136, '科特利亚酒吧'],
			[27, 20, '酒吧里面'],
			[10, 6, '客房'],
			[11, 6]
			],
		teacherpos : [11 ,5],
	},{
		category: '制造系',
		jobmainname: '制鞋工',
		skill:'制鞋',
		titles: ['制鞋学徒', '制鞋工', '资深制鞋师傅', '御用制鞋师傅', '制鞋名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[19, 24]
			],
		tutorpos : [19, 25],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[23, 23]
			],
		teacherpos : [23 ,24],
	},{
		category: '制造系',
		jobmainname: '造斧工',
		skill:'造斧',
		titles: ['造斧学徒', '造斧工', '资深造斧师傅', '御用造斧师', '造斧名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[22, 28]
			],
		tutorpos : [22, 29],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[23, 32]
			],
		teacherpos : [24 ,32],
	}, {
		category: '制造系',
		jobmainname: '造弓工',
		titles: ['造弓学徒', '造弓工', '资深造弓师傅', '御用造弓师傅', '造弓名师'],
		skill : '造弓',
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[24, 18]
			],
		tutorpos : [25 ,18],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[23, 15]
			],
		teacherpos : [24 ,15],
	}, {
		category: '制造系',
		jobmainname: '造盾工',
		skill:'',
		titles: ['造盾学徒', '造盾工', '资深造盾师傅', '御用造盾师傅', '造盾名师'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		jobmainname: '裁缝工',
		skill:'制衣服',
		titles: ['裁缝学徒', '裁缝工', '资深裁缝师傅', '御用裁缝师傅', '裁缝名师'],
		category: '制造系',
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[17, 19]
			],
		tutorpos : [17, 18],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[13, 19]
			],
		teacherpos : [13 ,18],
	}, {
		category: '制造系',
		jobmainname: '长袍工',
		skill:'制长袍',
		titles: ['长袍学徒', '长袍工', '资深长袍师傅', '御用长袍师傅', '长袍名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[16, 17]
			],
		tutorpos : [17, 17],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[12, 19]
			],
		teacherpos : [12 ,18],
	}, {
		category: '制造系',
		jobmainname: '厨师',
		skill:'料理',
		titles: ['料理学徒', '厨师', '资深大厨师', '御用厨师', '料理达人'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		category: '制造系',
		jobmainname: '铠甲工',
		skill:'',
		titles: ['铠甲学徒', '铠甲工', '资深铠甲师傅', '御用铠甲师傅', '铠甲名师'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		category: '制造系',
		jobmainname: '帽子工',
		skill:'',
		titles: ['帽子学徒', '帽子工', '资深帽子师傅', '御用帽子师傅', '帽子名师'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		category: '制造系',
		jobmainname: '头盔工',
		skill:'',
		titles: ['头盔学徒', '头盔工', '资深头盔师傅', '御用头盔师傅', '头盔名师'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		category: '制造系',
		jobmainname: '投掷武器工',
		skill:'造投掷武器',
		titles: ['投掷武器学徒', '投掷武器工', '资深投掷武器师傅', '御用投掷武器师傅', '投掷武器名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[32, 18]
			],
		tutorpos : [33, 17],
		teacherlocation: '圣拉鲁卡村',
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[32, 18]
			],
		teacherpos : [31 ,17],
	}, {
		category: '制造系',
		jobmainname: '小刀工',
		skill:'',
		titles: ['小刀学徒', '小刀工', '资深小刀师傅', '御用小刀师傅', '小刀名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[32, 34]
			],
		tutorpos : [33, 33],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[30, 35]
			],
		teacherpos : [31 ,36],
	}, {
		category: '制造系',
		jobmainname: '药剂师',
		skill:'',
		titles: ['实习药剂师', '药剂师', '资深药剂大师', '御用药剂师', '炼金术士'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[37, 50, '医院'],
			[14, 11, 2311],
			[12, 6]
			],
		tutorpos : [12, 5],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[12, 19]
			],
		teacherpos : [12 ,18],
	}, {
		category: '制造系',
		jobmainname: '造枪工',
		skill:'造枪',
		titles: ['造枪学徒', '造枪工', '资深造枪师傅', '御用造枪师傅', '造枪名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[39, 32]
			],
		tutorpos : [39, 31],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[39, 33]
			],
		teacherpos : [39 ,34],
	}, {
		category: '制造系',
		jobmainname: '造杖工',
		skill:'造杖',
		titles: ['造杖学徒', '造杖工', '资深造杖师傅', '御用造杖师傅', '造杖名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[37, 19]
			],
		tutorpos : [38, 18],
		teacherwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[37, 19]
			],
		teacherpos : [37 ,20],
	}, {
		category: '制造系',
		jobmainname: '制靴工',
		skill:'',
		titles: ['制靴学徒', '制靴工', '资深制靴师傅', '御用制靴师傅', '制靴名师'],
        tutorlocation: '圣拉鲁卡村'
	}, {
		category: '制造系',
		jobmainname: '铸剑工',
		skill:'铸剑',
		titles: ['铸剑学徒', '铸剑工', '资深铸剑师傅', '御用铸剑师傅', '铸剑名师'],
        tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[35, 36]
			],
		tutorpos : [36, 36],
		teacherlocation:'法兰城',
		teacherwalk:[
			CW,
			[22, 88,'芙蕾雅'],
			[446, 101,'小村正之洞窟'],
			[15, 7]
			],
		teacherpos : [15 ,6],
	}, {
		category: '服务系',
		jobmainname: '防具修理工',
		skill:'',
		titles: ['防具修理学徒', '防具修理工', '资深防具修理师', '御用防具修理师', '修理防具专家'],
        tutorlocation: '法兰城'
	}, {
		category: '服务系',
		jobmainname: '护士',
		skill:'急救',
		titles: ['实习护士', '护士', '资深护士', '护士长', '护理专家', '白衣天使'],
        tutorlocation: '法兰城',
		tutorwalk:[
			[153, 100, '里谢里雅堡'],
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[18, 71, '客房'],
			[11, 5]
			],
		tutorpos : [11, 4],
		teacherlocation:'法兰城',
		teacherwalk:[
			[17,53,'法兰城'],
			[82, 83, '医院'],
			[12, 31]
			],
		teacherpos : [12 ,30],
	}, {
		category: '服务系',
		jobmainname: '鉴定师',
		skill:'鉴定',
		titles: ['鉴定学徒', '鉴定士', '资深鉴定师傅', '御用鉴定师', '鉴定专家'],
        tutorlocation: '法兰城',
		tutorwalk:[
			CE,
			[191, 37, '强哥杂货店'],
			[12, 11]
			],
		tutorpos : [12, 9],
		teacherlocation: '法兰城',
		teacherwalk:[
			CE,
			[196, 78, '凯蒂夫人的店'],
			[15,14]
			],
		teacherpos : [17 ,14],
	}, {
		category: '服务系',
		jobmainname: '武器修理工',
		skill:'',
		titles: ['武器修理学徒', '武器修理工', '资深武器修理师', '御用武器修理师', '修理武器专家'],
        tutorlocation: '法兰城',
		teacherlocation:'法兰城',
		teacherwalk:[
			CW,
			[22, 88,'芙蕾雅'],
			[446, 101,'小村正之洞窟'],
			[14, 14]
			],
		teacherpos : [14, 12],
	}, {
		category: '服务系',
		jobmainname: '仙人',
		skill:'',
		titles: ['道童', '道士', '半仙', '仙人', '歌仙'],
        tutorlocation: '哥拉尔镇'
	}, {
		category: '服务系',
		jobmainname: '侦探',
		skill:'',
		titles: ['见习侦探', '侦探', '名侦探', '大侦探', '超级侦探'],
        tutorlocation: '法兰城'
	}, {
		jobmainname: '医生',
		skill:'治疗',
		titles: ['实习医师','医师','资深医师','御医','超级医生','神医'],
		category: '服务系',
        tutorlocation: '法兰城',
		tutorwalk:[
			CE,
			[221, 83, '医院'],
			[15, 8]
			],
		tutorpos : [16, 8],
		teacherlocation: '法兰城',
		teacherwalk:[
			CW,
			[82, 83, '医院'],
			[11, 6]
			],
		teacherpos : [10 ,5],
	}, {
		category: '采集系',
		jobmainname: '矿工',
		skill:'',
		titles: ['见习矿工', '矿工', '资深矿工', '御用矿工', '超级矿工'],
		tutorlocation: '圣拉鲁卡村',
		tutorwalk:[
			[7, 3, '村长的家'],
			[6, 14, '村长的家 2楼'],
			[8, 5]
			],
		tutorpos : [8, 4],
		teacherlocation:'法兰城',
		teacherwalk:[
			CS,
			[200, 132, '基尔的家'],
			[9, 3]
			],
		teacherpos : [9 ,2],
	}, {
		category: '采集系',
		jobmainname: '猎人',
		skill:'狩猎',
		titles: ['见习猎人', '猎人', '资深猎人', '御用猎人', '超级猎人'],
        tutorlocation: '伊尔村',
		tutorwalk:[
			[12, 17, '村长的家'],
			[6, 13, '伊尔村'],
			[35, 25, '装备店'],
			[12, 17]
			],
		tutorpos : [13, 16],
		teacherlocation: '法兰城',
		teacherwalk:[
			CE,
			[281, 88, '芙蕾雅'],
			//以下坐标是拉修出现过的坐标，目前收集中。白天及黄昏均有目击
			[479, 201]
			],
		teacherpos : [10 ,7],
	}, {
		category: '采集系',
		jobmainname: '樵夫',
		skill:'伐木',
		titles: ['见习樵夫', '樵夫', '资深樵夫', '御用樵夫', '超级樵夫'],
		tutorlocation: '法兰城',
		tutorwalk:[
			CE,
			[195, 50, '职业介绍所'],
			[7, 10]
			],
		tutorpos : [7, 11],
		teacherlocation: '法兰城',
		teacherwalk:[
			CE,
			[281, 88, '芙蕾雅'],
			[509, 153, '山男的家'],
			[10,8]
			],
		teacherpos : [10 ,7],
	}, {
		category: '初始系',
		jobmainname: '游民',
		skill:'绝技-身无分文',
		titles: ['游民'],
        tutorlocation: '法兰城'
	}
];
const categoryMap =(inputmsg) => {
	let arr = [];
	Professions.forEach(p => {
		if(p.category == inputmsg){
			arr.push(p)
		}
	});
	return arr;
};
const titlesMap = (inputmsg) => {
	let obj = {};

	Professions.forEach(p => p.titles.forEach(t => {
		if(t == inputmsg){
			obj = p 
			// console.log('t = '+ t +' inputmsg = '+ inputmsg + '')
		}
	}));
	return obj
};

module.exports = function(inputmsg) {
	console.log('职业信息输入 inputmsg = ' + inputmsg)
	var profession = null
	if(inputmsg == null){
		return Professions
	}
	else if(inputmsg.indexOf('系') > 0){
		profession = categoryMap(inputmsg)
	}
	else{
		profession = titlesMap(inputmsg)
	}
	
	if(profession == null || profession ==undefined){
		throw new Error('错误,请检查输入职业信息是否有误,例如[弓箭手]输入成了[弓箭]')
	}else if(Object.keys(profession).length === 0){
		throw new Error('错误,未检测到职业信息,请检查输入职业信息是否有误,例如[弓箭手]输入成了[弓箭]')
	}
	// console.log('profession.category = ' + profession.category)
	return profession;
};
