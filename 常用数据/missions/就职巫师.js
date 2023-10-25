/**
 * UNAecho:记录一些开发所需的信息
 * 冯奴的家(mapindex 3350)在mapindex 300 [349, 261]
 * 屋子内NPC：
 * 1、士兵霍尔[6, 3]
 * 2、亚莉耶鲁[12, 4]
 * 3、护卫强波[14, 1]
 * 4、护卫夫利登[11, 14]
 * 
 * 奇利村酒吧NPC
 * 1、雷欧尼[10, 14]
 * 任务重置：
 * 1、前往冯奴的家与亚莉耶鲁对话至出现【对不起，巫师冯奴现在不能出来见客…很抱歉。】为止。不然之前做过任务，无法在奇利村执行任务第一步（拿到【给亚莉耶鲁的信】）
 * 
 * BOSS战前房间index16508
 * 战斗胜利房间16509
 * 战斗胜利房间NPC：
 * 1、士兵霍尔[26, 19]
 * 2、巫师玛其[25, 16]
 * 3、亚莉安娜[22, 16]
 * 4、香蒂的房间[33, 13] index 5011
 * 
 * 攻击吸收/魔法吸收房间：
 * NPC均为[9, 4]
 * 传送出房间的NPC均为[14, 9]
 * 
 * 巫师导师房间index 3352，出口[9 ,16]
 * 
 * BOSS战：
 * Lv.50露比，2动，血量约3000，邪魔系，属性：全50，抗咒；技能：圣盾、攻击吸收/无效/反弹、强力恢复魔法、强力补血魔法（HP<25%追加）、喽啰<3只后追加：超强陨石魔法、超强冰冻魔法、超强混乱魔法
 * ◇打法建议：留下3个以上的血腥之刃后，再合击露比。BOSS超强混乱魔法
 */
var thisobj = {
	taskName: '就职巫师',
	taskStages: [
		{//0
			intro: '0.任务重置，并前往奇利村酒吧（46.78）与雷欧尼（10.14）对话，选三次“是”后获得【给亚莉耶鲁的信】。如果做过任务或任务做了一半没有继续，不与冯奴的家的亚莉耶鲁对话重置任务则无法重解任务。',
			workFunc: function (cb2) {

				// 如果有默认物资调整，则先调整
				thisobj.func.bankObj.manualPrepare(thisobj.func.getPrepareObj(), () => {
					// 补充状态之后出发
					thisobj.func.healObj.func(() => {
						cga.travel.toVillage('奇利村', () => {
							cga.travel.autopilot('东门', () => {
								cga.walkList([
									[349, 261, 3350]
								], () => {
									// 任务重置的NPC提示词
									let msg = cga.job.getJob().job == '巫师' ? '你也是巫师吧' : '不能出来见客'
									// 对话直至任务重置
									cga.askNpcForObj({ act: 'msg', target: msg, npcpos: [12, 4] }, () => {
										// 出去
										cga.walkList([
											[1, 6, 300]
										], () => {
											// 回到奇利村
											cga.walkList([
												[294, 325, 3200]
											], () => {
												// 接任务
												cga.travel.autopilot('酒吧', () => {
													cga.askNpcForObj({ act: 'item', target: '给亚莉耶鲁的信', npcpos: [10, 14] }, () => {
														cb2(true)
													})
												})
											});
										});
									})
								});
							})
						})
					})
				})
			}
		},
		{//1
			intro: '1.出奇利村，前往索奇亚岛（349.261）处冯奴的家与亚莉耶鲁（12.4）对话，选“是”交出【给亚莉耶鲁的信】获得【希望的蜡烛】。',
			workFunc: function (cb2) {
				cga.travel.toVillage('奇利村', () => {
					thisobj.func.healObj.func(() => {
						cga.travel.autopilot('东门', () => {
							cga.walkList([
								[349, 261, 3350]
							], () => {
								// 拿蜡烛，并落盘记录时间
								thisobj.func.getCandle(() => {
									cb2(true)
								})
							});
						})
					})
				})
			}
		},
		{//2
			intro: '2.前往索奇亚岛（240.265）处，抵达索奇亚海底洞窟地下1楼。调查门（7.41），选“是”通过栅栏。再步行抵达索奇亚海底洞窟地下2楼。调查可疑的岩石（35.7），选“是”传送至海底洞窟地下3楼。',
			workFunc: function (cb2) {

				// 如果超过1个小时，则任务失败，返回任务最初的步骤
				if (thisobj.func.isTimeout()) {
					console.log('持有蜡烛超过1小时，任务失败。返回任务最初的步骤重新开始。')
					cb2('jump', 0)
					return
				}

				let mapindex = cga.GetMapIndex().index3
				let XY = cga.GetMapXY()
				if (mapindex == 3350) {
					cga.walkList([
						[1, 6, 300]
					], () => {
						cb2('restart stage')
					});
					return
				} else if (mapindex == 300) {
					cga.walkList([
						[294, 325, 3200]
					], () => {
						cb2('restart stage')
					});
					return
				} else if (mapindex == 15003) {
					cga.askNpcForObj({ act: 'map', target: 16507, npcpos: [35, 7] }, () => {
						cb2('restart stage')
					})
					return
				} else if (mapindex == 15004) {
					if (XY.y >= 41) {
						cga.askNpcForObj({ act: 'map', target: 15004, npcpos: [7, 41], pos: [7, 39] }, () => {
							cb2('restart stage')
						})
					} else {
						cga.walkList([
							[24, 13, 15003],
						], () => {
							cb2('restart stage')
						});
					}
					return
				} else if (mapindex == 16507) {
					cb2(true)
					return
				} else {
					cga.travel.toVillage('奇利村', () => {
						thisobj.func.healObj.func(() => {
							cga.travel.autopilot('北门', () => {
								cga.walkList([
									[240, 265, 15004],
								], () => {
									cb2('restart stage')
								});
							})
						})
					})
				}
			}
		},
		{//3
			intro: '3.通过海底洞窟地下3楼（14.14）处黄色传送石进入黑色的祈祷（地下随机迷宫）。在迷宫内寻找随机出现的萌子并与之对话，无论选“是”或“否”，都可获得【恐怖旅团之证】。并通过随机迷宫抵达黑之祈祷，与守门人（24.32）对话，选“是”交出【恐怖旅团之证】通过栅栏。',
			workFunc: function (cb2) {

				// 如果超过1个小时，则任务失败，返回任务最初的步骤
				if (thisobj.func.isTimeout()) {
					console.log('持有蜡烛超过1小时，任务失败。返回任务最初的步骤重新开始。')
					cb2('jump', 0)
					return
				}

				let XY = cga.GetMapXY()
				// 迷宫入口
				if (cga.isInMap(thisobj.data.mazeInfo.entryMap, true)) {
					cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.buildTeamPos1_1 }, (r) => {
						if (r && r == 'ok') {
							if (thisobj.data.isTeamLeader) {
								// 进入随机迷宫，或人物被迷宫刷新甩出来之后重新进入
								cga.getRandomMazeEntrance({
									table: thisobj.data.mazeInfo.posList,
									filter: (obj) => {
										return obj.cell == 3 && obj.mapx >= thisobj.data.mazeInfo.xLimit[0] && obj.mapx <= thisobj.data.mazeInfo.xLimit[1] && obj.mapy >= thisobj.data.mazeInfo.yLimit[0] && obj.mapy <= thisobj.data.mazeInfo.yLimit[1];
									},
									blacklist: [],
									expectmap: thisobj.data.mazeInfo.prefix + '1' + thisobj.data.mazeInfo.suffix,
								}, () => {
									cb2('restart stage')
								})
							} else {
								cga.waitForMap(thisobj.data.mazeInfo.prefix + '1' + thisobj.data.mazeInfo.suffix, () => {
									cb2('restart stage')
								})
							}
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
				} else if (cga.isInMap(thisobj.data.mazeInfo.prefix, true)) {// 迷宫中
					// 开启任务playerThink
					cb2('playerThink on')
					// 读取赶路配置
					thisobj.func.configMode.manualLoad(thisobj.data.normalFile)

					// 拿完恐怖旅团之证
					if (cga.getItemCount(thisobj.data.itemName1_2) > 0) {
						if (thisobj.data.isTeamLeader) {
							// 走出迷宫
							cga.walkRandomMazeAuto(thisobj.data.mazeInfo.exitMap, () => {
								cb2('restart stage')
							})
						} else {
							cga.waitForMap(thisobj.data.mazeInfo.exitMap, () => {
								cb2('restart stage')
							})
						}
					} else {// 没拿恐怖旅团之证
						if (thisobj.data.isTeamLeader) {
							cga.exploreMaze({
								identify: (obj) => { return obj.name == thisobj.data.npcName1_1 },
								act: (obj, cb) => {
									if (obj.name == thisobj.data.npcName1_1) {
										cga.askNpcForObj({ act: 'item', target: thisobj.data.itemName1_2, npcpos: [obj.x, obj.y] }, () => {
											cb(false)
										})
										return
									}
								}
							}, (cache) => {// 返回的是迷宫各单位的缓存
								cb2('restart stage')
							})
						} else {
							cga.findNPCWithCallback(thisobj.data.npcName1_1, (npc) => {
								cga.askNpcForObj({ act: 'item', target: thisobj.data.itemName1_2, npcpos: [npc.xpos, npc.ypos], waitLocation: cga.GetMapIndex().index3 }, () => {
									cb2('restart stage')
								})
							})
						}
					}
				} else if (cga.isInMap(thisobj.data.mazeInfo.exitMap, true)) {// 迷宫出口
					// 栅栏内
					if (XY.x > 14 && XY.x < 34 && XY.y > 0 && XY.y < 31) {
						cb2(true)
					} else {// 栅栏外
						// 只能单人与NPC对话
						cga.disbandTeam(() => {
							cga.askNpcForObj({ act: 'map', target: thisobj.data.mazeInfo.exitMap, npcpos: [24, 32], pos: [24, 29] }, () => {
								// 重新执行本方法，会在最初发现已经持有净化碎片，并跳转
								cb2('restart stage')
							})
						})
					}
				} else {
					throw new Error('逻辑不应该出现在这里，请检查')
				}
			}
		},
		{//4
			intro: '4.与露比（24.11）对话，进入战斗。',
			workFunc: function (cb2) {

				// 如果超过1个小时，则任务失败，返回任务最初的步骤
				if (thisobj.func.isTimeout()) {
					console.log('持有蜡烛超过1小时，任务失败。返回任务最初的步骤重新开始。')
					cb2('jump', 0)
					return
				}

				cga.buildTeam({ teammates: thisobj.data.teammates, timeout: 0, pos: thisobj.data.buildTeamPos2_1 }, (r) => {
					if (r && r == 'ok') {
						cga.askNpcForObj({
							act: 'battle', target: {
								battle: thisobj.data.battleFile,
								normal: thisobj.data.normalFile,
							}, npcpos: [24, 11], waitLocation: 16508, notalk: () => { return !thisobj.data.isTeamLeader }
						}, () => {
							// 万一战斗失败，这里避免直接cb2(true)直接下一步了
							cga.waitForMap(16509, () => {
								cga.disbandTeam(() => {
									cb2(true)
								})
							})
						})
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{//5
			intro: '5.战斗胜利后一定几率随机获得【怠惰的罪书】、【魔族的水晶】。与巫师亚莉安娜（22.16）（左）或者巫师玛其（25.16）（右）对话，交出【希望的蜡烛】并传送至2个不同的冯奴的房间。',
			workFunc: function (cb2) {
				// 香蒂的房间，注意：不同的BOSS，香蒂房间的mapindex不同，这也解释了为什么购买的图纸不一样。 购买完直接回到冯奴的家，无法转职、学技能
				let obj1 = { act: 'map', target: 5011, npcpos: [33, 13] }
				// 香蒂
				let obj2 = { act: 'map', target: 3350, npcpos: [7, 6] }
				// 朵葡
				let obj3 = { act: 'map', target: 3350, npcpos: [7, 6] }
				// 由此回去
				let obj4 = { act: 'map', target: 16509, npcpos: [8, 4] }

				let mapindex = cga.GetMapIndex().index3

				// 战斗胜利房间
				if (mapindex == 16509) {
					// 如果超过1个小时，则无法学习技能，与任意NPC对话传送回冯奴的家
					if (thisobj.func.isTimeout()) {
						console.log('持有蜡烛1小时以上，无法学习技能，返回冯奴的家')
						cga.askNpcForObj({ act: 'map', target: 3352, npcpos: [22, 16] }, () => {
							cb2('restart stage')
						})
						return
					} else {
						// 无论是否学习技能，必须选一个NPC传送至学习房间，这样去下一个节点更快。默认去攻击吸收房间
						// 不学技能，直接从攻击吸收房间出去
						if (thisobj.data.learn == null) {
							cga.askNpcForObj({ act: 'map', target: 3351, npcpos: [22, 16] }, () => {
								cga.askNpcForObj({ act: 'map', target: 3352, npcpos: [14, 9] }, () => {
									cb2(true)
								})
							})
						} else {// 学技能
							// 可直接兼容攻击/魔法吸收2种技能的寻路
							cga.askNpcForObj({
								act: 'skill',
								target: thisobj.data.learn,
							}, () => {
								// 学完技能被NPC扔到巫师导师房间
								cga.askNpcForObj({ act: 'map', target: 3352, npcpos: [14, 9] }, () => {
									cb2(true)
								})
							})
						}
					}
				} else if (mapindex == 3351) {// 兜底逻辑，万一在此地图启动脚本则走此逻辑
					if (thisobj.data.learn == '攻击吸收') {
						cga.askNpcForObj({
							act: 'skill',
							target: thisobj.data.learn,
						}, () => {
							// 学完技能被NPC扔到巫师导师房间
							cga.askNpcForObj({ act: 'map', target: 3352, npcpos: [14, 9] }, () => {
								cb2(true)
							})
						})
					}
				} else if (mapindex == 3354) {// 兜底逻辑，万一在此地图启动脚本则走此逻辑
					if (thisobj.data.learn == '魔法吸收') {
						cga.askNpcForObj({
							act: 'skill',
							target: thisobj.data.learn,
						}, () => {
							// 学完技能被NPC扔到巫师导师房间
							cga.askNpcForObj({ act: 'map', target: 3352, npcpos: [14, 9] }, () => {
								cb2(true)
							})
						})
					}
				} else if (mapindex == 3352) {
					cb2(true)
				} else {
					throw new Error('逻辑不应该出现在这里，请检查')
				}
			}
		},
		{//6
			intro: '6.与巫师卡莫西（14.9）对话，选“是”传送至冯奴的家。与巫师冯奴（9.9）对话即可就职巫师。',
			workFunc: function (cb2) {
				if(thisobj.data.needjob){
					console.log('【UNAecho脚本提醒】就职、转职巫师，不需要推荐信，与导师对话即可。')
					cga.askNpcForObj({ act: 'job', target: thisobj.data.job.job }, () => {
						cb2(true)
					})
					return
				}
				console.log('【UNAecho脚本提醒】不需要就职/转职巫师，跳过此步骤')
				cb2(true)
				return
			}
		},
		{//7
			intro: '7.通过（9.16）处抵达冯奴的房间，与亚莉耶鲁对话，任务完结。◆此步必须完成才能重做。',
			workFunc: function (cb2) {
				cga.walkList([
					[9, 16, 3350]
				], () => {
					cga.askNpcForObj({ act: 'msg', target: '不会放弃', npcpos: [12, 4] }, () => {
						cb2(true)
					})
				});
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {// 0.任务重置，并重新接任务。如果做过任务或任务做了一半没有继续，不与亚莉耶鲁对话重置任务则无法重解任务。
			return cga.getItemCount('给亚莉耶鲁的信') > 0
		},
		function () {// 1.出奇利村，前往索奇亚岛（349.261）处冯奴的家与亚莉耶鲁（12.4）对话，选“是”交出【给亚莉耶鲁的信】获得【希望的蜡烛】。
			return cga.getItemCount(thisobj.data.itemName1_1) > 0 && !thisobj.func.isTimeout()
		},
		function () {// 2.前往索奇亚岛（240.265）处，抵达索奇亚海底洞窟地下1楼。调查门（7.41），选“是”通过栅栏。再步行抵达索奇亚海底洞窟地下2楼。调查可疑的岩石（35.7），选“是”传送至海底洞窟地下3楼。
			return cga.isInMap(thisobj.data.mazeInfo.entryMap, true) || cga.isInMap(thisobj.data.mazeInfo.prefix, true) || cga.isInMap(thisobj.data.mazeInfo.exitMap, true)
		},
		function () {// 3.在迷宫内寻找随机出现的萌子并与之对话，无论选“是”或“否”，都可获得【恐怖旅团之证】。并通过随机迷宫抵达黑之祈祷，与守门人（24.32）对话，选“是”交出【恐怖旅团之证】通过栅栏。
			let XY = cga.GetMapXY()
			return cga.isInMap(thisobj.data.mazeInfo.exitMap, true) && XY.x > 14 && XY.x < 34 && XY.y > 0 && XY.y < 31
		},
		function () {// 4.与露比（24.11）对话，进入战斗。
			let mapindex = cga.GetMapIndex().index3
			return [16509,3351,3354].includes(mapindex)
		},
		function () {// 5.战斗胜利后一定几率随机获得【怠惰的罪书】、【魔族的水晶】。与巫师亚莉安娜（22.16）（左）或者巫师玛其（25.16）（右）对话，交出【希望的蜡烛】并传送至2个不同的冯奴的房间。
			return cga.GetMapIndex().index3 == 3352
		},
		function () {// 6.与巫师卡莫西（14.9）对话，选“是”传送至冯奴的家。与巫师冯奴（9.9）对话即可就职巫师。
			return false
		},
		function () {// 7.通过（9.16）处抵达冯奴的房间，与亚莉耶鲁对话，任务完结。◆此步必须完成才能重做。
			return false
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		// 职业信息
		job: cga.job.getJob('巫师'),
		// 队伍信息缓存
		teammates: null,
		// BOSS战的默认战斗配置
		battleFile: 'BOSS合击血量高',
		// 赶路时的默认战斗配置
		normalFile: '任务',
		// 本次任务要学的技能名称。注意：一次任务只能学习攻击/魔法吸收的其中1种
		learn: null,
		// 本次任务是否需要就职/转职为巫师，默认false
		needjob : false,
		// 任务道具名称
		itemName1_1: '希望的蜡烛',
		itemName1_2: '恐怖旅团之证',
		// 希望的蜡烛获取时的时间戳
		timestamp: null,
		// 任务使用的迷宫信息
		mazeInfo: cga.mazeInfo['黑色的祈祷'],
		// 任务NPC名称
		npcName1_1: '萌子',
		// 随机迷宫入口地图组队坐标
		buildTeamPos1_1: [7, 5],
		// 黑之祈祷栅栏内组队坐标
		buildTeamPos2_1: [24, 28],
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		configMode: require('../../通用挂机脚本/公共模块/读取战斗配置.js'),
		// 任务默认需要准备的物品，需要通过移动银行.js和自动存取.js实现。
		getPrepareObj: () => {
			// 至少减去传送费和补血费，要学得起技能
			return {
				"gold": [{
					"name": "金币",
					"upper": 300000,
					"lower": 100000
				}],
			}
		},
		// 判断蜡烛是否超时
		isTimeout: () => {
			if (!thisobj.data.timestamp) {
				return true
			}
			let cost = Date.now() - thisobj.data.timestamp
			console.log('距离拿到蜡烛已经过【' + (cost / 1000 / 60).toFixed(2) + '】分钟')
			return cost > 3600000
		},
		// 在个人配置中，记录任务道具的时间戳
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
		// 任务结束时，删除道具时间戳。
		delTimestamp: (cb) => {
			let config = cga.loadPlayerConfig();

			if (!config)
				config = {};
			if (!config["mission"])
				config["mission"] = {}

			delete config["mission"][thisobj.data.itemName1_1]

			cga.savePlayerConfig(config, cb);
			return
		},
		// 拿取蜡烛，并落盘计时
		getCandle: (cb) => {
			let obj = { act: 'item', target: thisobj.data.itemName1_1, npcpos: [12, 4] }
			cga.askNpcForObj(obj, () => {
				// 记录时间
				thisobj.func.saveTimestamp(obj.target, () => {
					cb(null)
				})
			})
		}
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo()
		let teamplayers = cga.getTeamPlayers()
		// let index = cga.GetMapIndex().index3

		// 到达指定房间后自动终止playerthink
		if (cga.isInMap(thisobj.data.mazeInfo.exitMap, true)) {
			console.log('到达指定区域，playerthink自动终止...')
			return false
		}

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			teamplayers: teamplayers,
			result: null,
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		if (ctx.teamplayers.length != thisobj.data.teammates.length) {
			console.log('队伍与预设值', thisobj.param.teammates, '不符，中断任务')
			return function (cb) {
				// 返回任务的第index步
				cb(0)
			}
		}

		// 只有掉魂中止任务，受伤无视。因为走一回迷宫非常艰难
		if (ctx.playerinfo.souls > 0) {
			console.log('人物掉魂，中断任务')
			return function (cb) {
				// 治疗、招魂
				healMode.func(() => {
					// 返回任务的第index步
					cb(0)
				})
			}
		}

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param

		let playerInfo = cga.GetPlayerInfo()

		// 外部传入队伍信息
		if (!thisobj.param.hasOwnProperty('teammates') || !thisobj.param.teammates instanceof Array) {
			throw new Error('必须传入正确的队伍成员信息')
		}

		// 保存队伍信息
		thisobj.data.teammates = thisobj.param.teammates

		// 判断自己是队长还是队员
		thisobj.data.isTeamLeader = !thisobj.data.teammates.length || thisobj.data.teammates[0] == playerInfo.name

		// 外部传入的战斗配置
		if (thisobj.param.hasOwnProperty('battle')) {
			thisobj.data.battleFile = thisobj.param.battle
		} else {
			console.log('【UNAecho脚本提醒】你没有传入BOSS战所使用的战斗配置文件名，脚本使用默认文件【' + thisobj.data.battleFile + '】来战斗')
		}
		if (thisobj.param.hasOwnProperty('normal')) {
			thisobj.data.normalFile = thisobj.param.normal
		} else {
			console.log('【UNAecho脚本提醒】你没有传入赶路时所使用的战斗配置文件名，脚本使用默认文件【' + thisobj.data.normalFile + '】来战斗')
		}

		// 外部传入的战前物资调整函数
		if (thisobj.param.hasOwnProperty('prepare')) {
			console.log('【UNAecho脚本提醒】你传入了战前物资调整函数，将按照自定义函数准备物资')
			thisobj.func.getPrepareObj = thisobj.param.prepare
		} else {
			console.log('【UNAecho脚本提醒】你没有传入战前物资调整函数prepare，脚本使用默认配置进行调整')
		}

		// 如果身上有蜡烛
		if (cga.getItemCount(thisobj.data.itemName1_1) > 0) {
			console.log('检测到你身上有【' + thisobj.data.itemName1_1 + '】')
			let config = cga.loadPlayerConfig();
			if (config && config["mission"]) {
				if (config["mission"][thisobj.data.itemName1_1]) {
					thisobj.data.timestamp = config["mission"][thisobj.data.itemName1_1]
				}
			}
		}

		// 外部传入要学习的技能信息。如果不传则不学习
		if (thisobj.param.hasOwnProperty('learn') && ['攻击吸收', '魔法吸收'].includes(thisobj.param.learn)) {
			thisobj.data.learn = thisobj.param.learn
			console.log('【UNAecho脚本提醒】本次任务你想学习【' + thisobj.data.learn + '】')
		} else {
			console.log('【UNAecho脚本提醒】你没有传入你想学习的攻击吸收或魔法吸收技能，本次任务跳过学习步骤。')
		}

		// 外部传入是否要就职/转职，注意：转职是敏感动作，请确认好。
		if (thisobj.param.hasOwnProperty('needjob') && thisobj.param.needjob === true) {
			thisobj.data.needjob = thisobj.param.needjob
			console.log('【UNAecho脚本提醒】本次任务你想就职/转职成为巫师，转职是敏感操作，请确认好。')
		} else {
			console.log('【UNAecho脚本提醒】本次任务你没传入想就职/转职成为巫师的参数needjob。默认不转职')
		}

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		task.doTask(()=>{
			thisobj.func.delTimestamp(cb)
		});
		return
	},
};

module.exports = thisobj;