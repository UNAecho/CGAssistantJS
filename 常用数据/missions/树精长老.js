var thisobj = {
	taskName: '树精长老',
	taskStages: [
		{
			intro: '0.任务准备。',
			workFunc: function (cb2) {
				thisobj.func.bankObj.prepare(() => {
					thisobj.func.healObj.func(() => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '1.前往维诺亚村医院（61.53）与佣兵艾里克（7.5）对话，选“是”获得【火把】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: '火把', npcpos: [7, 5] }

				let go = () => {
					cga.travel.autopilot('医院', () => {
						cga.askNpcForObj(obj, () => {
							// 考虑到万一有角色可能是徒步赶来，超时时间设置成10分钟
							cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 600000, pos: [5, 8] }, (r) => {
								if (r && r == 'ok') {
									cb2(true)
									return
								} else if (r && r == 'timeout') {// 如果超时，则结束任务。
									console.log('等待队员超时，结束任务。')
									// 任务道具也一并丢弃
									thisobj.func.dropUseless(['火把'], () => {
										cb2('jump', thisobj.taskStages.length)
									})
									return
								} else {
									throw new Error('cga.buildTeam返回类型错误')
								}
							})
						})
					})
				}

				cga.travel.toVillage('维诺亚村', () => {
					// 如果是徒步走到村镇，还需要再次回补
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
			intro: '2.出维诺亚村向北行走至芙蕾雅岛（380.353）处，进入布满青苔的洞窟。通过随机迷宫抵达叹息之森林。',
			workFunc: function (cb2) {

				// 任务战斗模式
				thisobj.func.configMode.func('节能模式');
				// 开启任务playerThink
				cb2('playerThink on')
				cga.travel.autopilot('东门', () => {
					cga.findAndWalkMaze(thisobj.data.maze.name, thisobj.data.maze.exitMap, () => {
						cb2(true)
					})
				})
			}
		},
		{
			intro: '3.与树精长老（29.13）对话，交出【火把】进入战斗。',
			workFunc: function (cb2) {
				// 任务战斗模式
				thisobj.func.configMode.func('节能模式');

				let obj = {
					act: 'map', target: 15508, npcpos: [29, 13], waitLocation: thisobj.data.maze.exitMap, notalk: () => {
						// 仅队长对话
						if (!thisobj.data.isTeamLeader) {
							return true
						}
						return false
					}
				}

				cga.askNpcForObj(obj, () => {
					cb2(true)
				})
			}
		},
		{
			intro: '4.战斗胜利后传送至叹息森林，队伍中随机1人获得【艾里克的大剑】。与年轻树精（26.12）对话，获得【树苗？】。',
			workFunc: function (cb2) {
				cga.disbandTeam(() => {
					/**
					 * 任务支线道具：艾里克的大剑。
					 * 前往维诺亚村医院与佣兵艾里克对话，交出【艾里克的大剑】获得【贤者的戒指】
					 * 【贤者的戒指】：Lv.3戒指、耐久130~150；敏捷+3~5、精神+3~5；不可交易、丢地消失
					 * 
					 * 没有啥用，丢弃。
					 */
					thisobj.func.dropUseless(['艾里克的大剑', '磨刀石'], () => {
						// 如果已经一转以上，则视为陪打，结束任务。
						// 由于任务初始化执行了cga.refreshMissonStatus，所以cga.loadPlayerConfig().mission必然有数据支撑逻辑判断。
						if (cga.loadPlayerConfig().mission[thisobj.taskName]) {
							console.log('你已经一转或以上，结束任务。')
							cb2('jump', thisobj.taskStages.length)
							return
						}

						let obj = { act: 'item', target: '树苗？', npcpos: [26, 12] }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
				})
			}
		},
		{
			intro: '5.前往法兰城凯蒂夫人的店（196.78）与凯蒂夫人（15.12）对话，交出30G将【树苗？】鉴定为【生命之花】。',
			workFunc: function (cb2) {
				cga.travel.falan.toKatieStore(() => {
					cga.walkList([
						[15, 12],
					], () => {
						var itemArray = cga.findItemArray('树苗？');
						cga.turnTo(16, 12);
						cga.AsyncWaitNPCDialog(() => {
							cga.SellNPCStore(itemArray);
							cga.AsyncWaitNPCDialog(() => {
								cb2(true);
							});
						});
					});
				});
			}
		},
		{
			intro: '6.前往维诺亚村村长的家（40.36）与村长卡丹（16.7）对话，选“是”交出【生命之花】获得晋阶资格，任务完结。',
			workFunc: function (cb2) {
				cga.travel.toVillage('维诺亚村', () => {
					cga.travel.autopilot('村长的家', () => {
						// 这里如果曾经交过生命之花，但未晋级时，会卡住，因为村长会说和任务之前一样的话【大自然】【土地】等等
						cga.walkList([
							[15, 8],
						], () => {
							cga.turnTo(16, 7);
							cga.AsyncWaitNPCDialog((err, dlg) => {
								if (dlg) {
									if (dlg.message.indexOf('大自然') != -1 && cga.getItemCount('生命之花') >= 1) {
										console.log('你已经交过生命之花了，具备晋级资格，丢弃【生命之花】，任务结束。')

										let item = cga.findItem('生命之花')
										if (item != -1) {
											cga.DropItem(item);
										}

										cga.refreshMissonStatus({ '树精长老': true }, () => {
											cb2(true)
										})
										return
									} else if (dlg.message.indexOf('给我') != -1) {
										cga.ClickNPCDialog(4, 0);
										cga.AsyncWaitNPCDialog(() => {
											cga.refreshMissonStatus({ '树精长老': true }, () => {
												cb2(true)
											})
										});
									}
								}
							});
						});
					})
				})
			}
		},
	],
	taskRequirements: [//任务阶段是否完成
		function () {
			return false;
		},
		function () {
			return (cga.getItemCount('火把') >= 1 && cga.getTeamPlayers().length > 0) ? true : false;
		},
		function () {
			return (cga.GetMapName() == '叹息之森林') ? true : false;
		},
		function () {
			return (cga.GetMapIndex().index3 == 15508) ? true : false;
		},
		function () {
			return (cga.getItemCount('树苗？') >= 1) ? true : false;
		},
		function () {
			return (cga.getItemCount('生命之花') >= 1) ? true : false;
		},
		function () {
			return false;
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		maze: cga.mazeInfo['布满青苔的洞窟'],
	},
	func: {// 任务自定义函数
		bankObj: require('../../通用挂机脚本/子插件/自动存取.js'),
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
		}
	},
	taskPlayerThink: () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo();
		let teamplayers = cga.getTeamPlayers()
		// let items = cga.GetItemsInfo();
		let index = cga.GetMapIndex().index3

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			teamplayers: teamplayers,
			// inventory: items.filter((item) => {
			// 	return item.pos >= 8 && item.pos < 100;
			// }),
			// equipment: items.filter((item) => {
			// 	return item.pos >= 0 && item.pos < 8;
			// }),
			result: null,
		}

		if (index == thisobj.data.maze.exitMap) {
			console.log('抵达迷宫出口，playerthink结束..')
			return false
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		if (ctx.teamplayers.length != thisobj.param.teammates.length) {
			console.log('队伍与预设值', thisobj.param.teammates, '不符，中断任务')
			return function (cb) {
				// 返回任务的第index步
				cb(0)
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

		if (!thisobj.param.hasOwnProperty('teammates') || !thisobj.param.teammates instanceof Array) {
			throw new Error('参数错误：teammates。队伍成员必须在外部传入，否则无法执行逻辑。')
		}

		// 判断队长队员
		thisobj.data.isTeamLeader = thisobj.param.teammates[0] == cga.GetPlayerInfo().name

		// 逃跑赶路
		cga.loadBattleConfig('战斗赶路')

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;

		// 任务初始化，刷新角色的晋级任务状态
		cga.refreshMissonStatus(null, () => {
			task.doTask(cb)
		})
		return
	},
};

module.exports = thisobj;