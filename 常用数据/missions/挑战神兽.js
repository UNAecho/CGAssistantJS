var thisobj = {
	taskName: '挑战神兽',
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
			intro: '1.前往杰诺瓦镇医院（44.33）2楼与神官比尔班（11.4）对话，获得【贝兹雷姆之钥】。',
			workFunc: function (cb2) {
				let obj = { act: 'item', target: '贝兹雷姆之钥', npcpos: [11, 4] }

				let go = () => {
					cga.travel.autopilot('医院2楼', () => {
						cga.askNpcForObj(obj, () => {
							// 考虑到万一有角色可能是徒步至杰诺瓦镇，超时时间设置成10分钟
							cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 600000, pos: [11, 6] }, (r) => {
								if (r && r == 'ok') {
									cb2(true)
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
					})
				}

				cga.travel.toVillage('杰诺瓦镇', () => {
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
			intro: '2.出杰诺瓦镇西门，前往莎莲娜岛（135.333）处与神官杰拉娜对话，交出【贝兹雷姆之钥】传送至入口',
			workFunc: function (cb2) {
				let obj = { act: 'map', target: '入口', npcpos: [135, 333], waitLocation: 400 }

				let buildTeam = () => {
					cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: [25, 19] }, (r) => {
						if (r && r == 'ok') {
							cb2(true)
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

				let go = () => {
					// 任务战斗模式
					thisobj.func.configMode.func('节能模式');
					// 开启任务playerThink
					cb2('playerThink on')

					if (cga.GetMapIndex().index3 == 16510) {
						buildTeam()
						return
					}

					cga.askNpcForObj(obj, () => {
						buildTeam()
					})
				}

				let prepare = () => {
					if (thisobj.data.isTeamLeader) {
						cga.travel.autopilot('西门', () => {
							go()
						})
					} else {
						go()
					}

				}

				if (cga.travel.isInVillage() && cga.needSupplyInitial({})) {
					cga.travel.toHospital(() => {
						cb2('restart stage');
					});
					return;
				}

				prepare()
			}
		},
		{
			intro: '3.打鳞片环节。全员收集鳞片，并与神官葛雷森（26.67）对话，选“是”交出【地龙的鳞片】并通过栅栏。',
			workFunc: function (cb2) {

				// 任务战斗模式
				thisobj.func.configMode.func('节能模式');
				// 开启任务playerThink
				cb2('playerThink on')

				// 如果playerthink监测到全队已经集齐了鳞片
				if (thisobj.data.allDone) {
					cga.findAndWalkMaze(thisobj.data.maze.name, thisobj.data.maze.exitMap, () => {
						let obj = { act: 'map', target: thisobj.data.maze.exitMap, npcpos: [26, 67], pos: [26, 65], waitLocation: thisobj.data.maze.exitMap }
						cga.askNpcForObj(obj, () => {
							cb2(true)
						})
					})
					return
				}
				// 输入99层，利用API特殊性质，抵达迷宫出口水晶处刷鳞片
				cga.findAndWalkMaze(thisobj.data.maze.name, 99, () => {
					if (thisobj.data.isTeamLeader) {
						let xy = cga.GetMapXY()
						cga.freqMove(cga.getRandomSpaceDir(xy.x, xy.y))
					}
					console.log('开始刷鳞片..')
				})
			}
		},
		{
			intro: '4.与神兽史雷普尼尔（26.25）对话进入战斗。',
			workFunc: function (cb2) {
				// 任务战斗模式
				thisobj.func.configMode.func('节能模式');

				cga.buildTeam({ teammates: thisobj.param.teammates, timeout: 60000, pos: [26, 64] }, (r) => {
					if (r && r == 'ok') {

						let obj = {
							act: 'map', target: 16512, npcpos: [26, 25], waitLocation: 16511, notalk: () => {
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
			intro: '5.由静谧之间(index 16512)（26.12）处进入咒缚之帐(index 16513)与邪灵鸟人（14.14）对话2次，任务完结。',
			workFunc: function (cb2) {
				cga.disbandTeam(() => {
					thisobj.func.dropUseless(['刀的饰物','魔族的水晶','誓言之证'],() => {
						cga.travel.autopilot('咒缚之帐', () => {
							let obj = { act: 'msg', target: '再睡一阵子', npcpos: [14, 14] }
							cga.askNpcForObj(obj, () => {
								cga.refreshMissonStatus({'挑战神兽' : true},()=>{
									cb2(true)
								})
							})
						})
					})
				})
			}
		}
	],
	taskRequirements: [//任务阶段是否完成
		function () {// 0.任务准备。
			return false;
		},
		function () {// 1.前往杰诺瓦镇医院（44.33）2楼与神官比尔班（11.4）对话，获得【贝兹雷姆之钥】。
			return (cga.travel.switchMainMap() == '杰诺瓦镇' && cga.getTeamPlayers().length == 2 && cga.getItemCount('贝兹雷姆之钥') >= 1) ? true : false;
		},
		function () {// 2.出杰诺瓦镇西门，前往莎莲娜岛（135.333）处与神官杰拉娜对话，交出【贝兹雷姆之钥】传送至入口。
			return (cga.GetMapIndex().index3 == thisobj.data.maze.entryMap && cga.getTeamPlayers().length == 2) ? true : false;
			// return (cga.getTeamPlayers().length == 2) ? true : false;
		},
		function () {// 3.打鳞片环节。全员收集鳞片，并与神官葛雷森（26.67）对话，选“是”交出【地龙的鳞片】并通过栅栏。
			return (cga.isInMap(thisobj.data.maze.exitMap) && cga.GetMapXY().y < 66) ? true : false;
		},
		function () {// 4.与神兽史雷普尼尔（26.25）对话进入战斗。
			return (cga.travel.switchMainMap() == '静谧之间') ? true : false;
		},
		function () {// 5.由静谧之间（26.12）处进入咒缚之帐与邪灵鸟人（14.14）对话2次，任务完结。
			return false;
		},
	],
	data: {// 任务数据，可自定义，方便使用
		isTeamLeader: false,
		doneNick: 'scale',
		allDone: false,
		noCheck: false,// 是否监测地龙的鳞片情况
		maze: cga.mazeInfo['贝兹雷姆的迷宫'],
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

		if (thisobj.data.allDone && index == thisobj.data.maze.exitMap) {
			console.log('全员持有鳞片，并且抵达迷宫出口，playerthink结束..')
			return false
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		if (ctx.teamplayers.length != thisobj.param.teammates.length) {
			let xy = cga.GetMapXY();
			if (
				(index == thisobj.data.maze.entryMap && xy.y > 10) ||// 迷宫门口组队时
				(index == 400 && xy.x > 130 && xy.x < 140 && xy.y > 328 && xy.y < 338)//迷宫外面神官对话时
			) {
				console.log('进入神殿前队伍需要解散，暂时阻止playerthink的组队监测..')
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

		// 鳞片判断环节，如果全员并没有集齐鳞片
		if (!thisobj.data.allDone) {
			// 监测称号，如果打到鳞片，则改变自己的玩家昵称为thisobj.data.doneNick
			if (ctx.playerinfo.nick != thisobj.data.doneNick && cga.getItemCount('地龙的麟片') >= 1) {
				cga.ChangeNickName(thisobj.data.doneNick)
			}

			// 由于队伍解散的时候teamplayers.length=0，下面的for循环不会进入，所以tmpFlag的初始值不能直接设为true，而是当队伍存在，默认值才为true。
			let doneCnt = 0
			// 遍历全队，只有当所有人称号都为thisobj.data.doneNick时，thisobj.data.allDone才会置为true，并阻止下一次playerthink再次进入鳞片判断环节。
			for (let i = 0; i < teamplayers.length; i++) {
				if (teamplayers[i].nick == thisobj.data.doneNick) {
					doneCnt += 1
				}
			}

			thisobj.data.allDone = (doneCnt == thisobj.param.teammates.length)
		}

		// 如果全员集齐了鳞片
		if (thisobj.data.allDone && !thisobj.data.noCheck) {
			console.log('全员已经集齐【地龙的鳞片】。禁用鳞片监测，走出迷宫，通过栅栏')
			thisobj.data.noCheck = true
			return function (cb) {
				cb(3)
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

		if (thisobj.param.teammates.length != 2) {
			throw new Error('参数错误：teammates。神兽任务teammates长度必须为2。teammates:', teammates)
		}
		// 判断队长队员
		thisobj.data.isTeamLeader = thisobj.param.teammates[0] == cga.GetPlayerInfo().name

		// 逃跑赶路
		cga.loadBattleConfig('战斗赶路')

		// 重置昵称，用于监测鳞片
		cga.ChangeNickName('')

		var task = cga.task.TaskWithThink(thisobj.taskName, thisobj.taskStages, thisobj.taskRequirements, thisobj.taskPlayerThink)
		// 此任务的锚点清晰，无需落盘辅助记录任务进度
		// task.anyStepDone = false;
		// 任务初始化，刷新角色的晋级任务状态
		cga.refreshMissonStatus(null,()=>{
			task.doTask(cb)
		})
		return
	},
};

module.exports = thisobj;