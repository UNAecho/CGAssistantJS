var cga = require('./cgaapi')(function(){

	var playerinfo = cga.GetPlayerInfo();

	// 提取本地职业信息
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(playerinfo.job)
	
	if (professionalInfo.jobmainname == '暗黑骑士' || professionalInfo.jobmainname == '教团骑士'){
		// 黑白骑无法打开保证书上限，吉拉在52级之前是70点声望一场，打12场即可满足每天800上限。
		// 打20场是防止出现战斗失败却累计次数的情况，多打几盘提升稳妥。
		console.log('当前职业：【'+professionalInfo.jobmainname+'】，为限制循环次数的职业')
		var battlecount = 20
	}

	if (playerinfo.level <20 || playerinfo.level >108){
		console.log("【注意】：人物等级在1-108级打吉拉才会有声望，你目前等级不在这范围内，打吉拉仅会加魅力。")
	}

	// var mapindexlist = [59520,1500,1000,1400,1403,1450,1451,1452,1453,1454,1455,1456,1457] 
	var healcount = 0
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
		}
		else if(dlg && dlg.options == 3)
		{
			cga.ClickNPCDialog(1, 0);
			return;
		}
		else
		{
			return;
		}
	}
	var drop = (onmarket)=>{
		if(cga.getItemCount('斗士之证') > 0){
			if (onmarket !=undefined && onmarket == true){
				// console.log('在场内，丢弃自己的斗士之证')
				item = cga.getInventoryItems().find((it)=>{
				return (it.itemid == 18257)
				});
				if(item){
					cga.DropItem(item.pos);
				}
			}else{
				// console.log('在场外，丢弃斗士之证')
				item = cga.getInventoryItems().find((it)=>{
					return (it.name == '斗士之证')
				});
				if(item){
					cga.DropItem(item.pos);
				}
				setTimeout(drop, 3000);

			}
		}
		return;
	}
	var battle = ()=>{

		var waitBOSS = ()=>{
			if(cga.isInBattle())
			{
				setTimeout(waitBOSS, 1000);
				return;
			}
			setTimeout(loop, 1000);
		}
		drop(true)
		cga.turnDir(0);
		cga.AsyncWaitNPCDialog(function(err){
			cga.ClickNPCDialog(4, -1);
			cga.AsyncWaitNPCDialog((err,dlg)=>{
				cga.ClickNPCDialog(1, -1);
				if (battlecount !=undefined){
					battlecount -=1
					console.log('当前还需要打' + battlecount + '次')
				}
				setTimeout(waitBOSS, 1500);
			});
		});
		
	}
	var goto = () => {
		cga.walkList([
			[41, 98, '法兰城'],
			[124, 161],
		], ()=>{
			cga.TurnTo(122, 161);
			cga.AsyncWaitMovement({map:1400}, ()=>{
				cga.walkList([
					[27,14,'治愈的广场'],
					[25,13]
				], ()=>{
					cga.TurnTo(27, 13);
					cga.AsyncWaitNPCDialog(function(err){
						cga.ClickNPCDialog(32, -1);
						cga.AsyncWaitNPCDialog((err,dlg)=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitNPCDialog((err,dlg)=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitMovement({map:1450}, ()=>{
									cga.walkList([
										[22,13,1451],
										[15,8,1452],
										[22,8,1453],
										[15,8,1454],
										[22,16,1455],
										[16,12]
									], ()=>{
										cga.TurnTo(16, 10);
										cga.AsyncWaitNPCDialog(function(err){
											cga.ClickNPCDialog(4, -1);
											cga.AsyncWaitNPCDialog((err,dlg)=>{
												cga.ClickNPCDialog(1, -1);
												cga.AsyncWaitMovement({map:1456}, ()=>{
													cga.walkList([
														[16,5]
													], ()=>{
														cga.turnDir(3);
														cga.AsyncWaitNPCDialog(function(err){
															cga.ClickNPCDialog(8, -1);
															cga.AsyncWaitNPCDialog((err,dlg)=>{
																cga.ClickNPCDialog(1, -1);
																cga.AsyncWaitNPCDialog((err,dlg)=>{
																	cga.turnDir(0);
																	cga.AsyncWaitNPCDialog((err,dlg)=>{
																		cga.ClickNPCDialog(4, -1);
																		cga.AsyncWaitNPCDialog((err,dlg)=>{
																			cga.ClickNPCDialog(1, -1);
																			cga.AsyncWaitMovement({map:1457}, ()=>{
																				battle()
																			});
																		});
																	});
																});
															});
														});
													});
												});
											});
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
	var gettitle = ()=>{
		cga.travel.falan.toStone('E2', ()=>{
			cga.walkList([
				[230, 82],
			], ()=>{
				cga.turnTo(230, 84);
				setTimeout(console.log('目前称号为：'+ cga.GetPlayerInfo.titile), 1000);
				return
			});
		});
	}
	var loop = ()=>{
		//补血
		if(cga.needSupplyInitial() && cga.GetPlayerInfo().hp < 800){
			cga.travel.falan.toCastleHospital(()=>{
				healcount+=1
				if (healcount % 10 ==0){
					console.log('每回补10次，去看看称号进展')
					setTimeout(gettitle, 1000);
				}
				console.log('battlecount = ' + battlecount)
				// 如果是黑白骑，判断是否打多了
				if (battlecount!= undefined && battlecount <= 0){
					console.log('【注意】暗黑骑士、教团骑士每天仅需打满12盘吉拉即可完成提升声望，请停止脚本！')
				}
				setTimeout(loop, 1000);
			});
			return;
		}else{
			if(cga.GetMapIndex().index3 == 1457)
			{	
				// console.log('在场内')
				cga.walkList([
					[31, 23],
				], ()=>{
					battle()
				});
			}else{
				// console.log('在场外')
				cga.travel.falan.toStone('C', ()=>{
					drop(false)
					goto()
				});
			}
		}

	}
	
	loop()

});