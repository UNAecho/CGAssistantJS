var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){
	global.cga = cga
	var rootdir = cga.getrootdir()
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	var playerinfo = cga.GetPlayerInfo();
	
	// 不使用动态组队，避免脚本运行时需要手动组队的麻烦。
	var teammates = null
	// 需要在静态teams中定义好角色所属的队伍。
	var teams = [
		[
			"UNAの巫师",
			"UNAの格斗01",
			"UNAの格斗02",
			"UNAの猎人02",
			"UNAの传教士"
		],
		[
			"UNAの咒术师",
			"UNAの格斗03",
			"UNAの圣骑士",
			"UNAの格斗04",
			"UNAの传教士2"
		]
	]
	// 采用静态多队伍模式，角色会自己寻找自己在哪个队伍中。
	for (var t in teams){
		if (teams[t].indexOf(playerinfo.name) != -1){
			teammates = teams[t]
		}
	}
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false
	
	var task = cga.task.Task('树精长老的末日', [
	{//0
		intro: '1.任务准备',
		workFunc: function(cb2){
			healMode.func(()=>{
				cb2(true)
			})
		}
	},
	{//1
		intro: '2.前往维诺亚村医院（61.53）与佣兵艾里克（7.5）对话，选“是”获得【火把】。',
		workFunc: function(cb2){

			var checkFire = (cb)=>{
				if(cga.getItemCount('火把') > 0){
					cga.SayWords('1', 0, 3, 1);	
					if(!cga.isTeamLeader){
						cb(true)
					}
				}else{
					cb('restart stage');
				}
				return
			}

			var go = () => {
				cga.travel.falan.autopilot('医院',()=>{
					cga.walkList([
						[6, 5],
						], ()=>{
							cga.cleanInventory(1, ()=>{
								cga.TurnTo(7, 5);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(1, 0);
										setTimeout(()=>{
											cga.travel.falan.autopilot('主地图',()=>{
												if(cga.isTeamLeader){
													leader_go()
												} else {
													teammate_go()
												}
											})
										}, 1500);
									});
								});
							});
						});
				})
			}

			var leader_go = ()=>{
				cga.walkList([
					[59, 47],
					], ()=>{
						setTimeout(() => {
							cga.waitTeammateSayNextStage(teammates, cb2);
						}, 500);
						leader_wait()
					});
			}

			var teammate_go = ()=>{
				cga.walkList([
					[59, 48],
					], ()=>{
						teammate_wait()
					});
			}
			
			var leader_wait = ()=>{
				cga.waitTeammates(teammates, (r)=>{
					if(r){
						checkFire(cb2);
						return;
					}
					setTimeout(leader_wait, 1000);
				});
			}

			var teammate_wait = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						checkFire(cb2)
						return;
					}
					setTimeout(teammate_wait, 1000);
				});
			}
			
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(()=>{
					cga.travel.falan.toTeleRoom('维诺亚村', go);
				}, 2000);
			});
		}
	},
	{//2
		intro: '3.出维诺亚村向北行走至芙蕾雅岛（380.353）处，进入布满青苔的洞窟。3.通过随机迷宫抵达叹息之森林，与树精长老（29.13）对话，交出【火把】进入战斗。',
		workFunc: function(cb2){
			
			var fuckBOSS = ()=>{
				if(cga.isTeamLeader){
					cga.walkList([
					[29, 14],
					], ()=>{
						cga.turnTo(29, 13);
					});
				}
				
				cga.waitForLocation({mapname : '叹息森林', mapindex : 15508}, ()=>{
					cb2(true);
				});
			}
			
			var walkMaze = (cb3)=>{
				var map = cga.GetMapName();
				if(map == '叹息之森林'){
					cb3();
					return;
				}
				if(map == '芙蕾雅'){
					cb2('restart stage');
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb3);
				});
			}
			
			var go = ()=>{
				cga.walkList(
				(cga.GetMapName() == '芙蕾雅') ? 
				[
				[380, 353, '布满青苔的洞窟1楼'],
				]
				:
				[
				[67, 47, '芙蕾雅'],
				[380, 353, '布满青苔的洞窟1楼'],
				]
				, ()=>{
					walkMaze(fuckBOSS);
				});
			}
			
			if(cga.isTeamLeader){
				go();
			} else {
				cga.waitForLocation({mapname : '叹息之森林', mapindex : 15507}, fuckBOSS);
			}
		}
	},
	{//3
		intro: '4.战斗胜利后传送至叹息森林，队伍中随机1人获得【艾里克的大剑】。5.与年轻树精（26.12）对话，获得【树苗？】。',
		workFunc: function(cb2){
			var go = ()=>{
				cga.walkList([
				[27, 13],
				], ()=>{
					var sword = cga.findItem('艾里克的大剑');

					if(sword != -1){
						cga.DropItem(sword);
					}
					
					setTimeout(()=>{
						cga.cleanInventory(1, ()=>{
							cga.turnTo(26, 12);
							cga.AsyncWaitNPCDialog(()=>{
								cga.SayWords('拿到树苗后前往法兰城凯蒂夫人的店，鉴定树苗并将其交给维诺亚村村长的家“村长卡丹”，即可完成任务！', 0, 3, 1);
								setTimeout(cb2, 1000, true);
							});
						});
					}, 1000);					
				});
			}

			setTimeout(()=>{
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				setTimeout(go, 1500);
			}, 1500);
		}
	},
	{//4
		intro: '5.前往法兰城凯蒂夫人的店（196.78）与凯蒂夫人（15.12）对话，交出30G将【树苗？】鉴定为【生命之花】。',
		workFunc: function(cb2){
			cga.travel.falan.toKatieStore(()=>{
				cga.walkList([
					[15, 12],
				], ()=>{
						var itemArray = cga.findItemArray('树苗？');
						cga.turnTo(16, 12);
						cga.AsyncWaitNPCDialog(()=>{
							cga.SellNPCStore(itemArray);
							cga.AsyncWaitNPCDialog(()=>{
								cb2(true);
							});
						});
				});
			});
		}
	},
	{//5
		intro: '6.前往维诺亚村村长的家（40.36）与村长卡丹（16.7）对话，选“是”交出【生命之花】获得晋阶资格，任务完结。',
		workFunc: function(cb2){
			cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
				cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[15, 8],
				], ()=>{
					cga.turnTo(16, 7);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cb2(true);
						});
					});
				});				
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){
			return false;
		},
		function(){
			return (cga.getItemCount('火把') >= 1 && cga.getTeamPlayers().length > 0) ? true : false;
		},
		function(){
			return (cga.GetMapName() == '叹息之森林') ? true : false;
		},
		function(){
			return (cga.getItemCount('树苗？') >= 1) ? true : false;
		},
		function(){
			return (cga.getItemCount('生命之花') >= 1) ? true : false;
		},
		function(){
			return false;
		},
	]
	);
	configMode.func('节能模式')
	task.doTask(()=>{
		var minssionObj = {"树精长老的末日" : true}
		cga.refreshMissonStatus(minssionObj)
	});
});