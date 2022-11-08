var cga = require('../cgaapi')(function(){

	global.cga = cga;
	var rootdir = cga.getrootdir()
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	var playerinfo = cga.GetPlayerInfo();
	// 提取本地职业数据
	const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(playerinfo.job)
	var category = professionalInfo.category
	
	var teammates = [
		"UNAの格斗2",
    ];
	
	// var teamplayers = cga.getTeamPlayers();

	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;
	
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

	var saveAndSupply = (isPro, cb)=>{
		if(cga.getTeamPlayers().length > 0){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(saveAndSupply, 1000, isPro, cb);
			return
		}
		cga.travel.saveAndSupply(isPro, cb)
		return
	}

	var gather = (gatherPos, cb)=>{
		if(cga.isTeamLeader){
			cga.walkList([
				gatherPos,
				], ()=>{
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							setTimeout(cb, 1000, true);
							return
						}
						setTimeout(gather, 1000, gatherPos, cb);
					});
				})
		}else {
			cga.walkList([
				cga.getRandomSpace(gatherPos[0], gatherPos[1])
				], ()=>{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							cb(true)
							return;
						}
						setTimeout(gather, 1000, gatherPos, cb);
					});
				})
		}
	}

	var pass = (npcPos, originIndex, targetIndex, wannaPos, cb)=>{
		cga.waitForLocation({mapindex : originIndex, pos : npcPos}, ()=>{
			var retry = ()=>{
				// 如果切换了地图，则进行下一步判断
				if (cga.GetMapIndex().index3 == targetIndex){
					// 如果还要求了切换之后的坐标，则判断
					if(wannaPos && (cga.GetMapXY().x != wannaPos[0] || cga.GetMapXY().y != wannaPos[1])){
						setTimeout(retry, 1000);
						return
					}
					// index和坐标都符合预期，则通过
					setTimeout(cb, 1000, true);
					return
				}
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.TurnTo(npcPos[0], npcPos[1]);
				setTimeout(retry, 2500);
				return
			}
			setTimeout(retry, 1500);
		});
		return
	}

	var task = cga.task.Task('维诺亚-加纳开传送一条龙', [
	{//0
		intro: '0.队员集合',
		workFunc: function(cb2){
			healMode.func(()=>{
				cga.travel.falan.toStone('C', (r)=>{
					gather([37, 78], cb2)
				});
			})
		}
		
	},
	{//1
		intro: '1.出发去维诺亚村',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				//去维诺亚洞窟前过20级限制门卫
				var leader_go_1 = ()=>{
					cga.walkList([
					[473, 316],
					[473, 317],
					[473, 316],
					[473, 317],
					[473, 316],
					[473, 317],
					[473, 316],
				], ()=>{
					pass([472, 316], 100, 11000, [20,14], ()=>{
						gather([20, 15], ()=>{
							cga.walkList([
								[20,59,'维诺亚洞穴 地下2楼'],
								[24,81,'维诺亚洞穴 地下3楼'],
								[26,64,'芙蕾雅'],
								[330,480,'维诺亚村'],
								], ()=>{
									cga.waitForLocation({mapindex : cga.travel.info['维诺亚村'].mainindex}, ()=>{
										cb2(true)
									});
								});
						})
					},)
					});
				}
				if(cga.GetMapName() != '法兰城'){
					cga.travel.falan.toStone('C', ()=>{
						cga.walkList([
							[41, 98, '法兰城'],
							//南门
							[153, 241, '芙蕾雅'],
						], leader_go_1)
					})
				}else{
					cga.walkList([
						//南门
						[153, 241, '芙蕾雅'],
					], leader_go_1)
				}
			} else {
				pass([472, 316], 100, 11000, [20,14], ()=>{
					var retry = ()=>{
						cga.addTeammate(teammates[0], (r)=>{
							if(r){
								cga.waitForLocation({mapindex : cga.travel.info['维诺亚村'].mainindex}, ()=>{
									cb2(true)
								});
								return;
							}
							setTimeout(retry, 1000);
						});
					}
					retry()
				},)
			}
		}
	},
	{//2
		intro: '2.维诺亚村开传送并补给',
		workFunc: function(cb2){
			saveAndSupply(category == '魔法系' ? true : false, ()=>{
				gather([59, 47], cb2)
			})
		}
	},
	{//3
		intro: '3.过海底',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				cga.walkList(
					[
						[67, 46, '芙蕾雅'],
						[343, 497, '索奇亚海底洞窟 地下1楼'],
						[18, 34, '索奇亚海底洞窟 地下2楼'],
						[27, 29, '索奇亚海底洞窟 地下1楼'],
						[7,37]
						], ()=>{
							cga.AsyncWaitNPCDialog(dialogHandler);
							cga.TurnTo(8, 37);
							cga.waitForLocation({mapindex : 300, pos : [240, 265]}, ()=>{
								cb2(true)
							});
					});
			} else {
				cga.waitForLocation({mapindex : 300, pos : [240, 265]}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//4
		intro: '4.出发去奇利村',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				cga.walkList([
					[274, 294, '奇利村'],
				], ()=>{
					cga.waitForLocation({mapindex : cga.travel.info['奇利村'].mainindex}, ()=>{
						cb2(true)
					});
					});
			} else {
				cga.waitForLocation({mapindex : cga.travel.info['奇利村'].mainindex}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//5
		intro: '5.奇利村开传送并补给',
		workFunc: function(cb2){
			saveAndSupply(category == '魔法系' ? true : false, ()=>{
				gather([77, 76], cb2)
			})
		}
	},
	{//6
		intro: '6.过洪恩大风洞（角笛大风穴）',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				cga.walkList([
					[79, 76, '索奇亚'],
					[356, 334, '角笛大风穴'],
					[133, 26, '索奇亚'],
			], ()=>{
				setTimeout(() => {
					cb2(true)
				}, 2000);
				});
			} else {
				cga.waitForLocation({mapindex : 300, pos : [402,304]}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//7
		intro: '7.出发去加纳村',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				cga.walkList([
					[704, 147, '加纳村'],
				], ()=>{
					cga.waitForLocation({mapindex : cga.travel.info['加纳村'].mainindex}, ()=>{
						cb2(true)
					});
					});
			} else {
				cga.waitForLocation({mapindex : cga.travel.info['加纳村'].mainindex}, ()=>{
					cb2(true)
				});
			}
		}
	},
	{//8
		intro: '8.加纳村开传送并补给',
		workFunc: function(cb2){
			saveAndSupply(category == '魔法系' ? true : false, ()=>{
				cb2(true)
			})
		}
	},
	],
	[//任务阶段是否完成
		function(){// 0.队员集合
			return false;
		},
		function(){// 1.出发去维诺亚村
			return (cga.travel.switchMainMap() == '维诺亚村') ? true : false;
		},
		function(){// 2.维诺亚村开传送并补给
			var config = cga.loadPlayerConfig();
			return (cga.GetMapIndex().index3 == cga.travel.info['维诺亚村'].mainindex && config && config['维诺亚村'] && !cga.needSupplyInitial()) ? true :false
		},
		function(){// 3.过海底
			return (cga.GetMapIndex().index3 == 300) ? true : false;
		},
		function(){// 4.出发去奇利村
			return (cga.travel.switchMainMap() == '奇利村') ? true : false;
		},
		function(){// 5.奇利村开传送并补给
			var config = cga.loadPlayerConfig();
			return (cga.GetMapIndex().index3 == cga.travel.info['奇利村'].mainindex && config && config['奇利村'] && !cga.needSupplyInitial()) ? true :false
		},
		function(){// 6.过洪恩大风洞（角笛大风穴）
			return (cga.travel.switchMainMap() == '索奇亚加纳域') ? true : false;
		},
		function(){// 7.出发去加纳村
			return (cga.travel.switchMainMap() == '加纳村') ? true : false;
		},
		function(){// 8.加纳村开传送并补给
			var config = cga.loadPlayerConfig();
			return (cga.GetMapIndex().index3 == cga.travel.info['加纳村'].mainindex && config && config['加纳村'] && !cga.needSupplyInitial()) ? true :false
		},
	]
	);

	configMode.func('节能模式')
	
	task.doTask(()=>{
		var config = cga.loadPlayerConfig();
		if(config && config['allstonedone']){
			console.log('你已开启全部传送，脚本结束')
		}else{
			var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
			var body = {
				path : rootdir + "\\交通脚本\\单人开全部传送(非战斗系40级以上).js",
			}
			scriptMode.call_ohter_script(body)
		}
	});
});