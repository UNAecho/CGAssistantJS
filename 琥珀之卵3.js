var cga = require('./cgaapi')(function(){

	var playerinfo = cga.GetPlayerInfo();

	// 是否重新执行本任务。【注意】：如果身上带有魔导书抄本，脚本会跳过重置任务步骤。可使用此flag强行从任务初始开始做
	var resetflag = false
	// 不使用动态组队，避免脚本运行时需要手动组队的麻烦
	var teammates = [
		"UNAの弓",
		"UNAの传教",
		"UNAの剑士",
		"UNAの游侠",
		"UNAの饲养师",
	];

	// 注销掉动态组队
	// var teamplayers = cga.getTeamPlayers();
	// for(var i in teamplayers)
	// 	teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false

	// 随机迷宫指定搜索范围
	var battleAreaArray = [
		{
			name : '虫洞',
			range : [190, 211, 230, 290],
		},
	]
	// 入口缓存信息
	var cachedEntrance = null;
	// 进入错误迷宫会出来，并将地图加入黑名单
	var blacklistEntrance = []

	// 寻找迷宫入口
	var getMazeEntrance = (cb)=>{
	
		if(cachedEntrance)
		{
			cga.downloadMapEx(cachedEntrance.mapx - 12, cachedEntrance.mapy - 12, cachedEntrance.mapx + 12, cachedEntrance.mapy + 12, ()=>{
				var objs = cga.getMapObjects();
				var entrance = objs.find((obj)=>{
					return (obj.cell == 3 && obj.mapx == cachedEntrance.mapx && obj.mapy == cachedEntrance.mapy)
				})
				
				if(entrance == undefined){
					cachedEntrance = null;
					console.log('缓存的迷宫入口失效,重新寻找入口')
					getMazeEntrance(cb);
					return;
				}
				
				cb(entrance);
			});
			return;
		}
		
		console.log('正在下载地图')
		cga.downloadMapEx(
		battleAreaArray[0].range[0],
		battleAreaArray[0].range[1], 
		battleAreaArray[0].range[2], 
		battleAreaArray[0].range[3], ()=>{
			console.log('地图已下载完成')
			
			var objs = cga.getMapObjects();
			console.log(objs.filter((o)=>{
				return o.cell == 3;
			}))
			var entrance = objs.find((obj)=>{
	
				return (obj.cell == 3 && 
				obj.mapx >= battleAreaArray[0].range[0] &&
				obj.mapx <= battleAreaArray[0].range[1] && 
				obj.mapy >= battleAreaArray[0].range[2] && 
				obj.mapy <= battleAreaArray[0].range[3] && 
				( !blacklistEntrance.length || (blacklistEntrance.length && blacklistEntrance.find((b)=>{
					return b.mapx == obj.mapx && b.mapy == obj.mapy;
				}) == undefined) )
				);
			})
			
			if(entrance == undefined){
				console.log('迷宫入口未找到,等待3秒后重试')
				setTimeout(getMazeEntrance, 3000, cb);
				return;
			}
			
			cachedEntrance = entrance;
			cb(entrance);
		});
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
			return;
		}else if(dlg && dlg.options == 8)
		{
			cga.ClickNPCDialog(8, 0);
			return;
		}
		else if(dlg && dlg.options == 3)
		{
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else
		{
			return;
		}
	}

	var task = cga.task.Task('琥珀之卵3', [
	{//0
		intro: '◆在艾夏岛冒险者旅馆(102.115)内与时空之人(30.20)对话，输入“朵拉”选“是”，再选“确定”可重置本任务',
		workFunc: function(cb2){
			cga.travel.newisland.toPUB(()=>{
				cga.walkList([
				[31, 21],
				], ()=>{
					cga.TurnTo(30, 20);
					cga.AsyncWaitNPCDialog(()=>{
						cga.SayWords('贝尔达', 0, 3, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
								setTimeout(()=>{
									cb2(true);
								}, 1500);
							});
						});
					});
				});
			});
		}
	},
	{//1
		intro: '1.黄昏或夜晚前往艾尔莎岛神殿·伽蓝（200.96）三楼神殿·里侧大厅，至（48.60）处进入约尔克神庙。调查(39.21)处，获得【琥珀之卵】。',
		workFunc: function(cb2){
			
			if(cga.getItemCount('琥珀之卵') > 0){
				cb2(true);
				return;
			}
			
			var retry = ()=>{
				cga.cleanInventory(1, ()=>{
					cga.turnTo(39, 21);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(!(dlg && dlg.message.indexOf('感觉脑海中有什么声响') >= 0)){
							setTimeout(retry, 5000);
							return;
						}
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(32, 0);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(32, 0);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(32, 0);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(1, 0);
												setTimeout(cb2, 1000, true);
											});
										});
									});
								});
							});
						});
					});
				});				
			}
			
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[201, 96, '神殿　伽蓝'],
				[95, 104, '神殿　前廊'],
				[44, 41, '神殿　里侧大厅'],
				[34, 34, 59535],
				[48, 60, '约尔克神庙'],
				[39, 22],
				], ()=>{
					retry();
				});
			});
		}
	},
	{//2
		intro: '2.前往梅布尔隘地与马汀斯(170.120)对话进入战斗。战斗胜利后队伍中随机一人获得【魔导书抄本】，由于是单挑，必定自己获得。接下来继续作为队长来带队',
		workFunc: function(cb2){

			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}
			//队长自己去单挑马汀斯
			if(cga.isTeamLeader){
				var book = ()=>{
					if(cga.getItemCount('魔导书抄本') > 0){
						console.log('已拿到魔导书抄本')
						cb2(true)
					}else{
						setTimeout(book, 1000);
					}
					return
				}

				cga.travel.newisland.toStone('X', ()=>{
					cga.walkList([
					[165, 153],
					], ()=>{
						cga.TurnTo(165, 154);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(8, -1);
								cga.waitForLocation({mapname : '梅布尔隘地', pos : [198, 48]}, ()=>{
									cga.walkList([
										[169, 120],
										], ()=>{
											cga.TurnTo(170, 120);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(32, 0);
												cga.AsyncWaitNPCDialog(()=>{
													cga.ClickNPCDialog(32, 0);
													cga.AsyncWaitNPCDialog(()=>{
														cga.ClickNPCDialog(8, -1);
														book()
														return
													});
												});
											});
										});
								});
							});
						});
					});
				});
			}else{//小号直接跳过
				cb2(true)
			}
		}
	},
	{//3
		intro: '3.前往盖雷布伦森林与纳塞(245.73)对话，选“是”。',
		workFunc: function(cb2){
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}

			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[130, 50, '盖雷布伦森林'],
				[244, 73]
				], ()=>{
					cga.TurnTo(245, 73);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 7000);

				});
			});
		}
	},
	{//4
		intro: '4.黄昏或夜晚时至神殿·伽蓝与荷特普(92.138)对话，选“是”。',
		workFunc: function(cb2){
			var retry = ()=>{
				if(cga.GetSysTime().hours >15 || cga.GetSysTime().hours <6){
					cga.travel.newisland.toStone('X', ()=>{
						cga.walkList([
							[201, 96, '神殿　伽蓝'],
							[91, 138],
						], (r)=>{
							cga.task.waitForNPC('荷特普', ()=>{
								cga.turnTo(92, 138);
								cga.AsyncWaitNPCDialog(dialogHandler);
								setTimeout(()=>{
									cb2(true);
									return
								}, 7000);
							});
						});
					});
				}else{
					console.log('等待黄昏与荷特普对话')
					setTimeout(retry, 30000);
					return
				}
			}
			retry()
		}
	},
	{//5
		intro: '5.前往艾夏岛冒险者旅馆(102.115)与安洁可(55.32)对话选“是”。',
		workFunc: function(cb2){

			cga.travel.newisland.toPUB(()=>{
				cga.walkList([
				[56, 32],
				], ()=>{
					cga.TurnTo(56, 31);
					cga.AsyncWaitNPCDialog(dialogHandler);
					setTimeout(()=>{
						cb2(true);
					}, 7000);
				});
			});
		}
	},
	{//6
		intro: '6.前往布拉基姆高地（203.265）处附近虫洞。',
		workFunc: function(cb2){
			
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}

			var go = ()=>{
				cga.walkList([
					[256, 166, '布拉基姆高地'],
					], ()=>{
						getMazeEntrance((obj)=>{
							cga.walkList([
								[obj.mapx, obj.mapy, '虫洞地下1层']
							], ()=>{
								console.log('已到达虫洞，请自行手动进行后续任务')
								cb2(true)
							});
						})
					});
			}

			var findcaptain = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						cb2(true)
						return;
					}
					setTimeout(findcaptain, 1000);
				});
			}

			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
				[165, 153],
				], ()=>{
					cga.TurnTo(165, 154);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(8, -1);
							cga.waitForLocation({mapname : '梅布尔隘地', pos : [198, 48]}, ()=>{
								if(cga.isTeamLeader){
									var wait = ()=>{
										cga.WalkTo(198, 49);
										cga.waitTeammates(teammates, (r)=>{
											if(r){
												go();
												return;
											}
											setTimeout(wait, 1000);
										});
									}
									wait()
								} else {
									findcaptain()
								}
							});
						});
					});
				});
			});
		}
	},
	{//7
		intro: '7.寻找迷宫内随机出现的纳塞并与之对话，选“是”传送至？？？',
		workFunc: function(cb2){
			cga.waitForLocation({mapname : '？？？'}, ()=>{
				setTimeout(()=>{
					cb2(true)
				}, 2000);
			});
		}
	},
	{//8
		intro: '8.与玄武(195.32)对话，选择“是”进入战斗。\n战斗胜利后，与玄武对话。通过（230.57）处黄色传送石返回布拉基姆高地。',
		workFunc: function(cb2){

			if(cga.isTeamLeader){
				cga.walkList([
					[195, 33],
					], ()=>{
						cga.TurnTo(195, 32);
						cga.AsyncWaitNPCDialog(dialogHandler);

					});
			}

			cga.waitForLocation({mapindex : 59716, pos : [230, 75]}, ()=>{
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				cga.walkList([
					[229, 67],
					], ()=>{
						cga.TurnTo(229, 66);
						cga.AsyncWaitNPCDialog(dialogHandler);
						setTimeout(()=>{
							cga.walkList([
								[230, 57, '布拉基姆高地'],
								], ()=>{
									cga.waitForLocation({mapname : '布拉基姆高地'}, ()=>{
										cb2(true)
									});
								});
						}, 7000);
					});
			});
		}
	},
	{//9
		intro: '9.再次前往虫洞，通过随机迷宫抵达？？？。夜晚或凌晨后与安洁可战斗，并传送至荷特普房间。（夜袭女子，官方设定可还行？）\n之后与荷特普对话，传送至布拉基姆高地，任务完成',
		workFunc: function(cb2){

			var fuckBOSS = ()=>{
				if(cga.isTeamLeader && (cga.GetSysTime().hours >19 || cga.GetSysTime().hours <6)){
					cga.walkList([
					[50, 114],
					], ()=>{
						cga.turnTo(50, 113);
						cga.AsyncWaitNPCDialog(dialogHandler);
					});
				}
				
				cga.waitForLocation({mapindex : 59716, pos : [131, 102]}, ()=>{
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					cga.walkList([
						[131, 101],
						], ()=>{
							cga.TurnTo(131, 100);
							cga.AsyncWaitNPCDialog(dialogHandler);
							setTimeout(()=>{
								cga.waitForLocation({mapname : '布拉基姆高地', pos : [208, 281]}, ()=>{
									setTimeout(()=>{
										cb2(true)
									}, 2000);
								});
							}, 9000);
						});
				});
			}

			var walkMaze = (cb3)=>{
				var map = cga.GetMapName();
				if(map == '？？？'){
					cb3();
					return;
				}
				if(map == '布拉基姆高地'){
					cb2('restart stage');
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb3);
				});
			}

			var go = ()=>{
				getMazeEntrance((obj)=>{
					cga.walkList([
						[obj.mapx, obj.mapy, '虫洞地下1层']
					], ()=>{
						walkMaze(fuckBOSS);
					});
				})
			}

			var findcaptain = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						cb2(true)
						return;
					}
					setTimeout(findcaptain, 1000, cb);
				});
			}

			if(cga.isTeamLeader){
				var wait = ()=>{
					cga.WalkTo(208, 280);
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							go();
							return;
						}
						setTimeout(wait, 1000);
					});
				}
				wait()
			} else {
				findcaptain()
				cga.waitForLocation({mapname : '？？？'}, fuckBOSS);
			}


		}
	},
	],
	[//任务阶段是否完成
		function(){
			return false;
		},
		function(){//琥珀之卵
			return (cga.getItemCount('琥珀之卵') >= 1) ? true : false;
		},
		function(){//魔导书抄本
			return (cga.getItemCount('魔导书抄本') > 0) ? true : false;
		},
		function(){//路路耶家外面的纳塞对话
			if(cga.isTeamLeader){
				return false
			}else{
				return true;
			}
		},
		function(){//荷特普对话
			if(cga.isTeamLeader){
				return false
			}else{
				return true;
			}
		},
		function(){//安洁可对话
			if(cga.isTeamLeader){
				return false
			}else{
				return true;
			}
		},
		function(){//去虫洞
			return (cga.GetMapName().indexOf('虫洞')>=0) ? true : false;
		},
		function(){//进入玄武战斗房间
			return (cga.GetMapIndex().index3 == 59716) ? true : false;
		},
		function(){//与玄武战斗胜利，开始全员对话，通过换色水晶传送至布拉基姆高地
			return false;
		},
		function(){//再次通过刚才的虫洞随机迷宫底层进入安洁可BOSS房间，并战斗。传送至布拉基姆高地，任务完成
			return false;
		},
	]
	);
	// 强制不跳过，用于重置任务
	if(resetflag){
		task.anyStepDone = false;
	}
	task.doTask(()=>{
		console.log('UNA脚本：已结束');
	});
});