/**
 * UNAecho:
 * level:物品等级
 * name:物品官方名称
 * display_name:物品自定义名称
 * func:走到采集此物品地点的函数
 * back:走回就近可回补城镇的函数。只包含走路，不包含回补行为。
 * 【注意】不一定所有采集物品对象都有back函数，如果没有则视为登出回补的方式效率更高
 */
var mineArray = [
{
	level : 1,
	name : '小麦粉',
	display_name : '小麦粉',
	func : (cb)=>{
		//小麦粉和蕃茄一样，因为要打蕃茄后，去曙光营地兑换小麦粉。
		cga.travel.falan.toStone('E2', ()=>{
			cga.walkList([
				[281, 88, '芙蕾雅'],
				[475, 161],
			], cb);
		});
	}
},
{
	level : 1,
	name : '神圣米',
	display_name : '神圣米',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
				[130, 50, '盖雷布伦森林'],
				[178, 174],
			], cb);
		});
	}		
},
{
	level : 1,
	name : '蕃茄',
	display_name : '蕃茄',
	func : (cb)=>{
		cga.travel.falan.toStone('E2', ()=>{
			cga.walkList([
				[281, 88, '芙蕾雅'],
				[475, 161],
			], cb);
		});
	}		
},
{
	level : 1,
	name : '鸡蛋',
	display_name : '鸡蛋',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('奇利村', ()=>{
			cga.walkList([
				[7, 6, '村长的家'],
				[7, 1, 3212],
				[1, 9, '奇利村'],
				[79, 76, '索奇亚'],
				[297, 361],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['奇利村'].entrance['东门'],
		], cb);
	}
},
{
	level : 1,
	name : '鹿皮',
	display_name : '鹿皮',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
				[130, 50, '盖雷布伦森林'],
				[175, 182],
			], cb);
		});
	}
},
{
	level : 2,
	name : '大豆',
	display_name : '大豆',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
				[112, 102, '温迪尔平原'],
				[224, 60, '盖雷布伦森林'],
				[108, 123, '法兰城遗迹'],
				[119, 65,],
			], cb);
		});
	}		
},
{
	level : 2,
	name : '葱',
	display_name : '葱',
	func : (cb)=>{
		cga.travel.newisland.toStone('D', ()=>{
			cga.walkList([
				[190, 116, '盖雷布伦森林'],
				[231, 222, '布拉基姆高地'],
				[61, 195],
			], cb);
		});
	}		
},
{
	level : 2,
	name : '牛奶',
	display_name : '牛奶',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
			[130, 50, '盖雷布伦森林'],
			[216, 44],
			], ()=>{
				cga.TurnTo(216, 43)		
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(8, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0); 
							cga.AsyncWaitMovement({map:'方堡盆地', delay:1000, timeout:5000}, ()=>{
								cga.walkList([
									[182, 62],
									], cb);
							});
						});
					});
				});
			});
		});
	}
},
{
	level : 3,
	name : '盐',
	display_name : '盐',
	func : (cb)=>{
		cga.travel.newisland.toStone('D', ()=>{
			cga.walkList([
				[190, 116, '盖雷布伦森林'],
				[199, 211],
			], cb);
		});
	}		
},
{
	level : 3,
	name : '酱油',
	display_name : '酱油',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('亚留特村', ()=>{
			cga.walkList([
				[8, 3, '村长的家'],
				[6, 14, '亚留特村'],
				[66, 64, '芙蕾雅'],
				[624, 110],
			], cb);
		});
	}
},
{
	level : 3,
	name : '白菜',
	display_name : '白菜',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
				[165, 153],
			], (r)=>{
				cga.TurnTo(165, 154);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(32, -1);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(8, -1);
						cga.AsyncWaitMovement({map:['梅布尔隘地'], delay:1000, timeout:10000}, (err)=>{
							if(err){
								retry();
								return;
							}
							cga.walkList([
							[195, 58],
							],cb);
						});
					});
				});
			});
		});
	}
},
{
	level : 4,
	name : '竹笋',
	display_name : '竹笋',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
				[112, 102, '温迪尔平原'],
				[224, 60, '盖雷布伦森林'],
				[108, 123, '法兰城遗迹'],
				[135, 117,],
			], cb);
		});
	}		
},
{
	level : 4,
	name : '芹菜',
	display_name : '芹菜',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('亚留特村', ()=>{
			cga.walkList([
				[8, 3, '村长的家'],
				[6, 14, '亚留特村'],
				[66, 64, '芙蕾雅'],
				[606, 64],
			], cb);
		});
	}
},
{
	level : 4,
	name : '海苔',
	display_name : '海苔',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('亚留特村', ()=>{
			cga.walkList([
				[8, 3, '村长的家'],
				[6, 14, '亚留特村'],
				[59, 31, '芙蕾雅'],
				[617, 25],
			], cb);
		});
	}
},
{
	level : 5,
	name : '牛肉',
	display_name : '牛肉',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('奇利村', ()=>{
			cga.walkList([
				[7, 6, '村长的家'],
				[7, 1, 3212],
				[1, 9, '奇利村'],
				[79, 76, '索奇亚'],
				// UNA:索奇亚有石头，人容易卡住，加一个临时地点圆滑一下
				[321, 365],
				[359, 375],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['奇利村'].entrance['东门'],
		], cb);
	}
},
{
	level : 5,
	name : '星鳗',
	display_name : '星鳗',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
			cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[10, 16, '维诺亚村'],
				[67, 46, '芙蕾雅'],
				[425, 466],
			], cb);
		});
	}
},
{
	level : 5,
	name : '马铃薯',
	display_name : '马铃薯',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[24, 39, '莎莲娜'],
				[182, 487],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['杰诺瓦镇'].entrance['西门'],
		], cb);
	}
},
{
	level : 5,
	name : '胡椒',
	display_name : '胡椒',
	func : (cb)=>{
		if(configTable.mineType == 1){
			cga.travel.falan.toTeleRoom('伊尔村', ()=>{
				cga.travel.autopilot('旧金山酒吧',()=>{
					cga.walkList(
						[[18, 11]], cb);
				})
			});
		}else{
			// TODO：寻找狩猎的胡椒纯点
		}
	}
},
{
	level : 6,
	name : '砂糖',
	display_name : '砂糖',
	func : (cb)=>{
		if(configTable.mineType == 1){
			cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
				cga.travel.autopilot('糖店',()=>{
					cga.walkList(
						[[11, 6]], cb);
				})
			});
		}else{
			cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
				cga.walkList([
					[5, 4, '村长的家'],
					[6, 13, 4312],
					[6, 13, '阿巴尼斯村'],
					[37, 71, '莎莲娜'],
					[118, 100, '魔法大学'],
					[85, 46],
				], cb);
			});
		}
	}
},
{
	level : 6,
	name : '米',
	display_name : '米',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[71, 18, '莎莲娜'],
				[286, 512],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['杰诺瓦镇'].entrance['东门'],
		], cb);
	}
},
{
	level : 7,
	name : '高级奶油',
	display_name : '高级奶油',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[24, 39, '莎莲娜'],
				[154, 349],
			], cb);
		});
	}
},
{
	level : 7,
	name : '辣椒',
	display_name : '辣椒',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[71, 18, '莎莲娜'],
				[309, 446],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['杰诺瓦镇'].entrance['东门'],
		], cb);
	}
},
{
	level : 7,
	name : '辣椒',
	display_name : '辣椒哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇'){
			cga.LogBack();
			throw new Error('必须从哥拉尔镇启动');}
		cga.walkList([
			[176, 105, '库鲁克斯岛'],
			[321, 367],
		], cb);
	}
},
{	// UNA:官方居然有错别字。。。官方写的是【咖哩】而不是【咖喱】
	level : 7,
	name : '咖哩块',
	display_name : '咖哩块',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[71, 18, '莎莲娜'],
				[268, 430],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['杰诺瓦镇'].entrance['东门'],
		], cb);
	}
},
{
	level : 8,
	name : '螃蟹',
	display_name : '螃蟹',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[71, 18, '莎莲娜'],
				[318, 503],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['杰诺瓦镇'].entrance['东门'],
		], cb);
	}
},
{
	level : 8,
	name : '霜降牛肉',
	display_name : '霜降牛肉',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
			cga.walkList([
				[14, 6, '村长的家'],
				[1, 9, '杰诺瓦镇'],
				[24, 39, '莎莲娜'],
				[115, 320],
			], cb);
		});
	}
},
{// UNAecho:半山8/死神的降临任务【神圣庇护之衣】狩猎材料
	level : 8,
	name : '闪亮的珍珠',
	display_name : '闪亮的珍珠',
	func : (cb)=>{
		var obj = {act : 'map', target : '小岛', npcpos : [27,15]}
		cga.travel.falan.toStone('C', (r)=>{
			cga.travel.autopilot(1504,()=>{
				cga.askNpcForObj(obj,()=>{
					cga.walkList([
						[66, 9],
					], cb);
				})
			})
		});
	}
},
{
	level : 9,
	name : '伊势虾',
	display_name : '伊势虾',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
			cga.walkList([
				[5, 4, '村长的家'],
				[6, 13, 4312],
				[6, 13, '阿巴尼斯村'],
				[37, 71, '莎莲娜'],
				[95, 112],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['魔法大学'].entrance['入口'],
		], cb);
	}
},
{
	level : 9,
	name : '海胆',
	display_name : '海胆',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
			cga.walkList([
				[5, 4, '村长的家'],
				[6, 13, 4312],
				[6, 13, '阿巴尼斯村'],
				[37, 71, '莎莲娜'],
				[132, 110],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['魔法大学'].entrance['入口'],
		], cb);
	}
},
{
	level : 10,
	name : '鱼翅',
	display_name : '鱼翅',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
			cga.walkList([
				[5, 4, '村长的家'],
				[6, 13, 4312],
				[6, 13, '阿巴尼斯村'],
				[37, 71, '莎莲娜'],
				[43, 183],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['魔法大学'].entrance['入口'],
		], cb);
	}
},
{
	level : 10,
	name : '鳖',
	display_name : '鳖',
	func : (cb)=>{
		cga.travel.falan.toTeleRoom('阿巴尼斯村', ()=>{
			cga.walkList([
				[5, 4, '村长的家'],
				[6, 13, 4312],
				[6, 13, '阿巴尼斯村'],
				[37, 71, '莎莲娜'],
				[67, 135],
			], cb);
		});
	},
	back : (cb) =>{
		cga.walkList([
			cga.travel.info['魔法大学'].entrance['入口'],
		], cb);
	}
},
{
	level : 10,
	name : '鱼翅',
	display_name : '鱼翅哥拉尔',
	func : (cb)=>{// UNAecho:尝试一版在这里写【非法兰采集】，但在法兰集合交易的逻辑。
		var go = ()=>{
			cga.walkList([
				[176, 105, '库鲁克斯岛'],
				[389, 528],
			], cb);
		}

		if(cga.GetMapName() != '哥拉尔镇'){
			if(cga.travel.gelaer.isSettled()){
				cga.logBack(go)
				return
			}else{
				console.log('UNAecho提示:8级以上食材建议定居在哥拉尔，打满之后坐船送回去')
				cga.travel.goAbroad('艾尔巴尼亚王国', go)
				return
			}
		}
		go()
	}
},
{
	level : 1,
	name : '小麦粉',
	display_name : '小麦伊尔村',
	func : (cb)=>{
		cga.travel.falan.toStone('E2', ()=>{
			cga.walkList([
				[281, 88, '芙蕾雅'],
				[594, 242],
			], cb);
		});
	}
},
{
	level : 2,
	name : '牛奶',
	display_name : '牛奶伊尔村',
	func : (cb)=>{
		cga.travel.falan.toStone('E2', ()=>{
			cga.walkList([
				[281, 88, '芙蕾雅'],
				[679, 312],
			], cb);
		});
	}
},
{
	level : 2,
	name : '葱',
	display_name : '葱哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[176, 105, '库鲁克斯岛'],
			[287, 436],
		], cb);
	}
},
{
	level : 2,
	name : '鸡蛋',
	display_name : '鸡蛋盆地',
	func : (cb)=>{
		cga.travel.newisland.toStone('X', ()=>{
			cga.walkList([
			[130, 50, '盖雷布伦森林'],
			[216, 44],
			], ()=>{
				cga.TurnTo(216, 43)		
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(8, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0); 
							cga.AsyncWaitMovement({map:'方堡盆地', delay:1000, timeout:5000}, ()=>{
								cga.walkList([
									[182, 166],
									], cb);
							});
						});
					});
				});
			});
		});
	}
},
{
	level : 4,
	name : '鸡肉',
	display_name : '鸡肉哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[119, 38, '库鲁克斯岛'],
			[264, 394],
		], cb);
	}
},
{
	level : 5,
	name : '牛肉',
	display_name : '牛肉哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[176, 105, '库鲁克斯岛'],
			[347, 406],
		], cb);
	}
},
{
	level : 6,
	name : '米',
	display_name : '米哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[119, 38, '库鲁克斯岛'],
			[257, 348],
		], cb);
	}
},
{
	level : 8,
	name : '霜降牛肉',
	display_name : '霜降牛肉哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[176, 105, '库鲁克斯岛'],
			[435, 456],
		], cb);
	}
},
{
	level : 9,
	name : '伊势虾',
	display_name : '伊势虾哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[119, 38, '库鲁克斯岛'],
			[148, 399],
		], cb);
	}
},
{
	level : 9,
	name : '海胆',
	display_name : '海胆哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[119, 38, '库鲁克斯岛'],
			[163, 411],
		], cb);
	}
},
{
	level : 10,
	name : '鳖',
	display_name : '鳖哥拉尔',
	func : (cb)=>{
		if(cga.GetMapName() != '哥拉尔镇')
			throw new Error('必须从哥拉尔镇启动');
		cga.walkList([
			[119, 38, '库鲁克斯岛'],
			[286, 294],
		], cb);
	}
},
];
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;
var mineTypeInfo = ['使用狩猎、伐木、挖掘技能采集', '采集其他材料兑换或直接商店购买'];

var thisobj = {
	func : (cb) =>{
		thisobj.object.func(cb);
	},
	check_done : ()=>{
		return cga.getInventoryItems().length >= 20
	},
	translate : (pair)=>{
		if(pair.field == 'mineObject'){
			pair.field = '采集材料种类';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if(pair.field == 'mineType'){
			pair.field = '获取材料方式';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		for(var i in mineArray){
			if(mineArray[i].display_name == obj.mineObject){
				configTable.mineObject = mineArray[i].display_name;
				thisobj.object = mineArray[i];
				break;
			}
		}
		
		if(!thisobj.object){
			console.error('读取配置：采集材料种类失败！');
			return false;
		}

		configTable.mineType = obj.mineType;
		thisobj.mineType = obj.mineType
		
		if(!thisobj.mineType){
			console.log('【UNA脚本警告】读取配置：采集方式失败！，默认使用技能进行采集');
			thisobj.mineType = 0
		}
		return true;
	},
	inputcb : (cb)=>{
		Async.series([(cb2)=>{
			var sayString = '【采集插件】请选择要采集的材料种类';
			for(var i in mineArray){
				if(i != 0)
					sayString += ', ';
				sayString += '('+ (parseInt(i)+1) + ')' + mineArray[i].display_name;
			}
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && mineArray[index - 1]){
					configTable.mineObject = mineArray[index - 1].display_name;
					thisobj.object = mineArray[index - 1];
					
					var sayString2 = '当前已选择:[' + thisobj.object.display_name + ']。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}, (cb2)=>{
			var sayString = '【采集插件】请选择材料采集方式: 0技能采集 1采集其他材料兑换或直接商店购买';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val >= 0 && val <= 1){
					configTable.mineType = val;
					thisobj.mineType = val;
					
					var sayString2 = '当前已选择:'+mineTypeInfo[thisobj.mineType]+'。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}], cb);
	},
	init : ()=>{
		
	}
}

module.exports = thisobj;
module.exports.mineArray = mineArray;