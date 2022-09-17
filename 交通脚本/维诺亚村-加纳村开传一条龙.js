var cga = require('../cgaapi')(function(){

	global.cga = cga;
	var rootdir = cga.getrootdir()
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	var playerinfo = cga.GetPlayerInfo();
	
	var teammates = [
        "UNAの格斗2",
    ];
	
	var teamplayers = cga.getTeamPlayers();

	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;
	
	var task = cga.task.Task('维诺亚-加纳开传送一条龙', [
	{//0
		intro: '0.队员集合',
		workFunc: function(cb2){
			var gather = ()=>{
					if(cga.isTeamLeader){
						cga.WalkTo(140, 106);
						cga.waitTeammates(teammates, (r)=>{
							if(r){
								cga.travel.falan.toStone('C', (r)=>{
									cga.walkList([
										[34, 89],
										[34, 88],
										[34, 89],
										[34, 88],
										[34, 89],
									], (r)=>{
										cga.TurnTo(36, 87);
										setTimeout(()=>{
											cb2(true)
										}, 3500);
									});
								});	
								return;
							}
							setTimeout(gather, 1000);
						});
			
					} else {
						cga.addTeammate(teammates[0], (r)=>{
							if(r){
								cb2(true)
								return;
							}
							setTimeout(gather, 1000);
						});
					}
			}
			// 入口
			cga.travel.newisland.toStone('X', ()=>{
				gather()
			})
		}
	},
	{//1
		intro: '1.先去维诺亚村开传送',
		workFunc: function(cb2){
			//队员进入维诺亚洞穴，找队长组队
			var teammates_wait_1 = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						teammates_go_1();
						return;
					}
					setTimeout(teammates_wait_1, 1000);
				});
			}

			var teammates_go_1 = ()=>{

				var retry = ()=>{

					cga.TurnTo(5, 4);
					cga.AsyncWaitNPCDialog((err)=>{
						if(err){
							retry();
							return;
						}
						setTimeout(()=>{
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
						cb2(true);
					});

				}
				retry()
			}

			var leader_wait_1 = ()=>{
				cga.WalkTo(20, 15);
				cga.waitTeammates(teammates, (r)=>{
					if(r){
						leader_go_2();
						return;
					}
					setTimeout(leader_wait_1, 1000);
				});
			}

			var leader_go_2 = ()=>{
				cga.walkList([
					[20,59,'维诺亚洞穴 地下2楼'],
					[24,81,'维诺亚洞穴 地下3楼'],
					[26,64,'芙蕾雅'],
					[330,480,'维诺亚村'],
					[40,36,'村长的家'],
					[18,10,'村长家的小房间'],
					[8,2,'维诺亚村的传送点'],
					[4,3],
					[4,4],
					[4,3],
					[4,4],
					[4,3],
					[4,4],
					[4,3],
					], ()=>{
						cga.TurnTo(5, 4);
						setTimeout(()=>{
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
						//等待队员打1，然后进入下一步
						cga.waitTeammateSayNextStage(teammates, cb2);
						});
					
			}
			// 本步骤入口
			if(cga.isTeamLeader){
				var settle = ()=>{
					if(cga.GetMapName() != '法兰城'){
						cga.travel.falan.toStone('C', ()=>{
							cga.walkList([
								[41, 98, '法兰城'],
								//南门
								[153, 241, '芙蕾雅'],
							], leader_go_1)
						})
					}
					else{
						cga.walkList([
							//南门
							[153, 241, '芙蕾雅'],
						], leader_go_1)
					}
				}

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
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					cga.TurnTo(472, 316);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, -1);
						cga.AsyncWaitMovement({map:'维诺亚洞穴 地下1楼', delay:1000, timeout:5000}, (err)=>{
							if(err){
								console.error('出错，请检查..')
								return;
							}
							setTimeout(leader_wait_1, 1500);
							});
						});
					});
				}
				settle()
			} else {
				var retry = ()=>{
					cga.TurnTo(472, 316);
					cga.AsyncWaitNPCDialog(function(err){
						if(err){
							cga.walkList([ [473, 317], [473, 316] ], retry);
							return;
						}
						cga.ClickNPCDialog(4, -1);
						setTimeout(teammates_wait_1, 3000);
					});
				}
				
				cga.waitForLocation({mapname : '芙蕾雅', pos : [473, 317], leaveteam : true}, retry);
			}
		}
	},
	{//2
		intro: '2.过海底',
		workFunc: function(cb2){

			var go = ()=>{
				cga.walkList(
				(cga.GetMapName() == '芙蕾雅') ? 
				[
					[343, 497, '索奇亚海底洞窟 地下1楼'],
					[18, 34, '索奇亚海底洞窟 地下2楼'],
					[27, 29, '索奇亚海底洞窟 地下1楼'],
					[7,37]
				]
				:
				[
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[10, 16, '维诺亚村'],
				[67, 46, '芙蕾雅'],
				[343, 497, '索奇亚海底洞窟 地下1楼'],
				[18, 34, '索奇亚海底洞窟 地下2楼'],
				[27, 29, '索奇亚海底洞窟 地下1楼'],
				[7,37]
				]
				, ()=>{
					cga.TurnTo(8, 37);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1)
							cga.AsyncWaitMovement({map:'索奇亚', delay:1000, timeout:5000}, (err)=>{
								if(err){
									console.error('出错，请检查..')
									return;
								}
								cb2(true);
								});
							});
						});
				});
			}
			
			if(cga.isTeamLeader){
				go();
			} else {
				console.log('等待过海进入索奇亚..')
				cga.waitForLocation({mapname : '索奇亚'}, cb2);
			}
		}
	},
	{//3
		intro: '3.去奇力村开传送',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					[274, 294, '奇利村'],
					// 村长的家map.index3是3212
					[50, 63, 3212],
					// 去传送房间的过道房间是3214
					[10, 15, 3214],
					[5, 3, '奇利村的传送点'],
					[12, 8],
					[12, 9],
					[12, 8],
					[12, 9],
					[12, 8]
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('1', 0, 3, 1);						
					}, 1500);
					//等待队员打1，然后进入下一步
					cga.waitTeammateSayNextStage(teammates, cb2);
					});
			}
			var teammates_go_1 = ()=>{

				var retry = ()=>{
					console.log('等待登记传送点..')
					cga.TurnTo(13, 8);
					cga.AsyncWaitNPCDialog((err)=>{
						if(err){
							retry();
							return;
						}
						setTimeout(()=>{
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
						cb2(true);
					});

				}
				retry()
			}
			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '奇利村的传送点', leaveteam : false}, teammates_go_1);
			}
		}
	},
	{//4
		intro: '4.在奇力村补给，并过洪恩大风洞（角笛大风穴）',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					// 去传送房间的过道房间是3214
					[7, 6, 3214],
					// 村长的家map.index3是3212
					[7, 1, 3212],
					[1, 8, '奇利村'],
					[64, 56,'医院'],
					// 考虑到带开传一般是攻人 + 非战斗系，那么就去非资深护士补给。
					[11, 6],
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(11, 5);				
					}, 1500);
					setTimeout(()=>{
						leader_go_2();
					}, 5000);
					});
			}

			var leader_go_2 = ()=>{
				cga.walkList([
					[3, 9, '奇利村'],
					[79, 76, '索奇亚'],
					[356, 334, '角笛大风穴'],
					[133, 26, '索奇亚'],
				], ()=>{
					cb2(true)});
			}

			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '索奇亚', pos : [402, 304],leaveteam : false}, cb2);
			}
		}
	},
	{//5
		intro: '5.出了洪恩大风洞之后，去加纳村开传送。',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					[704, 147, '加纳村'],
					[36, 40, '村长的家'],
					[17, 6, '加纳村的传送点'],
					[15, 8],
					[14, 8],
					[15, 8],
					[14, 8],
					[15, 8],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('1', 0, 3, 1);						
					}, 1500);
					//等待队员打1，然后进入下一步
					cga.waitTeammateSayNextStage(teammates, cb2);
					});
			}

			var teammates_go_1 = ()=>{

				var retry = ()=>{
					console.log('等待登记传送点..')
					cga.TurnTo(15, 7);
					cga.AsyncWaitNPCDialog((err)=>{
						if(err){
							retry();
							return;
						}
						setTimeout(()=>{
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
						cb2(true);
					});

				}
				retry()
			}
			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '加纳村的传送点',leaveteam : false}, teammates_go_1);
			}
		}
	},
	// {//6
	// 	intro: '6.加纳村开完传送，切换至杰诺瓦-蒂娜-阿巴尼斯一条龙',
	// 	workFunc: function(cb2){
	// 		// global.cga是给【公共模块\\跳转其它脚本】使用的
	// 		global.cga = cga
	// 		var rootdir = cga.getrootdir()
	// 		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
	// 		var body = {
	// 			path : rootdir + "\\交通脚本\\杰诺瓦镇-蒂娜村-阿巴尼斯村开传一条龙.js",
	// 		}
	// 		scriptMode.call_ohter_script(body)
	// 		cb2(true);
	// 	}
	// },
	],
	[//任务阶段是否完成
		// function(){
		// 	return (cga.getItemCount('火把') >= 1) ? true : false;
		// },
		// function(){
		// 	return (cga.GetMapName() == '叹息之森林') ? true : false;
		// },
		// function(){
		// 	return (cga.getItemCount('树苗？') >= 1) ? true : false;
		// },
		// function(){
		// 	return (cga.getItemCount('生命之花') >= 1) ? true : false;
		// },
		// function(){
		// 	return false;
		// },
	]
	);
	configMode.func('节能模式')
	task.doTask(()=>{
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\交通脚本\\单人开全部传送(非战斗系40级以上).js",
		}
		scriptMode.call_ohter_script(body)
	});
});