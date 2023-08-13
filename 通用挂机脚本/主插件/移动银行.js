var cga = global.cga;

// 移动银行站立地点
var waitmapname = '里谢里雅堡'
var waitXY = {x:48,y:39}

// 暗号物品名称
var cipher = '$^~'

const tradeReg = new RegExp(/r?([sd]{1})([igp])([\w\u4e00-\u9fa5（）]*)([\^]{1})([\d]+)(\&?)([\d]*)/)

var loop = ()=>{
	// 如果没有与银行对话缓存数据
	if(thisobj.bankCache.items == null || thisobj.bankCache.gold == null || thisobj.bankCache.pets == null){
		cga.disbandTeam(()=>{
			cga.travel.toBank((r) => {
				setTimeout(thisobj.saveOfflineData, 1000, loop);
			})
		})
		return
	}

	thisobj.toWaitLocation(()=>{
		// GetTeamPlayerInfo()属于C++类API，节约在等待存/取物品时的CPU消耗。
		let teaminfo = cga.GetTeamPlayerInfo();
		if(teaminfo.length){
			// 有人进队再获取更多信息，节约性能。
			let teamplayers = cga.getTeamPlayers()
			for (let i = 0; i < teamplayers.length; i++) {
				if(teamplayers[i].is_me){
					continue
				}
				if(teamplayers[i].nick == cipher){
					let lockPlayerName = teamplayers[i].name
					console.log('队员',lockPlayerName,'通过暗号昵称，开启队员聊天监听其需求..')
					thisobj.waitLockTeammateSay(lockPlayerName,(player, msg)=>{
						// 规定好player为null即视为lockPlayerName离队。
						if(player == null){
							setTimeout(loop, 1000);
							return false
						}
						let matchObj = msg.match(tradeReg)
						if(player.name == lockPlayerName && matchObj){
							thisobj.tradeFunc(lockPlayerName,matchObj,loop)
							return false
						}
						return true
					})
					return
				}
			}
			// 如果没有检测到有效交易信息，则重新进入loop循环。此处不需要return
		}
		console.log('3秒后重新进入loop..')
		setTimeout(loop,3000)
	})
	return
}

var thisobj = {
	// 角色最低保留金币，方式角色没钱不能存银行。
	protectGold : 1000,
	// 角色银行信息缓存
	bankCache :{
		items:null,
		gold:null,
		pets:null,
	},
	// 主动申请交易的延迟，给对方处理数据的时间。
	positiveTradeDelay : 2000,
	/**
	 * UNAecho:等待队内指定玩家名称的人说话，如果该人物离队，则结束循环。
	 * 参考cga.waitTeammateSay所写
	 * @param {*} cb 
	 */
	waitLockTeammateSay : (lockPlayerName,cb)=>{
		cga.AsyncWaitChatMsg((err, r)=>{
			if(!r){
				let curTeamPlayerInfos = cga.GetTeamPlayerInfo()
				for (let t of curTeamPlayerInfos) {
					if(t.name == lockPlayerName){
						thisobj.waitLockTeammateSay(lockPlayerName,cb);
						return
					}
				}
				console.log('监听【'+lockPlayerName+'】失败！该队员已离队。waitLockTeammateSay结束..')
				cb(null,null)
				return;
			}
			
			var listen = true;
			var fromTeammate = null;
			var teamplayers = cga.getTeamPlayers();

			if(!teamplayers.length){
				console.log('队伍已解散，waitLockedTeammateSay结束..')
				cb(null,null)
				return;
			}

			for(var i in teamplayers){
				if(teamplayers[i].unit_id == r.unitid){
					fromTeammate = teamplayers[i];
					fromTeammate.index = i;
					break;
				}
			}
			
			if(fromTeammate){
				var msgheader = fromTeammate.name + ': ';
				if(r.msg.indexOf(msgheader) >= 0){
					var msg = r.msg.substr(r.msg.indexOf(msgheader) + msgheader.length);
					
					if (msg.indexOf('[交易]') == 0)
						msg = msg.substr('[交易]' .length);
					listen = cb(fromTeammate, msg);
				}
			}

			if(listen == true)
				thisobj.waitLockTeammateSay(lockPlayerName,cb);
		}, 1000);
	},
	// 走到移动银行等待地点，在此地点与需求方对接。
	toWaitLocation:(cb)=>{
		cga.travel.newisland.toStone('X', () => {
			cga.walkList([
				[140, 111],
			], cb);
		});
	},
	getTradeInfo: (matchObj) => {
		console.log("🚀 ~ file: 移动银行.js:375 ~ matchObj:", matchObj)
		if (typeof matchObj != 'object') {
			throw new Error('matchObj must be object')
		}

		let result = {}
		// 判断信息来源，只有队长才能给出response信息。如果在队员处收到response信息，则出现安全问题。可能有人在利用交易规则漏洞。
		if (matchObj.input[0] == 'r') {
			result.type = 'response'
		} else {
			result.type = 'request'
		}
		// 判断存取
		if (matchObj[1] == 's') {
			result.tradeType = 'save'
		} else if (matchObj[1] == 'd') {
			result.tradeType = 'draw'
		}
		// 判断物资类型
		if (matchObj[2] == 'i') {
			result.targetType = 'item'
		}
		// 由于官方服务端不会返回银行中物品的itemid，这里废除使用itemid查询的方式
		// else if (matchObj[2] == '#') {
		// 	result.targetType = 'itemid'
		// } 
		else if (matchObj[2] == 'g') {
			result.targetType = 'gold'
		} else if (matchObj[2] == 'p') {
			result.targetType = 'pet'
		}
		// 获取目标物资
		if (matchObj[3]) {
			result.target = matchObj[3]
		}else if(matchObj[2] == 'g'){
			result.target = 'gold'
		}
		// 获取物资数量或宠物名称
		if (matchObj[4] == '^') {
			result.count = matchObj[5]
		}
		if (matchObj[6] == '&') {
			result.maxcount = matchObj[7]
		}

		//check
		if (!result.hasOwnProperty('tradeType') || !result.hasOwnProperty('targetType')
			|| (!result.hasOwnProperty('count')) || (result.targetType == 'item' && !result.hasOwnProperty('maxcount'))) {
			throw new Error('getTradeInfo交易信息错误，请检查:', matchObj)
		}
		return result
	},
	tradeFunc : (lockPlayerName,matchObj,cb) => {
		// 实时背包资源信息
		// let items = cga.GetItemsInfo()
		let gold = cga.GetPlayerInfo().gold;
		let pets = cga.GetPetsInfo()

		// 分析请求，制作成obj
		let reqObj = thisobj.getTradeInfo(matchObj)
		if(reqObj.type == 'response'){
			throw new Error('matchObj匹配到response信息，逻辑错误。response信息不能由需求方给出。')		
		}
		// 响应对象
		let resObj = {
			// 给对方的回复，会通知可以存/取多少资源。以r开头代表response
			resStr: 'r' + matchObj[1] + matchObj[2] + (matchObj[2] == 'g' ? '' : matchObj[3]) + matchObj[4],
			// 资源相关信息
			resTradeType: reqObj.tradeType,
			resTargetType: reqObj.targetType,
			resTarget: reqObj.target,
			resTargetMaxcount: reqObj.maxcount,
			// 未能满足需求的数量，如：身上只有20万，对方要30万。那么此值需要30-20=10万，需要去银行，或者搜索其他账号来补足。
			resRemain: 0,
		}

		// 存资源
		if(reqObj.tradeType == 'save'){
			if(reqObj.targetType == 'item'){
				let emptySlots = cga.getInventoryEmptySlotCount()
				let needSlots = Math.ceil(reqObj.count / (reqObj.maxcount > 0 ? reqObj.maxcount : 1))
				if(emptySlots < needSlots){
					resObj.resCount = emptySlots * (reqObj.maxcount > 0 ? reqObj.maxcount : 1)
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
				// 数量明确后再拼接item的堆叠数
				resObj.resStr = resObj.resStr + matchObj[6] + matchObj[7]
			}else if(reqObj.targetType == 'gold'){
				let cnt = 1000000 - gold
				if(cnt < reqObj.count){
					resObj.resCount = cnt
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
			}
			else if(reqObj.targetType == 'pet'){
				let cnt = 5 - pets.length
				if(cnt < reqObj.count){
					resObj.resCount = cnt
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
			}
		}else if(reqObj.tradeType == 'draw'){// 取资源
			if(reqObj.targetType == 'item'){
				let ownCount = cga.getItemCount(reqObj.target)
				if(ownCount < reqObj.count){
					resObj.resCount = ownCount
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
				// 数量明确后再拼接item的堆叠数
				resObj.resStr = resObj.resStr + matchObj[6] + matchObj[7]
			}else if(reqObj.targetType == 'gold'){
				let cnt = gold
				// 对方要的钱比自己持有的钱多，不能把全部钱都给出去，需要预留一点存银行消耗的钱
				if(cnt < reqObj.count){
					resObj.resCount = cnt - thisobj.protectGold
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{// 对方要的钱比自己持有的钱少，正常给
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
			}
			else if(reqObj.targetType == 'pet'){
				/**
				 * 这里判断宠物是否满足需求，如果是默认官方名称，name是''空串，只能通过realname（默认官方宠物名称）来判断。
				 * 如果宠物重命名，则以重命名为判断标准；如果是默认名字，以默认名字为判断标准。
				 * 
				 * 例：把【水龙蜥】命名为【1档】。
				 * 此时如果对方要【水龙蜥】，'水龙蜥'!='1档'，该水龙蜥不会被取出。
				 * 只会被【1档】这种名字的需求取出。
				 */
				let cnt = pets.filter((p) => {return (p.name ? p.name == reqObj.target : p.realname == reqObj.target)}).length
				if(cnt < reqObj.count){
					resObj.resCount = cnt
					resObj.resStr = resObj.resStr + resObj.resCount
					resObj.resRemain = reqObj.count - resObj.resCount
				}else{
					resObj.resStr = resObj.resStr + reqObj.count
					resObj.resCount = reqObj.count
				}
			}
		}else{
			throw new Error('matchObj.tradeType数值错误。')
		}
		
		console.log("🚀 ~ file: 移动银行.js:332 ~ resObj:", resObj)
		// 分析完身上资源之后，进入判断。
		// 如果当前提供不了服务，则去银行存取/换其它号重新执行逻辑
		if(resObj.resCount == 0){
			setTimeout(thisobj.afterTrade, 1000,resObj,cb);
			return
		}else{// 如果当前能提供服务（或提供部分服务，比如先存10万、先存1个道具、宠物等等），则进入交易。
			let stuffs = {}
			let stuffCnt = 0
			if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'item') {
				stuffs.itemFilter = (item)=>{
					// 没有堆叠数量的道具，count默认是0，这里统计时要人为改为1，便于计算
					if(item.name == resObj.resTarget && stuffCnt < resObj.resCount){
						stuffCnt += (item.count > 0 ? item.count : 1)
						return true
					}
					return false
				}
			} else if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'gold') {
				stuffs.gold = resObj.resCount
			} else if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'pet') {
				stuffs.petFilter = (pet)=>{
					if((pet.name ? pet.name == resObj.resTarget : pet.realname == resObj.resTarget) && stuffCnt < resObj.resCount){
						stuffCnt += 1
						return true
					}
					return false
				}
			}

			let teamplayers = cga.getTeamPlayers()
			for (let i = 0; i < teamplayers.length; i++) {
				// 必须在昵称上标记暗号，才能触发交易
				if(teamplayers[i].name == lockPlayerName && teamplayers[i].nick == cipher){

					// 告诉对方能提供服务的部分
					cga.SayWords(resObj.resStr, 0, 3, 1);
					// 延迟几秒再申请交易，给对方处理数据的时间
					setTimeout(()=>{
						cga.positiveTrade(lockPlayerName, stuffs, (playerName, receivedStuffs)=>{
							if(playerName != lockPlayerName){
								console.log('交易对象【'+playerName+'】与预期对象【' + lockPlayerName +'】不同！终止交易。')
								return false
							}
							if(reqObj.tradeType == 'save'){
								if (resObj.resTargetType == 'item') {
									let receivedCount = 0
									let received = receivedStuffs.items.filter((it)=>{
										if(it.name == resObj.resTarget){
											receivedCount += (it.count > 0 ? it.count : 1)
											return true
										}
										return false
									})
									if(received && receivedCount == resObj.resCount && received.length == Math.ceil(resObj.resCount / resObj.resTargetMaxcount)){
										return true
									}
									return false
								} else if (resObj.resTargetType == 'gold') {
									// 【注意】receivedStuffs.gold的value数据结构为{gold:12345}
									// 如果没给钱，receivedStuffs.gold = {}
									if(receivedStuffs.hasOwnProperty('gold') && receivedStuffs.gold == resObj.resCount){
										return true
									}
									return false
								} else if (resObj.resTargetType == 'pet') {
									let petsCount = 0
									let received = receivedStuffs.pet.filter((pet)=>{
										if((pet.name ? pet.name == resObj.resTarget : pet.realname == resObj.resTarget) && petsCount < resObj.resCount){
											petsCount += 1
											return true
										}
										return false
									})
									if(received && received.length == resObj.resCount){
										return true
									}
									return false
								}
							}
							return true
						}, (result)=>{
							if (result.success == true){
								// 交易过后，更新离线数据
								// 银行数据也会被更新，但是银行数据由于有Session机制（进入游戏时与银行NPC对话过），也是最新的。
								setTimeout(thisobj.saveOfflineData, 1000, ()=>{
									setTimeout(thisobj.afterTrade, 1000,resObj,cb);
								});
								return
							} else {
								console.log('与【'+lockPlayerName+'】交易失败，执行回调函数..')
								setTimeout(cb, 1000);
							}
						});
					}, thisobj.positiveTradeDelay);
					return
				}
			}
		}
	},
	afterTrade: (resObj, cb) => {
		if (resObj.resRemain == 0) {
			console.log('交易完成，本次交易无需去银行或换号。')
			cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
			setTimeout(cb, 1000)
			return
		}
		// 先解散队伍
		if(cga.GetTeamPlayerInfo().length){
			cga.disbandTeam(()=>{
				thisobj.afterTrade(resObj,cb)
			})
			return
		}

		let account = thisobj.search(resObj)
		// 既有记录中，没有满足需求的账号。开始循环登陆AccountInfos.js已经登记的账号，寻找满足需求的账号。
		// 【注意】如果AccountInfos.js中登记得所有账号均没有要取得资源，会陷入无限循环。
		if(account == null){
			account = cga.gui.getAccountWithBias(1)
			thisobj.switchAccount(account,cb)
		}else if(account && account.name == cga.GetPlayerInfo().name){//如果自己银行仓库满足需求
			// 去当地银行并与柜员对话
			cga.travel.toBank(() => {
				if(resObj.resTradeType == 'save'){
					if(resObj.resTargetType == 'item'){
						/**
						 * 说明：
						 * 存物品的逻辑是无视身上物品，尽量全都存进银行来腾出空间。
						 * 但如果银行中的道具的count=0，也就是无堆叠数的物品，如武器防具
						 * 这时cga.saveToBankAll中的cga.findBankEmptySlot逻辑，会根据maxcount数来返回可以存的pos
						 * 如果resObj.resTargetMaxcount是3，而银行中的道具count数为0，就会出现在这个count=0的格子无限循环存物品
						 * 这里需要将count=0的格子排除掉，所以return false。
						 * 其余情况均视为true
						 */
						cga.saveToBankAll((it)=>{
							if (it.count == 0) {
								return false
							}
							return true
						},
						resObj.resTargetMaxcount,
						(r)=>{
							setTimeout(thisobj.saveOfflineData, 1000, cb);
						});
					}else if(resObj.resTargetType == 'gold'){
						// 仅腾出需求存不下的钱的空间
						cga.MoveGold(resObj.resRemain,cga.MOVE_GOLD_TOBANK)
						setTimeout(thisobj.saveOfflineData, 2000, cb);
					}else if(resObj.resTargetType == 'pet'){
						cga.savePetToBankAll(()=>{
							// 由于需求存不下了，这里将任何宠物都存进银行，给身上腾出空间
							return true
						},false,()=>{
							setTimeout(thisobj.saveOfflineData, 1000, cb);
						})
					}
				}else if(resObj.resTradeType == 'draw'){
					if(resObj.resTargetType == 'item'){
						cga.drawFromBankAll(resObj.resTarget, resObj.resTargetMaxcount, (r)=>{
							setTimeout(thisobj.saveOfflineData, 1000, cb);
						});
					}else if(resObj.resTargetType == 'gold'){
						let bankgold = cga.GetBankGold()
						cga.MoveGold(resObj.resRemain > bankgold ? bankgold : resObj.resRemain,cga.MOVE_GOLD_FROMBANK)
						setTimeout(thisobj.saveOfflineData, 2000, cb);
					}else if(resObj.resTargetType == 'pet'){
						/**
						 * 【注意】本脚本对待宠物的判定逻辑为【有重命名(pet.name的值)以重命名为准】
						 * 但宠物的name属性，在cga.GetPetsInfo()与cga.GetBankPetsInfo()中，逻辑居然是不同的
						 * cga.GetPetsInfo()中，如果宠物没有重命名，name为''，空串
						 * cga.GetBankPetsInfo()中，如果宠物没有重命名，name与realname一样，为系统默认名字
						 * 
						 * 所以，这里的cga.drawPetToBankAll需要强制customerName=true，来实现以重命名为准来索引。
						 */
						cga.drawPetToBankAll(resObj.resTarget,true,()=>{
							setTimeout(thisobj.saveOfflineData, 1000, cb);
						})
					}
				}else{
					throw new Error('resObj.resTradeType数值错误。')
				}
			})
		}else{//其它人身上或者银行仓库满足需求
			thisobj.switchAccount(account,cb)
		}
	},
	search : (resObj)=>{
		let offlineData = cga.loadPlayerOfflineDataAllSync()
		let type = ['inventory','bank']

		if(resObj.resTradeType == 'save'){
			for (let i in offlineData) {
				for (let j in type) {
					if(resObj.resTargetType == 'item' && 20 - offlineData[i][type[j]].item.length > 0){
						return offlineData[i]
					}else if(resObj.resTargetType == 'gold' && 1000000 - offlineData[i][type[j]].gold > 0){
						return offlineData[i]
					}else if(resObj.resTargetType == 'pet' && 5 - offlineData[i][type[j]].pet.length > 0){
						return offlineData[i]
					}
				}
			}
		}else if(resObj.resTradeType == 'draw'){
			for (let i in offlineData) {
				for (let j in type) {
					if(resObj.resTargetType == 'item'){
						let find =  offlineData[i][type[j]].item.find((it)=>{
							return it.name == resObj.resTarget
						})
						if(find){
							console.log(offlineData[i].name + '的' + type[j] + '有' + find.name)
							return offlineData[i]
						}
					}else if(resObj.resTargetType == 'gold' && offlineData[i][type[j]].gold > thisobj.protectGold){
						return offlineData[i]
					}else if(resObj.resTargetType == 'pet'){
						let find =  offlineData[i][type[j]].pet.find((p)=>{
							return p.name == resObj.resTarget || p.realname == resObj.resTarget
						})
						if(find){
							return offlineData[i]
						}
					}
				}
			}
		}else{
			throw new Error('resObj.resTradeType类型错误。')
		}

		return null
	},
	saveOfflineData : (cb)=>{
        let inventory = cga.getAssets()
		// 只要游戏客户端启动后与银行NPC对话过一次，即可随时获取银行数据，无需再次对话。
		// 但存取操作还是需要对话的。
        let bank = cga.getAssets(true)
		let obj = {
            name : cga.GetPlayerInfo().name,
            inventory:inventory,
            bank:bank
        }
		// 顺便更新资源的缓存数据
		thisobj.bankCache.items = bank.item
		thisobj.bankCache.gold = bank.gold
		thisobj.bankCache.pets = bank.pet
		// 将身上与银行的所有资源保存为离线文件，方便搜索。
        cga.savePlayerOfflineData(obj,cb)
		return
	},
	switchAccount : (account,cb)=>{
		cga.gui.LoadAccount({
			user : account.user,
			pwd : account.pwd,
			gid : account.gid,// 子账号
			character : account.character, //左边or右边
		}, (err, result)=>{
			if(err){
				console.error(err);
				cb(new Error(err));
				return
			}
			console.log(result);
			console.log('登出!');
			setTimeout(()=>{
				cga.LogOut();
			}, 1000);
			return
		})
	},
	getDangerLevel: () => {
		return 0;
	},
	translate: (pair) => {
		return false;
	},
	loadconfig: (obj) => {
		return true;
	},
	inputcb: (cb) => {
		cb(null);
	},
	execute: () => {
		loop()
	},
};
module.exports = thisobj;