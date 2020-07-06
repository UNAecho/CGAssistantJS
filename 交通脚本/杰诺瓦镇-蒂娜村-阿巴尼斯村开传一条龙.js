var cga = require('../cgaapi')(function(){
	//队员信息
	var playerinfo = cga.GetPlayerInfo();
	//手动输入队友，方便脚本直接加队伍，省去手动组队切窗口的麻烦
	var teammates = ["UNAの弓","UNAの格斗2","UNAの造斧","UNAの护士","UNAの封印"];
	
	var teamplayers = cga.getTeamPlayers();

	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;

	//任务核心流程
	var task = cga.task.Task('杰诺瓦镇-蒂娜村-阿巴尼斯村开传一条龙', [
	{//0
		intro: '0.队员集合',
		workFunc: function(cb2){
			var gather = ()=>{
					if(cga.isTeamLeader){
						cga.WalkTo(140, 106);
						cga.waitTeammates(teammates, (r)=>{
							if(r){
								cb2(true)
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
			cga.travel.newisland.toStone('X', ()=>{
				gather()
			})
		}
	},
	{//1
		intro: '1.从法兰城侧过海底，直接在杰诺瓦开传送',
		workFunc: function(cb2){
			//队员进入地图，找队长组队
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

				//和传送石NPC对话
				var retryNpc = ()=>{
					cga.TurnTo(7, 7);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg && dlg.message && (dlg.message.indexOf('欢迎来') >= 0 || dlg.message.indexOf('一个一个') >= 0)){
							if(err){
								retryNpc();
								return;
							}
							setTimeout(()=>{
								cga.SayWords('1', 0, 3, 1);	
								cb2(true)
							}, 1500);
						}
						else
						{
							setTimeout(retryNpc, 500);
						}
					});
				}
				retryNpc()
			}
			//队长在洞穴入口处等待队员加队
			var leader_wait_1 = ()=>{
				cga.WalkTo(21, 33);
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
					[20,8,'莎莲娜海底洞窟 地下2楼'],
					[11,9,'莎莲娜海底洞窟 地下1楼'],
					[24,11,'莎莲娜'],
					[217,455,'杰诺瓦镇'],
					[58,43,'村长的家'],
					[13,7,'杰诺瓦镇的传送点'],
					[6,7],
					[7,8],
					[6,7],
					[7,8],
					[6,7],
					[7,8],
					], ()=>{
						setTimeout(()=>{
	                     cga.TurnTo(7, 7);
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
						//等待队员打1，然后进入下一步
						cga.waitTeammateSayNextStage(teammates, cb2);
						});
					
			}

			// 程序第一步入口方法
			if(cga.isTeamLeader){
				var settle = ()=>{
					if(cga.GetMapName() != '法兰城'){
						cga.travel.falan.toStone('C', ()=>{
							cga.walkList([
								[34,89]
							], ()=>{
								cga.TurnTo(36, 87);
								setTimeout(() => {
									cga.walkList([
										//里谢里雅堡西门
										[17, 53, '法兰城'],
										//西门
										[22, 88, '芙蕾雅'],
									], leader_go_1)
								}, 5000);
							})
						
						})
					}
					else{
						cga.walkList([
							//西门
							[22, 88, '芙蕾雅'],
						], leader_go_1)
					}
				}

				//去莎莲娜海底隧道前过40级限制门卫
				var leader_go_1 = ()=>{		
					cga.walkList([
					[201, 166],
					[200, 166],
					[201, 166],
					[200, 166],
					[201, 166],
				], ()=>{
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					cga.TurnTo(201, 165);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, -1)
						cga.AsyncWaitMovement({map:15000, delay:1000, timeout:5000}, (err)=>{
							if(err){
								console.error('出错，请检查..')
								return;
							}
							setTimeout(leader_wait_1, 1500);
							});
						});
					});
				}
				//程序第一步调用
				settle()
			} else {
				var retry = ()=>{
					cga.TurnTo(201, 165);
					cga.AsyncWaitNPCDialog(function(err){
						if(err){
							cga.walkList([ [201, 166], [200, 166], ], retry);
							return;
						}
						cga.ClickNPCDialog(1, -1);
						setTimeout(teammates_wait_1, 3000);
					});
				}
				
				cga.waitForLocation({mapname : '芙蕾雅', pos : [201, 166], leaveteam : true}, retry);
			}
		}
	},
	{//2
		intro: '2.补给之后出杰诺瓦镇',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					[14,6,'村长的家'],
					[1,10,'杰诺瓦镇'],
					[44,33,'医院'],
					// 考虑到带开传一般是攻人 + 非战斗系，那么就去非资深护士补给。
					[10,5]
					
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(12, 5);				
					}, 1500);
					setTimeout(()=>{
						leader_go_2();
					}, 5000);
					});
			}

			var leader_go_2 = ()=>{
				cga.walkList([
					[1,9,'杰诺瓦镇'],
					[71,18,'莎莲娜'],
				], ()=>{
					cb2(true)});
			}

			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '莎莲娜', leaveteam : false}, cb2);
			}
		}
	},
	{//3
		intro: '3.去蒂娜村开传送，注意只有白天是能去蒂娜村的，夜晚会被梦游村民fuck，夜晚地图index4201',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					// 村长的家map.index3是3212
					[29, 60, '村长的家'],
					// 去传送房间的过道房间是3214
					[9, 6, 4213],
					[7, 12, 4214],
					[12, 6,'蒂娜村的传送点'],
					[7, 5],
					[7, 6],
					[7, 5],
					[7, 6],
					[7, 5],
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(6, 5);
						cga.SayWords('1', 0, 3, 1);						
					}, 1500);
					//等待队员打1，然后进入下一步
					cga.waitTeammateSayNextStage(teammates, cb2);
					});
			}
			//在外面等候夜晚过去
			var leader_go_2 = ()=>{
				waittimems = 30000
				cga.walkList([
					[29,21,'莎莲娜']
					// 村长的家map.index3是3212
				], ()=>{
					setTimeout(()=>{
						console.log('等待天明..')
						cga.walkList([
							[570, 275, '蒂娜村'],
						],() => {
							cga.AsyncWaitMovement({map:'蒂娜村', delay:1000, timeout:5000}, (err)=>{
								mapindex = cga.GetMapIndex().index3;
								if(mapindex == 4200){
									console.log('天亮了，可以继续了')
									leader_go_1()
								}
								else{
									console.log('还是晚上，继续出去等。' + waittimems/1000 + ' 秒之后再来')
									leader_go_2()
								}
								});
						}, 1500)
					}, waittimems);
					});

			}
			var teammates_go_1 = ()=>{

				//和传送石NPC对话
					var retryNpc = ()=>{
						cga.TurnTo(6, 5);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if(dlg && dlg.message && (dlg.message.indexOf('欢迎来') >= 0 || dlg.message.indexOf('一个一个') >= 0)){
								if(err){
									retryNpc();
									return;
								}
								setTimeout(()=>{
									cga.SayWords('1', 0, 3, 1);	
									cb2(true)
								}, 1500);
							}
							else
							{
								setTimeout(retryNpc, 500);
							}
						});
					}
					retryNpc()
			}
			if(cga.isTeamLeader){
				cga.walkList([
					[570, 275, '蒂娜村'],
				], ()=>{
					cga.AsyncWaitMovement({map:'蒂娜村', delay:1000, timeout:5000}, (err)=>{
						if(err){
							console.error('出错，请检查..')
							return;
						}
						mapindex = cga.GetMapIndex().index3;
						if(mapindex == 4200){
							leader_go_1()
						}
						else{
							leader_go_2()
						}
						});
					});

			} else {
				cga.waitForLocation({mapname : '蒂娜村的传送点', leaveteam : false}, teammates_go_1);
			}
		}
	},
	{//4
		intro: '4.蒂娜村补给，出村准备回到杰诺瓦中转',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					[11,2,4214],
					[7,1,4213],
					[1,7,4212],
					[1,7,'蒂娜村'],
					[34,25,'医院'],
					// 考虑到带开传一般是攻人 + 非战斗系，那么就去非资深护士补给。
					[12,9]
					
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(12, 7);
					}, 1500);
					setTimeout(()=>{
						leader_go_2();
					}, 5000);
					});
			}

			var leader_go_2 = ()=>{
				cga.walkList([
					[1,9,'蒂娜村'],
					[29,21,'莎莲娜'],
				], ()=>{
					cb2(true)});
			}

			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '莎莲娜', leaveteam : false}, cb2);
			}
		}
	},
	{//5
		intro: '5.返回杰诺瓦镇中专补给，准备去阿巴尼斯村',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					[264,434,'杰诺瓦镇'],
					[44,33,'医院'],
					// 考虑到带开传一般是攻人 + 非战斗系，那么就去非资深护士补给。
					[10,5]
					
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(12, 5);				
					}, 1500);
					setTimeout(()=>{
						leader_go_2();
					}, 5000);
					});
			}

			var leader_go_2 = ()=>{
					cga.walkList([
						[1,9,'杰诺瓦镇'],
						[31,27,'莎莲娜'],
					], ()=>{
						cb2(true)});
				}

			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '莎莲娜', pos : [224, 442],leaveteam : false}, cb2);
			}
		}
	},
	{//6
		intro: '6.出杰诺瓦镇，过通往阿巴尼斯的地下道，来到阿巴尼斯开传送',
		workFunc: function(cb2){
			var leader_go_1 = ()=>{
				cga.walkList([
					//杰诺瓦侧入口
					[235,338,'莎莲娜西方洞窟'],
					[45,9,14001],
					[57,13,14002],
					[36,7,'莎莲娜'],
					[183,161,'阿巴尼斯村'],
					[36,54,'村长的家'],
					[6,5,4313],
					[9,9,'阿巴尼斯村的传送点'],
					[5,14],
					[4,14],
					[5,14],
					[4,14],
					[5,14],
					[4,14],
				], ()=>{
					setTimeout(()=>{
						cga.TurnTo(5,15)
						cga.SayWords('1', 0, 3, 1);						
					}, 1500);
					//等待队员打1，然后进入下一步
					cga.waitTeammateSayNextStage(teammates, cb2);
					});
			}

			var teammates_go_1 = ()=>{

				//和传送石NPC对话
					var retryNpc = ()=>{
						cga.TurnTo(5, 15);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							if(dlg && dlg.message && (dlg.message.indexOf('欢迎来') >= 0 || dlg.message.indexOf('一个一个') >= 0)){
								if(err){
									retryNpc();
									return;
								}
								setTimeout(()=>{
									cga.SayWords('1', 0, 3, 1);	
									cb2(true)
								}, 1500);
							}
							else
							{
								setTimeout(retryNpc, 500);
							}
						});
					}
					retryNpc()
			}
			if(cga.isTeamLeader){
				leader_go_1();
			} else {
				cga.waitForLocation({mapname : '阿巴尼斯村的传送点',leaveteam : false}, teammates_go_1);
			}
		}
	},
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
	
	task.doTask();
});