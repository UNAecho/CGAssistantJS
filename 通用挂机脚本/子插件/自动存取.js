var cga = global.cga;
var configTable = global.configTable;

// 需要与移动银行.js中一致
const tradeReg = new RegExp(/r?([sd]{1})([igp])([\w\u4e00-\u9fa5（）]*)([\^]{1})([\d]+)(\&?)([\d]*)([\S]*)?/)

var thisobj = {
	// 寻找服务玩家的昵称暗号，需要与移动银行.js中一致
	serverCipher: '朵拉',
	// 客户端昵称暗号，服务方会辨识是否提供服务。需要与移动银行.js中一致
	clientCipher: '$^@',
	// 服务端玩家固定坐标。必须要固定，否则会出现客户端跟着服务端走的情况。
	serverPos: [48, 39],
	// 隐式加密金额，请在移动银行.js中加入对应逻辑。
	goldCipher: {
		'save': 1,
		'draw': 7,
	},
	// 禁用隐式加密告知内容，需要与移动银行.js中一致
	skipCipherStr: '*1~',
	// 循环喊话开关，默认on。可设置on持续运行、start循环说话、off关闭speaker
	speakStatus: 'on',
	// 循环喊话内容
	speakStr: '',
	// 循环喊话间隔，尽量大于移动银行的检测客户端昵称时间间隔，以免多等一轮循环
	speakDelay: cga.randomDelay(4, 6),
	/**
	 * 存取钱金币优化系数，范围为0-1的浮点数。代表百分比。
	 * 当把钱取到上限时，很可能卖了点魔石，又变成超过上限，需要存钱了
	 * 当把钱存到下限时，很可能补了次血，又变成低于下限了，需要取钱了
	 * 为了避免此极端现象，这个优化系数可以取与上/下限差值的百分比，再与上/下限结合，平滑数值。
	 * 设上限为upper，下限为lower，系数为x，身上现金为curgold
	 * 公式为 : 
	 * 1、存钱时：upper - (upper - lower) * x
	 * 2、取钱时：lower + (upper - lower) * x
	 * 
	 * 举例说明：如果此系数为0.9，上限为90万，下限为10万。
	 * 存钱时，需要将钱【存到】90万 - (90万-10万) * 0.9 = 18万，也就是最终需要存curgold - 18万
	 * 取钱时，需要将钱【取到】10万 + (90万-10万) * 0.9 = 82万，也就是最终需要取82万 - curgold
	 * 
	 * 这样避免了刚存完就要取，和刚取完就要存的尬尴。
	 */
	alpha: 0.9,
	// 属性名称字典
	typeProperty: {
		'item': '道具',
		'gold': '金币',
		'pet': '宠物',
	},
	/**
	 * UNAecho: 刷新订单，获取当前需要补足或削减的物资数量
	 * 
	 * 【注意】
	 * 1、考虑到不能低于下限就补到下限，因为只要使用一次就又会低于下限。所以必须补足至上限。
	 * 2、上限也是同理，超过上限就削减至上限的话，那么很快就会再次超过上限。还要去找服务端存取。人物就会疲于奔命。
	 * 
	 * 这个逻辑适用于gold和pet，但item却不太适用。
	 * 举例说明：
	 * 1、当前想要监视药瓶数量，药瓶堆叠数为3个1组。
	 * 2、假设上限定为6，下限定为3。
	 * 3、客户端手中只有2瓶药，此时去找服务端拿药，目标是拿到上限，6个。
	 * 4、如果服务端给客户端1组，3瓶，2+3=5<6，并没有满足拿到上限这个目标，此时需要再拿6-5=1个
	 * 5、由于CGA没有拆分，所以即便要求服务端给自己1瓶药，服务端还是只能给出1组，3瓶药。
	 * 6、此时手上的药就变成了5+3=8>6，超过上限了，那么就需要存至下限。
	 * 7、存至下限又会因为没有拆分，而只能存2组，2*3=6，8-6=2，又会低于下限，形成了死循环。
	 * 
	 * 为了避免此情况发生，目前使用下面逻辑：
	 * 1、堆叠数(依赖于cga.getItemMaxcount()，请注意补足相关数据)，当对方需求存/取的数量出现不是堆叠数的整数倍时，会出现多存/取的现象。
	 * 2、由于CGA没有道具拆分API（可能由于自动堆叠的存在），每次交易只能给出1组道具。
	 * 3、所以刷新订单的逻辑，item的逻辑调整为【如果超过上/下限的部分小于道具的堆叠数时，视为没有超限，不做处理】
	 * 
	 * 这样可以避免存了item之后低于下限，而取了item之后又超过上限的问题。
	 * @returns 
	 */
	refreshOrder: () => {
		let orderArr = []
		let needCount = null

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

				// 超过上限，调整为下限。item逻辑说明见上面的doc
				if (curCount > obj.upper && (k != 'item' || (k == 'item' && curCount - obj.upper >= cga.getItemMaxcount({ name: obj.name })))) {
					// 如果是金币操作，使用平滑系数来避免直接将金币存取至上下限临界点
					if (k == 'gold') {
						needCount = curCount - (obj.upper - (obj.upper - obj.lower) * thisobj.alpha)
						console.log('【UNAecho脚本提醒】存金币不会存至下限，而是加入平滑系数防止金币数量成为临界点。当前需要【存】' + needCount + '金币，使现金变为' + (obj.upper - (obj.upper - obj.lower) * thisobj.alpha) + 'G')
					} else {
						needCount = curCount - obj.lower
					}

					orderArr.push({
						name: obj.name,
						type: k,
						tradeType: 'save',
						count: needCount,
					})
				} else if (curCount < obj.lower && (k != 'item' || (k == 'item' && obj.lower - curCount >= cga.getItemMaxcount({ name: obj.name })))) {// 低于下限，调整为上限。
					// 如果是金币操作，使用平滑系数来避免直接将金币存取至上下限临界点
					if (k == 'gold') {
						needCount = (obj.lower + (obj.upper - obj.lower) * thisobj.alpha) - curCount
						console.log('【UNAecho脚本提醒】取金币不会取至上限，而是加入平滑系数防止金币数量成为临界点。当前需要【取】' + needCount + '金币，使现金变为' + (obj.lower + (obj.upper - obj.lower) * thisobj.alpha) + 'G')
					} else {
						needCount = obj.upper - curCount
					}
					orderArr.push({
						name: obj.name,
						type: k,
						tradeType: 'draw',
						count: needCount,
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
						console.log('进入队伍失败，重新进入findServer..')
						setTimeout(thisobj.findServer, 1000, cb)
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

			result += cga.getItemMaxcount(item).toString()
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
					// 必须要stuffCnt+=item.count <= matchObj[5]才行，举例：stuffCnt目前累积为8，matchObj[5]=9，那么8+3=11>9了，此时该道具不能return true。
					let itemCnt = item.count > 0 ? item.count : 1
					if (item.name == matchObj[3] && (stuffCnt + itemCnt) <= matchObj[5]) {
						stuffCnt += itemCnt
						return true
					}
					return false
				}
				// 如果需要金币暗号，则提供
				// 这里尽量用正则匹配出来的第0个内容(被正则表达式捕获到的内容)，而不是input，以防正则没有匹配上，也进入判断。
				if (!matchObj[0].endsWith(thisobj.skipCipherStr)) {
					stuffs.gold = thisobj.goldCipher['save']
				}
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
				// 如果需要金币暗号，则提供
				if (!matchObj[0].endsWith(thisobj.skipCipherStr)) {
					stuffs.gold = thisobj.goldCipher['save']
				}
			}
		} else if (matchObj[1] == 'd') {
			// 隐式加密，存取物品/宠物要提供金币暗号
			if (matchObj[2] != 'g' && !matchObj[0].endsWith(thisobj.skipCipherStr)) {
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
			// 结束此子插件，稍微延迟，给离开队伍一点时间
			setTimeout(cb, 2000)
			return
		}

		// 检测是否还在队伍中
		let teaminfo = cga.GetTeamPlayerInfo();
		if (teaminfo.length == 0) {
			console.log('移动银行离队，无法继续提供服务，继续等待下一位服务端..')
			setTimeout(thisobj.findServer, 1000, cb)
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

					setTimeout(thisobj.findServer, 1000, cb)
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
								if (!receivedStuffs.items) {
									console.log('【' + lockPlayerName + '】动作【' + reqObj.tradeType + '】【' + reqObj.name + '】未获取到道具信息，验证失败！拒绝交易')
									return false
								}
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
								if (!receivedStuffs.pet) {
									console.log('【' + lockPlayerName + '】动作【' + reqObj.tradeType + '】【' + reqObj.name + '】未获取到宠物信息，验证失败！拒绝交易')
									return false
								}
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
							console.log('与【' + lockPlayerName + '】交易失败，重新进入tradeFunc..')
							setTimeout(thisobj.tradeFunc, 1000, lockPlayerName, cb)
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

		if (!order.length) {
			// console.log('【自动存取】经检查，无需存取。')

			// 关闭speaker
			thisobj.speakStr = ''
			thisobj.speakStatus = 'off'

			cb(null)
			return
		}
		console.log('有自动存取需求:', order)
		// 打开交易
		console.log('打开交易..')
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
		// 启动speaker
		thisobj.speakStatus = 'on'
		thisobj.speaker()

		thisobj.toWaitLocation(() => {
			thisobj.findServer(cb)
		})

		return
	},
	/**
	 * UNAecho:暴露接口，将prepare的功能给除通用挂机脚本以外的脚本调用。方便存取
	 * 可以手动传一份autoSaveAndDraw，具体格式见脚本设置中的json文件，或者下面的inputcb
	 * @param {Object} autoSaveAndDraw 
	 * @param {*} cb 
	 */
	manualPrepare: (autoSaveAndDraw, cb) => {
		// 如果手动传入，则使用手动的数据。否则使用脚本设置保存的数据
		if (autoSaveAndDraw) {
			thisobj.autoSaveAndDraw = autoSaveAndDraw
		}

		let order = thisobj.refreshOrder()
		if (!order.length) {
			// 关闭speaker
			thisobj.speakStr = ''
			thisobj.speakStatus = 'off'

			cb(null)
			return
		}
		console.log('有自动存取需求:', order)
		// 打开交易
		console.log('打开交易..')
		cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
		// 启动speaker
		thisobj.speakStatus = 'on'
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
							if ((p == 'upper' || p == 'lower') && typeof o[p] != 'number') {
								console.error('读取配置：自动存取失败！数据格式有误，属性', p, '必须为number类型。请删除游戏角色对应脚本设置中的json文件，重新运行。');
								return false
							}
						}

						if (o.upper < o.lower) {
							console.error('读取配置：自动存取失败！数值有误，' + o.name + 'upper的值必须大于lower。请删除游戏角色对应脚本设置中的json文件，重新运行。');
							return false
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
							sayString = '【自动存取】请输入是否监测' + property[k] + '的上下限，0不监视1监视:';
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
						sayString = '【自动存取】请输入' + property[k] + '的监测内容。输入ok结束当前[' + property[k] + ']循环:';
						cga.sayLongWords(sayString, 0, 3, 1);

						cga.waitForChatInput((msg, value) => {
							if (msg && msg == 'ok') {
								stage(obj, cb)
								return false
							} else if (msg && msg.indexOf(':') == -1) {
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
				'upper': '数量上限，超过上限时自动调整至下限',
				'lower': '数量下限，低于下限时自动调整至上限',
			}

			for (let k of Object.keys(property)) {
				if (!obj.hasOwnProperty(k)) {
					sayString = '【自动存取】请输入' + property[k] + '，上限不能小于下限。';
					cga.sayLongWords(sayString, 0, 3, 1);
					cga.waitForChatInput((msg, val) => {
						if (val !== null && val >= 0) {
							sayString = '当前已输入: [' + val + ']';
							cga.sayLongWords(sayString, 0, 3, 1);

							obj[k] = val
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
		setTimeout(stage, 2000, inputObj, cb)
		return
	}
};

module.exports = thisobj;