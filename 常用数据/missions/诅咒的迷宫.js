var thisobj = {
	taskName: '诅咒的迷宫',
	taskStages: [
		{
			intro: '0.任务准备。',
			workFunc: function (cb2) {
				thisobj.func.bankObj.prepare(() => {
					thisobj.func.healObj.func(() => {
						if (cga.findTitle('开启者')) {
							console.log('已经完成【开启者】(UD)任务，可以继续任务..')
							cb2(true)
						} else {
							throw new Error('错误，你没有完成开启者(UD)任务，脚本结束。')
						}
					})
				})
			}
		},
		{
			intro: '1.前往阿巴尼斯村民家（40.30）与历史学家雷伯尔森（14.10）对话，选“是”获得【野草莓】。',
			workFunc: function (cb2) {
				let go = () => {
					cga.travel.autopilot('民家', () => {
						let obj = { act: 'item', target: '野草莓', npcpos: [14, 10] }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				}

				cga.travel.toVillage('阿巴尼斯村', () => {
					// 如果是走路至杰诺瓦镇，还需要再次回补
					if (cga.needSupplyInitial({})) {
						cga.travel.toHospital(() => {
							go()
						});
						return;
					}
					go()
				})
			}
		},
		{
			intro: '2.与米希安（9.4）对话，交出【野草莓】并传送至民家地下。',
			workFunc: function (cb2) {
				let go = () => {
					let obj = { act: 'map', target: 4331, npcpos: [9, 4] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				}
				go()
			}
		},
		{
			intro: '3.调查连接时空的石盘（15.7），选“是”传送至民家地下。',
			workFunc: function (cb2) {
				let go = () => {
					let obj = { act: 'map', target: 4332, npcpos: [15, 7] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				}
				go()
			}
		},
		{
			intro: '4.与战士帕鲁凯斯（15.7）对话，获得【刀刃的碎片】。',
			workFunc: function (cb2) {
				let go = () => {
					let obj = { act: 'item', target: '刀刃的碎片', npcpos: [15, 7] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				}
				go()
			}
		},
		{
			intro: '5.通过（5.3）处楼梯至民家，与历史学家雷波雷翁（14.10）对话。通过（9.4）处楼梯返回民家地下。',
			workFunc: function (cb2) {
				let go = () => {
					cga.travel.autopilot(4333, () => {
						cga.travel.autopilot(4334, () => {
							cb2(true)
						})
					})
				}
				go()
			}
		},
		{
			intro: '6.调查连接时空的石盘（15.10），选“是”传送至民家地下。',
			workFunc: function (cb2) {
				let go = () => {
					let obj = { act: 'map', target: 4335, npcpos: [15, 10] }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				}
				go()
			}
		},
		{
			intro: '7.出阿巴尼斯村，前往莎莲娜岛（54.161）处，持有【刀刃的碎片】调查鼓动的石盘，交出【刀刃的碎片】传送至诅咒的迷宫。通过（35.9）处楼梯进入诅咒的迷宫。',
			workFunc: function (cb2) {
				let obj = { act: 'map', target: 24008, npcpos: thisobj.data.npcPos1, waitLocation: 402 }

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
						cga.travel.autopilot('出口', () => {
							cga.askNpcForObj(obj, () => {
								cb2(true)
							})
						})
					} else {
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					}
				}

				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.travel.autopilot('主地图', () => {
					cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: thisobj.data.buildTeamPos1 }, (r) => {
						if (r && r == 'ok') {
							go()
							return
						} else if (r && r == 'timeout') {// 如果超时，则结束任务。
							console.log('等待队员超时，结束任务。')
							cb2('jump', thisobj.taskStages.length)
							return
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
				})
			}
		},
		{
			intro: '8.诅咒的迷宫为固定迷宫，每10层一个关卡，需战胜BOSS或满足通关条件后方可通过。进入迷宫前先组队，并进入诅咒的迷宫内部。',
			workFunc: function (cb2) {
				let go = () => {
					if (thisobj.data.isTeamLeader) {
						cga.walkList([
							[35, 9, 24009],
						], () => {
							cb2(true)
						});
					} else {
						cga.waitForMap(24009, () => {
							cb2(true)
						})
					}
				}

				// 单人模式不组队
				if (thisobj.data.soloBattle) {
					go()
					return
				}

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: thisobj.data.buildTeamPos2 }, (r) => {
					if (r && r == 'ok') {
						go()
						return
					} else if (r && r == 'timeout') {// 如果超时，则结束任务。
						console.log('等待队员超时，结束任务。')
						cb2('jump', thisobj.taskStages.length)
						return
					} else {
						throw new Error('cga.buildTeam返回类型错误')
					}
				})
			}
		},
		{
			/**
			 * 一个workFunc直接走完所有迷宫
			 * 每个BOSS房间对应的跳关技能(8级或以上)：
			 * 1、精灵的盟约、调教或宠物强化
			 * 2、四属性攻击魔法（单体/强力/超强）、吸血魔法
			 * 3、乾坤一掷、连击、诸刃、阳炎、乱射、暗杀、反击、护卫、气功弹、战栗袭心、明镜止水、混乱攻击或圣盾
			 * 4、气绝回复、洁净魔法、补血类魔法（单体/强力/超强）或恢复类魔法（单体/强力/超强）
			 * 5、各种状态变化魔法（单体/强力/超强）、各种状态抵抗或各种制御魔法
			 * 6、最终BOSS，不可以跳过
			 */
			intro: '9.走迷宫，并且过5位BOSS。脚本可以在任意时刻中断并重新执行。',
			workFunc: function (cb2) {
				// 任务战斗模式
				if (thisobj.data.soloBattle) {
					thisobj.func.configMode.manualLoad('战斗赶路');
				} else {
					thisobj.func.configMode.func('节能模式');
				}
				// 开启任务playerThink
				cb2('playerThink on')

				// 一个循环，解决整个诅咒的迷宫逻辑
				let loop = () => {
					let mapindex = cga.GetMapIndex().index3
					// 如果进入双王(第6个难关)战斗胜利房间，循环结束
					if (mapindex == 24068) {
						console.log('BOSS战胜利，进入下一步..')
						cb2(true)
						return
					}

					// 获取下一个BOSS房间的数据
					let nextStageObj = thisobj.func.getNextStageObj(mapindex)
					/**
					 * 抵达目标地点时的动作callback
					 * 成功判定标准：
					 * 1、抵达战斗胜利的房间。
					 * 2、持有8级的跳转技能，跳转至下一个10个楼层的第一个index。例：从第一个BOSS房间index24018跳至第11层index24019
					 */
					let callbackArr = [
						{
							moving: true,
							mapindex: nextStageObj.successIndex,
							cb: () => {
								setTimeout(loop, 1000);
								return true;
							}
						},
						{
							moving: true,
							mapindex: nextStageObj.bossRoomIndex + 1,
							cb: () => {
								setTimeout(loop, 1000);
								return true;
							}
						},
						{
							moving: true,
							mapindex: 24068,
							cb: () => {
								setTimeout(cb2, 1000,true);
								return true;
							}
						}
					];

					let bossFunc = ()=>{
						// 为队长在BOSS面前调整全队位置预留出时间，延迟对话
						setTimeout(() => {
							cga.turnTo(nextStageObj.bossPos[0], nextStageObj.bossPos[1]);
							cga.AsyncWaitNPCDialog((err)=>{
								if(cga.isInBattle()){
									return;
								}
								if(err){
									return;
								}
								cga.ClickNPCDialog(1, 0);
							});
							cga.waitForMultipleLocation(callbackArr);
							
						}, 3000);
					}

					let waitFunc = (counter)=>{

						if(cga.GetMapIndex().index3 != nextStageObj.bossRoomIndex)
						{
							cga.waitForMultipleLocation(callbackArr);
							return;
						}
		
						if(counter == 0){
							bossFunc();
							return;
						} else if(counter == 5){
							cga.SayWords("倒计时5秒！", 0, 3, 1);
						} else if(counter == 10){
							cga.SayWords("倒计时10秒！", 0, 3, 1);
						}
						
						setTimeout(waitFunc, 1000, counter-1);
					}

					// 如果在BOSS房间
					if(mapindex == nextStageObj.bossRoomIndex){
						// 单挑BOSS模式 TODO BOSS战斗配置自适应
						if(thisobj.data.soloBoss){
							cga.walkList(thisobj.func.getPath(mapindex,true), () => {
								if(thisobj.func.getSkipSkill(nextStageObj)){
									bossFunc();
									return;
								}
								setTimeout(waitFunc, 1000, 15);
							});
							return
						}else{// 组队群殴BOSS模式
							let teamplayers = cga.getTeamPlayers()
							if(!teamplayers.length){
								cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: thisobj.data.stage[mapindex].bossRoomBuildTeamPos }, (r) => {
									if (r && r == 'ok') {
										loop()
										return
									} else if (r && r == 'timeout') {// 如果超时，则结束任务。
										console.log('等待队员超时，结束任务。')
										cb2('jump', thisobj.taskStages.length)
										return
									} else {
										throw new Error('cga.buildTeam返回类型错误')
									}
								})
								return
							}
							if (teamplayers[0].name == cga.GetPlayerInfo().name) {
								cga.walkList(thisobj.func.getPath(mapindex,true), () => {
									let words = '抵达BOSS面前，队伍中持有' + nextStageObj.skipWords + '8级或以上技能的人与BOSS对话，直接跳过BOSS战。倒计时15秒后视为全队无一人满足技能要求，与BOSS对话进入战斗。'
									cga.sayLongWords(words, 0, 3, 1);
									if(thisobj.func.getSkipSkill(nextStageObj)){
										bossFunc();
										return;
									}
									setTimeout(waitFunc, 1000, 15);
								});
							} else {
								cga.waitForMultipleLocation(callbackArr.concat({
									mapindex: nextStageObj.bossRoomIndex, 
									pos:nextStageObj.bossPos, 
									cb : ()=>{
										if(thisobj.func.getSkipSkill(nextStageObj)){
											bossFunc();
											return true;
										}
										
										return false;
									}
								}));
							}
						}
					}else{// 如果在赶路
						// 单人逃跑模式
						if(thisobj.data.soloBattle){
							if(cga.getTeamPlayers().length){
								console.log('你选择单人赶路，解散队伍并继续逻辑..')
								cga.disbandTeam(loop)
								return
							}

							cga.walkList(thisobj.func.getPath(mapindex), loop);
						}else{// 组队战斗模式
							if (thisobj.data.isTeamLeader) {
								cga.walkList(thisobj.func.getPath(mapindex), loop);
							} else {
								cga.waitForMultipleLocation(callbackArr.concat({
									mapindex: nextStageObj.bossRoomIndex, 
									pos:nextStageObj.bossPos, 
									cb : ()=>{
										if(thisobj.func.getSkipSkill(nextStageObj)){
											bossFunc();
											return true;
										}
										
										return false;
									}
								}));
							}
						}
					}
				}

				loop()
			}
		},
		{
			intro: '10.抵达第六个难关，调查封印石（24.19）进入战斗。',
			workFunc: function (cb2) {
				let mapindex = cga.GetMapIndex().index3
				let nextStageObj = thisobj.func.getNextStageObj(mapindex)
				let go = () => {

					// 调整战斗配置
					thisobj.func.loadBattleConfig()

					let obj = { act: 'map', target: nextStageObj.successIndex, npcpos: nextStageObj.bossPos, waitLocation: nextStageObj.bossRoomIndex }
					cga.askNpcForObj(obj, () => {
						cb2(true)
					})
				}

				if(thisobj.data.soloBoss){
					go()
					return
				}else{
					cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 300000, pos: thisobj.data.stage[mapindex].bossRoomBuildTeamPos }, (r) => {
						if (r && r == 'ok') {
							go()
							return
						} else if (r && r == 'timeout') {// 如果超时，则结束任务。
							console.log('等待队员超时，结束任务。')
							cb2('jump', thisobj.taskStages.length)
							return
						} else {
							throw new Error('cga.buildTeam返回类型错误')
						}
					})
				}
			}
		},
		{
			intro: '11.战斗胜利后与神官贝米乌斯（21.12）对话，获得晋阶资格并传送至莎莲娜岛，任务完结。',
			workFunc: function(cb2){
				// 任务NPC
				let obj1 = { act: 'map', target: 402, npcpos: [21, 12] }
				// 香蒂的房间，注意：不同的BOSS，香蒂房间的mapindex不同，这也解释了为什么购买的图纸不一样。
				let obj2 = { act: 'map', target: 5014, npcpos: [21, 26] }
				// 香蒂
				let obj3 = { act: 'map', target: 402, npcpos: [10, 6] }
				// 朵葡
				let obj4 = { act: 'map', target: 402, npcpos: [10, 7] }
				// 香蒂的房间返回任务房间NPC
				let obj5 = { act: 'map', target: 24074, npcpos: [8, 4] }

				cga.disbandTeam(() => {
					cga.askNpcForObj(obj1, () => {
						thisobj.func.dropUseless([],() => {
							cga.refreshMissonStatus({'诅咒的迷宫' : true},()=>{
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
			return false
		},
		function () {//1.前往阿巴尼斯村民家（40.30）与历史学家雷伯尔森（14.10）对话，选“是”获得【野草莓】。
			return cga.getItemCount('野草莓') > 0
		},
		function () {//2.与米希安（9.4）对话，交出【野草莓】并传送至民家地下。
			return cga.GetMapIndex().index3 == 4331
		},
		function () {//3.调查连接时空的石盘（15.7），选“是”传送至民家地下。
			return cga.GetMapIndex().index3 == 4332
		},
		function () {//4.与战士帕鲁凯斯（15.7）对话，获得【刀刃碎片】。
			return cga.getItemCount('刀刃的碎片') > 0 && cga.GetMapIndex().index3 == 4332
		},
		function () {//5.通过（5.3）处楼梯至民家，与历史学家雷波雷翁（14.10）对话。通过（9.4）处楼梯返回民家地下。
			return cga.GetMapIndex().index3 == 4334
		},
		function () {//6.调查连接时空的石盘（15.10），选“是”传送至民家地下。
			let item = cga.getItemCount('刀刃的碎片')
			if(item == 0){
				return false
			}
			let mapindex = cga.GetMapIndex().index3
			if(mapindex == 4300 || mapindex == 4320 || mapindex == 4335){
				return true
			}
			return false
		},
		function () {//7.出阿巴尼斯村，前往莎莲娜岛（54.161）处，持有【刀刃的碎片】调查鼓动的石盘，交出【刀刃的碎片】传送至诅咒的迷宫。通过（35.9）处楼梯进入诅咒的迷宫。
			return cga.GetMapIndex().index3 == 24008
		},
		function () {//8.诅咒的迷宫为固定迷宫，每10层一个关卡，需战胜BOSS或满足通关条件后方可通过。进入迷宫前先组队，并进入诅咒的迷宫内部。
			let mapindex = cga.GetMapIndex().index3
			return (mapindex > 24008 && mapindex < 24067) || (mapindex > 24068 && mapindex < 24074)
		},
		function () {//9.走迷宫，并且过5位BOSS。脚本可以在任意时刻中断并重新执行。
			let mapindex = cga.GetMapIndex().index3
			return mapindex == 24068
		},
		function () {//10.抵达第六个难关，调查封印石（24.19）进入战斗。
			let mapindex = cga.GetMapIndex().index3
			return mapindex == 24074
		},
		function () {//11.战斗胜利后与神官贝米乌斯（21.12）对话，获得晋阶资格并传送至莎莲娜岛，任务完结。
			return false
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		preparePos: [],
		// 阿巴尼斯村组队坐标
		buildTeamPos1: [40, 32],
		// 诅咒的迷宫组队坐标
		buildTeamPos2: [8, 8],
		// 莎莲娜鼓动的石盘
		npcPos1: [54, 161],
		// 任务普通战斗组队开关，true则组队战斗，false则单人逃跑。
		soloBattle: false,
		// 任务BOSS战斗组队开关，true则组队战斗，false则单挑BOSS。
		soloBoss: false,
		// 诅咒的迷宫walklist列表，用于自动索引寻路
		path: {
			24009: [[25, 13, '诅咒的迷宫 地下2楼'],],
			24010: [[17, 4, '诅咒的迷宫 地下3楼'],],
			24011: [[23, 20, '诅咒的迷宫 地下4楼'],],
			24012: [[16, 10, '诅咒的迷宫 地下5楼'],],
			24013: [[6, 3, '诅咒的迷宫 地下6楼'],],
			24014: [[15, 3, '诅咒的迷宫 地下7楼'],],
			24015: [[25, 18, '诅咒的迷宫 地下8楼'],],
			24016: [[14, 18, '诅咒的迷宫 地下9楼'],],
			24017: [[24, 4, '第一个难关'],],
			24018: [[22, 15], [21, 15], [22, 15], [21, 15], [22, 15],],
			24019: [[15, 4, '诅咒的迷宫 地下12楼'],],
			24020: [[24, 15, '诅咒的迷宫 地下13楼'],],
			24021: [[16, 3, '诅咒的迷宫 地下14楼'],],
			24022: [[25, 12, '诅咒的迷宫 地下15楼'], [17, 18, '诅咒的迷宫 地下15楼'],],
			24023: [[22, 5, '诅咒的迷宫 地下16楼'], [25, 21, '诅咒的迷宫 地下16楼'],],
			24024: [[17, 18, '诅咒的迷宫 地下17楼'], [22, 18, '诅咒的迷宫 地下17楼'],],
			24025: [[23, 4, '诅咒的迷宫 地下18楼'],],
			24026: [[7, 12, '诅咒的迷宫 地下19楼'],],
			24027: [[18, 18, '第二个难关']],
			24028: [[25, 17], [25, 18], [25, 17], [25, 18], [25, 17],],
			24029: [[20, 3, '诅咒的迷宫 地下22楼'], [14, 12, '诅咒的迷宫 地下22楼'],],
			24030: [[7, 4, '诅咒的迷宫 地下23楼'], [17, 12, '诅咒的迷宫 地下23楼'],],
			24031: [[14, 12, '诅咒的迷宫 地下24楼'],[27, 2, '诅咒的迷宫 地下24楼'],],
			24032: [[7, 20, '诅咒的迷宫 地下25楼'],],
			24033: [[24, 20, '诅咒的迷宫 地下26楼'],],
			24034: [[17, 5, '诅咒的迷宫 地下27楼'], [25, 21, '诅咒的迷宫 地下27楼'],],
			24035: [[9, 11, '诅咒的迷宫 地下28楼'], [23, 16, '诅咒的迷宫 地下28楼'],],
			24036: [[25, 21, '诅咒的迷宫 地下27楼'],[16, 12, '诅咒的迷宫 地下29楼'],],
			24037: [[7, 1, '第三个难关']],
			24038: [[20, 20], [19, 20], [20, 20], [19, 20], [20, 20],],
			24039: [[24, 13, '诅咒的迷宫 地下32楼'],],
			24040: [[15, 12, '诅咒的迷宫 地下33楼'], [23, 4, '诅咒的迷宫 地下33楼'],],
			24041: [[24, 12, '诅咒的迷宫 地下34楼'], [6, 13, '诅咒的迷宫 地下34楼'],],
			24042: [[23, 4, '诅咒的迷宫 地下33楼'],[9, 21, '诅咒的迷宫 地下35楼'],],
			24043: [[6, 13, '诅咒的迷宫 地下36楼'],],
			24044: [[9, 21, '诅咒的迷宫 地下37楼'],],
			24045: [[24, 21, '诅咒的迷宫 地下38楼'],],
			24046: [[8, 21, '诅咒的迷宫 地下39楼'],],
			24047: [[23, 25, '第四个难关']],
			24048: [[16, 18], [16, 17], [16, 18], [16, 17], [16, 18],],
			24049: [[8, 18, '诅咒的迷宫 地下42楼'],],
			24050: [[24, 21, '诅咒的迷宫 地下43楼'],],
			24051: [[23, 4, '诅咒的迷宫 地下44楼'],],
			24052: [[24, 21, '诅咒的迷宫 地下45楼'],],
			24053: [[26, 9, '诅咒的迷宫 地下46楼'],],
			24054: [[9, 2, '诅咒的迷宫 地下47楼'],],
			24055: [[22, 3, '诅咒的迷宫 地下48楼'],],
			24056: [[17, 12, '诅咒的迷宫 地下49楼'],],
			24057: [[9, 2, '第五个难关']],
			24058: [[22, 15], [21, 15], [22, 15], [21, 15], [22, 15],],
			24059: [[25, 23, '诅咒的迷宫 地下52楼'],],
			24060: [[23, 4, '诅咒的迷宫 地下53楼'], ],
			24061: [[25, 23, '诅咒的迷宫 地下54楼'], [15, 5, '诅咒的迷宫 地下54楼'],],
			24062: [[23, 4, '诅咒的迷宫 地下55楼'], [13, 14, '诅咒的迷宫 地下53楼'], [15, 11, '诅咒的迷宫 地下55楼'],],
			24063: [[19, 17, '诅咒的迷宫 地下54楼'],[15, 8, '诅咒的迷宫 地下56楼'],],
			24064: [[25, 12, '诅咒的迷宫 地下57楼'], ],
			24065: [[23, 3, '诅咒的迷宫 地下58楼'], [13, 15, '诅咒的迷宫 地下58楼'],],
			24066: [[20, 15, '诅咒的迷宫 地下59楼'],[18, 25, '诅咒的迷宫 地下57楼'],],
			24067: [[8, 13, '第六个难关']],
			24069: [[31, 30, '诅咒的迷宫 地下11楼']],
			24070: [[30, 5, '诅咒的迷宫 地下21楼']],
			24071: [[20, 28, '诅咒的迷宫 地下31楼']],
			24072: [[29, 26, '诅咒的迷宫 地下41楼']],
			24073: [[24, 4, '诅咒的迷宫 地下51楼']],
		},
		// BOSS房间各种信息，按照第123456难关顺序
		stage: {
			24018: {
				bossRoomIndex: 24018,
				successIndex: 24069,
				skipSkill: [
					'精灵的盟约',
					'调教',
					'宠物强化',
				],
				skipWords : '精灵的盟约、调教或宠物强化',
				bossRoomBuildTeamPos: [23, 4],
				bossPos: [22, 14],
			},
			24028: {
				bossRoomIndex: 24028,
				successIndex: 24070,
				skipSkill: [
					'陨石魔法',
					'冰冻魔法',
					'火焰魔法',
					'风刃魔法',
					'强力陨石魔法',
					'强力冰冻魔法',
					'强力火焰魔法',
					'强力风刃魔法',
					'超强陨石魔法',
					'超强冰冻魔法',
					'超强火焰魔法',
					'超强风刃魔法',
					'吸血魔法',
				],
				skipWords : '四属性攻击魔法（单体/强力/超强）、吸血魔法',
				bossRoomBuildTeamPos: [17, 26],
				bossPos: [26, 17],
			},
			24038: {
				bossRoomIndex: 24038,
				successIndex: 24071,
				skipSkill: [
					'乾坤一掷',
					'连击',
					'诸刃',
					'阳炎',
					'乱射',
					'暗杀',
					'反击',
					'护卫',
					'气功弹',
					'战栗袭心',
					'明镜止水',
					'混乱攻击',
					'圣盾'
				],
				skipWords : '乾坤一掷、连击、诸刃、阳炎、乱射、暗杀、反击、护卫、气功弹、战栗袭心、明镜止水、混乱攻击或圣盾',
				bossRoomBuildTeamPos: [11, 6],
				bossPos: [20, 21],
			},
			24048: {
				bossRoomIndex: 24048,
				successIndex: 24072,
				skipSkill: [
					'补血魔法',
					'强力补血魔法',
					'超强补血魔法',
					'恢复魔法',
					'强力恢复魔法',
					'超强恢复魔法',
					'气绝回复',
					'洁净魔法',
				],
				skipWords : '气绝回复、洁净魔法、补血类魔法（单体/强力/超强）或恢复类魔法（单体/强力/超强）',
				bossRoomBuildTeamPos: [20, 26],
				bossPos: [15, 18],
			},
			24058: {
				bossRoomIndex: 24058,
				successIndex: 24073,
				skipSkill: [
					, '攻击反弹'
					, '攻击无效'
					, '攻击吸收'
					, '魔法反弹'
					, '魔法无效'
					, '魔法吸收'
					, '中毒魔法'
					, '强力中毒魔法'
					, '超强中毒魔法'
					, '石化魔法'
					, '强力石化魔法'
					, '超强石化魔法'
					, '昏睡魔法'
					, '强力昏睡魔法'
					, '超强昏睡魔法'
					, '酒醉魔法'
					, '强力酒醉魔法'
					, '超强酒醉魔法'
					, '混乱魔法'
					, '强力混乱魔法'
					, '超强混乱魔法'
					, '遗忘魔法'
					, '强力遗忘魔法'
					, '超强遗忘魔法'
					, '抗毒'
					, '抗昏睡'
					, '抗混乱'
					, '抗酒醉'
					, '抗石化'
					, '抗遗忘'
				],
				skipWords : '各种状态变化魔法（单体/强力/超强）、各种状态抵抗或各种制御魔法',
				bossRoomBuildTeamPos: [10, 4],
				bossPos: [22, 14],
			},
			24068: {// 最终BOSS凯法+帕布提斯马，不能跳过
				bossRoomIndex: 24068,
				successIndex: 24074,
				skipSkill: [],
				bossRoomBuildTeamPos: [13, 18],
				bossPos: [24, 19],
			},
		}
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取魔币.js'),
		healObj: require('../../通用挂机脚本/公共模块/治疗和招魂.js'),
		configMode: require('../../通用挂机脚本/公共模块/读取战斗配置.js'),
		loadBattleConfig : ()=>{
			let jobObj = cga.job.getJob()
			if(jobObj.job == '传教士'){
				cga.loadBattleConfig('BOSS传教')
			}else{
				cga.loadBattleConfig('BOSS合击血量高')
			}
		},
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
		// 获取需要继续走的路径
		getPath: (mapindex,isBossRoom) => {
			let xy = cga.GetMapXY()
			let pathObj = thisobj.data.path[mapindex]

			if(isBossRoom){
				return pathObj
			}

			for (let i = 0; i < pathObj.length; i++) {
				if (cga.isPathAvailable(xy.x, xy.y, pathObj[i][0], pathObj[i][1])) {
					return [pathObj[i]]
				}
			}
			// 如果没有路径需要走，由于返回结果需要给walklist运行，所以返回空数组而不是null
			return []
		},
		// 走迷宫，其实诅咒的迷宫不是随机迷宫，而是固定地图。
		walkMaze: (targetIndex, cb) => {
			let mapindex = cga.GetMapIndex().index3
			if (mapindex == targetIndex) {
				setTimeout(cb, 1000);
				return
			}

			if (thisobj.data.isTeamLeader) {
				let path = thisobj.func.getPath(mapindex)
				cga.walkList(path, () => {
					setTimeout(thisobj.func.walkMaze, 1000, targetIndex, cb);
				});
			} else {
				cga.waitForMap(targetIndex, () => {
					setTimeout(cb, 1000);
				})
			}
			return
		}, getSkipSkill: (stageObj) => {
			let ignoreBattle = cga.GetSkillsInfo().find((s) => {
				if (stageObj.skipSkill.indexOf(s.name) != -1 && s.lv >= 8) {
					return true
				}
				return false
			})
			return ignoreBattle
		}, getNextStageObj: (mapindex) => {
			if (mapindex == 24069) {
				return thisobj.data.stage[24028]
			} else if (mapindex == 24070) {
				return thisobj.data.stage[24038]
			} else if (mapindex == 24071) {
				return thisobj.data.stage[24048]
			} else if (mapindex == 24072) {
				return thisobj.data.stage[24058]
			} else if (mapindex == 24073) {
				return thisobj.data.stage[24068]
			}

			let keys = Object.keys(thisobj.data.stage)
			for (let k = 0; k < keys.length; k++) {
				if (mapindex <= keys[k]) {
					return thisobj.data.stage[keys[k]]
				}
			}
			return null
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
		if (index == 24074) {
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

		return true
	},
	doTask: (param, cb) => {
		// 接受外部传入的参数
		thisobj.param = param
		// 判断任务是否指定小怪逃跑或者BOSS单挑
		if (Object.prototype.toString.call(thisobj.param.solo) == '[object Object]') {
			if (!thisobj.param.solo.hasOwnProperty('battle') || !thisobj.param.solo.hasOwnProperty('boss')) {
				throw new Error('参数错误：如果要单人进行任务，solo对象必须包含battle、boss2个key，value为Boolean型。')
			}
			if (thisobj.param.solo.battle === true){
				thisobj.data.soloBattle = true
			}
			if (thisobj.param.solo.boss === true){
				thisobj.data.soloBoss = true
			}
		}

		if(thisobj.data.soloBattle && thisobj.data.soloBoss){
			console.log('你指定了此任务：普通小怪逃跑，BOSS战单挑的逻辑，本任务全程省略组队逻辑。')
		} else if (!thisobj.param.hasOwnProperty('teammates') || !thisobj.param.teammates instanceof Array) {
			throw new Error('参数错误：teammates。队伍成员必须在外部传入，否则无法执行逻辑。')
		}
		
		// 判断自己是队长还是队员
		thisobj.data.isTeamLeader = thisobj.data.soloBattle || thisobj.param.teammates[0] == cga.GetPlayerInfo().name

		// 制作playerthink禁用队伍监测的坐标位置，在此位置1x1范围内，playerthink会忽视队伍变动
		thisobj.data.noTeamThinkObj = {
			402: [thisobj.data.npcPos1,],
			24008: [thisobj.data.buildTeamPos2,],
		}

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		task.doTask(cb)
		return
	},
};

module.exports = thisobj;