var thisobj = {
	taskName: '起司的任务',
	taskStages: [
		{//0
			intro: '1.任务准备',
			workFunc: function (cb2) {
				thisobj.func.healObj.func(() => {
					cb2(true)
				})
			}
		},
		{//1
			intro: '2.前往加纳村酒吧（51.34）与葛达对话，选“是”交出100G获得【好像很好吃的起司】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: '好像很好吃的起司', npcpos: [13, 5] }
				cga.travel.toVillage('加纳村', () => {
					cga.travel.autopilot('酒吧', () => {
						cga.askNpcForObj(obj, () => {
							// 记录时间
							thisobj.func.saveTimestamp(obj.target, () => {
								cb2(true)
							})
						})
					})
				})
				return
			}
		},
		{//2
			intro: '3.从现在开始直至任务结束，都必须徒步。而且必须在刚好1小时的时候交付任务道具。先徒步至奇利村，全程逃跑约5分钟',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')

				let villageName = '加纳村'

				let go = () => {
					cga.travel.autopilot('出口', () => {
						cga.walkList([
							[402, 304, '角笛大风穴'],
							[18, 6, '索奇亚'],
							[294, 325, '奇利村'],
						], () => {
							setTimeout(cb2, 1000, true);
						});
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					cga.SayWords('开始徒步行走任务全过程，接下来将会在每一个村庄落脚点自适应等待若干时间再出发，以免出现掉线情况', 0, 3, 1);
					cga.travel.toHospital(go, false, false)
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//3
			intro: '4.徒步至维诺亚村，全程逃跑约3分钟。到达维诺亚村时，距离加纳村拿到起司大概8分钟。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '奇利村'

				let go = () => {
					cga.travel.autopilot('北门', () => {
						cga.walkList([
							[240, 265, 15004],
						], () => {
							let obj = { act: 'map', target: 15004, npcpos: [7, 41], pos: [7, 39] }
							cga.askNpcForObj(obj, () => {
								cga.walkList([
									[24, 13, 15003],
									[49, 46, 15005],
									[10, 5, 100],
									[330, 481, 2100],
								], () => {
									setTimeout(cb2, 1000, true);
								});
							})
						});
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					// 顺道开传送，补给，出发
					cga.travel.saveAndSupply(false, () => {
						// 强制等待一段时间，剩余时间长则等待时间长，反之则短。
						setTimeout(() => {
							thisobj.func.checkHealth(go)
						}, thisobj.func.waitTime());
					})
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//4
			intro: '5.徒步至伊尔村，全程逃跑约6分钟。到达伊尔村时，距离加纳村拿到起司大概12分钟。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '维诺亚村'

				let go = () => {
					cga.travel.autopilot('出口', () => {
						cga.walkList([
							[442, 349, 11002],
							[35, 10, 11001],
							[34, 14, 11000],
							[20, 14, '芙蕾雅'],
							[681, 343, '伊尔村'],
						], () => {
							setTimeout(cb2, 1000, true);
						});
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					// 顺道开传送，补给，出发
					cga.travel.saveAndSupply(false, () => {
						// 强制等待一段时间，剩余时间长则等待时间长，反之则短。
						setTimeout(() => {
							thisobj.func.checkHealth(go)
						}, thisobj.func.waitTime());
					})
				}
				// 如果人物被飞，在这里续上流程。
				else if ((mainMap == '法兰城' || mainMap == '艾尔莎岛') && cga.findItem('好像很好吃的起司') != -1) {
					cga.travel.falan.toStone('C', (r) => {
						thisobj.func.healObj.func(() => {
							setTimeout(() => {
								cga.travel.autopilot('主地图', () => {
									cga.walkList([
										[281, 88, '芙蕾雅'],
										[681, 343, '伊尔村'],
									], () => {
										setTimeout(cb2, 1000, true);
									})
								})
							}, thisobj.func.waitTime());

						})
					});
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//5
			intro: '6.徒步至亚留特村，全程逃跑约4分钟。到达亚留特村时，距离加纳村拿到起司大概16分钟。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '伊尔村'

				let go = () => {
					cga.travel.autopilot('出口', () => {
						cga.walkList([
							[672, 223, '哈巴鲁东边洞穴 地下1楼'],
							[41, 8, '哈巴鲁东边洞穴 地下2楼'],
							[17, 18]
						], () => {
							cga.ForceMove(6, true);
							cga.ForceMove(6, true);
							cga.walkList([
								[16, 11, '哈巴鲁东边洞穴 地下1楼'],
								[30, 4, '芙蕾雅'],
								[596, 84, '亚留特村'],
							], () => {
								setTimeout(cb2, 1000, true);
							});
						});
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					// 顺道开传送，补给，出发
					cga.travel.saveAndSupply(false, () => {
						// 强制等待一段时间，剩余时间长则等待时间长，反之则短。
						setTimeout(() => {
							thisobj.func.checkHealth(go)
						}, thisobj.func.waitTime());
					})
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//6
			intro: '7.前往亚留特村村长的家，在获得【好像很好吃的起司】后的1小时左右与努波对话，交出100G获得【好像很好喝的酒】。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '亚留特村'

				let go = () => {
					cga.travel.autopilot('村长的家', () => {
						let obj = { act: 'item', target: '好像很好喝的酒', npcpos: [17, 11] }
						let remain = 3603000 - (Date.now() - thisobj.data.timestamp)
						if (remain > 0) {
							console.log('还需要等待【' + (remain / 1000 / 60).toFixed(2) + '】分才能交付道具')
						} else {
							remain = 0
						}
						setTimeout(() => {
							cga.askNpcForObj(obj, () => {
								// 记录时间
								thisobj.func.saveTimestamp(obj.target, () => {
									cb2(true)
								})
							})
						}, remain);

					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					thisobj.func.checkHealth(go)
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//7
			intro: '8.徒步至法兰城，全程逃跑约4分钟。到达法兰城时，距离亚留特村拿到酒大概4分钟。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '亚留特村'

				let go = () => {
					cga.travel.autopilot('东门', () => {
						cga.walkList([
							[691, 188, 11005],
							[21, 39, 11004],
							[17, 16],
						], () => {
							cga.ForceMove(2, true);
							cga.ForceMove(2, true);
							cga.walkList([
								[62, 65, '哈巴鲁东边洞穴 地下1楼'],
								[9, 37, '芙蕾雅'],
								[470, 196, '法兰城'],
							], () => {
								setTimeout(cb2, 1000, true);
							});
						});
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					// 顺道开传送，补给，出发
					cga.travel.saveAndSupply(false, () => {
						// 强制等待一段时间，剩余时间长则等待时间长，反之则短。
						setTimeout(() => {
							thisobj.func.checkHealth(go)
						}, thisobj.func.waitTime());
					})
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//8
			intro: '9.徒步至杰诺瓦镇',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '法兰城'
				let go = () => {
					cga.travel.autopilot('西门', () => {
						cga.askNpcForObj({ act: 'map', target: 15000, npcpos: [201, 165] }, () => {
							cga.walkList([
								[20, 8, '莎莲娜海底洞窟 地下2楼'],
								[11, 9, '莎莲娜海底洞窟 地下1楼'],
								[24, 11, '莎莲娜'],
								[217, 455, '杰诺瓦镇'],
							], () => {
								setTimeout(cb2, 1000, true);
							});
						})
					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					thisobj.func.healObj.func(() => {
						// 强制等待一段时间，剩余时间长则等待时间长，反之则短。
						setTimeout(() => {
							thisobj.func.checkHealth(go)
						}, thisobj.func.waitTime());
					})
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
		{//9
			intro: '10.前往杰诺瓦镇民家（38.59），在获得【好像很好喝的酒】后的1小时左右与德特老爷爷对话。若被告知为好吃则代表时间刚好并获得晋阶资格，选“确定”交出【好像很好吃的起司】、【好像很好喝的酒】根据时间不同随机获得【奖品】，任务完结。',
			workFunc: function (cb2) {
				// 开启任务playerThink
				cb2('playerThink on')
				
				let villageName = '杰诺瓦镇'
				let go = () => {
					cga.travel.autopilot('民家', () => {
						let obj = { act: 'msg', target: '答谢你', npcpos: [9, 3] }
						let remain = 3603000 - (Date.now() - thisobj.data.timestamp)
						if (remain > 0) {
							console.log('还需要等待【' + (remain / 1000 / 60).toFixed(2) + '】分才能交付道具')
						} else {
							remain = 0
						}
						setTimeout(() => {
							cga.askNpcForObj(obj, () => {
								cga.refreshMissonStatus({'起司的任务' : true},()=>{
									// 任务结束还要在个人配置中删除时间数据，这里延迟一下再调用cb，以免读写间隔过短
									setTimeout(cb2, 2000, true)
								})
							})
						}, remain);

					})
				}

				let mainMap = cga.travel.switchMainMap()
				if (mainMap == villageName) {
					thisobj.func.checkHealth(go)
				} else {
					throw new Error('错误，请登出重新启动脚本，不然计时会乱。')
				}
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {//1.任务准备
			return false;
		},
		function () {//2.前往加纳村酒吧（51.34）与葛达对话，选“是”交出100G获得【好像很好吃的起司】。
			if (cga.travel.switchMainMap() == '加纳村' && cga.findItem('好像很好吃的起司') != -1) {
				return true
			}
			return false;
		},
		function () {//3.从现在开始直至任务结束，都必须徒步。而且必须在刚好1小时的时候交付任务道具。先徒步至奇利村，全程逃跑约5分钟
			if (cga.travel.switchMainMap() == '奇利村' && cga.findItem('好像很好吃的起司') != -1) {
				return true
			}
			return false;
		},
		function () {//4.徒步至维诺亚村，全程逃跑约3分钟。到达维诺亚村时，距离加纳村拿到起司大概8分钟。
			let mainMap = cga.travel.switchMainMap()
			if ((mainMap == '法兰城' || mainMap == '艾尔莎岛' || mainMap == '维诺亚村') && cga.findItem('好像很好吃的起司') != -1) {
				return true
			}
			return false;
		},
		function () {//5.徒步至伊尔村，全程逃跑约6分钟。到达伊尔村时，距离加纳村拿到起司大概12分钟。
			if (cga.travel.switchMainMap() == '伊尔村' && cga.findItem('好像很好吃的起司') != -1) {
				return true
			}
			return false;
		},
		function () {//6.徒步至亚留特村，全程逃跑约4分钟。到达亚留特村时，距离加纳村拿到起司大概16分钟。
			if (cga.travel.switchMainMap() == '亚留特村' && cga.findItem('好像很好吃的起司') != -1) {
				return true
			}
			return false;
		},
		function () {//7.前往亚留特村村长的家，在获得【好像很好吃的起司】后的1小时左右与努波对话，交出100G获得【好像很好喝的酒】。
			if (cga.travel.switchMainMap() == '亚留特村' && cga.findItem('好像很好喝的酒') != -1) {
				return true
			}
			return false;
		},
		function () {//8.徒步至法兰城，全程逃跑约4分钟。到达法兰城时，距离亚留特村拿到酒大概4分钟。
			let mainMap = cga.travel.switchMainMap()
			if ((mainMap == '法兰城' || mainMap == '艾尔莎岛') && cga.findItem('好像很好喝的酒') != -1) {
				return true
			}
			return false;
		},
		function () {//9.徒步至杰诺瓦镇
			if (cga.travel.switchMainMap() == '杰诺瓦镇' && cga.findItem('好像很好喝的酒') != -1) {
				return true
			}
			return false;
		},
		function () {//10.前往杰诺瓦镇民家（38.59），在获得【好像很好喝的酒】后的1小时左右与德特老爷爷对话。若被告知为好吃则代表时间刚好并获得晋阶资格，选“确定”交出【好像很好吃的起司】、【好像很好喝的酒】根据时间不同随机获得【奖品】，任务完结。
			let config = cga.loadPlayerConfig();
			if (config && config["mission"] && config["mission"]["起司的任务"]) {
				return true
			}
			return false
		},
	],
	taskPlayerThink: () => {
		let petId = cga.GetPlayerInfo().petid
		if (petId < 0) {
			return true
		}
		let petInfo = cga.GetPetInfo(petId)
		if (petInfo.loyality < 40) {
			console.log('宠物忠诚度低于逃跑临界点40，回收宠物不再出战')
			cga.ChangePetState(petInfo.index, cga.PET_STATE_READY)
		}
		return true
	},
	data: {// 任务数据，可自定义，方便使用
		// 上一次获取道具时的时间戳
		timestamp: 0,
		// 5分钟的毫秒数
		fiveMinute: 1000 * 60 * 5
	},
	func: {// 任务自定义函数
		// 回城依靠其它人治疗和招魂
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		// 路上自己治疗自己
		healMyself: require('../../通用挂机脚本/公共模块/治疗自己'),
		/**
		 * 计时器，计算上一次获取任务道具的时间经过
		 * 据实验，人物什么都不做，最长挂机时间为1931.622秒
		 * @returns 
		 */
		timerfunc: () => {
			if (!thisobj.data.timestamp) {
				return 0
			}
			let timeCost = (Date.now() - thisobj.data.timestamp) / 1000 / 60
			console.log('计时器：已经过' + timeCost.toFixed(2) + '分。')
			return timeCost
		},
		waitTime: () => {
			let timeRemaining = 61 - thisobj.func.timerfunc()
			let result = 0
			if (timeRemaining >= 40) {
				result = thisobj.data.fiveMinute * 4
			} else if (timeRemaining >= 30 && timeRemaining < 40) {
				result = thisobj.data.fiveMinute * 3
			} else if (timeRemaining >= 20 && timeRemaining < 30) {
				result = thisobj.data.fiveMinute * 2
			}
			console.log('【UNA脚本提醒】距离交付道具还需' + timeRemaining.toFixed(2) + '分钟，在这里先等待【' + (result / 1000 / 60).toFixed(0) + '】分钟后再出发，防止单一位置等待时间过长而掉线')
			return result
		},
		saveTimestamp: (itemName, cb) => {
			thisobj.data.timestamp = Date.now()
			let config = cga.loadPlayerConfig();

			if (!config)
				config = {};
			if (!config["mission"])
				config["mission"] = {}

			config["mission"][itemName] = thisobj.data.timestamp;

			cga.savePlayerConfig(config, cb);
			return
		},
		checkHealth: (cb) => {
			let skill_heal = cga.findPlayerSkill('治疗')
			let requiremp = 25 + skill_heal.lv * 5;
			let playerinfo = cga.GetPlayerInfo();

			if (playerinfo.mp < requiremp && cga.travel.isInVillage()) {
				cga.travel.toHospital(() => {
					thisobj.func.checkHealth(cb)
				})
				return
			}

			if (playerinfo.health != 0) {
				console.log('人物受伤，开始治疗')
				thisobj.func.healMyself.func(() => {
					thisobj.func.checkHealth(cb)
				});
				return
			}
			cga.travel.toHospital(cb)
			return
		},
	},
	doTask: (param, cb) => {
		// 避免使用自动丢弃列表包含铜的战斗配置
		cga.loadBattleConfig('生产赶路')
		// 接受外部传入的参数
		thisobj.param = param
		// 如果传入了离线记录的时间戳，则获取。用于记录上一次获得任务道具的时间。
		thisobj.data.timestamp = thisobj.param.timestamp
		if (thisobj.data.timestamp) {
			thisobj.func.timerfunc()
		}

		let task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements)
		task.doTask(()=>{
			let config = cga.loadPlayerConfig();

			if (!config)
				config = {};
			if (!config["mission"])
				config["mission"] = {}

			let item = '好像很好吃的起司'
			if(config["mission"].hasOwnProperty(item)){
				console.log('删除个人配置中【' + item +'】所记录的时间。')
				delete config["mission"][item]
			}
			item = '好像很好喝的酒'
			if(config["mission"].hasOwnProperty(item)){
				console.log('删除个人配置中【' + item +'】所记录的时间。')
				delete config["mission"][item]
			}
			cga.savePlayerConfig(config, cb);
		})
		return
	},
};

module.exports = thisobj;