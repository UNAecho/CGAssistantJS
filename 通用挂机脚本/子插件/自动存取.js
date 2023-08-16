var cga = global.cga;
var configTable = global.configTable;

// 需要与移动银行.js中一致
const tradeReg = new RegExp(/r?([sd]{1})([igp])([\w\u4e00-\u9fa5（）]*)([\^]{1})([\d]+)(\&?)([\d]*)/)

var thisobj = {
	// 寻找服务玩家的昵称暗号，需要与移动银行.js中一致
	serverCipher: '朵拉',
	// 客户端昵称暗号，服务方会辨识是否提供服务。
	clientCipher: '$^~',
	// 服务端玩家固定坐标。必须要固定，否则会出现客户端跟着服务端走的情况。
	serverPos: [48, 39],
	// 隐式加密金额，请在移动银行.js中加入对应逻辑。
	goldCipher: {
		'save': 1,
		'draw': 7,
	},
	// 循环喊话开关，默认on。可设置on持续运行、start循环说话、off关闭speaker
	speakStatus: 'on',
	// 循环喊话内容
	speakStr: '',
	// 循环喊话间隔，尽量大于移动银行的检测客户端昵称时间间隔，以免多等一轮循环
	speakDelay: cga.randomDelay(4, 6),
	// 属性名称字典
	typeProperty: {
		'item': '道具',
		'gold': '金币',
		'pet': '宠物',
	},
	refreshOrder: () => {
		let orderArr = []

		for (let k in thisobj.autoSaveAndDraw) {
			for (let obj of thisobj.autoSaveAndDraw[k]) {
				let curCount = null
				if (k == 'item') {
					curCount = cga.getItemCount(obj.name)
				} else if (k == 'gold') {
					curCount = cga.GetPlayerInfo().gold
				} else if (k == 'pet') {
					curCount = cga.getPetCount(obj.name)
				}

				if (curCount == null) {
					throw new Error('获取数量有误，请检查。')
				}

				if (obj.upper < obj.lower) {
					throw new Error('数量上限不可以小于下限。')
				}

				if (obj.upper != null && curCount > obj.upper) {
					orderArr.push({
						name: obj.name,
						type: k,
						tradeType: 'save',
						count: curCount - obj.upper,
					})
				} else if (obj.lower != null && curCount < obj.lower) {
					orderArr.push({
						name: obj.name,
						type: k,
						tradeType: 'draw',
						count: obj.lower - curCount,
					})
				}

			}
		}
		return orderArr
	},
	// 循环喊话，由speakStatus控制状态
	speaker: () => {
		if (thisobj.speakStatus == 'off') {
			console.log('speaker off..')
			return
		} else if (thisobj.speakStatus == 'on') {
			setTimeout(thisobj.speaker, thisobj.speakDelay)
			return
		}
		if (thisobj.speakStatus == 'start') {
			if (thisobj.speakStr) {
				cga.SayWords(thisobj.speakStr, 0, 3, 1);
			} else {
				console.log('speakStr没有内容，本次speak不喊话，保持运行..')
			}
		}
		setTimeout(thisobj.speaker, thisobj.speakDelay)
		return
	},
	// 走到移动银行等待地点，在此地点与服务方对接。
	toWaitLocation: (cb) => {
		cga.travel.falan.toStone('C', () => {
			cga.walkList([
				cga.getRandomSpace(thisobj.serverPos[0], thisobj.serverPos[1])
			], cb);
		});
	},
	findServer: (cb) => {
		// 搜索服务端玩家
		let server = cga.findPlayerUnit((u) => {
			if (u.nick_name == thisobj.serverCipher && u.xpos == thisobj.serverPos[0] && u.ypos == thisobj.serverPos[1]) {
				return true;
			}
			return false
		});
		if (server) {
			console.log('发现移动银行人物:' + server.unit_name)
			let addTeam = () => {
				cga.addTeammate(server.unit_name, (r) => {
					if (!r) {
						setTimeout(addTeam, 1000)
						return
					}
					// 开启队聊，防止干扰其他玩家
					console.log('开启队聊..')
					cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true);
					thisobj.tradeFunc(server.unit_name, cb)
				})
			}
			addTeam()
			return
		}
		setTimeout(thisobj.findServer, 1000, cb)
		return
	},
	// orderObj数据格式参考：{ name: '生命力回复药（1000）', type: 'item', tradeType: 'draw', count: 1 }
	getReqStr: (orderObj) => {
		if (typeof orderObj != 'object') {
			throw new Error('orderObj must be object')
		}

		let result = ''
		// 判断存取
		if (orderObj.tradeType == 'save') {
			result += 's'
		} else if (orderObj.tradeType == 'draw') {
			result += 'd'
		}
		// 判断物资类型
		if (orderObj.type == 'item') {
			result += 'i'
		} else if (orderObj.type == 'gold') {
			result += 'g'
		} else if (orderObj.type == 'pet') {
			result += 'p'
		}

		if (orderObj.type != 'g') {
			result += orderObj.name
		}

		result += '^' + orderObj.count.toString()
		// 物品要明确堆叠数
		if (orderObj.type == 'item') {
			result += '&'
			/**
			 * 获取物品堆叠数时，有一种特殊情况：
			 * 1、如果当前有残余目标物品，则获取其堆叠数
			 * 2、如果没有，则无法获取其堆叠数，那么默认为0堆叠数，也就是和装备一样。
			 */
			let item = cga.GetItemsInfo().find((it) => {
				return it.name == orderObj.name
			})

			result += cga.getItemStackeMax(item).toString()
		}
		return result
	},
	/**
	 * UNAecho:获取交易提供的物资
	 * 【注意】这里隐式地使用金币加密，金额请自己定好，并在移动银行.js对应好，否则拒绝交易。
	 * @param {*} matchObj 
	 * @returns 
	 */
	getStuffs: (matchObj) => {
		let stuffs = {}
		if (typeof matchObj != 'object') {
			throw new Error('matchObj must be object')
		}

		// 判断信息来源，只有队长才能给出response信息。
		if (matchObj.input[0] != 'r') {
			throw new Error('response数据格式有误：' + matchObj.input + '，首位必须为r')
		}

		// 修改数量类型
		if (typeof matchObj[5] != 'number') {
			matchObj[5] = parseInt(matchObj[5])
		}

		// 制定stuffs，也就是交易时提供给服务端的filter。
		if (matchObj[1] == 's') {
			let stuffCnt = 0
			if (matchObj[2] == 'i') {
				stuffs.itemFilter = (item) => {
					// 没有堆叠数量的道具，count默认是0，这里统计时要人为改为1，便于计算
					// matchObj[5]为对方告知你最多能存/取多少
					if (item.name == matchObj[3] && stuffCnt < matchObj[5]) {
						stuffCnt += (item.count > 0 ? item.count : 1)
						return true
					}
					return false
				}
				// 金币暗号
				stuffs.gold = thisobj.goldCipher['save']
			} else if (matchObj[2] == 'g') {// matchObj[5]为对方告知你最多能存/取多少
				stuffs.gold = matchObj[5]
			} else if (matchObj[2] == 'p') {
				stuffs.petFilter = (pet) => {
					if ((pet.name ? pet.name == matchObj[3] : pet.realname == matchObj[3]) && stuffCnt < matchObj[5]) {
						stuffCnt += 1
						return true
					}
					return false
				}
				// 金币暗号
				stuffs.gold = thisobj.goldCipher['save']
			}
		} else if (matchObj[1] == 'd') {
			// 隐式加密，存取物品/宠物要提供金币暗号
			if (matchObj[2] != 'g') {
				// 存东西的加密数额
				if (matchObj[1] == 's') {
					stuffs.gold = thisobj.goldCipher['save']
				} else if (matchObj[1] == 'd') {// 取东西的加密数额
					stuffs.gold = thisobj.goldCipher['draw']
				}
			}
		}
		return stuffs
	},
	tradeFunc: (lockPlayerName, cb) => {
		let order = thisobj.refreshOrder()
		if (!order.length) {
			console.log('所有需求已满足..')

			// 关闭speaker
			thisobj.speakStr = ''
			thisobj.speakStatus = 'off'
			// 离开队伍
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			// 结束此子插件
			cb(null)
			return
		}

		// 检测是否还在队伍中
		let teaminfo = cga.GetTeamPlayerInfo();
		if (teaminfo.length == 0) {
			console.log('移动银行离队，无法继续提供服务，继续等待下一位服务端..')
			thisobj.findServer(cb)
			return
		}

		// 昵称暗号
		let playerInfo = cga.GetPlayerInfo()
		if (playerInfo.nick != thisobj.clientCipher) {
			cga.ChangeNickName(thisobj.clientCipher)
		}

		// 取需求表中的第一个需求。
		// 由于每次都刷新需求，所以只取第一个即可。
		let reqObj = order[0]

		let startTrade = () => {
			// 打开speaker，循环喊话
			thisobj.speakStr = thisobj.getReqStr(reqObj)
			thisobj.speakStatus = 'start'

			cga.waitLockTeammateSay(lockPlayerName, (player, msg) => {
				// 规定好player为null即视为lockPlayerName离队。
				if (player == null) {
					console.log('服务端离队，结束对话监听，回到寻找服务端逻辑..')
					// speaker改为on
					thisobj.speakStr = ''
					thisobj.speakStatus = 'on'

					thisobj.findServer(cb)
					return false
				}
				let matchObj = msg.match(tradeReg)
				if (player.name == lockPlayerName && matchObj) {
					let stuffs = thisobj.getStuffs(matchObj)
					cga.waitTrade(stuffs, (playerName, receivedStuffs) => {
						if (playerName != lockPlayerName) {
							console.log('交易对象【' + playerName + '】与预期对象【' + lockPlayerName + '】不同！终止交易。')
							return false
						}
						if (reqObj.tradeType == 'draw') {
							if (reqObj.type == 'item') {
								let receivedCount = 0
								let received = receivedStuffs.items.filter((it) => {
									if (it.name == reqObj.name) {
										receivedCount += (it.count > 0 ? it.count : 1)
										return true
									}
									return false
								})
								// 检查数量。注意，服务端可能会多给（数量除以堆叠数出现余数情况）
								if (received && receivedCount >= matchObj[5]) {
									return true
								}
								console.log('【' + lockPlayerName + '】动作【' + reqObj.tradeType + '】【' + reqObj.name + '】验证失败！拒绝交易')
								return false
							} else if (reqObj.type == 'gold') {
								// 【注意】receivedStuffs.gold的value数据结构为{gold:12345}
								// 如果没给钱，receivedStuffs.gold = {}
								if (receivedStuffs.hasOwnProperty('gold') && receivedStuffs.gold == matchObj[5]) {
									return true
								}
								console.log('【' + lockPlayerName + '】动作【' + reqObj.tradeType + '】【' + reqObj.name + '】验证失败！拒绝交易')
								return false
							} else if (reqObj.type == 'pet') {
								let petsCount = 0
								let received = receivedStuffs.pet.filter((pet) => {
									// 必须为自定义名称
									if (pet.name == reqObj.name) {
										petsCount += 1
										return true
									}
									return false
								})
								if (received && received.length == matchObj[5]) {
									return true
								}
								console.log('【' + lockPlayerName + '】动作【' + reqObj.tradeType + '】【' + reqObj.name + '】验证失败！拒绝交易')
								return false
							}
						}
						return true
					}, (result) => {
						if (result.success == true) {
							// 重新进入trade环节，刷新需求。或继续交易，或需求完成，退出交易。
							thisobj.speakStatus = 'on'
							thisobj.speakStr = ''
							console.log('与【' + lockPlayerName + '】交易成功，重新刷新需求列表..')
							setTimeout(thisobj.tradeFunc, 1000, lockPlayerName, cb);
							return
						} else {// 交易失败，重新发起请求，并打开监听
							console.log('与【' + lockPlayerName + '】交易失败，重新发起请求..')
							setTimeout(startTrade, 1000);
							return
						}
					});
					return false
				}
				return true
			})

		}

		startTrade()
		return

	},
	prepare: (cb) => {
		let order = thisobj.refreshOrder()
		console.log(order)
		if (!order.length) {
			console.log('【自动存取】经检查，无需存取。')

			// 关闭speaker
			thisobj.speakStr = ''
			thisobj.speakStatus = 'off'

			cb(null)
			return
		}

		// 打开交易
		console.log('打开交易..')
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
		// 启动speaker
		thisobj.speaker()

		thisobj.toWaitLocation(() => {
			thisobj.findServer(cb)
		})

		return
	},
	/**
	 * UNAecho:
	 * 自动存取多数都会在城镇内的prepare单人环节进行。
	 * 为了节约性能，think暂不做监控。如有需要请自行修改。
	 */
	think: (ctx) => {
		return
	},
	loadconfig: (obj) => {
		let property = ['name', 'upper', 'lower',]

		if (typeof obj.autoSaveAndDraw == 'object') {
			for (let k in obj.autoSaveAndDraw) {
				if (Object.keys(thisobj.typeProperty).indexOf(k) == -1) {
					console.error('读取配置：自动存取失败！类型' + k + '有误，请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
				if (!obj.autoSaveAndDraw[k] instanceof Array) {
					console.error('读取配置：自动存取失败！' + k + '的value必须为Array，请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
				let arr = obj.autoSaveAndDraw[k]
				if (arr instanceof Array) {
					for (let o of arr) {
						for (let p of property) {
							if (!o.hasOwnProperty(p)) {
								console.error('读取配置：自动存取失败！数据格式有误，属性', property, '必须全部具备。请删除游戏角色对应脚本设置中的json文件，重新运行。');
								return false
							}
						}
					}
				} else {
					console.error('读取配置：自动存取失败！数据格式有误，', Object.keys(thisobj.typeProperty), '所对应的value值必须为Array类型。请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
			}
		} else {
			console.error('读取配置：自动存取失败！数据格式有误，请删除游戏角色对应脚本设置中的json文件，重新运行。');
			return false
		}
		thisobj.autoSaveAndDraw = obj.autoSaveAndDraw
		return true;
	},
	inputcb: (cb) => {

		let stage = (obj, cb) => {
			let sayString = null
			let property = {
				'item': '道具',
				'gold': '金币',
				'pet': '宠物',
			}

			for (let k of Object.keys(property)) {
				if (!obj.hasOwnProperty(k)) {
					obj[k] = []
					let inputLoop = (cb) => {
						// 金币不需要输入内容，直接进入上下限环节
						if (k == 'gold') {
							sayString = '【自动存取】请输入是否监测' + property[k] + '的上下限，0不监视1监视。';
							cga.sayLongWords(sayString, 0, 3, 1);

							cga.waitForChatInput((msg, value) => {
								if (value == 0) {
									stage(obj, cb)
									return false
								} else if (value == 1) {
									limit({
										name: '金币',
									}, (r) => {
										obj[k].push(r)
										stage(obj, cb)
									})
									return false
								}
								return true;
							});
							return
						}
						sayString = '【自动存取】请输入' + property[k] + '的监测内容。输入ok结束当前[' + property[k] + ']循环。';
						cga.sayLongWords(sayString, 0, 3, 1);

						cga.waitForChatInput((msg, value) => {
							if (msg && msg == 'ok') {
								stage(obj, cb)
								return false
							} else if (msg && msg.indexOf('输入') == -1) {
								let tmpObj = {
									name: msg,
								}
								sayString = '当前已输入: [' + msg + ']';
								cga.sayLongWords(sayString, 0, 3, 1);
								setTimeout(limit, 1000, tmpObj, (r) => {
									obj[k].push(r)
									inputLoop(cb)
								})
								return false
							}
							return true;
						});
						return
					}
					inputLoop(cb)
					return
				}
			}
			thisobj.autoSaveAndDraw = obj
			configTable.autoSaveAndDraw = obj
			cb(null)
			return
		}

		let limit = (obj, cb) => {
			let sayString = null
			let property = {
				'upper': '上限',
				'lower': '下限',
			}

			for (let k of Object.keys(property)) {
				if (!obj.hasOwnProperty(k)) {
					sayString = '【自动存取】请输入数量' + property[k] + '。输入ok则视为不限制';
					cga.sayLongWords(sayString, 0, 3, 1);
					cga.waitForChatInput((msg, value) => {
						if (msg && msg == 'ok') {
							sayString = '当前已选择: [不限制]';
							cga.sayLongWords(sayString, 0, 3, 1);

							obj[k] = null
							setTimeout(limit, 1000, obj, cb)
							return false
						} else if (value >= 0) {
							sayString = '当前已输入: [' + value + ']';
							cga.sayLongWords(sayString, 0, 3, 1);

							obj[k] = value
							setTimeout(limit, 1000, obj, cb)
							return false
						}
						return true;
					});
					return
				}
			}
			cb(obj)
			return
		}

		let inputObj = {}
		stage(inputObj, cb)
		return
	}
};

module.exports = thisobj;