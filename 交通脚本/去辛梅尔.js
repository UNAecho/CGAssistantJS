var cga = require('../cgaapi')(function(){
	// 重要信息：59934为【战斗系和准战斗系，通过黑色方舟最终到达白色方舟与露比对话，传送的学第11格技能】的mapindex3
	// 59930为白色方舟四色分歧口

	//队员信息
	var playerinfo = cga.GetPlayerInfo();

	// 如没有王冠，加2人小队坐飞象时，目标名称所包含字符的筛选条件。
	var namefilter = "UNA"

	// 2人小队集合点，队长等待坐标，如无需要，无需更改
	var wait_xpos = 139
	var wait_ypos = 108
	// 队员等待坐标
	var go_xpos = 139
	var go_ypos = 107

	var checkmap = (cb)=>{
		if(!cga.isMapDownloaded())
		{
			cga.downloadMap(cb);
		} 
	}

	var dialogHandler = (err, dlg)=>{
		if(dlg && dlg.message.indexOf('丘斯特港') >= 0)
		{
			return;
		}
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
		else
		{
			return;
		}
	}
	// 三个临时变量用于保存每次retry的turnto坐标，和原地图index。
	// 这么做是因为callback的时候无法继续传递参数，不知道狗JS是怎么操作的，很恶心
	var tmp_x = 0
	var tmp_y = 0
	var tmp_index = 0
	var retry = ()=>{
		cga.TurnTo(tmp_x, tmp_y);
		cga.AsyncWaitNPCDialog(dialogHandler);
		if (cga.GetMapIndex().index3 != tmp_index){
			console.log('地图已切换')
			return
		}
		setTimeout(retry, 5000);
		
	}
	var onboard =() =>{
		cga.TurnTo(tmp_x, tmp_y);
		cga.AsyncWaitNPCDialog((err, dlg)=>{
				
			if(dlg && dlg.message.indexOf('辛梅尔') >= 0 && dlg.options == 12){
				console.log('到辛梅尔了，下船')
				cga.ClickNPCDialog(4, -1);
				return
			}else{
				setTimeout(onboard, 5000);
			}
		});
	}

	// 下了飞象之后各自离队独立行动
	var wheel_and_deal = ()=>{
		cga.AsyncWaitMovement({map:'丘斯特村'}, ()=>{
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			cga.walkList([
				[130, 88],
				[130, 89],
				[130, 88],
				[130, 89],
				[130, 88],
			], ()=>{
				tmp_x = 131
				tmp_y = 88
				tmp_index = 59524
				retry();
				cga.AsyncWaitMovement({map:59527}, ()=>{
					cga.walkList([
						[26, 19],
					], ()=>{
						tmp_x = 26
						tmp_y = 18
						tmp_index = 59527
						retry();
						cga.AsyncWaitMovement({map:'修拉特瓦尔号'}, ()=>{
							cga.walkList([
								[18, 18],
							], ()=>{
									tmp_x = 18
									tmp_y = 20
									onboard()
									cga.AsyncWaitMovement({map:59528}, ()=>{
										cga.walkList([
											[18, 18],
										], ()=>{
											tmp_x = 18
											tmp_y = 17
											tmp_index = 59528
											retry();
											cga.AsyncWaitMovement({map:59526}, ()=>{
												cga.walkList([
													[207, 91,'光之路'],
												], ()=>{
														cga.walkList([
															[165, 82],
														], ()=>{
															tmp_x = 165
															tmp_y = 81
															tmp_index = 59505
															retry()
															cga.AsyncWaitMovement({map:59930}, ()=>{
																var xy = cga.GetMapXY();
																var dir = cga.getRandomSpaceDir(xy.x, xy.y);
																cga.freqMove(dir);

																// 跳转四转换花脚本
																global.cga = cga
																var rootdir = cga.getrootdir()
																var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
																var body = {
																	path : rootdir + "\\四转换花.js",
																}
																
																scriptMode.call_ohter_script(body)
															});
															});
														});
													});
											})
										});
									});
								});
							});
						});
					});
				});
	}

	// 主流程开始
	// 丢弃旧的誓约之花
	var dropflower = ()=>{
		item = cga.getInventoryItems().find((it)=>{
			return (it.name == '誓约之花')
		});
		if(item){
			console.log('丢弃旧的誓约之花..');
			cga.DropItem(item.pos);
			setTimeout(dropflower, 1000);
		}else{
			if(cga.getTeamPlayers().length == 2){
				setTimeout(mainlogic, 500);
			}else{
				console.log('脚本启动，开始去集合点组队坐小象飞艇')
				setTimeout(organizeteam, 500);
			}
		}
	}

	var mainlogic = ()=>{

		var teammates = [];
		var teamplayers = cga.getTeamPlayers();
		
		for(var i in teamplayers)
			teammates[i] = teamplayers[i].name;
		cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;

		// 队长行动
		if(cga.isTeamLeader){
			cga.walkList([
				[201, 96, 59530],
				[91, 122],
			], ()=>{
				cga.TurnTo(92 ,122)
				cga.walkList([
					[81, 133, '艾尔莎岛'],
					[165, 153],
					[164, 153],
					[165, 153],
				], ()=>{
					tmp_x = 165
					tmp_y = 155
					tmp_index = 59520
					retry();
					cga.AsyncWaitMovement({map:'利夏岛'}, ()=>{
						var leader_wait_1 = ()=>{
							cga.WalkTo(93, 63);
							cga.waitTeammates(teammates, (r)=>{
								if(r){
									cga.walkList([
										[118, 100],
									], ()=>{
										tmp_x = 118
										tmp_y = 102
										tmp_index = 59522
										retry();
										cga.AsyncWaitMovement({map:'丘斯特村'}, ()=>{
												checkmap(wheel_and_deal)
											});
										});
									return;
								}
								setTimeout(leader_wait_1, 1000);
							});
						}
						leader_wait_1()
					});
				});
				});
		}else{//队员行动
			var gotolixiaisland = ()=>{
				cga.TurnTo(165, 154);
				cga.AsyncWaitNPCDialog(function(err){
					if(err){
						cga.walkList([ [165, 153], ], gotolixiaisland);
						return;
					}
					cga.ClickNPCDialog(32, -1);
					cga.AsyncWaitNPCDialog((err,dlg)=>{
						cga.ClickNPCDialog(4, -1);
						setTimeout(teammates_wait_1, 1000);
					});
				});
			}

			var teammates_wait_1 = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						checkmap(wheel_and_deal)
						return;
					}
					setTimeout(teammates_wait_1, 1000);
				});
			}

			cga.waitForLocation({mapname : '艾尔莎岛', pos : [165, 153], leaveteam : true}, gotolixiaisland)

		}
	}

	// 组2人队，为了坐2人小象飞艇
	var organizeteam = ()=>{
		var teaminfo = cga.getTeamPlayers()
		if(teaminfo.length == 2){
			cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
			setTimeout(mainlogic, 100);
		}else if(teaminfo.length == 0 && cga.GetMapXY().x == wait_xpos && cga.GetMapXY().y == wait_ypos){
			setTimeout(organizeteam, 1000);
		}
		else if(teaminfo.length == 0){
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					[go_xpos, go_ypos],
				], ()=>{
					var leader = cga.findPlayerUnit((u)=>{
						if (u.unit_name.indexOf(namefilter) != -1){
							return true
						}
					})
					if(leader !=undefined && leader!= null && leader.xpos ==wait_xpos && leader.ypos==wait_ypos){
						cga.addTeammate(leader.unit_name, mainlogic);
					}else{
						cga.walkList([
							[wait_xpos, wait_ypos],
						], ()=>{
							cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
							var teamplayers = cga.getTeamPlayers();			
							if(teamplayers.length == 2){
								cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
								setTimeout(mainlogic, 5000);
								return;
							}
							setTimeout(organizeteam, 5000);
						});
					}
				});
			});
		}else{
			// 如果队伍人数超过了2，就离队
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			cga.travel.newisland.toStone('X', organizeteam);
		}
	}
	// 程序起点
	dropflower()
});