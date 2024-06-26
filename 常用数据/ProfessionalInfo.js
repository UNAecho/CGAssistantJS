// CE:里谢里雅堡东门出口，ESWN，东南西北。
var CE = [65, 53, '法兰城']
var CS = [41, 98, '法兰城']
var CW = [17, 53, '法兰城']
var CN = [41, 14, '法兰城']

/**
 * npcMap : 就职、转职、晋阶导师所在的房间名称，如果出现重复的歧义房间名称，则使用index代替。
 * npcpos : 就职、转职、晋阶导师的具体坐标
 * skill : 职业得意技，晋级时候有等级要求。子插件【智能培养角色】依赖此数组中的技能来判断得意技是否满足条件。如果晋级对得意技没有要求，则可置为空数组[]
 * trainskills : 职业建议练满的技能名称，可自行修改，用于自动读取战斗配置中的烧技能模式。以便在练级时候顺便烧技能和声望。
 * 如果人物持有数组中的技能，则修炼，没有则无视。请根据自身需要来学习技能，或者调整数组中的内容。
 */
const Professions = [
	{
		name: '暗黑骑士',
		skill:[
			'暗黑骑士之力',
		],
		trainskills:[
			'气绝回复'
			,'明镜止水'
			,'战栗袭心'
			,'连击'
			,'乾坤一掷'
			,'吸血攻击'
			,'攻击吸收'
			,'洁净魔法'
			,'恢复魔法'
		],
		titles: ['见习暗黑骑士', '暗黑骑士', '高阶暗黑骑士', '暗黑领主', '暗黑之魂', '漆黑之影'],
		category: '物理系',
		npcMainMap: '法兰城',
		npcMap: 1000,
		npcpos : [195, 191],
	}, {
		name: '盗贼',
		skill:[
			'窃盗',
		],
		trainskills:[
			'恢复魔法',
			'洁净魔法',
		],
		titles: ['见习盗贼', '盗贼', '小偷', '欺诈师', '偷窃高手', '盗贼头目'],
		category: '物理系',
		npcMainMap: '哥拉尔镇',
		npcMap: 47003,
		npcpos : [13, 8],
	}, {
		name: '格斗士',
		skill:[
			'混乱攻击',
		],
		trainskills:[
			'气绝回复'
			,'明镜止水'
			,'战栗袭心'
			,'崩击'
			,'气功弹'
			,'反击'
		],
		titles: ['见习格斗士', '格斗士', '格斗专家', '格斗家师范', '格斗王', '斗圣'],
		category: '物理系',
        npcMainMap: '奇利村',
		npcMap: 23603,
		npcpos : [20, 16],
	}, {
		name: '弓箭手',
		skill:[
			'乱射',
		],
		trainskills:[
			'气绝回复'
			,'明镜止水'
			,'战栗袭心'
			,'崩击'
			,'阳炎'
			,'一击必中'
			,'毒击'
		],
		titles: ['见习弓箭手', '弓箭手', '王宫弓箭手', '弓术师范', '弓术大师', '神射手'],
		category: '物理系',
        npcMainMap: '法兰城',
		npcMap: '弓箭手公会',
		npcpos : [6, 4],
	}, {
		name: '剑士',
		skill:[],
		titles: ['见习剑士', '剑士', '王宫剑士', '剑术师范', '剑术大师', '剑圣'],
		category: '物理系',
        npcMainMap: '法兰城',
		npcMap: 1401,
		npcpos : [18, 10],
	}, {
		/**
		 * 曙光营地指挥部里的教团骑士职业房间index：27015的6,9处NPC可以对话选择用20000魔币交换一个护身符
		 * 效果为：气绝回复70%魔力消耗，遗忘+10，魔力+300
		 */
		name: '教团骑士',
		skill:[
			'神圣之力'
			,'神圣光芒'
		],
		trainskills:[
			'气绝回复'
			,'护卫'
			,'圣盾'
			,'洁净魔法'
		],
		titles: ['见习教团骑士', '教团骑士', '高阶教团骑士', '圣骑士', '光明骑士', '仲裁者'],
		category: '物理系',
        npcMainMap: '曙光骑士团营地',
		npcMap: 27015,
		npcpos : [11, 5],
	}, {
		name: '骑士',
		skill:['护卫'],
		titles: ['见习骑士', '骑士', '王宫骑士', '近卫骑士', '枪术大师', '枪圣'],
		category: '物理系',
        npcMainMap: '法兰城',
		npcMap: 27015,
		npcpos : [11, 4],
	}, {
		name: '忍者',
		skill:['暗杀'],
		titles: ['初级忍者', '中级忍者', '上级忍者', '影', '忍术大师', '鬼'],
		category: '物理系',
        npcMainMap: '其它'
	}, {
		name: '士兵',
		skill:[],
		titles: ['见习士兵', '士兵', '王宫士兵', '士兵长', '重战士', '指挥官'],
		category: '物理系',
        npcMainMap: '法兰城',
		npcMap:'里谢里雅堡 1楼',
		npcpos : [81, 22],
	}, {
		name: '舞者',
		skill:[],
		titles: ['见习舞者', '串场艺人', '舞者', '超级巨星', '天王巨星', '舞圣'],
		category: '物理系',
        npcMainMap: '其它'
	}, {
		name: '战斧斗士',
		skill:[],
		trainskills:[
			'气绝回复'
			,'明镜止水'
			,'战栗袭心'
			,'连击'
			,'乾坤一掷'
			,'诸刃'
			,'崩击'
			,'气功弹'
			,'护卫'
			,'戒骄戒躁'
			,'画龙点睛'
		],
		titles: ['见习战斧斗士', '战斧斗士', '王宫战斧斗士', '战斧师范', '战斧大师', '斧圣'],
		category: '物理系',
		npcMainMap: '法兰城',
		npcMap:'后台',
		tutorwalk:[
			[15, 6, '竞技场'],
			[35, 8, '后台'],
			[20, 23]
			],
		npcpos : [20, 22],
	}, {
		name: '传教士',
		skill:[
			'补血魔法'
			,'强力补血魔法'
			,'超强补血魔法'
			,'气绝回复'
		],
		trainskills:[
			'毒击'
			,'精神冲击波'
			// 学习法师魔法来过双王的技能检测
			,'陨石魔法'
			,'冰冻魔法'
			,'火焰魔法'
			,'风刃魔法'
			,'强力陨石魔法'
			,'强力冰冻魔法'
			,'强力火焰魔法'
			,'强力风刃魔法'
			,'超强陨石魔法'
			,'超强冰冻魔法'
			,'超强火焰魔法'
			,'超强风刃魔法'
			,'恢复魔法'
			,'强力恢复魔法'
			,'超强恢复魔法'
			,'洁净魔法'
			// 学习咒术魔法来过双王的技能检测
			,'昏睡魔法'
			,'强力昏睡魔法'
			,'超强昏睡魔法'
			,'遗忘魔法'
			,'强力遗忘魔法'
			,'超强遗忘魔法'
			// 任务可能会用
			,'属性反转'
			,'大地的祈祷'
			,'海洋的祈祷'
			,'火焰的祈祷'
			,'云群的祈祷'
		],
		titles: ['见习传教士', '传教士', '牧师', '主教', '大主教', '圣使'],
		category: '魔法系',
		npcMainMap: '法兰城',
		npcMap: 1207,
		tutorwalk:[
			CN,
			[154, 29, '大圣堂的入口'],
			[14, 7, '礼拜堂'],
			[23, 0,'大圣堂里面'],
			[16, 9]
			],
		npcpos : [17, 9],
	}, {
		name: '魔术师',
		skill:[],
		titles: ['见习魔术师', '魔术师', '王宫魔法师', '魔导士', '大魔术师', '狂魔导师'],
		category: '魔法系',
        npcMainMap: '其它',
		npcMap: '魔女之家',
		npcpos : [19, 13],
	}, {
		name: '巫师',
		skill:[
			'恢复魔法'
			,'强力恢复魔法'
			,'超强恢复魔法'
			,'洁净魔法'
		],
		trainskills:[
			'气绝回复'
			,'毒击'
			,'精神冲击波'
			,'陨石魔法',
			,'冰冻魔法',
			,'火焰魔法',
			,'风刃魔法',
			,'强力陨石魔法',
			,'强力冰冻魔法',
			,'强力火焰魔法',
			,'强力风刃魔法',
			,'超强陨石魔法',
			,'超强冰冻魔法',
			,'超强火焰魔法',
			,'超强风刃魔法',
			,'补血魔法'
			,'强力补血魔法'
			,'超强补血魔法'
			,'吸血魔法'
			,'攻击反弹'
			,'攻击无效'
			,'攻击吸收'
			,'魔法反弹'
			,'魔法无效'
			,'魔法吸收'
			,'昏睡魔法',
			,'强力昏睡魔法',
			,'超强昏睡魔法',
			,'酒醉魔法',
			,'强力酒醉魔法',
			,'超强酒醉魔法',
			,'混乱魔法',
			,'强力混乱魔法',
			,'超强混乱魔法',
			// 任务可能会用
			,'属性反转',
			,'大地的祈祷',
			,'海洋的祈祷',
			,'火焰的祈祷',
			,'云群的祈祷',
		],
		titles: ['见习巫师', '巫师', '王宫巫师', '巫术大师', '巫王', '幻之巫王'],
		category: '魔法系',
        npcMainMap: '奇利村',
		npcMap: 3352,
		npcpos : [9, 9],
	}, {
		name: '咒术师',
		// 咒术师晋级没有得意技要求，故置空
		skill:[],
		trainskills:[
			'气绝回复'
			,'精神冲击波'
			// 学习法师魔法来过双王的技能检测
			,'陨石魔法'
			,'冰冻魔法'
			,'火焰魔法'
			,'风刃魔法'
			,'强力陨石魔法'
			,'强力冰冻魔法'
			,'强力火焰魔法'
			,'强力风刃魔法'
			,'超强陨石魔法'
			,'超强冰冻魔法'
			,'超强火焰魔法'
			,'超强风刃魔法'
			,'补血魔法'
			,'强力补血魔法'
			,'超强补血魔法'
			,'洁净魔法'
			,'吸血魔法'
			,'攻击反弹'
			,'攻击无效'
			,'攻击吸收'
			,'魔法反弹'
			,'魔法无效'
			,'魔法吸收'
			,'中毒魔法',
			,'强力中毒魔法'
			,'超强中毒魔法'
			,'石化魔法'
			,'强力石化魔法'
			,'超强石化魔法'
			,'昏睡魔法'
			,'强力昏睡魔法'
			,'超强昏睡魔法'
			,'酒醉魔法'
			,'强力酒醉魔法'
			,'超强酒醉魔法'
			,'混乱魔法'
			,'强力混乱魔法'
			,'超强混乱魔法'
			,'遗忘魔法'
			,'强力遗忘魔法'
			,'超强遗忘魔法'
			,'单体即死'
			,'属性反转'
			,'大地的祈祷'
			,'海洋的祈祷'
			,'火焰的祈祷'
			,'云群的祈祷'
		],
		titles: ['见习咒术师', '咒术师', '王宫咒术师', '降头师', '咒术大师', '咒缚者'],
		category: '魔法系',
        npcMainMap: '法兰城',
		npcMap: 15012,// 15011的房间跟15012一样，但是NPC并不是职业导师。对话会提醒你去做咒术师就职任务
		tutorwalk:[
			CW,
			[22, 88, '芙蕾雅'],
			[201, 166],
		],
		// 咒术师房间导师坐标，地图index3:15011
		npcpos : [11, 10],
	}, {
		name: '封印师',
		skill:[
			'精灵的盟约',
		],
		trainskills:[
			'气绝回复'
			,'明镜止水'
			,'精神冲击波'
			// 学习法师魔法来过双王的技能检测
			,'陨石魔法',
			,'冰冻魔法',
			,'火焰魔法',
			,'风刃魔法',
			,'强力陨石魔法',
			,'强力冰冻魔法',
			,'强力火焰魔法',
			,'强力风刃魔法',
			,'超强陨石魔法',
			,'超强冰冻魔法',
			,'超强火焰魔法',
			,'超强风刃魔法',
			,'恢复魔法'
			,'强力恢复魔法'
			,'超强恢复魔法'
			,'洁净魔法'
			,'中毒魔法',
		],
		titles: ['见习封印师', '封印师', '王宫封印师', '封印术师范', '封印大师', '召唤师'],
		category: '魔物系',
        npcMainMap: '法兰城',
		npcMap: 1508,
		tutorwalk:[
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[32, 71, '客房'],
			[9, 5]
			],
		npcpos : [10, 4],
	}, {
		name: '饲养师',
		skill:['宠物强化'],
		titles: ['见习饲养师', '饲养师', '王宫饲养师', '高级饲养师', '饲养大师', '星之饲养师'],
		category: '魔物系',
        npcMainMap: '法兰城',
		npcMap: '饲养师之家',
		tutorwalk:[
			CN,
			[122, 36, '饲养师之家'],
			[13, 10]
			],
		npcpos : [13, 9],
	}, {
		name: '驯兽师',
		skill:['调教'],
		titles: ['见习驯兽师', '驯兽师', '王宫驯兽师', '驯兽师范', '驯兽大师', '兽王'],
		category: '魔物系',
        npcMainMap: '法兰城',
		npcMap: '职业公会',
		tutorwalk:[
			CW,
			[73, 60, '职业公会'],
			[13, 10]
			],
		npcpos : [13, 8],
	},{
		category: '制造系',
		name: '制鞋工',
		skill:['制鞋'],
		titles: ['制鞋学徒', '制鞋工', '资深制鞋师傅', '御用制鞋师', '制鞋名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[19, 24]
			],
		npcpos : [19, 25],
	},{
		category: '制造系',
		name: '造斧工',
		skill:['造斧'],
		titles: ['造斧学徒', '造斧工', '资深造斧师傅', '御用造斧师', '造斧名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[22, 28]
			],
		npcpos : [22, 29],
	}, {
		category: '制造系',
		name: '造弓工',
		titles: ['造弓学徒', '造弓工', '资深造弓师傅', '御用造弓师', '造弓名师'],
		skill:['造弓'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[24, 18]
			],
		npcpos : [25 ,18],
	}, {
		category: '制造系',
		name: '造盾工',
		skill:['造盾'],
		titles: ['造盾学徒', '造盾工', '资深造盾师傅', '御用造盾师', '造盾名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[11, 42]
			],
		npcpos : [11, 41],
	}, {
		category: '制造系',
		name: '裁缝工',
		skill:['制衣服'],
		titles: ['裁缝学徒', '裁缝工', '资深裁缝师傅', '御用裁缝师', '裁缝名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[17, 19]
			],
		npcpos : [17, 18],
	}, {
		category: '制造系',
		name: '长袍工',
		skill:['制长袍'],
		titles: ['长袍学徒', '长袍工', '资深长袍师傅', '御用长袍师傅', '长袍名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[16, 17]
			],
		npcpos : [17, 17],
	}, {
		category: '制造系',
		name: '厨师',
		skill:['料理'],
		titles: ['料理学徒', '厨师', '资深大厨师', '御用厨师', '料理铁人'],
        npcMainMap: '伊尔村',
		npcMap: '旧金山酒吧',
		tutorwalk:[
			[12, 17, '村长的家'],
			[6, 13, '伊尔村'],
			[32, 65,'旧金山酒吧'],
			[15, 5],
			],
		npcpos : [15, 4],
	}, {
		category: '制造系',
		name: '铠甲工',
		skill:['造铠'],
		titles: ['铠甲学徒', '铠甲工', '资深铠甲师傅', '御用铠甲师', '铠甲名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[27, 32]
			],
		npcpos : [27, 31],
	}, {
		category: '制造系',
		name: '帽子工',
		skill:['制帽子'],
		titles: ['帽子学徒', '帽子工', '资深帽子师傅', '御用帽子师傅', '帽子名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[12, 25]
			],
		npcpos : [13, 25],
	}, {
		category: '制造系',
		name: '头盔工',
		skill:['造头盔'],
		titles: ['头盔学徒', '头盔工', '资深头盔师傅', '御用头盔师', '头盔名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[15, 32]
			],
		npcpos : [15, 31],
	}, {
		category: '制造系',
		name: '投掷武器工',
		skill:['造投掷武器'],
		titles: ['投掷武器学徒', '投掷武器工', '资深投掷武器师傅', '御用投掷武器师', '投掷武器名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[32, 18]
			],
		npcpos : [33, 17],
	}, {
		category: '制造系',
		name: '小刀工',
		skill:['造小刀'],
		titles: ['小刀学徒', '小刀工', '资深小刀师傅', '御用小刀师', '小刀名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[32, 34]
			],
		npcpos : [33, 33],
	}, {
		category: '制造系',
		name: '药剂师',
		skill:['制药'],
		titles: ['实习药剂师', '药剂师', '资深药剂大师', '御用药剂师', '炼金术士'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: 2311,
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[37, 50, '医院'],
			[14, 11, 2311],
			[12, 6]
			],
		npcpos : [12, 5],
	}, {
		category: '制造系',
		name: '造枪工',
		skill:['造枪'],
		titles: ['造枪学徒', '造枪工', '资深造枪师傅', '御用造枪师', '造枪名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[39, 32]
			],
		npcpos : [39, 31],
	}, {
		category: '制造系',
		name: '造杖工',
		skill:['造杖'],
		titles: ['造杖学徒', '造杖工', '资深造杖师傅', '御用造杖师', '造杖名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[37, 19]
			],
		npcpos : [38, 18],
	}, {
		category: '制造系',
		name: '制靴工',
		skill:['制长靴'],
		titles: ['制靴学徒', '制靴工', '资深制靴师傅', '御用制靴师', '制靴名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[17, 32]
			],
		npcpos : [17, 31],
	}, {
		category: '制造系',
		name: '铸剑工',
		skill:['铸剑'],
		titles: ['铸剑学徒', '铸剑工', '资深铸剑师傅', '御用铸剑师', '铸剑名师'],
        npcMainMap: '圣拉鲁卡村',
		npcMap: '地下工房',
		tutorwalk:[
			[7, 3, '村长的家'],
			[2, 9, '圣拉鲁卡村'],
			[32, 70, '装备品店'],
			[14, 4, '1楼小房间'],
			[9, 3, '地下工房'],
			[35, 36]
			],
		npcpos : [36, 36],
	}, {
		name: '防具修理工',
		category: '服务系',
		skill:['防具修理'],
		titles: ['防具修理学徒', '防具修理工', '资深防具修理师', '御用防具修理师', '修理防具专家'],
        npcMainMap: '法兰城',
		npcMap: '米克尔工房',
		npcpos : [14, 15],
	}, {
		name: '护士',
		category: '服务系',
		skill:['急救'],
		titles: ['实习护士', '护士', '资深护士', '护士长', '护理专家', '白衣天使'],
        npcMainMap: '法兰城',
		npcMap: 1507,
		tutorwalk:[
			[153, 100, '里谢里雅堡'],
			[41, 50, '里谢里雅堡 1楼'],
			[74, 19, '里谢里雅堡 2楼'],
			[18, 71, '客房'],
			[11, 5]
			],
		npcpos : [11, 4],
	}, {
		name: '鉴定士',
		category: '服务系',
		skill:['鉴定'],
		titles: ['鉴定学徒', '鉴定士', '资深鉴定师傅', '御用鉴定师', '鉴定专家'],
        npcMainMap: '法兰城',
		npcMap: '强哥杂货店',
		tutorwalk:[
			CE,
			[191, 37, '强哥杂货店'],
			[12, 11]
			],
		npcpos : [12, 9],
	}, {
		name: '武器修理工',
		category: '服务系',
		skill:['武器修理'],
		titles: ['武器修理学徒', '武器修理工', '资深武器修理师', '御用武器修理师', '修理武器专家'],
        npcMainMap: '法兰城',
		npcMap: '米克尔工房',
		npcpos : [11, 12],
	}, {
		name: '仙人',
		category: '服务系',
		skill:['变身'],
		titles: ['道童', '道士', '半仙', '仙人', '歌仙'],
        npcMainMap: '哥拉尔镇'
	}, {
		category: '服务系',
		name: '侦探',
		skill:['变装'],
		titles: ['见习侦探', '侦探', '名侦探', '大侦探', '超级侦探'],
        npcMainMap: '法兰城'
	}, {
		name: '医师',
		category: '服务系',
		skill:['治疗'],
		titles: ['实习医师','医师','资深医师','御医','超级医生','神医'],
        npcMainMap: '法兰城',
		npcMap: 1111,
		tutorwalk:[
			CE,
			[221, 83, '医院'],
			[15, 8]
			],
		npcpos : [16, 8],
	}, {
		category: '采集系',
		name: '矿工',
		skill:['挖掘'],
		titles: ['见习矿工', '矿工', '资深矿工', '御用矿工', '超级矿工'],
		npcMainMap: '圣拉鲁卡村',
		npcMap: '村长的家 2楼',
		tutorwalk:[
			[7, 3, '村长的家'],
			[6, 14, '村长的家 2楼'],
			[8, 5]
			],
		npcpos : [8, 4],
	}, {
		category: '采集系',
		name: '猎人',
		skill:['狩猎'],
		titles: ['见习猎人', '猎人', '资深猎人', '御用猎人', '超级猎人'],
        npcMainMap: '伊尔村',
		npcMap: '装备店',
		tutorwalk:[
			[12, 17, '村长的家'],
			[6, 13, '伊尔村'],
			[35, 25, '装备店'],
			[12, 17]
			],
		npcpos : [13, 16],
	}, {
		category: '采集系',
		name: '樵夫',
		skill:['伐木'],
		titles: ['见习樵夫', '樵夫', '资深樵夫', '御用樵夫', '超级樵夫'],
		npcMainMap: '法兰城',
		npcMap: '职业介绍所',
		tutorwalk:[
			CE,
			[195, 50, '职业介绍所'],
			[7, 10]
			],
		npcpos : [7, 11],
	}, {
		name: '游民',
		category: '初始系',
		skill:[],
		titles: ['游民'],
        npcMainMap: '法兰城'
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
	// console.log('inputmsg' + inputmsg)
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

module.exports.Professions = Professions
/**
 * 输入职位名称，返回职业几转
 * 0：0转，见习
 * 1：1转，正阶
 * 2：2转，王宫
 * 3：3转，师范
 * 4：4转，大师
 * 5：5转，最终阶段
 * @param {string} inputmsg 输入职位信息，如：见习传教士
 * @returns int
 */
module.exports.getJobLevel = function(inputmsg) {
	// console.log('inputmsg' + inputmsg)
	var result = null
	if(inputmsg == null){
		throw new Error('错误，请输入职位信息')
	}else{
		result = titlesMap(inputmsg)
	}
	
	if(result == null || result ==undefined){
		throw new Error('错误,请检查输入职业信息是否有误,例如[弓箭手]输入成了[弓箭]')
	}else if(Object.keys(result).length === 0){
		throw new Error('错误,未检测到职业信息,请检查输入职业信息是否有误,例如[弓箭手]输入成了[弓箭]')
	}

	return result.titles.indexOf(inputmsg);
};

/**
 * 输入职位统称，返回职业对象。
 * @param {string} inputmsg 输入职位统称，如：忍者
 * @returns obj
 */
 module.exports.getJobObj = function(inputmsg) {
	var result = null
	if(inputmsg == null){
		throw new Error('错误，请输入职位统称')
	}else{
		result = Professions.find((p) => {
			if(p.name == inputmsg){
				return true
			}
			return false
		});
	}
	
	if(result == null || result ==undefined){
		throw new Error('错误,请检查输入职业信息是否有误,例如[弓箭手]输入成了[弓箭]')
	}

	return result
};