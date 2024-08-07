var cga = require(process.env.CGA_DIR_PATH_UTF8 + '/cgaapi')(function () {
	global.cga = cga
	let rootdir = cga.getrootdir()
	let configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	// UNAecho:加入自动存取，不将刷完的道具存进个人银行，而是存入移动银行
	let saveAndDraw = require('./通用挂机脚本/子插件/自动存取');
	// 单人治疗和招魂
	let healMode = require('./通用挂机脚本/公共模块/治疗和招魂');
	global.bridge = (cb) => {
		saveAndDraw.manualPrepare(
			{
				"item": [{ "name": "王冠", "upper": 0, "lower": 0 }, { "name": "公主头冠", "upper": 0, "lower": 0 }, { "name": "小猫帽", "upper": 0, "lower": 0 },],
				"gold": [{ "name": "金币", "upper": 300000, "lower": 100000 }],
				"pet": []
			}, () => {
				cb('restart stage')
			})
	}

	console.log('重要提示：途经的每一层塔地图档都要下载，否则自动寻路会失败！')
	console.log('BUG期间建议移动速度不超过300%否则容易掉线')

	var loop_count = 0;

	var mineArray = [
		{
			type: 1,
			name: '王冠',
			func: (cb) => {

			}
		},
		{
			type: 2,
			name: '公主头冠',
			func: (cb) => {

			}
		},
		{
			type: 3,
			name: '小猫帽',
			func: (cb) => {

			}
		},
	]

	var mineObject = null;
	const clearDialogs = (cb) => cga.AsyncWaitNPCDialog(error => {
		if (error) {
			cb();
		} else {
			clearDialogs(cb);
		}
	}, 1000);

	let taskPlayerThink = () => {
		if (!cga.isInNormalState()) {
			return true;
		}

		let playerinfo = cga.GetPlayerInfo();

		let ctx = {
			playerinfo: playerinfo,
			petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
			result: null,
		}

		// 宠物忠诚低于40要收起来
		if (ctx.petinfo && ctx.petinfo.loyality < 40) {
			cga.ChangePetState(ctx.petinfo.index, cga.PET_STATE_READY)
		}

		if (ctx.playerinfo.health > 0 || ctx.playerinfo.souls > 0) {
			console.log('人物受伤，中断任务')
			return function (cb) {
				// 治疗、招魂
				healMode.func(()=>{
					// 返回任务的第index步
					cb(0)
				})
			}
		}

		return true
	}

	// 改用带有playerthink的任务API
	var task = cga.task.TaskWithThink('圣域守护者', [
		{//0
			intro: '1.前往雪拉威森塔95楼与守护者杰斯（28.104）对话，选“是”获得【塞特的护身符】。',
			workFunc: function (cb2) {

				var stage2 = () => {
					cga.TurnTo(28, 103);
					cga.AsyncWaitNPCDialog((dlg) => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(1, 0);
									cga.AsyncWaitMovement({ map: '雪拉威森塔９６层', delay: 1000, timeout: 5000 }, cb2);
								});
							});
						});
					});
				}

				if (mineObject.type != 3) {
					if (cga.getItemCount('王冠') >= 1) {
						if (typeof global.bridge == 'function') global.bridge(cb2);
						else cga.travel.falan.toBank(() => {
							cga.walkList([
								[11, 8],
							], () => {
								cga.turnDir(0);
								cga.AsyncWaitNPCDialog(() => {
									cga.saveToBankAll('王冠', 0, (r) => {
										if (r) throw 'bank full';
										cb2('restart stage');
									});
								}, 1000);
							});
						});
						return;
					}
					if (cga.getItemCount('公主头冠') >= 1) {
						if (typeof global.bridge == 'function') global.bridge(cb2);
						else cga.travel.falan.toBank(() => {
							cga.walkList([
								[11, 8],
							], () => {
								cga.turnDir(0);
								cga.AsyncWaitNPCDialog(() => {
									cga.saveToBankAll('公主头冠', 0, (r) => {
										if (r) throw 'bank full';
										cb2('restart stage');
									});
								}, 1000);
							});
						});
						return;
					}
				}
				else {
					if (cga.getItemCount('小猫帽') >= 1) {
						if (typeof global.bridge == 'function') global.bridge(cb2);
						else cga.travel.falan.toBank(() => {
							cga.walkList([
								[11, 8],
							], () => {
								cga.turnDir(0);
								cga.AsyncWaitNPCDialog(() => {
									cga.saveToBankAll('小猫帽', 0, (r) => {
										if (r) throw 'bank full';
										cb2('restart stage');
									});
								}, 1000);
							});
						});
						return;
					}
				}

				if (cga.needSupplyInitial()) {
					healMode.func(()=>{
						cb2('restart stage')
					})
					return;
				}

				if (cga.GetMapName() == '国民会馆') {
					// 开启任务playerThink
					cb2('playerThink on')
					cga.walkList([
						[108, 39, '雪拉威森塔１层'],
						[73, 60],
						[75, 50, '雪拉威森塔５０层'],
						[16, 44, '雪拉威森塔９５层'],
						[28, 105],
					], stage2);
				}
				else {
					cga.travel.newisland.toLiXiaIsland(() => {
						// 开启任务playerThink
						cb2('playerThink on')
						cga.walkList([
							[90, 99, '国民会馆'],
							[108, 39, '雪拉威森塔１层'],
							[73, 60],
							[75, 50, '雪拉威森塔５０层'],
							[16, 44, '雪拉威森塔９５层'],
							[28, 105],
						], stage2);
					});
				}
			}
		},
		{//1
			intro: '2.前往雪拉威森塔96楼与守护者梅亚（88.118）对话，交出【塞特的护身符】获得【梅雅的护身符】。',
			workFunc: function (cb2) {

				if (cga.needSupplyInitial({})) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(() => {
							cga.travel.newisland.toStone('X', () => {
								cb2('restart stage');
							});
						}, 3000);
					});
					return;
				}

				if (cga.GetMapName() != '雪拉威森塔９６层') {
					var useItem = cga.findItem('塞特的护身符');
					if (useItem != -1) {
						clearDialogs(() => {
							cga.UseItem(useItem);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９５层', delay: 1000, timeout: 5000 }, () => {
									cga.TurnTo(29, 104);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔９６层', delay: 1000, timeout: 5000 }, () => {
											cb2('restart stage');
										});
									});
								});
							});
						});
					}
					return;
				}

				// 开启任务playerThink
				cb2('playerThink on')

				cga.walkList([
					[87, 118],
				], () => {
					cga.TurnTo(89, 118);
					cga.AsyncWaitNPCDialog((dlg) => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(1, 0);
									cga.AsyncWaitMovement({ map: '雪拉威森塔９７层', delay: 1000, timeout: 5000 }, cb2);
								});
							});
						});
					});
				});
			}
		},
		{//2
			intro: '3.前往雪拉威森塔97楼与守护者迪斯（117.125）对话，交出【梅雅的护身符】获得【提斯的护身符】。',
			workFunc: function (cb2) {

				if (cga.needSupplyInitial({})) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(() => {
							cga.travel.newisland.toStone('X', () => {
								cb2('restart stage');
							});
						}, 3000);
					});
					return;
				}

				if (cga.GetMapName() != '雪拉威森塔９７层') {
					var useItem = cga.findItem('梅雅的护身符');
					if (useItem != -1) {
						clearDialogs(() => {
							cga.UseItem(useItem);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９６层', delay: 1000, timeout: 5000 }, () => {
									cga.TurnTo(89, 118);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔９７层', delay: 1000, timeout: 5000 }, () => {
											cb2('restart stage');
										});
									});
								});
							});
						});
					}
					return;
				}
				// 开启任务playerThink
				cb2('playerThink on')

				cga.walkList([
					[117, 126],
				], () => {
					cga.TurnTo(117, 124);
					cga.AsyncWaitNPCDialog((dlg) => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔９８层', delay: 1000, timeout: 5000 }, cb2);
									});
								});
							});
						});
					});
				});
			}
		},
		{//3
			intro: '4.前往雪拉威森塔98楼与守护者乌斯（120.120）对话，交出【提斯的护身符】获得【伍斯的护身符】。',
			workFunc: function (cb2) {

				if (cga.needSupplyInitial({})) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(() => {
							cga.travel.newisland.toStone('X', () => {
								cb2('restart stage');
							});
						}, 3000);
					});
					return;
				}

				if (cga.GetMapName() != '雪拉威森塔９８层') {
					var useItem = cga.findItem('提斯的护身符');
					if (useItem != -1) {
						clearDialogs(() => {
							cga.UseItem(useItem);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９７层', delay: 1000, timeout: 5000 }, () => {
									cga.TurnTo(118, 125);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔９８层', delay: 1000, timeout: 5000 }, () => {
											cb2('restart stage');
										});
									});
								});
							});
						});
					}
					return;
				}

				// 开启任务playerThink
				cb2('playerThink on')

				cga.walkList([
					[120, 121],
				], () => {
					cga.TurnTo(120, 119);
					cga.AsyncWaitNPCDialog((dlg) => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(1, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９９层', delay: 1000, timeout: 5000 }, cb2);
							});
						});
					});
				});
			}
		},
		{//4
			intro: '5.前往雪拉威森塔99楼与守护者妮斯（102.54）对话，交出【伍斯的护身符】获得【尼斯的护身符】。',
			workFunc: function (cb2) {

				if (cga.needSupplyInitial({})) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(() => {
							cga.travel.newisland.toStone('X', () => {
								cb2('restart stage');
							});
						}, 3000);
					});
					return;
				}

				if (cga.GetMapName() != '雪拉威森塔９９层') {
					var useItem = cga.findItem('伍斯的护身符');
					if (useItem != -1) {
						clearDialogs(() => {
							cga.UseItem(useItem);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９８层', delay: 1000, timeout: 5000 }, () => {
									cga.TurnTo(120, 119);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔９９层', delay: 1000, timeout: 5000 }, () => {
											cb2('restart stage');
										});
									});
								});
							});
						});
					}
					return;
				}

				// 开启任务playerThink
				cb2('playerThink on')

				cga.walkList([
					[101, 54],
				], () => {
					cga.TurnTo(103, 54);
					cga.AsyncWaitNPCDialog((dlg) => {
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog((dlg) => {
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({ map: '雪拉威森塔最上层', delay: 1000, timeout: 5000 }, cb2);
						});
					});
				});
			}
		},
		{//5
			intro: '6.通过（103.134）处楼梯上楼达到雪拉威森塔塔顶。',
			workFunc: function (cb2) {

				if (cga.needSupplyInitial({})) {
					cga.travel.falan.toCastleHospital(() => {
						setTimeout(() => {
							cga.travel.newisland.toStone('X', () => {
								cb2('restart stage');
							});
						}, 3000);
					});
					return;
				}

				if (cga.GetMapName() != '雪拉威森塔最上层') {
					var useItem = cga.findItem('尼斯的护身符');
					if (useItem != -1) {
						clearDialogs(() => {
							cga.UseItem(useItem);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '雪拉威森塔９９层', delay: 1000, timeout: 5000 }, () => {
									cga.TurnTo(103, 54);
									cga.AsyncWaitNPCDialog((dlg) => {
										cga.ClickNPCDialog(1, 0);
										cga.AsyncWaitMovement({ map: '雪拉威森塔最上层', delay: 1000, timeout: 5000 }, () => {
											cb2('restart stage');
										});
									});
								});
							});
						});
					}
					return;
				}
				
				// 开启任务playerThink
				cb2('playerThink on')

				cga.walkList([
					[103, 134, '雪拉威森塔前庭'],// index 59906
					[103, 19],
				], () => {
					cga.TurnTo(105, 17);
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (mineObject.type != 3) {
							cga.SayWords(mineObject.type == 1 ? '男' : '女', 0, 3, 1);
							cga.AsyncWaitNPCDialog((dlg) => {
								cga.ClickNPCDialog(1, 0);
								setTimeout(cb2, 3000, true);
							});
						} else {
							if (dlg && dlg.message.indexOf('给你这个') >= 0) {
								cga.ClickNPCDialog(32, 0);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(1, 0);
									setTimeout(cb2, 3000, true);
								});
							}
							else if (dlg && dlg.message.indexOf('还给我吗') >= 0) {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(1, 0);
									setTimeout(cb2, 3000, true);
								});
							}
							else if (dlg && dlg.message.indexOf('我是管理') >= 0) {
								cga.SayWords('男', 0, 3, 1);
								cga.AsyncWaitNPCDialog((dlg) => {
									cga.ClickNPCDialog(1, 0);
									setTimeout(cb2, 3000, true);
								});
							}
						}
					});
				});
			}
		},
	],
		[//任务阶段是否完成
			function () {
				return (cga.getItemCount('塞特的护身符') >= 1) ? true : false;
			},
			function () {
				return (cga.getItemCount('梅雅的护身符') >= 1) ? true : false;
			},
			function () {
				return (cga.getItemCount('提斯的护身符') >= 1) ? true : false;
			},
			function () {
				return (cga.getItemCount('伍斯的护身符') >= 1) ? true : false;
			},
			function () {
				return (cga.getItemCount('尼斯的护身符') >= 1) ? true : false;
			},
			function () {
				return false;
			},
		],
		taskPlayerThink
	);

	var loop = () => {
		loop_count++;
		cga.SayWords('已刷' + loop_count + '遍！', 0, 3, 1);
		task.doTask(loop);
	}
	// 逃跑模式赶路
	configMode.manualLoad('刷王冠小猫帽')

	// 直接刷王冠
	mineObject = mineArray[0]
	cga.SayWords('欢迎使用UNA刷王冠、公主头冠、小猫帽脚本，当前正在刷【'+mineObject.name+'】。', 0, 3, 1);
	task.doTask(loop)


	// cga.waitTeammateSay((player, msg) => {

	// 	if (player.is_me == true) {

	// 		for (var i in mineArray) {
	// 			if (mineArray[i].type == parseInt(msg)) {
	// 				mineObject = mineArray[i];
	// 				break;
	// 			}
	// 		}

	// 		if (mineObject != null) {
	// 			cga.SayWords('您选择了刷' + mineObject.name + '。', 0, 3, 1);
	// 			task.doTask(loop);
	// 			return false;
	// 		}
	// 	}

	// 	return true;
	// });
});