var thisobj = {
	taskName: '开启者',
	taskStages: [
		{
			intro: '0.任务准备。',
			workFunc: function (cb2) {
				thisobj.func.bankObj.prepare(() => {
					thisobj.func.healObj.func(() => {
						if (thisobj.data.soloBattle) {
							console.log('单人solo，跳过建立队伍')
							cb2(true)
							return
						}
						cga.travel.newisland.toStone('X', () => {
							// 无超时时间
							cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 0, pos: thisobj.data.sexObj.preparePos[thisobj.data.sex] }, (r) => {
								if (r && r == 'ok') {
									// 修改称号，通知其它单位将自己纳入统计范畴
									cga.ChangeNickName(thisobj.data.taskNick)
									setTimeout(thisobj.func.waitForStart, 1000, () => {
										cga.disbandTeam(() => {
											cb2(true)
										})
									});
									return
								} else {
									throw new Error('cga.buildTeam返回类型错误')
								}
							})
						});
					})
				})
			}
		},
		{
			intro: '1.前往杰诺瓦镇，出镇北门至莎莲娜岛（260.359）处与阿斯提亚神官对话，选“是”进入参道。',
			workFunc: function (cb2) {

				let go = () => {
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						thisobj.func.configMode.manualLoad('战斗赶路');
					} else {
						thisobj.func.configMode.func('节能模式');
					}
					// 开启任务playerThink
					cb2('playerThink on')

					cga.travel.autopilot('北门', () => {
						let obj = { act: 'map', target: 14010, npcpos: [260, 359], waitLocation: 400 }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				}

				let prepare = () => {

					if (thisobj.data.soloBattle) {
						go()
						return
					}

					cga.travel.autopilot('主地图', () => {
						cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 600000, pos: thisobj.data.sexObj.buildTeamPos1[thisobj.data.sex] }, (r) => {
							if (r && r == 'ok') {
								go()
								return
							} else if (r && r == 'timeout') {// 如果超时，则结束任务。
								console.log('等待队员超时，结束任务。')
								return
							} else {
								throw new Error('cga.buildTeam返回类型错误')
							}
						})
					})
				}

				cga.travel.toVillage('杰诺瓦镇', () => {
					// 如果是走路至杰诺瓦镇，还需要再次回补
					if (cga.needSupplyInitial({})) {
						cga.travel.toHospital(() => {
							prepare()
						});
						return;
					}
					prepare()
				})
			}
		},
		{
			intro: '2.通过参道抵达阿斯提亚镇。',
			workFunc: function (cb2) {

				let go = () => {
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						thisobj.func.configMode.manualLoad('战斗赶路');
					} else {
						thisobj.func.configMode.func('节能模式');
					}
					// 开启任务playerThink
					cb2('playerThink on')

					if (thisobj.data.isTeamLeader) {
						cga.walkList([
							[27, 11, 14011],
							[34, 12, 14012],
							[16, 9, 14013],
							[34, 9, 14014],
							[24, 8, 14015],
							[18, 28, 14016],
							[22, 10, 4100],
						], () => {
							cb2(true);
						});
					} else {
						cga.waitForMap(4100, () => {
							cb2(true)
						})
					}
				}
				// 单人模式不组队
				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: thisobj.data.sexObj.buildTeamPos2[thisobj.data.sex], dangerLevel: 2 }, (r) => {
					if (r && r == 'ok') {
						go()
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '3.在神殿补给后，通过（20.22）处楼梯进入大厅，与克里斯夫多祭司（26.23）对话，选“是”传送至圣餐之间。',
			workFunc: function (cb2) {

				cga.disbandTeam(() => {
					if (cga.needSupplyInitial({})) {
						cga.travel.toHospital(() => {
							cb2('restart stage');
						}, false, false);
						return;
					}
					cga.travel.autopilot('大厅', () => {
						let obj = { act: 'map', target: 24006, npcpos: [26, 23] }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
			}
		},
		{
			intro: '4.与阿斯提亚神官（40.12）对话，传送至圣坛。',
			workFunc: function (cb2) {
				let obj = { act: 'map', target: 24003, npcpos: [40, 12] }
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
		{
			/**
			 * UNAecho开发提醒：cga.walkList有一个严重bug，就是在同一个地图不同的坐标之间传送（如：[24, 76, '圣坛', 24, 71]）这种坐标时，会出现没切换坐标前就提前执行callback的情况。
			 * 这会导致你传给cga.walkList的callback会提前执行，如果callback中含有坐标类的API，会直接导致报错(因为无法抵达。)
			 * 使用cga.walkList时，要注意此事
			 */
			intro: '5.第1层组队，并获取蜡烛。',
			workFunc: function (cb2) {
				// 获取蜡烛对象
				let mapindex = cga.GetMapIndex().index3
				let candleObj = thisobj.data.sexObj.candle[mapindex][thisobj.data.sex]

				let obj = { act: 'item', target: candleObj.before, npcpos: thisobj.data.sexObj.layer1ItemNpcPos[thisobj.data.sex], waitLocation: 24003 }

				let go = () => {
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						thisobj.func.configMode.manualLoad('战斗赶路');
					} else {
						thisobj.func.configMode.func('节能模式');
					}
					// 开启任务playerThink
					cb2('playerThink on')

					if (thisobj.data.isTeamLeader) {
						cga.walkList(thisobj.data.sexObj.path[mapindex][thisobj.data.sex].candle, () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						});
					} else {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					}
				}

				// 单人模式不组队
				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: thisobj.data.sexObj.layer1TeamPos[thisobj.data.sex], dangerLevel: 2 }, (r) => {
					if (r && r == 'ok') {
						go()
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '6.第1层换蜡烛，并进入下一层',
			workFunc: function (cb2) {
				// 任务战斗模式
				if (thisobj.data.soloBattle) {
					thisobj.func.configMode.manualLoad('战斗赶路');
				} else {
					thisobj.func.configMode.func('节能模式');
				}
				// 开启任务playerThink
				cb2('playerThink on')

				// 进入下一层的对话obj
				let obj = { act: 'map', target: 24004, npcpos: thisobj.data.sexObj.layer1NpcPos[thisobj.data.sex], waitLocation: 24003 }

				setTimeout(thisobj.func.layerLogic, 3000, obj, () => {
					cb2(true)
				});
			}
		},
		{
			intro: '7.第2层换蜡烛，并进入下一层',
			workFunc: function (cb2) {
				// 进入下一层的对话obj
				let obj = { act: 'map', target: 24005, npcpos: thisobj.data.sexObj.layer2NpcPos[thisobj.data.sex], waitLocation: 24004 }

				let go = () => {
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						thisobj.func.configMode.manualLoad('战斗赶路');
					} else {
						thisobj.func.configMode.func('节能模式');
					}
					// 开启任务playerThink
					cb2('playerThink on')

					setTimeout(thisobj.func.layerLogic, 3000, obj, () => {
						cb2(true)
					});
				}

				// 单人模式不组队
				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: thisobj.data.sexObj.layer2TeamPos[thisobj.data.sex], dangerLevel: 2 }, (r) => {
					if (r && r == 'ok') {
						go()
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '8.第3层换蜡烛，之后与传送水晶对话，抵达阿尔杰斯的慈悲。',
			workFunc: function (cb2) {
				console.log('【UNAecho脚本提示：】此楼层有特殊交换蜡烛的地点(男[56,60],女[54,62])，可节约路程。但考虑脚本的稳定运行，依然使用传统地点交易蜡烛。')

				// 进入下一层的对话obj
				let obj = { act: 'map', target: 24002, npcpos: thisobj.data.sexObj.layer3NpcPos[thisobj.data.sex], waitLocation: 24005 }

				let go = () => {
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						thisobj.func.configMode.manualLoad('战斗赶路');
					} else {
						thisobj.func.configMode.func('节能模式');
					}
					// 开启任务playerThink
					cb2('playerThink on')

					setTimeout(thisobj.func.layerLogic, 3000, obj, () => {
						cb2(true)
					});
				}

				// 单人模式不组队
				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: thisobj.data.sexObj.layer3TeamPos[thisobj.data.sex], dangerLevel: 2 }, (r) => {
					if (r && r == 'ok') {
						go()
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			intro: '9.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。',
			workFunc: function (cb2) {
				let obj = { act: 'map', target: 24001, npcpos: [93, 49] }
				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
		{
			/**
			 * UNAecho:经测试，一队5个人，1个大号格斗，4个小号100级左右攻人，全力合击等级最高的单位，可auto打过UD。仅供参考。
			 */
			intro: '10.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。',
			workFunc: function (cb2) {
				let obj = { act: 'map', target: 24000, npcpos: thisobj.data.sexObj.bossPos[thisobj.data.sex], waitLocation: 24001 }

				let battleWords = '【UNA脚本提示】BOSS信息：Lv.65犹大，血量约7500，邪魔系，属性：全50，抗咒；技能：攻击、圣盾、崩击、乾坤一掷、战栗袭心、反击（奇数回合）、超强补血魔法（间隔2回合）、魔法封印（第一回合、每4回合；效果持续到下回合）'
				let suggest = '【UNA脚本提示】打法建议：按照火焰之刃/亡灵→冰怪→犹大→武装骷髅的顺序击杀，【人远程攻击，宠防御】。注意不能打死犹大前面的卡位的武装骷髅。'
				let tips = (counter) => {

					if (counter == 0) {
						return;
					} else if (counter == 3) {
						cga.SayWords(suggest, 1, 3, 1);
						console.log(suggest)
					} else if (counter == 6) {
						cga.SayWords(battleWords, 0, 3, 1);
						console.log(battleWords)
					}

					setTimeout(tips, 1000, counter - 1);
				}

				let go = () => {
					let delay = 5000
					// 任务战斗模式
					if (thisobj.data.soloBattle) {
						// // 单挑BOSS设置，自行配置
						// thisobj.func.configMode.func('节能模式');
					} else {
						thisobj.func.configMode.func('节能模式');
					}

					console.log(delay / 1000 + '秒后自动进入战斗..')

					setTimeout(() => {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					}, delay);
				}
				// 播报战斗参考信息
				if (thisobj.data.isTeamLeader) {
					tips(9)
				}

				if (thisobj.param.solo && thisobj.param.solo.boss) {
					console.log('你设置了单挑BOSS，现在直接去挑战')
					go()
					return
				}

				if (thisobj.param.bossTeam && thisobj.param.bossTeam instanceof Array) {
					console.log('你使用固定组队挑战BOSS，现在开始组队')
					cga.buildTeam({ teammates: thisobj.param.bossTeam, timeout: 600000, pos: thisobj.data.sexObj.bossRoomTeamPos[thisobj.data.sex] }, (r) => {
						if (r && r == 'ok') {
							go()
							return
						} else if (r && r == 'timeout') {// 如果超时，则结束任务。
							console.log('等待队员超时，结束任务。')
							return
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
					return
				} else {
					console.log('你未指定打BOSS的队员，手动组队并击败BOSS后，脚本自动继续..')
					// cga.loadBattleConfig('BOSS合击血量高')
					cga.waitForMap(obj.target, () => {
						cb2(true)
					})
				}

			}
		},
		{
			intro: '11.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。',
			workFunc: function (cb2) {
				// 任务NPC
				let obj1 = { act: 'map', target: 24007, npcpos: [17, 9] }
				// 香蒂的房间
				let obj2 = { act: 'map', target: 5013, npcpos: [27, 13] }
				// 香蒂
				let obj3 = { act: 'map', target: 24007, npcpos: [10, 6] }
				// 朵葡
				let obj4 = { act: 'map', target: 24007, npcpos: [10, 7] }
				// 香蒂的房间返回任务房间NPC
				let obj5 = { act: 'map', target: 24000, npcpos: [8, 4] }

				cga.disbandTeam(() => {
					cga.askNpcForObj(obj1, () => {
						thisobj.func.dropUseless(['破损的刀刃','魔族的水晶','誓言之证'],() => {
							cga.refreshMissonStatus({'开启者' : true},()=>{
								cb2(true)
							})
						})
					})
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {//0.前期处理。
			return thisobj.data.soloBattle
		},
		function () {//1.前往杰诺瓦镇，出镇北门至莎莲娜岛（260.359）处与阿斯提亚神官对话，选“是”进入参道。
			return cga.GetMapIndex().index3 == 14010
		},
		function () {//2.通过参道抵达阿斯提亚镇。
			return cga.travel.switchMainMap() == '阿斯提亚镇'
		},
		function () {//3.在神殿补给后，进入圣餐之间。
			return cga.GetMapIndex().index3 == 24006
		},
		function () {//4.与阿斯提亚神官（40.12）对话，传送至圣坛。
			return cga.GetMapIndex().index3 == 24003
		},
		function () {//5.第1层组队，并获取蜡烛。
			let mapindex = cga.GetMapIndex().index3
			if (mapindex > 24002 && mapindex < 24006 && cga.findItem(thisobj.data.sexObj.candle[24003][thisobj.data.sex].before) != -1) {
				return true
			} else if (mapindex > 24002 && mapindex < 24006 && cga.findItem(thisobj.data.sexObj.candle[24003][thisobj.data.sex].after) != -1) {
				return true
			}
			return false
		},
		function () {//6.第1层换蜡烛，并进入下一层
			return cga.GetMapIndex().index3 == 24004
		},
		function () {//7.第2层换蜡烛，并进入下一层
			return cga.GetMapIndex().index3 == 24005
		},
		function () {//8.第3层换蜡烛，之后与传送水晶对话，抵达阿尔杰斯的慈悲。
			return cga.GetMapIndex().index3 == 24002
		},
		function () {//9.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。
			return cga.GetMapIndex().index3 == 24001
		},
		function () {//10.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。
			return cga.GetMapIndex().index3 == 24000
		},
		function () {//11.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。
			return cga.GetMapIndex().index3 == 24007
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		// 任务识别暗号，名称中带有此暗号的人，会在准备阶段时，被统计进对应性别队伍的人数中。
		taskNick: 'opener',
		// 任务交易暗号，队长称号出现此符号，才开始交易蜡烛
		tradeStr: '$',
		// 性别，任务运行时必须被赋予0或1的number数值。不放在sexObj中是因为偷懒。
		sex: null,
		// 双方各自需要的数据，0女1男。如果数据相同，则代表没有区分的必要
		sexObj: {
			// 初期建立队伍时，队长所处的主城坐标，暂定为新城。
			preparePos: { 0: [159, 121], 1: [159, 117] },
			// 杰诺瓦镇出发组队坐标
			buildTeamPos1: { 0: [42, 36], 1: [42, 36] },
			// 参道神官坐标
			npcPos1: { 0: [260, 359], 1: [260, 359] },
			// 通过神官，在参道组队坐标
			buildTeamPos2: { 0: [8, 34], 1: [8, 34] },
			// 圣坛1层组队坐标
			layer1TeamPos: { 0: [11, 75], 1: [10, 24] },
			// 圣坛1层领取蜡烛NPC坐标
			layer1ItemNpcPos: { 0: [29, 81], 1: [29, 30] },
			// 圣坛1层传送水晶坐标
			layer1NpcPos: { 0: [111, 34], 1: [101, 58] },
			// 圣坛2层组队坐标
			layer2TeamPos: { 0: [9, 17], 1: [9, 85] },
			// 圣坛2层传送水晶坐标
			layer2NpcPos: { 0: [135, 78], 1: [142, 12] },
			// 圣坛3层组队坐标
			layer3TeamPos: { 0: [16, 82], 1: [15, 16] },
			// 圣坛3层传送水晶坐标
			layer3NpcPos: { 0: [82, 43], 1: [82, 63] },
			// BOSS房间组队坐标
			bossRoomTeamPos: { 0: [8, 8], 1: [8, 8] },
			// BOSS坐标，对话进入战斗
			bossPos: { 0: [15, 8], 1: [15, 8] },
			// 各性别在每层需要的蜡烛，key为mapindex
			candle: {
				24003: { 0: { before: 18492, after: 18496 }, 1: { before: 18496, after: 18492 } },
				24004: { 0: { before: 18497, after: 18493 }, 1: { before: 18493, after: 18497 } },
				24005: { 0: { before: 18494, after: 18498 }, 1: { before: 18498, after: 18494 } },
			},
			dir : {0: 6, 1: 2},
			// 男女行走路径，分为换蜡烛前与换蜡烛后。其中第一层24003还包含获取蜡烛的路径
			path: {
				24003: {
					0: {
						candle: [[24, 76, '圣坛', 24, 71],],
						before: [[24, 71, '圣坛', 24, 76], [69, 49], [74, 49],],
						after: [[81, 80, '圣坛', 73, 82], [97, 34, '圣坛', 103, 34],]
					},
					1: {
						candle: [[24, 24, '圣坛', 24, 19]],
						before: [[24, 19, '圣坛', 24, 24], [69, 47], [74, 47],],
						after: []
					},
				},
				24004: {
					0: {
						before: [
							[14, 29, '圣坛', 19, 27],
							[31, 70, '圣坛', 31, 65],
							[74, 82, '圣坛', 75, 76],
							[62, 64, '圣坛', 68, 63],
							[80, 52],
							[84, 52],
						],
						after: [
							[68, 62, '圣坛', 62, 63],
							[94, 71, '圣坛', 95, 65],
							[67, 34, '圣坛', 61, 36],
							[58, 47, '圣坛', 58, 51],
						]
					},
					1: {
						before: [
							[7, 54, '圣坛', 7, 49],
							[15, 53, '圣坛', 22, 53],
							[26, 53, '圣坛', 31, 50],
							[60, 3, '圣坛', 59, 10],
							[100, 16, '圣坛', 100, 22],
							[80, 50],
							[84, 50],
						],
						after: [
							[106, 45, '圣坛', 115, 44],
							[128, 44, '圣坛', 135, 43],
						]
					},
				},
				24005: {
					0: {
						before: [
							[76, 30, '圣坛', 78, 25],
							[98, 16, '圣坛', 106, 16],
							[110, 24, '圣坛', 110, 32],
							[111, 47, '圣坛', 111, 54],
							[121, 60, '圣坛', 130, 60],
							[135, 54, '圣坛', 135, 47],
							[134, 41],
							[139, 41],
						],
						after: [
							[135, 47, '圣坛', 135, 54],
							[130, 60, '圣坛', 121, 60],
							[111, 54, '圣坛', 111, 47],
							[110, 32, '圣坛', 110, 24],
							[106, 16, '圣坛', 98, 16],
						]
					},
					1: {
						before: [
							[23, 15, '圣坛', 32, 15],
							[36, 23, '圣坛', 36, 31],
							[37, 46, '圣坛', 37, 53],
							[36, 68, '圣坛', 36, 75],
							[47, 80, '圣坛', 56, 80],
							[60, 75, '圣坛', 60, 68],
							[71, 60, '圣坛', 78, 60],
							[83, 95, '圣坛', 88, 94],
							[140, 28, '圣坛', 135, 33],
							[134, 39],
							[139, 39],
						],
						after: [
							[135, 33, '圣坛', 140, 28],
							[88, 94, '圣坛', 83, 95],
						]
					},
				},

			}
		},
		// 单人跑图flag，打开此开关，抵达BOSS房间前均为单人赶路、换蜡烛（需要准备一名换蜡烛的异性伙伴）。战斗则是一直逃跑。
		soloBattle: false
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取魔币.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		configMode: require('../../通用挂机脚本/公共模块/读取战斗配置.js'),
		dropUseless: (items, cb) => {
			let itemname = items.shift()
			if (itemname) {
				let item = cga.findItem(itemname)
				if (item != -1) {
					console.log('丢弃【', itemname, '】，如果想要保留，请在脚本中将其去除。')
					cga.DropItem(item);
				}
				setTimeout(thisobj.func.dropUseless, 1500, items, cb);
				return
			}
			cb(null)
			return
		},
		/**
		 * UNAecho: 等待男女双方人齐才能一起出发，否则容易等待超时，浪费时间。
		 * 逻辑说明：
		 * 1、cga.GetMapUnits()不会获取自己的信息，所以在获取数据后，要把自己的性别数据补上。
		 * 也就是说，假如男女双方全部就位，cga.GetMapUnits()只能返回thisobj.param.teammates.length * 2 - 1个数据
		 * 2、男女队伍人数需要保持一致，所以每个队员都要判断地图视野范围内的人数以及性别是否对的上。
		 * 
		 * @param {*} cb 
		 * @returns 
		 */
		waitForStart: (cb) => {
			let units = cga.GetMapUnits().filter((u) => {
				if (u.valid == 2 && u.type == 8 && (u.flags & 256) == 256 && u.nick_name == thisobj.data.taskNick) {
					return true
				}
				return false
			})
			// 人数不足或未进入队伍准备好时，则进入休眠
			if (units.length < (thisobj.param.teammates.length * 2 - 1)) {
				setTimeout(thisobj.func.waitForStart, 1000, cb)
				return
			}
			// 进队时，称号修改的申请已经发送。如果在服务器响应前进入此方法，需要等待。
			if (cga.GetPlayerInfo().nick != thisobj.data.taskNick) {
				setTimeout(thisobj.func.waitForStart, 1000, cb)
				return
			}
			// 人数正确之后，开始判断双方性别是否对称
			// 由于cga.GetMapUnits()不包含自己的信息，所以初始化时，要将自己的性别先加进去。
			let maleCnt = thisobj.data.sex == 1 ? 1 : 0
			let feMaleCnt = thisobj.data.sex == 0 ? 1 : 0
			units.forEach(u => {
				if (cga.character.getCharacterInfo(u.model_id).sex == 0) {
					feMaleCnt++
				} else if (cga.character.getCharacterInfo(u.model_id).sex == 1) {
					maleCnt++
				} else {
					throw new Error('性别数值出错，sex必须为0或1')
				}
			});
			// 男女双方数量必须一致，且加和数量必须为队伍人数*2，避免性别人数不对称，或者男女都为0的情况。
			if (maleCnt == feMaleCnt && maleCnt + feMaleCnt == thisobj.param.teammates.length * 2) {
				cb(true)
				return
			}
			setTimeout(thisobj.func.waitForStart, 1000, cb)
			return
		}, waitForTradeCandle: (cb) => {
			let mapindex = cga.GetMapIndex().index3
			if (mapindex < 24003 || mapindex > 24005) {
				console.log('当前地图不属于换蜡烛的地图，waitForTradeCandle()结束..')
				if (cb) cb(null)
				return
			}
			// 对应性别需要的蜡烛信息
			let candleObj = thisobj.data.sexObj.candle[mapindex][thisobj.data.sex]
			// 如果已经持有本层所需蜡烛，则退出逻辑
			if (cga.findItem(candleObj.after) != -1) {
				console.log('蜡烛交换完毕，waitForTradeCandle()结束..')
				if (cb) cb(null)
				return
			}
			// 队长给出交易信号，才开始交易逻辑
			let teamplayers = cga.getTeamPlayers()
			if (teamplayers && teamplayers[0].nick && teamplayers[0].nick.indexOf(thisobj.data.tradeStr) == -1) {
				setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
				return
			}
			// 交易物品的判断方法
			let stuffs =
			{
				itemFilter: (item) => {
					if (item.itemid == candleObj.before) {// 提供自己在本层初期持有的蜡烛
						return true;
					}
					return false;
				}
			}

			let dir = cga.GetPlayerInfo().direction

			// thisobj.data.sex非0即1。
			// 男性逻辑
			if (thisobj.data.sex) {
				// 锁定朝向，不然坐标对上也不能交易
				if(dir != thisobj.data.sexObj.dir[thisobj.data.sex]){
					cga.turnDir(thisobj.data.sexObj.dir[thisobj.data.sex])
					setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
					return;
				}
				cga.waitTrade(stuffs, null, (results) => {
					if (results && results.success == true) {
						cb(true);
					} else {
						console.log('交易失败或超时，重新进入waitForTradeCandle()..')
						setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
					}
				}, 5000);
			} else {// 女性逻辑
				// 锁定朝向，不然坐标对上也不能交易
				if(dir != thisobj.data.sexObj.dir[thisobj.data.sex]){
					cga.turnDir(thisobj.data.sexObj.dir[thisobj.data.sex])
					setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
					return;
				}
				let xy = cga.GetMapXY()
				let playerunit = cga.findPlayerUnit(u => {
					// 如果对方称号中含有我想要的蜡烛id，并且与自己隔岸相望，则判断是可以交易的对象。
					if (u.nick_name.indexOf(candleObj.after) != -1 && u.xpos == xy.x && u.ypos == xy.y - 2) {
						return true
					}
				});
				if (playerunit != null) {
					console.log('找到交换蜡烛的对象【'+playerunit.unit_name+'】')
					cga.positiveTrade(playerunit.unit_name, stuffs, undefined, result => {
						if (result && result.success == true) {
							cb(true);
						} else {
							console.log('交易失败或超时，重新进入waitForTradeCandle()..')
							setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
						}
					});
				} else {
					console.log('没找到合适的交易对象，重新进入waitForTradeCandle()..')
					setTimeout(thisobj.func.waitForTradeCandle, 1000, cb)
				}
			}
		}, checkStatus: () => {
			let mapindex = cga.GetMapIndex().index3
			let candleObj = thisobj.data.sexObj.candle[mapindex][thisobj.data.sex]
			let keys = Object.keys(candleObj)

			// 如果是单人，仅检查物品即可获取当前换蜡烛的阶段
			if (thisobj.data.soloBattle) {
				for (let i = 0; i < keys.length; i++) {
					if (cga.findItem(candleObj[keys[i]]) != -1) {
						return keys[i]
					}
				}
				return null
			}

			// 组队模式，需要遍历全队昵称
			let status = null
			let teamplayers = cga.getTeamPlayers()
			for (let i = 0; i < teamplayers.length; i++) {
				for (let j = 0; j < keys.length; j++) {
					if (teamplayers[i].nick && teamplayers[i].nick.indexOf(candleObj[keys[j]]) != -1) {
						if (status == null) {
							status = keys[j]
						} else if (status != null && status != keys[j]) {
							return null
						}
					}
				}
			}

			return status
		},
		// 获取需要继续走的路径。part:需要指定是before还是after。分别代表换蜡烛的前后
		getPath: (part) => {
			let mapindex = cga.GetMapIndex().index3
			let xy = cga.GetMapXY()
			let pathObj = thisobj.data.sexObj.path[mapindex][thisobj.data.sex]

			for (let j = 0; j < pathObj[part].length; j++) {
				if (cga.isPathAvailable(xy.x, xy.y, pathObj[part][j][0], pathObj[part][j][1])) {
					return pathObj[part].slice(j)
				}
			}
			// 如果抵达传送水晶前，没有门需要走，由于返回结果需要给walklist运行，所以返回空数组而不是null
			return []
		},
		/**
		 * 由于圣坛1层拿蜡烛独立进行，剩下圣坛123层的逻辑都是一样的：
		 * 1、换蜡烛前，赶路，队长走至换蜡烛地点，通知队员打开交易模式；队员等待队长通知打开交易模式，交换蜡烛。
		 * 2、换蜡烛后，赶路，走至传送石，对话，进入下一个地图
		 * 
		 * 所以抽象出一个通用的方法，传入需要的参数即可
		 * @param {*} obj 与cga.askNpcForObj需要用的obj类型。
		 * @param {*} cb 
		 */
		layerLogic: (obj, cb) => {
			let status = thisobj.func.checkStatus()
			if (status == null) {
				setTimeout(thisobj.func.layerLogic, 1000, obj, cb);
				return
			} else if (status == 'before') {
				if (thisobj.data.isTeamLeader) {
					cga.walkList(thisobj.func.getPath(status), () => {
						// 由于playerthink实时刷新称号，所以直接取自己的称号加上交易信号即可完成对队员的交易提醒动作。
						cga.ChangeNickName(cga.GetPlayerInfo().nick + thisobj.data.tradeStr)
						thisobj.func.waitForTradeCandle(() => {
							setTimeout(thisobj.func.layerLogic, 5000, obj, cb);
						})
					});
				} else {
					thisobj.func.waitForTradeCandle(() => {
						setTimeout(thisobj.func.layerLogic, 5000, obj, cb);
					})
				}
			} else if (status == 'after') {
				if (thisobj.data.isTeamLeader) {
					cga.walkList(thisobj.func.getPath(status), () => {
						cga.askNpcForObj(obj, () => {
							cb(true)
						})
					});
				} else {
					cga.askNpcForObj(obj, () => {
						cb(true)
					})
				}
			} else {
				throw new Error('状态错误,status只能为null,before,after这3种情况')
			}
		}
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo();
		let teamplayers = cga.getTeamPlayers()
		let items = cga.GetItemsInfo();
		let index = cga.GetMapIndex().index3

		// 到达指定房间后自动终止playerthink
		if ((index >= 4100 && index <= 4199) || (index == 24006 || index == 24002)) {
			console.log('到达特殊区域，playerthink自动终止...')
			return false
		}

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			teamplayers: teamplayers,
			inventory: items.filter((item) => {
				return item.pos >= 8 && item.pos < 100;
			}),
			// equipment: items.filter((item) => {
			// 	return item.pos >= 0 && item.pos < 8;
			// }),
			result: null,
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		if (!thisobj.data.soloBattle && ctx.teamplayers.length != thisobj.param.teammates.length) {
			if (cga.isAroundPos(thisobj.data.noTeamThinkObj,null,true)) {
				console.log('地图切换首末组队阶段，暂时阻止playerthink的组队监测..')
			} else {
				console.log('队伍与预设值', thisobj.param.teammates, '不符，中断任务')
				return function (cb) {
					// 返回任务的第index步
					cb(0)
				}
			}
		}

		if (ctx.playerinfo.health > 0) {
			console.log('人物受伤，中断任务')
			return function (cb) {
				// 返回任务的第index步
				cb(0)
			}
		}

		let candle = ctx.inventory.find((it) => {
			return it.name == '誓言的烛台'
		});

		if (candle && playerinfo.nick.indexOf(candle.itemid.toString()) == -1) {
			cga.ChangeNickName(candle.itemid.toString())
			console.log('持有蜡烛:', candle.itemid)
		}

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param

		if (Object.prototype.toString.call(thisobj.param.solo) == '[object Object]') {
			if (!thisobj.param.solo.hasOwnProperty('battle') || !thisobj.param.solo.hasOwnProperty('boss')) {
				throw new Error('参数错误：如果要单人进行任务，solo对象必须包含battle、boss2个key，value为Boolean型。')
			}
			thisobj.data.soloBattle = true
		} else if ((!thisobj.param.hasOwnProperty('maleTeam') || !thisobj.param.hasOwnProperty('femaleTeam')) || (!thisobj.param.maleTeam instanceof Array || !thisobj.param.femaleTeam instanceof Array)) {
			throw new Error('参数错误：如果不是单人solo，则必须传入maleTeam与femaleTeam的String型数组，来表示男女队员（至少要填写队长名称，其余队员可以写名字，也可以写null改为自由组队），否则任务无法进行。')
		}

		// 获取性别，0女1男。
		thisobj.data.sex = cga.character.getCharacterInfo().sex

		if (thisobj.data.sex != 0 && thisobj.data.sex != 1) {
			throw new Error('性别数值错误，cga.character.getCharacterInfo()返回的性别必须是0或1。')
		}
		// 组队任务，获取自己的队伍
		if (!thisobj.data.soloBattle) {
			thisobj.param.teammates = thisobj.data.sex == 1 ? thisobj.param.maleTeam : thisobj.param.femaleTeam
		}

		// 判断自己是队长还是队员
		thisobj.data.isTeamLeader = thisobj.data.soloBattle || thisobj.param.teammates[0] == cga.GetPlayerInfo().name

		// 制作playerthink禁用队伍监测的坐标位置，在此位置1x1范围内，playerthink会忽视队伍变动
		thisobj.data.noTeamThinkObj = {
			400: [thisobj.data.sexObj.npcPos1[thisobj.data.sex],],
			14010: [thisobj.data.sexObj.buildTeamPos2[thisobj.data.sex],],
			24003: [thisobj.data.sexObj.layer1TeamPos[thisobj.data.sex], thisobj.data.sexObj.layer1NpcPos[thisobj.data.sex],],
			24004: [thisobj.data.sexObj.layer2TeamPos[thisobj.data.sex], thisobj.data.sexObj.layer2NpcPos[thisobj.data.sex],],
			24005: [thisobj.data.sexObj.layer3TeamPos[thisobj.data.sex], thisobj.data.sexObj.layer3NpcPos[thisobj.data.sex],],
		}

		// 重置昵称，用于监测男女队员就绪
		cga.ChangeNickName('')

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;