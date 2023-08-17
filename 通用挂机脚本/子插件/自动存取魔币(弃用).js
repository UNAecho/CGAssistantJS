var cga = global.cga;
var configTable = global.configTable;


// 移动银行名称关键字，注意这个需要在名称开头才行。
var namefilters = ['UNA','砂の']
// 暗号物品名称
var ciphername = '瓶子'
// 暗号物品数量意义，1存，7取
var cipherSave = 1
var cipherDraw = 7
var threshold = cipherSave > cipherDraw ? cipherSave : cipherDraw

// 暗号内容，区分存取动作
var save = '头目万岁'
var draw = '魔术'
var borncipher = "朵拉$"

// 移动银行名字核心处
// 移动银行站立地点
var waitXY = {x:48,y:39}

// 银行金币上限，取决于是否开启易玩通的付费项目：银行大客户
var banklimit = 1000000

// 携带金钱上下限，多存少取
var lowerlimit = 100000
var upperlimit = 900000

// 每次给移动银行多少的金币
var batchlimit = 500000

// 是否先使用个人银行
var personalflag = true

//魔币操作： cga.MOVE_GOLD_TOBANK = 1;cga.MOVE_GOLD_FROMBANK =  2;cga.MOVE_GOLD_DROP = 3
var GoldAct = (money, type,cb) => {
	if(type == 'save'){
		cga.MoveGold(money, cga.MOVE_GOLD_TOBANK);
		console.log('本次存【'+money+'】元')
		setTimeout(cb, 3000);
	}else if(type == 'draw'){
		cga.MoveGold(money, cga.MOVE_GOLD_FROMBANK);
		console.log('本次取【'+money+'】元')
		setTimeout(cb, 3000);
	}else{
		console.log('非存取钱动作，跳过此操作')
		setTimeout(cb, 3000);
	}
	return

}

var thisobj = {
	prepare : (cb)=>{

		var personalbanklogic =(cb2)=>{
			
			var curgold = cga.GetPlayerInfo().gold
			if(curgold >= lowerlimit && curgold <= upperlimit)
			{
				cb(null);
				return;
			}
			
			var typeofact = curgold >= upperlimit ? 'save' : 'draw'
			var curgold = cga.GetPlayerInfo().gold
			// 银行或人物可存/取的钱数
			var remainingSpace = 0
			var optgold = 0

			cga.travel.toBank(() => {
				cga.AsyncWaitNPCDialog(() => {
					var bankgold = cga.GetBankGold()
					if(typeofact == 'save'){
						remainingSpace = banklimit - bankgold
						if(bankgold == 1000000){
							console.log('个人银行【满】了，去找移动银行')
							personalflag = false
							cga.travel.autopilot('主地图',()=>{
								setTimeout(thisobj.prepare, 1000, cb2);
							})
							return
						}else{// 在尽量多存的基础上，留15万在身上
							optgold = curgold > remainingSpace + 150000 ? remainingSpace : curgold - 150000
							setTimeout(() => {
								GoldAct(optgold, typeofact,()=>{
									cga.travel.autopilot('主地图',cb2)
								})
							}, 2000);
						}
					}else if(typeofact == 'draw'){
						remainingSpace = 1000000 - curgold -  100000
						if(bankgold == 0){
							console.log('个人银行【没钱】了，去找移动银行')
							personalflag = false
							cga.travel.autopilot('主地图',()=>{
								setTimeout(thisobj.prepare, 1000, cb2);
							})
							return
						}else{// 
							optgold = (bankgold > remainingSpace) && (bankgold <= 1000000) ? remainingSpace : (bankgold > 10000000 ? remainingSpace : bankgold)
							setTimeout(() => {
								GoldAct(optgold, typeofact,()=>{
									cga.travel.autopilot('主地图',cb2)
								})
							}, 2000);
						}
					}
					return
				}, 1000);
			});
		}

		// 如果个人银行无法满足魔币调整，就进入移动银行逻辑
		var portablebanklogic = (cb)=>{
			// console.log('【提示：】需要调整魔币数量，自动去找移动银行存取款')
			var inventory = cga.getInventoryItems();
			// 如果背包满了，无法购买暗号物品，则本功能跳过
			// TODO 如果开了付费移动背包，需要添加40、60、80等数量
			if(inventory.length == 20){
				console.error('包满，无法购买特殊数量的暗号物品了，中止此脚本。')
				cb(null);
				return;
			}
	
			var curgold = cga.GetPlayerInfo().gold
			var cipher = curgold >= upperlimit  ? save : draw
			var ciphercnt = cipher == save ? cipherSave : cipherDraw
			// 如果是1级出生小号没有钱买暗号物品，先提取一点启动资金
			if (curgold == 0){
				cipher = borncipher
				lowerlimit = 1000
			}else{
				lowerlimit = 100000
			}

			if(curgold >= lowerlimit && curgold <= upperlimit)
			{
				cb(null);
				return;
			}

			// // 丢弃暗号物品，一个pos最多丢弃9个物品
			// var dropcount = 0
			// var dropUseless = (cb2)=>{
			// 	console.log('开始清理暗号物品')
			// 	cga.travel.falan.toStone('C', ()=>{
			// 		cga.walkList([
			// 		[48, 39],
			// 		], ()=>{
			// 			if(dropcount < 9 && cga.getInventoryItems().find((inv)=>{
			// 				return inv.name == ciphername;
			// 			}) != undefined){
			// 				var itempos = cga.findItem(ciphername);
			// 				if(itempos != -1){
			// 					cga.DropItem(itempos);
			// 					dropcount+=1
			// 					setTimeout(dropUseless, 500, cb2);
			// 					return;
			// 				}
			// 			}
			// 			dropcount = 0
			// 			cb2(null);
			// 		});
			// 	});
			// }
			var buycipher = (cb2)=>{
				console.log('去购买暗号物品：【'+ciphername+'】【' +ciphercnt+ '】个')

				var shopAction = (talkpos, turndir, itemname, cb3)=>{
					cga.walkList([
						talkpos
						], ()=>{
							cga.turnDir(turndir);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(0, 0);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									var store = cga.parseBuyStoreMsg(dlg);
									if(!store)
									{
										cb2(new Error('商店内容解析失败'));
										return;
									}
		
									var buyitem = [];
									var emptySlotCount = cga.getInventoryEmptySlotCount();
		
									store.items.forEach((it)=>{
										if(it.name == itemname && emptySlotCount > 0){
											// 保持拥有存/取暗号最大数量，保证交易正常进行
											buyitem.push({index: it.index, count: ciphercnt});
										}
									});
		
									cga.BuyNPCStore(buyitem);
									cga.AsyncWaitNPCDialog((err, dlg)=>{
										cga.travel.autopilot('主地图',()=>{
											setTimeout(thisobj.prepare, 1000, cb3);
										})
										return;
									});
								});
							});
						});
					}
				var mapname = cga.GetMapName()
				if (mapname == '哥拉尔镇'){
					cga.travel.autopilot('杂货店',()=>{
						shopAction([25,18], 6, '瓶子', cb2)
					})
					return
				}else if(mapname == '阿凯鲁法村'){
					// TODO 
					// cga.travel.autopilot('杂货店',()=>{
					// 	shopAction([25,18], 6, '瓶子', cb2)
					// })
					return
				}else{
					cga.travel.falan.toStone('E2', ()=>{
						cga.travel.autopilot('拿潘食品店',()=>{
							shopAction([19,11], 0, '瓶子', cb2)
						})
					});
					return
				}
			}
			var trade = (targetname,cb2)=>{
				// 当移动银行掉线、登出换人物时
				if(cga.getTeamPlayers().length == 0){
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
					console.log('移动银行离队，重新等待..')
					setTimeout(retry, 1500,cb2);
					return
				}

				// 满足金币需求了就拍拍屁股走人
				if(cga.GetPlayerInfo().gold >= lowerlimit && cga.GetPlayerInfo().gold <= upperlimit){
					console.log('清点钱款完毕，退出此插件')
					if(cga.getTeamPlayers().length > 0){
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					}
					setTimeout(thisobj.prepare, 1000, cb2);
					return;
				}

				if(cga.getTeamPlayers().length > 1){
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
					setTimeout(() => {
						cga.SayWords(cipher, 0, 3, 1);
					}, 1000);
				}
	
				var stuffs = { 				
					itemFilter : (item)=>{
					if (item.name == ciphername && item.count == ciphercnt){
						return true;
					}
					
					return false;
				},
					gold : cipher == save ? batchlimit : 0 };
	
				setTimeout(()=>{
					cga.positiveTrade(targetname, stuffs, (playerName, receivedStuffs)=>{
						// 如果对方没给钱，receivedStuffs.gold是undefined而不是0
						// TODO：如果是存钱，对方没给钱也会拒绝，要修正一下
						if(cipher == save){
							if(!receivedStuffs.gold || receivedStuffs.gold >= lowerlimit){
								console.log('对方提供:');
								console.log(receivedStuffs);
								return true;
							}
							console.log('交易异常，拒绝');
							return false;
						}else{
							if(receivedStuffs.gold && receivedStuffs.gold >= lowerlimit){
								console.log('对方提供:');
								console.log(receivedStuffs);
								return true;
							}
							console.log('交易异常，银行方没有提供【'+ lowerlimit +'】');
							return false;
						}
					}, (result)=>{
						if (result.success == true){
							cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
							setTimeout(trade, 1000,targetname,cb2);
							return
						} else {
							setTimeout(trade, 2000,targetname,cb2);
						}
					});
				}, 2000);
				
			}
			var retry = (cb)=>{
				// console.log('尝试寻找移动银行人物..')
				var portablebank = cga.findPlayerUnit((u)=>{
					// 检测移动银行是否是目标，方法暂时使用名称fliter+坐标
					for (var filter in namefilters){
						if(u.unit_name.indexOf(namefilters[filter]) == 0 && u.xpos == waitXY.x && u.ypos == waitXY.y){
							console.log('发现移动银行人物:'+ u.unit_name)
							return true;
						}
					}
					return false
				});
				if(portablebank && cga.getTeamPlayers().length == 0){
					var target = cga.getRandomSpace(portablebank.xpos,portablebank.ypos);
					cga.walkList([
					target
					], ()=>{
						cga.addTeammate(portablebank.unit_name, (r)=>{
							// 开启队聊，防止干扰其他玩家
							cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
							// 进入交易模式
							setTimeout(()=>{
								trade(portablebank.unit_name,cb)
							}, 2000);
							//TODO 这里自行加了return，如果有问题注意这里
							return
						})
					});
				} else {
					setTimeout(retry, 1500,cb);
				}
			}
			// 判断是否需要购买暗号物品
			var item = cga.getInventoryItems().find((it)=>{
				return ((it.name == ciphername) && it.count == ciphercnt)
			});
			// 如果是取出生启动金，或者包里已经有交易暗号物品，才进入交易模式
			if(cipher == borncipher || item){
				var go = ()=>{
					cga.travel.falan.toStone('C', ()=>{
						cga.walkList([
							[48, 38],
						], ()=>{
							setTimeout(retry, 2000,cb);
						});
					});
				}
				// 添加在国外回来取钱的逻辑
				var config = cga.loadPlayerConfig();
				if(config && (config.settledCity == '阿凯鲁法村' || config.settledCity == '哥拉尔镇')){
					console.log('发现人在国外，需要回法兰取钱。')
					cga.travel.goAbroad('法兰城',go)
					return
				}

				go()
			}
			else{
				setTimeout(buycipher, 1000,cb);
			}
			return
		}

		// 清理背包，如果是烧声望来取钱，还要丢掉卡片
		var dropcount = 0
		var dropUseless = (cb) =>{
			var item = cga.getInventoryItems().find((it)=>{
				return ((it.name == '小石像怪的卡片' || it.name == '魔石'))
			});
			if(item && dropcount < 10){
				dropcount+=1
				cga.DropItem(item.pos);
				setTimeout(dropUseless, 1000,cb);
			}
		}

		dropUseless(cb)

		if (personalflag){
			personalbanklogic(cb)
		}else{
			portablebanklogic(cb)
		}
		return
	},
	think : (ctx)=>{
		var curgold = cga.GetPlayerInfo().gold
		if(curgold < lowerlimit || curgold > upperlimit)
		{
			ctx.result = 'logback_forced';
			ctx.reason = '自动存取魔币';
		}
	},
	loadconfig : (obj, cb)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}
};

module.exports = thisobj;