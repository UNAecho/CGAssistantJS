var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){

	global.cga = cga;
	var rootdir = cga.getrootdir()
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
	
	// 提取本地职业信息
	const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(cga.GetPlayerInfo().job)
	var jobmainname = professionalInfo.jobmainname
	/* tips:龙心id 622042，type = 26
	* 黑色方舟顶层出去，后传送至白色方舟index 59934，x= 145,y=56
	* 白色方舟目送者149，79。人物与其对话坐标站在149，78
	* 与目送者对话，就一个确定按钮。需要持有龙心的人点确定。
	* 目送者会全队传送，无须持有龙心以外的人操作
	* 目送者会传送全队至白色方舟index 59934，x= 93,y=12，房间中有黑色露比
	* 黑露比99，15，人物与其对话坐标站在98，15
	* 接下来2种情况：
	*
	* 1、未四转时，与黑露比对话，露比说【什么事情那么吃惊..】。对话顺序为2个【下一步】，一个【是否】，一个单【确定】按钮，确定后，交出誓言之花。任务完毕。
	*
	* 2、已四转时，与黑露比对话，露比说【真的来了啊..】。对话为单确定按钮，交出誓言之花，然后被强制离队，传送至index59934白色方舟的77，96
	* 【生产系注意：】然后生产系走到index59934白色方舟的63，60处，与64，60的传授者对话。学习11级制作配方。对话为单确定按钮
	* 之后走到51，131，与51，132处唤醒者对话，内容为【你好像只有..】时，选【是否】中的【是】，增加第11个技能栏。
	* 内容为【你已经有...光之路...】，选【是否】中的【是】，传送回光之路。
	*
	* 任务结束，被传送至光之路(index 59505)166，87。
	* 如果晋级之后再次完成任务（完成任务但不晋级不算），会被传送至白色方舟index59934，第11格技能栏提升或者生产11级配方获取房间。获取x41，86 y 53 137
	* 唤醒者：51，132，人物站立：51，131
	*/
	console.log('重要提示：每一层白色方舟地图档都要下载，否则自动寻路会失败！')

	var myname = cga.GetPlayerInfo().name;
	
	// 分组信息，绿组暂时不用，走else判断
	const red = ["剑士","骑士","战斧斗士","弓箭手","格斗士","教团骑士","暗黑骑士","魔术师","传教士","咒术师","巫师"]
	const blue = ["士兵","忍者","舞者","盗贼","封印师","驯兽师","饲养师","医生","护士"]
	const yellow = ["鉴定师","厨师","侦探","仙人","药剂师","矿工","樵夫","猎人","武器修理工","防具修理工"]
	const green = ["造斧工","造弓工","长袍工"]
	
	// 分组隶属，红蓝黄绿
	var groupName = null

	// 除战斗系外需要交付的物品
	const productDict = {
		'武器修理工' : {item : '至高之剑', count : 1},
		'防具修理工' : {item : '至高之铠', count : 1},
		'鉴定师' : {item : '神秘陨石', count : 1},
		'侦探' : {item : '侦探眼镜', count : 1},
		'仙人' : {item : '仙花', count : 1},
		'药剂师' : {item : '生命回复药（1000）', count : 1},
		'厨师' : {item : '鳖料理', count : 1},
		'矿工' : {item : '奥利哈钢', count : 20},
		'樵夫' : {item : '梣', count : 20},
		'猎人' : {item : '甲鱼', count : 20},
		'铸剑工' : {item : '曲刀', count : 1},
		'造枪工' : {item : '异型枪', count : 1},
		'造斧工' : {item : '处刑斧', count : 1},
		'造弓工' : {item : '魔弹', count : 1},
		'造杖工' : {item : '星屑短杖', count : 1},
		'小刀工' : {item : '幻之匕首', count : 1},
		'投掷武器工' : {item : '天秤回力标', count : 1},
		'头盔工' : {item : '圣龙头盔', count : 1},
		'铠甲工' : {item : '黄金铠甲', count : 1},
		'制靴工' : {item : '龙之靴', count : 1},
		'造盾工' : {item : '勇者之盾', count : 1},
		'帽子工' : {item : '妖精之帽', count : 1},
		'裁缝工' : {item : '灵魂之服', count : 1},
		'长袍工' : {item : '奇迹之袍', count : 1},
		'制鞋工' : {item : '龙之鞋', count : 1},
	}

	var dialogHandler = (err, dlg)=>{
		if(dlg && (dlg.options & 4) == 4)
		{
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		if(dlg && (dlg.options & 32) == 32)
		{
			cga.ClickNPCDialog(32, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if(dlg && dlg.options == 1)
		{
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if(dlg && dlg.options == 3)
		{
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if(dlg && dlg.options == 12)
		{
			cga.ClickNPCDialog(4, -1);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else
		{
			return;
		}
	}

	var entrance = (talkPos, npcPos, targetPos, cb)=>{
		var retry = (cb2)=>{
			cga.TurnTo(npcPos[0], npcPos[1]);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg && dlg.options == 1){
					cga.ClickNPCDialog(1, 0);
					setTimeout(retry, 2000, cb2);
					return;
				}
				cga.ClickNPCDialog(4, 0);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, 0);
						cga.AsyncWaitMovement({x:targetPos[0], y:targetPos[1], delay:1000, timeout:5000}, cb);
					});
				});
			});
		}
		cga.walkList([
			talkPos,
			], ()=>{
				retry(cb)
			}
		);
	}
	
	var flowerTable = [
	{
		'红花' : 622051,
		'黄花' : 622052,
		'绿花' : 622053,
		'蓝花' : 622054,
	},
	{
		'红花' : 622055,
		'黄花' : 622056,
		'绿花' : 622057,
		'蓝花' : 622058,
	},
	{
		'红花' : 622059,
		'黄花' : 622060,
		'绿花' : 622061,
		'蓝花' : 622062,
	},
	{
		'红花' : 622059,
		'黄花' : 622060,
		'绿花' : 622061,
		'蓝花' : 622062,
	}
	]
	var	waitFlower = (layerIndex, myItem, waitForItem, waitForPos, cb)=>{
		
		cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
		
		cga.TurnTo(waitForPos[0], waitForPos[1]);

		var isLeft = myItem > waitForItem;
		
		var stuffs = 
		{
			itemFilter : (item)=>{
				if(item.itemid == flowerTable[layerIndex][myItem]){
					return true;
				}
				return false;
			}
		}

		var waitChat = ()=>{
			cga.AsyncWaitChatMsg((err, r)=>{
				if(r && r.unitid != -1)
				{
					var findpos = r.msg.indexOf(': CGA四转脚本等待换花');
					if(findpos > 0)
					{
						var playername = r.msg.substr(0, findpos);
						
						if(myname != playername)
						{
							var playerunit = cga.findPlayerUnit(playername);
							if(playerunit != null && playerunit.xpos == waitForPos[0] && playerunit.ypos ==waitForPos[1])
							{
								cga.positiveTrade(playername, stuffs, undefined, result => {
									if (result && result.success == true){
										cb(true);
									} else {
										waitChat();
									}
								});
								return;
							}
						}
					}
				}
				
				waitChat();
			}, 5000);
		}
		
		var waitTrade = ()=>{
			cga.waitTrade(stuffs, null, (results)=>{
				if(results && results.success == true)
				{
					cb(true);
				}
				else
				{
					cga.SayWords('CGA四转脚本等待换花，['+myItem+']交换'+'['+waitForItem+']', 0, 3, 1);
					waitTrade();
				}
			}, 5000);
		}

		if(isLeft)
			waitChat();
		else
			waitTrade();
	}
	
	var mineArray = [
	{
		type : 1,
		name : '红组',
		desired_flowers : [
		'黄花',
		'绿花',
		'蓝花',
		],
		func_layer0 : (cb)=>{
			entrance([21,96], [23, 96], [28, 96], cb)
			// cga.walkList([
			// [21, 96],
			// ], ()=>{
			// 	cga.TurnTo(23, 96);
			// 	cga.AsyncWaitNPCDialog(()=>{
			// 		cga.ClickNPCDialog(4, 0);
			// 		cga.AsyncWaitNPCDialog(()=>{
			// 			cga.ClickNPCDialog(32, 0);
			// 			cga.AsyncWaitNPCDialog(()=>{
			// 				cga.ClickNPCDialog(1, 0);
			// 				cga.AsyncWaitMovement({x:28, y:96, delay:1000, timeout:5000}, cb);
			// 			});
			// 		});
			// 	});
			// });
		},
		func_layer0b : (cb)=>{
			cga.walkList([
			[58, 92],
			], ()=>{
				cga.TurnTo(58, 94);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({x:75, y:93, delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer1 : (cb)=>{
			cga.walkList([
			[89, 75],
			], ()=>{
				waitFlower(0, '红花', '黄花', [89, 73], cb);
			});
		},
		func_layer1b : (cb)=>{
			cga.walkList([
			[163, 77],
			], ()=>{
				cga.TurnTo(165, 77);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第二层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer2 : (cb)=>{
			cga.walkList([
			[126, 100],
			], ()=>{
				waitFlower(1, '黄花', '绿花', [126, 102], cb);
			});
		},
		func_layer2b : (cb)=>{
			cga.walkList([
			[152, 88],
			], ()=>{
				cga.TurnTo(154, 88);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第三层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer3 : (cb)=>{
			cga.walkList([
			[122, 92],
			], ()=>{
				waitFlower(2, '绿花', '蓝花', [122, 90], cb);
			});
		},
		func_layer3b : (cb)=>{
			cga.walkList([
			[88, 40],
			], ()=>{
				cga.TurnTo(90, 40);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第四层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer4 : (cb)=>{
			cga.walkList([
			[100, 94],
			], ()=>{
				cga.SayWords('已到达黑色方舟入口，请组队完成剩余部分！', 0, 3, 1);
				cb(true);
			});
		}
	},
	{
		type : 2,
		name : '蓝组',
		desired_flowers : [
		'绿花',
		'黄花',
		'红花',
		],
		func_layer0 : (cb)=>{
			entrance([21, 108], [23, 108], [28, 108], cb)
			// cga.walkList([
			// [21, 108],
			// ], ()=>{
			// 	cga.TurnTo(23, 108);
			// 	cga.AsyncWaitNPCDialog(()=>{
			// 		cga.ClickNPCDialog(4, 0);
			// 		cga.AsyncWaitNPCDialog(()=>{
			// 			cga.ClickNPCDialog(32, 0);
			// 			cga.AsyncWaitNPCDialog(()=>{
			// 				cga.ClickNPCDialog(1, 0);
			// 				cga.AsyncWaitMovement({x:28, y:108, delay:1000, timeout:5000}, cb);
			// 			});
			// 		});
			// 	});
			// });
		},
		func_layer0b : (cb)=>{
			cga.walkList([
			[60, 141],
			], ()=>{
				cga.TurnTo(60, 142);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({x:74, y:141, delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer1 : (cb)=>{
			cga.walkList([
			[89, 131],
			], ()=>{
				waitFlower(0, '蓝花', '绿花', [89, 129], cb);
			});
		},
		func_layer1b : (cb)=>{
			cga.walkList([
			[147, 138],
			], ()=>{
				cga.TurnTo(149, 136);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第二层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer2 : (cb)=>{
			cga.walkList([
			[126, 102],
			], ()=>{
				waitFlower(1, '绿花', '黄花', [126, 100], cb);
			});
		},
		func_layer2b : (cb)=>{
			cga.walkList([
			[152, 108],
			], ()=>{
				cga.TurnTo(154, 108);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第三层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer3 : (cb)=>{
			cga.walkList([
			[54, 120],
			], ()=>{
				waitFlower(2, '黄花', '红花', [54, 118], cb);
			});
		},
		func_layer3b : (cb)=>{
			cga.walkList([
			[37, 121],
			], ()=>{
				cga.TurnTo(37, 119);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第四层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer4 : (cb)=>{
			cga.walkList([
			[100, 94],
			], ()=>{
				cga.SayWords('已到达黑色方舟入口，请组队完成剩余部分！', 0, 3, 1);
				cb(true);
			});
		}
	},
	{
		type : 3,
		name : '黄组',
		desired_flowers : [
		'红花',
		'蓝花',
		'绿花',
		'黄花',
		],
		func_layer0 : (cb)=>{
			entrance([21, 92], [23, 92], [28, 92], cb)
			// cga.walkList([
			// [21, 92],
			// ], ()=>{
			// 	cga.TurnTo(23, 92);
			// 	cga.AsyncWaitNPCDialog(()=>{
			// 		cga.ClickNPCDialog(4, 0);
			// 		cga.AsyncWaitNPCDialog(()=>{
			// 			cga.ClickNPCDialog(32, 0);
			// 			cga.AsyncWaitNPCDialog(()=>{
			// 				cga.ClickNPCDialog(1, 0);
			// 				cga.AsyncWaitMovement({x:28, y:92, delay:1000, timeout:5000}, cb);
			// 			});
			// 		});
			// 	});
			// });
		},
		func_layer0b : (cb)=>{
			cga.walkList([
			[59, 63],
			], ()=>{
				cga.TurnTo(61, 63);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({x:75, y:57, delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer1 : (cb)=>{
			cga.walkList([
			[89, 73],
			], ()=>{
				waitFlower(0, '黄花', '红花', [89, 75], cb);
			});
		},
		func_layer1b : (cb)=>{
			cga.walkList([
			[136, 48],
			], ()=>{
				cga.TurnTo(138, 48);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第二层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer2 : (cb)=>{
			cga.walkList([
			[70, 102],
			], ()=>{
				waitFlower(1, '红花', '蓝花', [70, 104], cb);
			});
		},
		func_layer2b : (cb)=>{
			cga.walkList([
			[84, 88],
			], ()=>{
				cga.TurnTo(86, 88);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第三层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer3 : (cb)=>{
			cga.walkList([
			[122, 90],
			], ()=>{
				waitFlower(2, '蓝花', '绿花', [122, 92], cb);
			});
		},
		func_layer3b : (cb)=>{
			cga.walkList([
			[101, 17],
			], ()=>{
				cga.TurnTo(101, 15);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第四层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer4 : (cb)=>{
			cga.walkList([
			[99, 83],
			], ()=>{
				waitFlower(3, '绿花', '黄花', [101, 83], ()=>{
					cga.SayWords('已换完花，请自行完成剩余部分！', 0, 3, 1);
					cb(true);				
				});
			});
		}
	},
	{
		type : 4,
		name : '绿组',
		desired_flowers : [
		'蓝花',
		'红花',
		'黄花',
		'绿花',
		],
		func_layer0 : (cb)=>{
			entrance([21, 104], [23, 104], [28, 104], cb)
			// cga.walkList([
			// [21, 104],
			// ], ()=>{
			// 	cga.TurnTo(23, 104);
			// 	cga.AsyncWaitNPCDialog(()=>{
			// 		cga.ClickNPCDialog(4, 0);
			// 		cga.AsyncWaitNPCDialog(()=>{
			// 			cga.ClickNPCDialog(32, 0);
			// 			cga.AsyncWaitNPCDialog(()=>{
			// 				cga.ClickNPCDialog(1, 0);
			// 				cga.AsyncWaitMovement({x:28, y:104, delay:1000, timeout:5000}, cb);
			// 			});
			// 		});
			// 	});
			// });
		},
		func_layer0b : (cb)=>{
			cga.walkList([
			[60, 121],
			], ()=>{
				cga.TurnTo(60, 123);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({x:75, y:121, delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer1 : (cb)=>{
			cga.walkList([
			[89, 129],
			], ()=>{
				waitFlower(0, '绿花', '蓝花', [89, 131], cb);
			});
		},
		func_layer1b : (cb)=>{
			cga.walkList([
			[164, 110],
			], ()=>{
				cga.TurnTo(164, 108);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第二层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer2 : (cb)=>{
			cga.walkList([
			[70, 104],
			], ()=>{
				waitFlower(1, '蓝花', '红花', [70, 102], cb);
			});
		},
		func_layer2b : (cb)=>{
			cga.walkList([
			[84, 112],
			], ()=>{
				cga.TurnTo(86, 112);
				cga.AsyncWaitNPCDialog((dlg)=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第三层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer3 : (cb)=>{
			cga.walkList([
			[54, 118],
			], ()=>{
				waitFlower(2, '红花', '黄花', [54, 120], cb);
			});
		},
		func_layer3b : (cb)=>{
			cga.walkList([
			[68, 97],
			], ()=>{
				cga.TurnTo(70, 95);
				cga.AsyncWaitNPCDialog((dlg)=>{
					cga.ClickNPCDialog(1, 0);
					cga.AsyncWaitMovement({map:'白色方舟·第四层', delay:1000, timeout:5000}, cb);
				});
			});
		},
		func_layer4 : (cb)=>{
			cga.walkList([
			[101, 83],
			], ()=>{
				waitFlower(3, '黄花', '绿花', [99, 83], ()=>{
					cga.SayWords('已换完花，请自行完成剩余部分！', 0, 3, 1);
					cb(true);				
				});
			});
		}
	},
	]
	
	var mineObject = null;
	
	var task = cga.task.Task('誓言之花', [
	{//0
		intro: '1.前往光之路调查（165.81）处石碑，选“是”进入白色方舟第一层。',
		workFunc: function(cb2){
			if(cga.needSupplyInitial())
			{
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(cb2, 3000, 'restart stage');
				});
				return;
			}
			
			if(cga.getItemCount('王冠') == 0)
			{
				// 跳转四转换花脚本
				global.cga = cga
				var rootdir = cga.getrootdir()
				var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
				var body = {
					path : rootdir + "\\交通脚本\\去白色方舟.js",
				}
				
				scriptMode.call_ohter_script(body)
				return;
			}
			cga.travel.newisland.toLiXiaIsland(()=>{
				cga.walkList([
				[90, 99, '国民会馆'],
				[108, 39, '雪拉威森塔１层'],
				[35, 96],
				], ()=>{
					cga.TurnTo(35, 94);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, 0);
									cga.AsyncWaitMovement({map:'辛梅尔', delay:1000, timeout:5000}, ()=>{
										cga.walkList([
										[207, 91, '光之路'],
										[165, 82]
										], ()=>{
											cga.TurnTo(165, 80);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(4, 0);
												cga.AsyncWaitMovement({map:'白色方舟·第一层', delay:1000, timeout:5000}, cb2);
											});
										});
									});
								});
							});
						});
					});
				});
			});
		}
	},
	{//1
		intro: '2.根据职业与对应守卫对话，获得对应的【誓言之花】并进入白色方舟迷宫。',
		workFunc: function(cb2){
			mineObject.func_layer0(cb2);
		}
	},
	{//2
		intro: '3.地图切到换花部分',
		workFunc: function(cb2){
			mineObject.func_layer0b(cb2);
		}
	},
	{//3
		intro: '4.白色方舟·第一层换花。',
		workFunc: function(cb2){
			mineObject.func_layer1(cb2);
		}
	},
	{//4
		intro: '5.白色方舟·第一层换花完成，去第二层。',
		workFunc: function(cb2){
			mineObject.func_layer1b(cb2);
		}
	},
	{//5
		intro: '6.白色方舟·第二层换花',
		workFunc: function(cb2){
			mineObject.func_layer2(cb2);
		}
	},
	{//6
		intro: '7.白色方舟·第二层换花完成，去第三层。',
		workFunc: function(cb2){
			mineObject.func_layer2b(cb2);
		}
	},
	{//7
		intro: '8.白色方舟·第三层换花',
		workFunc: function(cb2){
			mineObject.func_layer3(cb2);
		}
	},
	{//8
		intro: '9.白色方舟·第三层换花完成，去第四层。',
		workFunc: function(cb2){
			mineObject.func_layer3b(cb2);
		}
	},
	{//9
		intro: '10.白色方舟·第四层,战斗系组队，生产系换花。',
		workFunc: function(cb2){
			mineObject.func_layer4(cb2);
		}
	},
	{//10
		intro: '11.战斗系过黑色方舟，生产系检查晋升物品。',
		workFunc: function(cb2){
			if(groupName == 'red' || groupName == 'blue'){
				// 黑色方舟通用战斗配置
				configMode.func('节能模式')
				// 等待找到暗黑龙后，读取手动战斗配置。
				var retry = ()=>{
					var unit = cga.GetMapUnits().find((u)=>{
						if(u.valid == 2 && u.type == 1 && u.model_id != 0 && (u.flags & 4096) != 0 && u.unit_name == '暗黑龙'){
							return true;
						}
						return false;
					});
					if(unit){
						cga.waitForLocation({pos:[unit.xpos, unit.ypos]}, ()=>{
							configMode.manualLoad('手动BOSS')
							cga.waitForLocation({mapindex: 59934, pos:[145, 56]}, ()=>{
								setTimeout(cb2, 1000, true);
							});
						});
						return
					}
					setTimeout(retry, 1000);
				}
				// 防止脚本出错，自动重启脚本
				cga.gui.LoadScript({
					autorestart : false,
				}, (err, result)=>{
					console.log('【UNA脚本提示：】为了防止脚本出错自动重启，现关闭【自动重启脚本】')
					console.log('【UNA脚本提示：】接下来请手动在黑色方舟寻找暗黑龙，它在迷宫随机出现，人物会在靠近暗黑龙0或1格距离的时候，读取手动打BOSS的战斗配置，望周知。')
					retry()
				})
			}else{// 生产系
				var retry = ()=>{
					if(cga.getItemCount(productDict[jobmainname].item) > 0){
						console.log('你已持有晋级物品，具备晋级资格')
						setTimeout(cb2, 1000, true);
						return
					}
					setTimeout(retry, 1000);
				}
				retry()
			}
		}
	},
	{//11
		intro: '12.与目送者或见证者对话，生产系需要提前准备好晋级物品。',
		workFunc: function(cb2){
			if(groupName == 'red' || groupName == 'blue'){

				var teamplayers = cga.getTeamPlayers();
				var teammates = []
				for(var i in teamplayers){
					teammates[i] = teamplayers[i].name;
				}
				
				cga.isTeamLeader = (teammates[0] == cga.GetPlayerInfo().name || teammates.length == 0) ? true : false;

				if(cga.isTeamLeader){
					cga.walkList([
						[149, 78],
						[150, 78],
						[149, 78],
						[150, 78],
						[149, 78],
						], ()=>{
							console.log('到达目送者面前，由持有龙心的人对话。')
						}
					);
				}
				// 龙心持有者需要和目送者对话
				if(cga.getItemCount('龙心') > 0){
					cga.waitForLocation({mapindex: 59934, pos:[149,79]}, ()=>{
						setTimeout(() => {
							cga.AsyncWaitNPCDialog(dialogHandler);
							cga.TurnTo(149,79);
						}, 5000);
					});
				}
				// 目送者传送至露比房间
				cga.waitForLocation({mapindex: 59934, pos:[93,12]}, ()=>{
					var leaveteam = ()=>{
						if(cga.getTeamPlayers().length){
							cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
							return
						}
						setTimeout(leaveteam, 1000);
					}

					leaveteam()

					cga.walkList([
						[98, 15],
						], ()=>{
							cga.AsyncWaitNPCDialog(dialogHandler);
							cga.TurnTo(99, 15);
							cga.waitForLocation({mapindex: 59505, pos:[166, 87]}, ()=>{
								setTimeout(cb2, 1000, true);
								return
							});
						}
					);
				});
			}else{// 生产系
				console.log('TODO生产系需要完成逻辑，注意可以提升第11格栏位，和Lv.11的物品制作方法')
				cga.waitForLocation({mapindex: 59505, pos:[166, 87]}, ()=>{
					setTimeout(cb2, 1000, true);
				});
			}
			
		}
	},
	{//12
		intro: '13.如果晋级之后再次完成任务（完成任务但不晋级不算），会被传送至白色方舟第11格技能栏提升或者生产11级配方获取房间，去拿取应有的报酬。',
		workFunc: function(cb2){
			if(groupName == 'red' || groupName == 'blue'){
				cga.walkList([
					[51, 131],
					], ()=>{
						cga.AsyncWaitNPCDialog(dialogHandler);
						cga.TurnTo(51, 132);
						cga.waitForLocation({mapindex: 59505, pos:[166, 87]}, ()=>{
							setTimeout(cb2, 1000, true);
							return
						});
					}
				);
			}else{// 生产系
				cga.walkList([
					[63, 60],
					], ()=>{
						cga.AsyncWaitNPCDialog(dialogHandler);
						cga.TurnTo(64, 60);
						cga.waitForLocation({mapindex: 59505, pos:[166, 87]}, ()=>{
							setTimeout(cb2, 1000, true);
							return
						});
					}
				);
			}
			
		}
	},
	],
	[//任务阶段是否完成
		function(){//1.前往光之路调查（165.81）处石碑，选“是”进入白色方舟第一层。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x < 23) ? true : false;
		},
		function(){//2.根据职业与对应守卫对话，获得对应的【誓言之花】并进入白色方舟迷宫。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x >= 23 && cga.GetMapXY().x <= 70) ? true : false;
		},
		function(){//3.地图切到换花部分
			return (cga.GetMapName() == '白色方舟·第一层' && cga.GetMapXY().x > 70 && cga.getItemCount(flowerTable[0][ mineObject.desired_flowers[0] ]) == 0) ? true : false;
		},
		function(){//4.白色方舟·第一层换花。
			return (cga.GetMapName() == '白色方舟·第一层' && cga.getItemCount(flowerTable[0][ mineObject.desired_flowers[0] ]) > 0) ? true : false;
		},
		function(){//5.白色方舟·第一层换花完成，去第二层。
			return (cga.GetMapName() == '白色方舟·第二层' && cga.getItemCount(flowerTable[1][ mineObject.desired_flowers[1] ]) == 0) ? true : false;
		},
		function(){//6.白色方舟·第二层换花
			return (cga.GetMapName() == '白色方舟·第二层' && cga.getItemCount(flowerTable[1][ mineObject.desired_flowers[1] ]) > 0) ? true : false;
		},
		function(){//7.白色方舟·第二层换花完成，去第三层。
			return (cga.GetMapName() == '白色方舟·第三层' && cga.getItemCount(flowerTable[2][ mineObject.desired_flowers[2] ]) == 0) ? true : false;
		},
		function(){//8.白色方舟·第三层换花
			return (cga.GetMapName() == '白色方舟·第三层' && cga.getItemCount(flowerTable[2][ mineObject.desired_flowers[2] ]) > 0) ? true : false;
		},
		function(){//9.白色方舟·第三层换花完成，去第四层。
			if (cga.GetMapName() == '白色方舟·第四层'){
				if(mineObject.desired_flowers[3] != undefined)
					return cga.getItemCount(flowerTable[2][ mineObject.desired_flowers[3] ]) > 0;
			}
			
			return false;
		},
		function(){//10.白色方舟·第四层,战斗系组队，生产系换花。
			return false;
		},
		function(){//11.战斗系过黑色方舟，生产系检查晋升物品。
			return false;
		},
		function(){//12.与见证者对话，生产系需要提前准备好晋级物品。
			var index = cga.GetMapIndex().index3;
			var XY = cga.GetMapXY();
			return (index == 59934 && XY.x > 41 && XY.x < 86 && XY.y > 53 && XY.y < 137) ? true : false;
		},
	]
	);

	cga.SayWords('欢迎使用CGA通用四转脚本换花，红组输入‘1’，蓝组输入‘2’，黄组输入‘3’，绿组输入‘4’。UNA脚本提供自动分组功能，2秒后自动分组', 0, 3, 1);
	
	var chooseteam = ()=>{

		if(red.indexOf(jobmainname) != -1){
			groupName = 'red'
			cga.SayWords('1', 0, 3, 1);
		}else if(blue.indexOf(jobmainname) != -1){
			groupName = 'blue'
			cga.SayWords('2', 0, 3, 1);
		}else if(yellow.indexOf(jobmainname) != -1){
			groupName = 'yellow'
			cga.SayWords('3', 0, 3, 1);
		}else{
			groupName = 'green'
			cga.SayWords('4', 0, 3, 1);
		}
		return
	}

	chooseteam()

	cga.waitTeammateSay((player, msg)=>{

		if(player.is_me == true){
			
			for(var i in mineArray){
				if(mineArray[i].type == parseInt(msg)){
					mineObject = mineArray[i];
					break;
				}
			}
			
			if(mineObject != null){
				cga.SayWords('当前职业：【'+jobmainname+'】，应走【'+mineObject.name+'】。', 0, 3, 1);
				task.doTask(()=>{
					// 阻塞，防止不断重启脚本
					while (true) {
				
					}
				});
				return false;
			}
		}

		return true;
	});
});