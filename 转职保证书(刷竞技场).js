var cga = require('./cgaapi')(function(){

	var interrupt = require('./通用挂机脚本/公共模块/interrupt');
	var moveThinkInterrupt = new interrupt();

	var playerinfo = cga.GetPlayerInfo();

	// 低于此数值，则需要购买武器和水晶来辅佐刷
	var thresholdhp = 1300
	var thresholdattack = 150
	
	var weapon = "平民斧"
	var crystal = "风地的水晶（5：5）"
	var isweaponequip = false
	var iscrystalequip = false
	// 如果不需要装备辅助，请设置为true
	var noneedweapon = false
	console.log('noneedweapon = ' + noneedweapon)

	var bosspos = [31, 23]

	// 提取本地职业信息
	const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(playerinfo.job)
	
	if (professionalInfo.name == '暗黑骑士' || professionalInfo.name == '教团骑士'){
		// 黑白骑无法打开保证书上限，吉拉在52级之前是70点声望一场，打12场即可满足每天800上限。
		// 打20场是防止出现战斗失败却累计次数的情况，多打几盘提升稳妥。
		console.log('当前职业：【'+professionalInfo.name+'】，为限制循环次数的职业')
		var battlecount = 20
	}

	if(playerinfo.level >52 && playerinfo.level <=104){
		console.log("当前等级为：" + playerinfo.level +"，需要打巴雷莉")
		bosspos = [27,25]
	}else if(playerinfo.level >104 && playerinfo.level <=112){
		console.log("当前等级为：" + playerinfo.level +"，需要打伊鲁玛")
		bosspos = [23,21]
	}else if(playerinfo.level >112 && playerinfo.level <=124){
		console.log("当前等级为：" + playerinfo.level +"，需要打伊佐塔")
		bosspos = [27,21]
	}else if(playerinfo.level >124 && playerinfo.level <=132){
		console.log("当前等级为：" + playerinfo.level +"，需要打伍那")
		bosspos = [30,26]
	}else if(playerinfo.level >132 && playerinfo.level <=156){
		console.log("当前等级为：" + playerinfo.level +"，需要打伊石雄")
		bosspos = [24,23]
	}else if(playerinfo.level >156){
		console.log("当前等级为：" + playerinfo.level +"，需要打伊牛鬼")
		bosspos = [30,21]
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
				//itemid == 18257吉拉，18258巴雷莉，18260 伊佐塔，18261伍娜
				return (it.itemid == 18257 || it.itemid == 18258 || it.itemid == 18260 || it.itemid == 18261)
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
		cga.isMoveThinking = false
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

	const putupEquipments = (itemname)=>{
		var currentEquip = cga.getEquipItems();
		var item = cga.getInventoryItems().find((eq)=>{
			return eq.name == itemname;
		});
		
		if(item != undefined){
			cga.UseItem(item.pos)
			
			// setTimeout(putupEquipments, 1000, cb);
			return;
		}
		
		return
	}
	var buy = (itemname)=>{
		cga.AsyncWaitNPCDialog(()=>{
			cga.ClickNPCDialog(0, 0);
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				var store = cga.parseBuyStoreMsg(dlg);
				if(!store)
				{
					cb(new Error('商店内容解析失败'));
					return;
				}

				var buyitem = [];
				var buyCount = 0;
				var emptySlotCount = cga.getInventoryEmptySlotCount();

				store.items.forEach((it)=>{
					if(it.name == itemname && buyCount < emptySlotCount){
						buyitem.push({index: it.index, count:1});
						buyCount ++;
					}
				});
				if(!buyitem.length)
				{
					cb(new Error('购买失败，可能已被买完或者背包没空间'));
					return;
				}

				cga.BuyNPCStore(buyitem);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg && dlg.message.indexOf('谢谢') >= 0){
						putupEquipments(itemname);
					}
					setTimeout(loop, 3000);
					return
				});
			});
		});
	}
	var buyEquip = (itemname)=>{
		cga.isMoveThinking = false
		if(itemname.indexOf("水晶")>=0){
			cga.travel.falan.toCrystalStore(()=>{
				cga.walkList([
				[17, 18]
				], ()=>{
					cga.turnTo(19, 18);
					buy(itemname)
				});
			});
		}else if(itemname.indexOf("平民")>=0){
			cga.travel.falan.toStone('B1', ()=>{
				cga.turnTo(150, 122);
				buy(itemname)
			});
		}else{
			console.log("未知装备输入！")
		}
	}

	var checkEquipItems = ()=>{
		if (noneedweapon){
			isweaponequip = true
		}
		// 如果光腚数值能达到150攻击，1300以上血量，则不买武器和水晶，裸装直接刷。
		var playerinfotemp = cga.GetPlayerInfo();
	
		if(playerinfotemp.detail.value_attack > thresholdattack && playerinfotemp.maxhp>thresholdhp){
			isweaponequip = true
			iscrystalequip = true
			console.log("当前血量上限：【"+playerinfotemp.maxhp+"】，大于买装备辅佐阈值：【"+thresholdhp+"】")
			console.log("当前攻击：【"+playerinfotemp.detail.value_attack+"】，大于买装备辅佐阈值：【"+thresholdattack+"】")
			console.log("不需要进行买装备来刷BOSS，开始裸奔")
			return
		}
		equips = cga.getEquipItems()
		if(equips.length){
			var emptyslot = cga.findInventoryEmptySlot();
			if(emptyslot == -1){
				cb(new Error('物品栏没有空位'));
				return;
			}
			for(var i in equips){
				if(equips[i].name == "平民斧"){
					console.log("武器OK")
					isweaponequip = true
				}
				if(equips[i].name.indexOf("水晶")>=0){
					console.log("水晶OK")
					iscrystalequip = true
				}
			}
		}else{
			isweaponequip = false
			iscrystalequip = false
		}
		return
	}
	var loop = ()=>{
		//补血
		if(cga.needSupplyInitial() && cga.GetPlayerInfo().hp < 800){
			cga.travel.falan.toCastleHospital(()=>{
				healcount+=1
				if (healcount % 10 ==0){
					console.log('每回补10次，去看看称号进展')
					// setTimeout(gettitle, 1000);
					gettitle()
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
				if(cga.getItemCount('斗士之证') == 0){
					cga.LogBack();
					setTimeout(loop, 3000);
					return
				}
				cga.walkList([
					bosspos,
				], ()=>{
					battle()
				});
			}else{
				console.log('在场外')
				cga.travel.falan.toStone('C', ()=>{
					checkEquipItems()
					if(!isweaponequip && !noneedweapon){
						console.log("去买武器")
						buyEquip(weapon)
						return
					}
					if(!iscrystalequip){
						console.log("去买水晶")
						buyEquip(crystal)
					}
					drop(false)
					if(isweaponequip && iscrystalequip){
						goto()
					}
				});
			}
		}

	}
	
	loop()

});