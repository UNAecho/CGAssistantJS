var cga = require(process.env.CGA_DIR_PATH_UTF8 + '/cgaapi')(function () {

	// 需要与自动存取.js中一致
	const tradeReg = new RegExp(/r?([sd]{1})([igp])([\w\u4e00-\u9fa5（）：「」？]*)([\^]{1})([\d]+)(\&?)([\d]*)([\S]*)?/)

	var loop = () => {
		// 如果没有与银行对话缓存数据。
		if (thisobj.bankCache.item == null || thisobj.bankCache.gold == null || thisobj.bankCache.pets == null) {
			cga.disbandTeam(() => {
				cga.travel.toBank((r) => {
					setTimeout(thisobj.saveOfflineData, 1000, loop);
				})
			})
			return
		}

		let XY = cga.GetMapXY()
		if (XY.x != thisobj.serverPos[0] || XY.y != thisobj.serverPos[1]) {
			thisobj.toWaitLocation(loop)
			return
		}

		// 昵称暗号
		let playerInfo = cga.GetPlayerInfo()
		if (playerInfo.nick != thisobj.serverCipher) {
			cga.ChangeNickName(thisobj.serverCipher)
		}

		let teamplayers = cga.getTeamPlayers()
		if (teamplayers.length) {
			for (let i = 0; i < teamplayers.length; i++) {
				if (teamplayers[i].is_me) {
					continue
				}
				if (teamplayers[i].nick == thisobj.clientCipher) {
					let lockPlayerName = teamplayers[i].name
					console.log('队员', lockPlayerName, '通过暗号昵称，开启队员聊天监听其需求..')
					cga.waitLockTeammateSay(lockPlayerName, (player, msg) => {
						// 规定好player为null即视为lockPlayerName离队。
						if (player == null) {
							setTimeout(loop, 1000);
							return false
						}
						let matchObj = msg.match(tradeReg)
						if (player.name == lockPlayerName && matchObj) {
							thisobj.tradeFunc(lockPlayerName, matchObj, loop)
							return false
						}
						return true
					})
					return
				}
			}
			// 如果没有检测到有效交易信息，则重新进入loop循环。此处不需要return
		}
		setTimeout(loop, 3000)
		return
	}

	var thisobj = {
		// 寻找服务玩家的昵称暗号，需要与自动存取.js中一致
		serverCipher: '朵拉',
		// 客户端昵称暗号，服务方会辨识是否提供服务。，需要与自动存取.js中一致
		clientCipher: '$^@',
		// 隐式加密金额，请在自动存取.js中加入对应逻辑。
		goldCipher: {
			'save': 1,
			'draw': 7,
		},
		// 禁用隐式加密的开关，如身上和银行金币均满，而对方要取东西，自己无法收取暗号金币时，启用此开关
		skipCipherGold: false,
		// 禁用隐式加密告知内容，需要与自动存取.js中一致
		skipCipherStr: '*1~',
		// 角色最低保留金币，方式角色没钱不能存银行。
		protectGold: 1000,
		// 角色银行信息缓存
		bankCache: {
			item: null,
			gold: null,
			pets: null,
		},
		// 主动申请交易的延迟，给对方处理数据的时间。
		positiveTradeDelay: cga.randomDelay(1, 2),
		// 服务端玩家固定坐标。必须要固定，否则会出现客户端跟着服务端走的情况。
		serverPos: [48, 39],
		// 走到移动银行等待地点，在此地点与需求方对接。
		toWaitLocation: (cb) => {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					thisobj.serverPos,
				], () => {
					// 打开组队，让客户端加入
					console.log('开启组队..')
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
					cb(null)
					return
				});
			});
		},
		getTradeInfo: (matchObj) => {
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
			} else if (matchObj[2] == 'g') {
				result.target = 'gold'
			}
			// 获取物资数量或宠物名称
			if (matchObj[4] == '^') {
				result.count = matchObj[5]
			}
			// 如果是道具，获取对方告知此道具的堆叠数量
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
		tradeFunc: (lockPlayerName, matchObj, cb) => {
			// 实时背包资源信息
			// let items = cga.GetItemsInfo()
			let gold = cga.GetPlayerInfo().gold;
			let pets = cga.GetPetsInfo()

			// 分析请求，制作成obj
			let reqObj = thisobj.getTradeInfo(matchObj)
			if (reqObj.type == 'response') {
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
			if (reqObj.tradeType == 'save') {
				if (reqObj.targetType == 'item') {
					let emptySlots = cga.getInventoryEmptySlotCount()
					let needSlots = Math.ceil(reqObj.count / (reqObj.maxcount > 0 ? reqObj.maxcount : 1))
					if (emptySlots < needSlots) {
						resObj.resCount = emptySlots * (reqObj.maxcount > 0 ? reqObj.maxcount : 1)
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
					// 数量明确后再拼接item的堆叠数
					resObj.resStr = resObj.resStr + matchObj[6] + matchObj[7]
				} else if (reqObj.targetType == 'gold') {
					let cnt = 1000000 - gold
					if (cnt < reqObj.count) {
						resObj.resCount = cnt
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
				}
				else if (reqObj.targetType == 'pet') {
					let cnt = 5 - pets.length
					if (cnt < reqObj.count) {
						resObj.resCount = cnt
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
				}
			} else if (reqObj.tradeType == 'draw') {// 取资源
				if (reqObj.targetType == 'item') {
					let ownCount = cga.getItemCount(reqObj.target)
					if (ownCount < reqObj.count) {
						resObj.resCount = ownCount
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
					// 数量明确后再拼接item的堆叠数
					resObj.resStr = resObj.resStr + matchObj[6] + matchObj[7]
				} else if (reqObj.targetType == 'gold') {
					let cnt = gold
					// 对方要的钱比自己身上金币还多，不能把全部钱都给出去，需要预留一点存银行消耗的钱（thisobj.protectGold）
					if (cnt < reqObj.count) {
						// 取钱逻辑，首先看一下thisobj.protectGold
						// 如果身上连thisobj.protectGold的数额都没有，比如身上金币数为0，而此时客户端要求取钱
						if (cnt <= thisobj.protectGold) {
							resObj.resCount = 0
						} else {// 如果在thisobj.protectGold可以维持的情况下，给出一部分
							resObj.resCount = cnt - thisobj.protectGold
						}
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {// 对方要的钱比自己持有的钱少，正常给
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
				} else if (reqObj.targetType == 'pet') {
					/**
					 * 这里判断宠物是否满足需求，如果是默认官方名称，name是''空串，只能通过realname（默认官方宠物名称）来判断。
					 * 如果宠物重命名，则以重命名为判断标准；如果是默认名字，以默认名字为判断标准。
					 * 
					 * 例：把【水龙蜥】命名为【1档】。
					 * 此时如果对方要【水龙蜥】，'水龙蜥'!='1档'，该水龙蜥不会被取出。
					 * 只会被【1档】这种名字的需求取出。
					 */
					let cnt = pets.filter((p) => { return (p.name ? p.name == reqObj.target : p.realname == reqObj.target) }).length
					if (cnt < reqObj.count) {
						resObj.resCount = cnt
						resObj.resStr = resObj.resStr + resObj.resCount
						resObj.resRemain = reqObj.count - resObj.resCount
					} else {
						resObj.resStr = resObj.resStr + reqObj.count
						resObj.resCount = reqObj.count
					}
				}
			} else {
				throw new Error('matchObj.tradeType数值错误。')
			}

			// 然后判断是否要收取暗号金币
			if (cga.GetPlayerInfo().gold + thisobj.goldCipher[reqObj.tradeType] > 1000000) {
				// 将跳过暗号金币flag置为true
				thisobj.skipCipherGold = true
				// 告知客户端不需要暗号金币
				resObj.resStr = resObj.resStr + thisobj.skipCipherStr
			}

			// 分析完身上资源之后，进入判断。
			// 如果当前提供不了服务，则去银行存取/换其它号重新执行逻辑
			if (resObj.resCount == 0) {
				setTimeout(thisobj.afterTrade, 1000, resObj, cb);
				return
			} else {// 如果当前能提供服务（或提供部分服务，比如先存10万、先存1个道具、宠物等等），则进入交易。
				let stuffs = {}
				let stuffCnt = 0
				if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'item') {
					stuffs.itemFilter = (item) => {
						// 没有堆叠数量的道具，count默认是0，这里统计时要人为改为1，便于计算
						let itemCnt = item.count > 0 ? item.count : 1
						if (item.name == resObj.resTarget && (stuffCnt + itemCnt) <= resObj.resCount) {
							stuffCnt += itemCnt
							return true
						}
						return false
					}
				} else if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'gold') {
					stuffs.gold = parseInt(resObj.resCount)
				} else if (resObj.resTradeType == 'draw' && resObj.resTargetType == 'pet') {
					stuffs.petFilter = (pet) => {
						if ((pet.name ? pet.name == resObj.resTarget : pet.realname == resObj.resTarget) && stuffCnt < resObj.resCount) {
							stuffCnt += 1
							return true
						}
						return false
					}
				}

				let teamplayers = cga.getTeamPlayers()
				for (let i = 0; i < teamplayers.length; i++) {
					// 必须在昵称上标记暗号，才能触发交易
					if (teamplayers[i].name == lockPlayerName && teamplayers[i].nick == thisobj.clientCipher) {

						// 告诉对方能提供服务的部分
						cga.SayWords(resObj.resStr, 0, 3, 1);
						// 延迟几秒再申请交易，给对方处理数据的时间
						setTimeout(() => {
							cga.positiveTrade(lockPlayerName, stuffs, (playerName, receivedStuffs) => {
								if (playerName != lockPlayerName) {
									console.log('交易对象【' + playerName + '】与预期对象【' + lockPlayerName + '】不同！终止交易。')
									return false
								}

								if (reqObj.tradeType == 'save') {
									if (resObj.resTargetType == 'item') {
										let receivedCount = 0
										let received = receivedStuffs.items.filter((it) => {
											if (it.name == resObj.resTarget) {
												receivedCount += (it.count > 0 ? it.count : 1)
												return true
											}
											return false
										})
										if (received && (!thisobj.skipCipherGold && receivedStuffs.gold != thisobj.goldCipher[reqObj.tradeType])) {
											console.log('【' + lockPlayerName + '】的金币数【' + receivedStuffs.gold + '】未通过暗号识别！拒绝交易')
											return false
										}
										/**
										 * 检查数量。【注意】客户端可能会少给。
										 * 举例：服务端回复可以存15个堆叠数为3，而客户端有1个物品堆叠数不足3，为2。
										 * 那么最终客户端会给出5个格子的物品，但是有1个格子count为2，那么就是2+3+3+3+3=14个，小于15个
										 */
										if (received && receivedCount <= resObj.resCount && received.length == Math.ceil(resObj.resCount / (resObj.resTargetMaxcount > 0 ? resObj.resTargetMaxcount : 1))) {
											return true
										}
										console.log('【' + lockPlayerName + '】动作【' + resObj.resTradeType + '】【' + resObj.resTarget + '】验证失败！拒绝交易')
										return false
									} else if (resObj.resTargetType == 'gold') {
										// 【注意】receivedStuffs.gold的value数据结构为{gold:12345}
										// 如果没给钱，receivedStuffs.gold = {}
										if (receivedStuffs.hasOwnProperty('gold') && receivedStuffs.gold == resObj.resCount) {
											return true
										}
										console.log('【' + lockPlayerName + '】动作【' + resObj.resTradeType + '】【' + resObj.resTarget + '】验证失败！拒绝交易')
										return false
									} else if (resObj.resTargetType == 'pet') {
										let petsCount = 0
										let received = receivedStuffs.pet.filter((pet) => {
											if ((pet.name ? pet.name == resObj.resTarget : pet.realname == resObj.resTarget) && petsCount < resObj.resCount) {
												petsCount += 1
												return true
											}
											return false
										})
										if (received && (!thisobj.skipCipherGold && receivedStuffs.gold != thisobj.goldCipher[reqObj.tradeType])) {
											console.log('【' + lockPlayerName + '】的金币数【' + receivedStuffs.gold + '】未通过暗号识别！拒绝交易')
											return false
										}
										if (received && received.length == resObj.resCount) {
											return true
										}
										console.log('【' + lockPlayerName + '】动作【' + resObj.resTradeType + '】【' + resObj.resTarget + '】验证失败！拒绝交易')
										return false
									}
								} else if (reqObj.tradeType == 'draw') {
									// 隐式加密，存取物品/宠物要提供金币暗号
									if (resObj.resTargetType != 'gold') {
										if (receivedStuffs && receivedStuffs.gold == thisobj.goldCipher[reqObj.tradeType]) {
											console.log('对方没有给出暗号金币，拒绝交易..')
											return true
										} else if (thisobj.skipCipherGold) {
											console.log('当前金币已经接收不了暗号金币，跳过此判断，同意交易..')
											return true
										}
									} else if (resObj.resTargetType == 'gold') {// 由于使用金币作为暗号，在交易本身就是金币的时候，则不使用暗号，太麻烦。TODO想一个除了金币以外的加密方式。
										return true
									}
									console.error('异常情况，请检查')
									return false
								}
								console.error('异常情况，请检查')
								return false
							}, (result) => {
								// 无论交易是否成功，都要重置暗号金币flag
								thisobj.skipCipherGold = false

								if (result.success == true) {
									// 交易成功，新离线数据
									// 银行数据也会被更新，但是银行数据由于有Session机制（进入游戏时与银行NPC对话过），也是最新的。
									setTimeout(thisobj.saveOfflineData, 1000, () => {
										setTimeout(thisobj.afterTrade, 1000, resObj, cb);
									});
									return
								}
								// 暗号金币实行判断制，理论上不应该出现物品栏已满的逻辑，暂时上线运行测试是否可用

								// else if (result.success == false && result.reason == '物品栏已满') {
								// 	console.log('与【' + lockPlayerName + '】交易失败，系统返回【物品栏已满】，推测是金币满了。搜索其它账号来支持继续交易..')
								// 	/**
								// 	 * 推测是金币满了，接收不了暗号的金币。这里手动修改一下resObj，以防干扰thisobj.afterTrade的判断
								// 	 * 这里resObj中相关数据要从item、pet改为gold类型，因为本质上交易前已经判断过部分item或pet是可以存的，只不过因为暗号金币不能存进来导致显示【物品栏已满】
								// 	 */
								// 	resObj.resTradeType = 'save'
								// 	resObj.resTarget = '金币'
								// 	resObj.resTargetType = 'gold'
								// 	resObj.resCount = '0'
								// 	// resRemain数量改为暗号金币的数量
								// 	resObj.resRemain = thisobj.goldCipher[resObj.resTradeType]
								// 	setTimeout(thisobj.saveOfflineData, 1000, () => {
								// 		setTimeout(thisobj.afterTrade, 1000, resObj, cb);
								// 	});
								// 	return
								// } 
								else {
									console.log('与【' + lockPlayerName + '】交易失败，执行回调函数..')
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
				setTimeout(cb, 1000)
				return
			}
			// 先解散队伍
			if (cga.getTeamPlayers().length) {
				// 重置昵称并延迟几秒解散队伍，防止其它等待玩家在解散队伍瞬间再次加入
				cga.ChangeNickName('')
				setTimeout(() => {
					cga.disbandTeam(() => {
						thisobj.afterTrade(resObj, cb)
					})
				}, 1500)
				return
			}

			let account = thisobj.search(resObj)
			// 既有记录中，没有满足需求的账号。开始循环登陆AccountInfos.js已经登记的账号，寻找满足需求的账号。
			// 【注意】如果AccountInfos.js中登记得所有账号均没有要取得资源，会陷入无限循环。
			if (account == null) {
				console.log('离线数据中，没有角色满足需求，开始循环登陆已经登记的账号，挨个尝试..')
				account = cga.gui.getAccountWithBias(1)
				thisobj.switchAccount(account, cb)
			} else if (account && account.name == cga.GetPlayerInfo().name) {//如果自己银行仓库满足需求
				console.log('自己银行账户即可满足需求，去银行..')
				console.log('【注意】如果个人设置中没有记录银行最大格数量，可能需要先记录一次格子就返回交易地点。再次与客户端对话，才能正常进行来自己银行存东西的逻辑。')
				// 去当地银行并与柜员对话
				cga.travel.toBank(() => {
					if (resObj.resTradeType == 'save') {
						if (resObj.resTargetType == 'item') {
							/**
							 * 说明：
							 * 这里的本意为【将身上的所有道具存到银行，腾出背包中的格子】
							 * 但执行逻辑使用的是cga.saveToBankAll()，使用一个filter实现这个逻辑判断。
							 * 受限于filter()的方法还要同时给cga.findBankEmptySlot()来辨别某一个格子是否可以存储或者继续堆叠存储（如银行本来有2个，现在放进去1个也可以）
							 * filter()要实现的逻辑就很复杂：既要满足背包中的道具全部return true，也要对银行中的道具根据条件return true还是false。
							 * 银行中的道具，如果是可以堆叠的，就要return true。如果是未鉴定的、count=0的、堆叠数叠加后超过目前要存的道具的，都要return false
							 * 
							 * 那么如何使用一个filter()满足所有逻辑呢？
							 * 目前使用的解决办法：
							 * 1、关于如何鉴别当前迭代的物品是背包物品还是银行物品：
							 * 银行中的item pos从100（含）开始，那么将pos<100的物品，视为背包中的物品，pos>=100的物品，视为银行中的物品。这样filter()可以实现一个方法识别
							 * 2、如何辨别当前迭代物品能否在银行中堆叠而不是使用新的空格子？
							 * 在filter()的外部调用区域，定义一个item name的缓存。遍历背包时，如果决定要存该物品（return true）之前，缓存这个物品的name
							 * 然后在cga.findBankEmptySlot()遍历银行中的可用格子时，如果遍历到的物品name与缓存name相等，视为可能会叠加的物品，然后根据maxcount判断是否可以往此格叠加。
							 * 
							 * TODO:已知bug，由于cga.saveToBankAll()以及相关的银行API，maxcount是在调用时就固定死的，所以当背包要存的东西manxcount不固定时，只能按照1种manxcount来执行
							 * 就比如当你传入manxcount=3时，药剂、料理虽然适用，但狩猎、木材、矿物等manxcount=40的物品，也会被视为3个即占满一个格子。
							 * 此问题的解决方案：cga.findBankEmptySlot()中的maxcount修改逻辑，变成可适配function类型和Number类型。
							 * 当maxcount传入function类型时，会根据function return的数值来动态识别当前迭代的银行物品的堆叠数。
							 * function目前使用cga.getItemMaxcount()来获取物品的maxcount值，请保持其数据健壮。
							 * 
							 * 目前投入生产环节使用，注意观察使用情况
							 */

							let itemNameCache = null
							cga.saveToBankAll((it) => {
								// pos小于100视为身上物品
								if (it.pos < 100) {
									itemNameCache = it.name
									return true
								} else {// pos大于等于100银行物品，PS:银行第1格的pos就是100
									if (it.name == itemNameCache) {
										return true
									}
									return false
								}
							},
								(it) => {
									return cga.getItemMaxcount(it)
								},
								(err) => {
									setTimeout(thisobj.saveOfflineData, 1000, cb);
								});
						} else if (resObj.resTargetType == 'gold') {
							// 银行还能存多少钱
							let freeSpace = 1000000 - cga.GetBankGold()
							// 仅腾出需求存不下的部分
							cga.MoveGold(resObj.resRemain > freeSpace ? freeSpace : resObj.resRemain, cga.MOVE_GOLD_TOBANK)
							setTimeout(thisobj.saveOfflineData, 2000, cb);
						} else if (resObj.resTargetType == 'pet') {
							cga.savePetToBankAll(() => {
								// 由于需求存不下了，这里将任何宠物都存进银行，给身上腾出空间
								return true
							}, false, () => {
								setTimeout(thisobj.saveOfflineData, 1000, cb);
							})
						}
					} else if (resObj.resTradeType == 'draw') {
						if (resObj.resTargetType == 'item') {
							cga.drawFromBankAll(resObj.resTarget, resObj.resTargetMaxcount, (r) => {
								setTimeout(thisobj.saveOfflineData, 1000, cb);
							});
						} else if (resObj.resTargetType == 'gold') {
							let bankgold = cga.GetBankGold()
							cga.MoveGold(resObj.resRemain > bankgold ? bankgold : resObj.resRemain, cga.MOVE_GOLD_FROMBANK)
							setTimeout(thisobj.saveOfflineData, 2000, cb);
						} else if (resObj.resTargetType == 'pet') {
							/**
							 * 【注意】本脚本对待宠物的判定逻辑为【有重命名(pet.name的值)以重命名为准】
							 * 但宠物的name属性，在cga.GetPetsInfo()与cga.GetBankPetsInfo()中，逻辑居然是不同的
							 * cga.GetPetsInfo()中，如果宠物没有重命名，name为''，空串
							 * cga.GetBankPetsInfo()中，如果宠物没有重命名，name与realname一样，为系统默认名字
							 * 
							 * 所以，这里的cga.drawPetToBankAll需要强制customerName=true，来实现以重命名为准来索引。
							 */
							cga.drawPetToBankAll(resObj.resTarget, true, () => {
								setTimeout(thisobj.saveOfflineData, 1000, cb);
							})
						}
					} else {
						throw new Error('resObj.resTradeType数值错误。')
					}
				})
			} else {//其它人身上或者银行仓库满足需求
				console.log('玩家【' + account.name + '】满足需求，开始切换账号..')
				let accountObj = cga.gui.getAccount(account.name)
				thisobj.switchAccount(accountObj, cb)
			}
		},
		search: (resObj) => {
			// 读取全员数据
			let offlineData = cga.loadPlayerOfflineDataAllSync()
			// 背包和银行的名称
			let type = ['inventory', 'bank']

			// 先检查全员数据中是否有自己的数据，如果有，则将其置顶，这样可以优先搜索自己的银行信息，如果满足需求，则无需切换账号了。
			let myName = cga.GetPlayerInfo().name
			for (let i = 0; i < offlineData.length; i++) {
				// 如果有自己的数据，则置顶自己的数据
				if (offlineData[i].name == myName) {
					let tmp = offlineData[i]
					offlineData[i] = offlineData[0]
					offlineData[0] = tmp
				}
			}
			// 开始搜索数据，找出符合条件的玩家
			if (resObj.resTradeType == 'save') {
				for (let i in offlineData) {
					for (let j in type) {
						if (resObj.resTargetType == 'item' && 20 - offlineData[i][type[j]].item.length > 0) {
							return offlineData[i]
						} else if (resObj.resTargetType == 'gold' && 1000000 - offlineData[i][type[j]].gold > 0) {
							return offlineData[i]
						} else if (resObj.resTargetType == 'pet' && 5 - offlineData[i][type[j]].pet.length > 0) {
							return offlineData[i]
						}
					}
				}
			} else if (resObj.resTradeType == 'draw') {
				for (let i in offlineData) {
					for (let j in type) {
						if (resObj.resTargetType == 'item') {
							let find = offlineData[i][type[j]].item.find((it) => {
								return it.name == resObj.resTarget
							})
							if (find) {
								console.log(offlineData[i].name + '的' + type[j] + '有' + find.name)
								return offlineData[i]
							}
						} else if (resObj.resTargetType == 'gold' && offlineData[i][type[j]].gold > thisobj.protectGold) {
							return offlineData[i]
						} else if (resObj.resTargetType == 'pet') {
							let find = offlineData[i][type[j]].pet.find((p) => {
								return p.name == resObj.resTarget || p.realname == resObj.resTarget
							})
							if (find) {
								return offlineData[i]
							}
						}
					}
				}
			} else {
				throw new Error('resObj.resTradeType类型错误。')
			}

			return null
		},
		saveOfflineData: (cb) => {
			let inventory = cga.getAssets()
			// 只要游戏客户端启动后与银行NPC对话过一次，即可随时获取银行数据，无需再次对话。
			// 但存取操作还是需要对话的。
			let bank = cga.getAssets(true)
			let obj = {
				name: cga.GetPlayerInfo().name,
				inventory: inventory,
				bank: bank
			}
			// 顺便更新资源的缓存数据
			thisobj.bankCache.item = bank.item
			thisobj.bankCache.gold = bank.gold
			thisobj.bankCache.pets = bank.pet
			// 将身上与银行的所有资源保存为离线文件，方便搜索。
			cga.savePlayerOfflineData(obj, cb)
			return
		},
		// 由于每次交易之后都落盘身上的数据，所以切账号前不需要再次记录身上以及银行的数据
		switchAccount: (account, cb) => {
			cga.gui.LoadAccount({
				user: account.user,
				pwd: account.pwd,
				gid: account.gid,// 子账号
				character: account.character, //1左边2右边
			}, (err, result) => {
				if (err) {
					console.error(err);
					cb(new Error(err));
					return
				}
				console.log('账号切换完毕，登出!');
				setTimeout(() => {
					cga.LogOut();
				}, 1000);
				return
			})
		},
	};
	// main开始前，先播报当前资产，方便审计
	console.log('【./离线数据】中，已记录的全局累计资产:')
	console.log(cga.getSumOfflineData())
	// main
	loop()
});