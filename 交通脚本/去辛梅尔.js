var cga = require('../cgaapi')(function(){
	// 重要信息：59934为【战斗系和准战斗系，通过黑色方舟最终到达白色方舟与露比对话，传送的学第11格技能】的mapindex3
	// 59930为白色方舟四色分歧口
	//队员信息
	var playerinfo = cga.GetPlayerInfo();
	var teammates = [];
	var teamplayers = cga.getTeamPlayers();

	for(var i in teamplayers)
		teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;


	
	var dialogHandler = (err, dlg)=>{
		console.log('start dialogHandler ...')
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
		console.log('retry... tmp_x =' + tmp_x + " tmp_y = " + tmp_y)
		cga.TurnTo(tmp_x, tmp_y);
		cga.AsyncWaitNPCDialog(dialogHandler);
		if (cga.GetMapIndex().index3 != tmp_index){
			console.log('地图已切换')
			return
		}
		setTimeout(retry, 5000);
		
	}
	var onboard =() =>{
		console.log('onboard...')
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
			if(cga.isTeamLeader){
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			}
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
	// 主流程
	if(cga.GetMapName() != '艾尔莎岛'){
		throw new error('需要从新城启动')
	}
	// 丢弃旧的誓约之花
	item = cga.getInventoryItems().find((it)=>{
		return (it.name == '誓约之花')
	});
	if(item){
		console.log('任务开始，丢弃旧的誓约之花..');
		cga.DropItem(item.pos);
	}
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
											wheel_and_deal()
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
					wheel_and_deal()
					return;
				}
				setTimeout(teammates_wait_1, 1000);
			});
		}

		cga.waitForLocation({mapname : '艾尔莎岛', pos : [165, 153], leaveteam : true}, gotolixiaisland)

	}

});