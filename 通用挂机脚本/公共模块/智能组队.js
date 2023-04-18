/**
 * UNAecho开发笔记:
 * 练级层数由thisobj.object.area.layer记录，由battleAreaArray中的walkto控制走到多少层
 */
var Async = require('async');
var teamModeArray = [
	{
		name: '智能组队',
		is_enough_teammates: () => {
			// 如果没有记录练级信息
			if (!thisobj.object.area) {
				// console.log('找不到thisobj.object.area，is_enough_teammates()返回false')
				return false
			}
			// 如果已经记录了车队成员
			var teamplayers = cga.getTeamPlayers();
			if (teamplayers.length >= thisobj.object.area.teammates.length) {
				for (var i = 0; i < teamplayers.length; ++i) {
					if (!is_array_contain(thisobj.object.area.teammates, teamplayers[i].name)) {
						// console.log('【'+teamplayers[i].name+'】不在预定队员列表内，is_enough_teammates()返回false')
						return false;
					}
				}
				return true;
			}
			return false;
		},
		wait_for_teammates_filter: (cb) => {
			// 如果是单练，跳过组队统计，直接选择练级地点。TODO与组队同步逻辑
			if (thisobj.object.minTeamMemberCount <= 1) {
				console.log('单人练级情况123123123123123')
				let areaObj = thisobj.switchArea()
				thisobj.object.area = areaObj['area']
				update.update_config(areaObj, true, cb)
				return;
			}
			// 全员通用操作
			var afterShare = (shareInfoObj, cb) => {
				// 关闭组队
				cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
				// 计算去哪里练级
				let areaObj = thisobj.switchArea(shareInfoObj, cga.getTeamPlayers())
				// 缓存练级信息结果
				thisobj.object.area = areaObj
				// 换水晶模块使用
				global.area = thisobj.object.area
				// 先落盘，再在内存中保存结果
				update.update_config({ area: thisobj.object.area }, true, () => {
					// 获取练级对象
					thisobj.object.battleAreaObj = battleAreaArray.find((b) => {
						return b.name == thisobj.object.area.map
					});
					cb(true)
				})
			}

			// 队员逻辑
			if (!cga.isTeamLeader) {
				var listenLeader = (shareInfoObj, retryFunc, cb) => {
					console.log('监听队长称号..')
					let teamplayers = cga.getTeamPlayers();
					// 如果共享信息成功后，队长突然掉线
					if (!teamplayers.length) {
						setTimeout(retryFunc, 1000, cb);
						return
					}

					if (teamplayers[0].nick == 'rebuild') {
						if (thisobj.object.role == 2) {
							console.log('队长要求小号离队，因为打手不足')
							// 退出时，加入时间戳
							blacklist[teamplayers[0].name] = Date.now()
							cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
							setTimeout(retryFunc, 2000, cb);
							return

						}
						share((shareInfoObj) => {
							// 如果共享信息时有人离队
							if (shareInfoObj === false) {
								setTimeout(retryFunc, 2000, cb);
								return
							}
							listenLeader(shareInfoObj, retryFunc, cb)
							return
						})
						return
					}

					if (teamplayers[0].nick == 'ok') {
						console.log('拼车成功，开始落盘..')
						afterShare(shareInfoObj, cb)
						return
					}
					setTimeout(listenLeader, 1000, shareInfoObj, retryFunc, cb);
					return
				}

				var retry = (cb) => {
					let teamplayers = cga.getTeamPlayers();
					if (teamplayers.length) {
						share((shareInfoObj) => {
							// 如果共享信息时有人离队
							if (shareInfoObj === false) {
								setTimeout(retry, 1000, cb);
								return
							}
							listenLeader(shareInfoObj, retry, cb)
							return
						})
						return
					} else {
						let curTime = Date.now()
						var leader = cga.findPlayerUnit((u) => {
							if (blacklist.hasOwnProperty(u.unit_name)) {
								console.log('出现小号挤兑现象，暂时离队。' + (blacklistTimeout - (curTime - blacklist[u.unit_name])) / 1000 + '秒内不能加入【', u.unit_name, '】队伍')
							}
							if (
								(u.xpos == thisobj.object.leaderX && u.ypos == thisobj.object.leaderY)
								&& (!thisobj.object.leaderFilter || u.nick_name.indexOf(thisobj.object.leaderFilter) != -1)
								&& ((!blacklist.hasOwnProperty(u.unit_name) || (curTime - blacklist[u.unit_name] > blacklistTimeout)))
							) {
								delete blacklist[u.unit_name]
								return true;
							}
							return false
						});
						if (leader) {
							var target = cga.getRandomSpace(leader.xpos, leader.ypos);
							cga.walkList([
								target
							], () => {
								cga.addTeammate(leader.unit_name, () => {
									setTimeout(retry, 1000, cb);
									return
								});
							});
						} else {
							setTimeout(retry, 1000, cb);
							return
						}
					}
				}

				retry(cb);
				return
			}
			else {// 队长逻辑
				var checkRole = (shareInfoObj, cb) => {
					// 检查队内打手数量，如果打手不足，则无法正常练级，回调rebuild
					var bodyguardCnt = 0
					for (var p in shareInfoObj) {
						// 跳过组队信息的key
						if (p == 'teammates') {
							continue
						}
						if (shareInfoObj[p].role['职责'] == '1') {
							bodyguardCnt += 1
						}
					}

					if (bodyguardCnt < thisobj.object.minBodyguard) {
						console.log('队内打手人数不足，队长重新等待队员加入，小号自己离队，并在规定时间内不再加入此队伍。')
						cb('rebuild')
						return
					}

					console.log('打手【', bodyguardCnt, '】人', '大于最少要求【', thisobj.object.minBodyguard, '】人，出发')
					cb('ok')
					return
				}

				var wait = () => {
					cga.waitTeammatesWithFilter(thisobj.object.memberFilter, thisobj.object.minTeamMemberCount, (r) => {
						if (r) {
							share((shareInfoObj) => {
								// 如果共享信息时有人离队
								if (shareInfoObj === false) {
									setTimeout(wait, 1000);
									return
								}
								checkRole(shareInfoObj, (r) => {
									if (r == 'ok') {
										setTimeout(() => {
											cga.ChangeNickName('ok')
										}, 1500);

										setTimeout(() => {
											afterShare(shareInfoObj, cb)
										}, 5000);
									} else if (r == 'rebuild') {
										setTimeout(() => {
											cga.ChangeNickName('rebuild')
										}, 1500);
										// 给小号对rebuild充分时间调整，然后挂上标记，进入wait
										setTimeout(() => {
											cga.ChangeNickName(thisobj.object.leaderFilter)
											wait()
										}, 5000);
									}
								})
							})
							return;
						}
						setTimeout(wait, 5000);
					})
				}

				cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
				// 挂上标记，队员才能识别队长
				cga.ChangeNickName(thisobj.object.leaderFilter)
				wait();
			}
		},
		wait_for_teammates_timeout: (cb) => {
			if (!thisobj.object.area.teammates instanceof Array || !thisobj.object.area.teammates.length) {
				console.log('【错误】:wait_for_teammates_timeout仅接受固定组队，teammates必须有值才行')
				cb(false)
				return
			}

			cga.waitTeammatesReady(thisobj.object.area.teammates, thisobj.object.timeout, (r) => {
				if (r && r == 'timeout') {
					console.log('等待组队超时，删除练级相关信息')
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
					update.delete_config(['area'], true, () => {
						// 练级信息、门票信息都清空
						thisobj.object.battleAreaObj = null
						thisobj.object.area = null
						setTimeout(cb, 3000, false);
					})
				} else if (r && r == 'ok') {
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
					cb(true)
				} else {
					throw new Error('cga.waitTeammatesReady返回类型错误')
				}
			})
		},
		/**
		 * 如果没有离线保存练级信息，则去集散点集合，为了拼车。
		 * 传送小岛：去西门外阿鲁卡对话检查能否传送小岛，能去小岛会说【飞过去】，不能去会说【陌生人】
		 */
		muster: (cb) => {
			const key = '传送小岛'
			const checkTicket = (cb2) => {
				cga.travel.falan.toStone('W1', () => {
					cga.walkList([
						[22, 88, '芙蕾雅'],
						[397, 168],
					], () => {
						cga.TurnTo(399, 168);
						cga.AsyncWaitNPCDialog((err, dlg) => {
							//try again if timeout
							if (err && err.message.indexOf('timeout') > 0) {
								setTimeout(ask, 1500);
								return;
							}
							if (dlg) {
								if (dlg.message.indexOf('陌生人') >= 0) {
									config['mission'][key] = false
									cga.savePlayerConfig(config, cb2);
									return;
								}
								if (dlg.message.indexOf('飞过去') >= 0) {
									config['mission'][key] = true
									cga.savePlayerConfig(config, cb2);
									return;
								}
							}
						});
					});
				});
			}

			const go = (cb3) => {
				if (thisobj.object.minTeamMemberCount <= 1) {
					console.log('当前为单独练级，跳过组队判断练级地点阶段')
					setTimeout(cb3, 1000);
					return
				}
				cga.travel.newisland.toStone('X', () => {
					// 队员会在wait_for_teammates_filter中自动找加队位置
					cga.walkList([
						[thisobj.object.leaderX, thisobj.object.leaderY]
					], cb3);
				});
			}

			var config = cga.loadPlayerConfig();
			if (!config)
				config = {};
			if (!config.hasOwnProperty('mission'))
				config['mission'] = {}
			if (config['mission'][key] == undefined) {
				checkTicket(() => {
					go(cb)
				})
			} else {
				go(cb)
			}
		},
		think: (ctx) => {
			//单练模式 TODO 单练时地点切换
			if (thisobj.object.area.teammates.length == 0)
				return;

			//队长：人数不足，登出
			//队员：人都跑光了，登出
			if ((ctx.teamplayers.length < thisobj.object.area.teammates.length && cga.isTeamLeader) || ctx.teamplayers.length == 0) {
				ctx.result = 'logback';
				ctx.reason = '人数不足，登出';
				return;
			}
			/**
			 * UNAecho开发提醒：
			 * 这里需要更新自己的练级场所数据，但有一个不好发现的bug。
			 * 在战斗切换期间，cga.getTeamPlayers()会出现bug，会发生只有自己信息正确，其余队员信息全0或者空的情况。
			 * 究其原因，很大可能性是因为：
			 * 1、playerthink的进入条件是!cga.isInNormalState()，而战斗画面和平常画面切换期间，!cga.isInNormalState()也是true的。
			 * 2、此时，由于cga.getTeamPlayers()中获得人物等级信息依赖于cga.GetMapUnits()，而切换期间，无法获取这些信息。
			 * 3、就导致cga.getTeamPlayers()无法获取到除了自己以外的队员信息，这会导致switchArea判断出错。
			 * 但cga.isInNormalState() == true时，还是无法分辨是战斗和平时切换，还是真的处于平常阶段。
			 * 所以目前处理方式只能是遍历ctx.teamplayers，如果有异常数据就不进行练级地点switchArea()判断
			 * 
			 * new Date().getSeconds() % 5 == 0这个是为了节能，减少计算量。
			 * 
			 * 更新：以上作为开发过程的记录，现在以及不在playerthink中计算练级区域，而是改在战斗中计算了。上面的开发记录作为参考保留备用。
			 * 现在仅监视称号，练级区域是否有变化，有变化则ctx.result = 'logback';
			 */

			// 在battleThink()中，如果练级区域并更新了自身的数据，开始等待全员变更。全员完毕后，ctx.result = logback，交给主插件登出
			if (ctx.playerinfo.nick == areaChangedFlag) {
				for (let t = 0; t < ctx.teamplayers.length; t++) {
					if (ctx.teamplayers[t].nick != areaChangedFlag) {
						console.log('还有队友未计算完毕，继续等待..')
						return
					}
				}
				ctx.result = 'logback';
				ctx.reason = '练级区域或楼层发生改变，登出重新loop流程';
			}
		}
	},
]

/**
 * UNAecho : 雪拉森威塔10-50层传送石坐标：index598开头，第几层就是0几。
 * 如：第1层59801，第10层59810，第25层59825。
 * 只有1、10、15、25、30、35、40、45、50层有传送石，其他层没有。
 * 国民会馆进入1层入口:[108, 39, 59801],
 * 1层回国民会馆:[33, 99, 59552],
 * 下面2个，左边是1楼走到其他楼的传送石，右边是其他楼走到1楼的传送石坐标。
 * [76, 58, 59810],[54, 38, 59801],
 * [76, 56, 59815],[137, 69, 59801],
 * [76, 54, 59820],[88, 146, 59801],
 * [76, 52, 59825],[95, 57, 59801],
 * [72, 60, 59830],[68, 33, 59801],
 * [72, 58, 59835],[104, 26, 59801],
 * [72, 56, 59840],[98, 95, 59801],
 * [72, 54, 59845],[98, 29, 59801],
 * [75, 50, 59850],[78, 59, 59801],
 * 下面是50楼走到其他楼的传送石，
 * 因为走路回补要路过50楼整层，所以最好还是登出回补。没记录走回来的坐标，绝不是因为懒，绝不是。
 * 2023年更新：走回来的坐标都记录在自动寻路中，这次不懒了。
 * [27, 55, 59855],
 * [25, 55, 59860],
 * [23, 55, 59865],
 * [21, 55, 59870],
 * [24, 44, 59875],
 * [22, 44, 59880],
 * [20, 44, 59885],
 * [18, 44, 59890],
 * [16, 44, 59895],
 */
var battleAreaArray = [
	{
		name: '雪拉威森塔',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.askNpcForObj('艾尔莎岛', [165, 154], { act: 'map', target: '利夏岛' }, () => {
					cga.walkList([
						[90, 99, '国民会馆'],
						cga.isTeamLeader ? [108, 42] : [108, 43],
					], cb);
				})
			});
		},
		walkTo: (cb) => {
			cga.travel.autopilot(59800 + thisobj.object.area.layer, cb)
		},
		isMusterMap: (map, mapXY) => {
			if (map != '国民会馆') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 108 && mapXY.x == 42) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 108 && mapXY.x == 43) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY, mapindex) => {
			return mapindex - 59800 == thisobj.object.area.layer ? true : false;
		}
	},
	{
		name: '低地鸡',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[221, 228],
				], cb);
			});
		},
		isMusterMap: (map, mapXY) => {
			return map == '艾尔莎岛';
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '盖雷布伦森林');
		}
	},
	{
		name: '刀鸡',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[34, 188],
				], cb);
			});
		},
		isMusterMap: (map, mapXY) => {
			if (map != '艾尔莎岛') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 144 && mapXY.x == 106) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 143 && mapXY.x == 106) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '布拉基姆高地');
		}
	},
	{
		name: '诅咒之迷宫',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			let mazeInfo = cga.mazeInfo['诅咒之迷宫']
			let map = cga.GetMapName();
			if (map == mazeInfo.entryMap || (map == mazeInfo.exitMap) || (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1)) {
				cga.findAndWalkMaze('诅咒之迷宫', thisobj.object.area.layer, cb)
			} else {
				cga.travel.falan.toStone('W1', () => {
					cga.walkList([
						[22, 88, '芙蕾雅'],
					], () => {
						cga.findAndWalkMaze('诅咒之迷宫', thisobj.object.area.layer, cb)
					});
				});
			}
		},
		isMusterMap: (map, mapXY) => {
			if (map != '艾尔莎岛') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 144 && mapXY.x == 106) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 143 && mapXY.x == 106) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			let mazeInfo = cga.mazeInfo['诅咒之迷宫']
			return map == (mazeInfo.prefix + thisobj.object.area.layer + mazeInfo.suffix) ? true : false
		}
	},
	{
		name: '龙骨',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[111, 206],
				], cb);
			});
		},
		isMusterMap: (map, mapXY) => {
			if (map != '艾尔莎岛') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 144 && mapXY.x == 106) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 143 && mapXY.x == 106) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '布拉基姆高地');
		}
	},
	{
		name: '黄金龙骨',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[135, 175],
				], cb);
			});
		},
		isMusterMap: (map, mapXY) => {
			if (map != '艾尔莎岛') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 144 && mapXY.x == 106) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 143 && mapXY.x == 106) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '布拉基姆高地');
		}
	},
	{
		name: '银狮',
		muster: (cb) => {
			cga.travel.newisland.toStone('X', () => {
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[122, 117],
					[147, 117],
				], cb);
			});
		},
		isMusterMap: (map, mapXY) => {
			if (map != '艾尔莎岛') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 144 && mapXY.x == 106) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 143 && mapXY.x == 106) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '布拉基姆高地');
		}
	},
	{
		name: '回廊',
		muster: (cb) => {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[52, 72]
				], () => {
					cga.TurnTo(54, 72);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitMovement({ map: '过去与现在的回廊', delay: 1000, timeout: 5000 }, () => {
									cga.walkList([
										cga.isTeamLeader ? [11, 20] : [10, 20],
									], cb);
								});
							});
						});
					});
				});
			});
			return
		},
		walkTo: (cb) => {
			setTimeout(cb, 500);
		},
		isMusterMap: (map, mapXY) => {
			return map == '过去与现在的回廊';
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '过去与现在的回廊');
		}
	},
	{
		name: '营地',
		muster: (cb) => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo: (cb) => {
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[548, 332],
			], cb);
		},
		isMusterMap: (map, mapXY) => {
			if (map != '圣骑士营地') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 96 && mapXY.x == 86) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 97 && mapXY.x == 86) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '肯吉罗岛');
		}
	},
	{
		name: '蝎子',
		muster: (cb) => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo: (cb) => {
			var map = cga.GetMapName();
			if (map == '圣骑士营地') {
				cga.walkList([
					[36, 87, '肯吉罗岛'],
					[384, 245, '蜥蜴洞穴'],
					[12, 2, '肯吉罗岛'],
					[231, 434, '矮人城镇'],
				], cb);
			} else if (map == '矮人城镇') {
				cga.walkList([
					[110, 191, '肯吉罗岛'],
					[233, 439],
				], cb);
			}
		},
		isMusterMap: (map, mapXY) => {
			if (map != '圣骑士营地') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 96 && mapXY.x == 86) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 97 && mapXY.x == 86) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域');
		}
	},
	{
		name: '沙滩',
		muster: (cb) => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo: (cb) => {
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[471, 203],
			], cb);
		},
		isMusterMap: (map, mapXY) => {
			if (map != '圣骑士营地') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 96 && mapXY.x == 86) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 97 && mapXY.x == 86) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域');
		}
	},
	{
		name: '蜥蜴洞穴上层',
		muster: (cb) => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo: (cb) => {
			let mazeInfo = cga.mazeInfo['蜥蜴洞穴上层']
			let map = cga.GetMapName();
			if (map == mazeInfo.entryMap || (map == mazeInfo.exitMap) || (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1)) {
				cga.findAndWalkMaze('蜥蜴洞穴上层', thisobj.object.area.layer, cb)
			} else {
				cga.walkList([
					[36, 87, '肯吉罗岛'],
					[384, 245, '蜥蜴洞穴'],
				], () => {
					cga.findAndWalkMaze('蜥蜴洞穴上层', thisobj.object.area.layer, cb)
				});
			}
		},
		isMusterMap: (map, mapXY) => {
			if (map != '圣骑士营地') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 96 && mapXY.x == 86) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 97 && mapXY.x == 86) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			let mazeInfo = cga.mazeInfo['蜥蜴洞穴上层']
			return map == (mazeInfo.prefix + thisobj.object.area.layer + mazeInfo.suffix) ? true : false
		}
	},
	{
		name: '黑龙沼泽',
		muster: (cb) => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo: (cb) => {
			let mazeInfo = cga.mazeInfo['黑龙沼泽']
			let map = cga.GetMapName();
			if (map == mazeInfo.entryMap || (map == mazeInfo.exitMap) || (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1)) {
				cga.findAndWalkMaze('黑龙沼泽', thisobj.object.area.layer, cb)
			} else {
				cga.walkList([
					[36, 87, '肯吉罗岛'],
				], () => {
					cga.findAndWalkMaze('黑龙沼泽', thisobj.object.area.layer, cb)
				});
			}
		},
		isMusterMap: (map, mapXY) => {
			if (map != '圣骑士营地') {
				return false
			}
			if (cga.isTeamLeader && mapXY.x == 96 && mapXY.x == 86) {
				return true
			} else if (!cga.isTeamLeader && mapXY.x == 97 && mapXY.x == 86) {
				return true
			}
			return false;
		},
		isDesiredMap: (map, mapXY) => {
			let mazeInfo = cga.mazeInfo['黑龙沼泽']
			return map == (mazeInfo.prefix + thisobj.object.area.layer + mazeInfo.suffix) ? true : false
		}
	},
	{
		name: '旧日迷宫',
		muster: (cb) => {
			var getHorn = (cb2) => {
				cga.walkList([
					[116, 69, '总部1楼'],
				], () => {
					cga.askNpcForObj('总部1楼', [87, 50], { act: 'item', target: '战斗号角' }, () => {
						cga.walkList([
							[4, 47, '圣骑士营地'],
						], () => {
							go(cb2)
						});
					})
				});
				return;
			}
			var go = (cb2) => {
				cga.askNpcForObj('圣骑士营地', [120, 81], { act: 'map', target: '旧日之地' }, () => {
					cga.askNpcForObj('旧日之地', [45, 46], { act: 'map', target: '迷宫入口' }, () => {
						cga.walkList([
							cga.isTeamLeader ? [6, 5] : [6, 6],
						], cb2);
					})
				})
			}
			cga.travel.falan.toCamp(() => {
				if (cga.getItemCount('战斗号角') == 0) {
					getHorn(cb)
				} else {
					go(cb)
				}
			});
			return
		},
		walkTo: (cb) => {// 旧日的muster就在地图入口
			let mazeInfo = cga.mazeInfo['旧日迷宫']
			let map = cga.GetMapName();
			if (map == mazeInfo.entryMap || (map == mazeInfo.exitMap) || (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1)) {
				cga.findAndWalkMaze('旧日迷宫', thisobj.object.area.layer, cb)
			} else {
				throw new Error('异常地图，请检查')
			}
		},
		isMusterMap: (map, mapXY) => {
			return map == '迷宫入口';
		},
		isDesiredMap: (map, mapXY) => {
			let mazeInfo = cga.mazeInfo['旧日迷宫']
			return map == (mazeInfo.prefix + thisobj.object.area.layer + mazeInfo.suffix) ? true : false
		}
	},
	{
		name: '通往山顶的路',
		muster: (cb) => {
			cga.travel.falan.toStone('W1', () => {
				cga.walkList([
					[22, 88, '芙蕾雅'],
					[397, 168],
				], () => {
					cga.TurnTo(399, 168);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitMovement({ map: ['小岛'], delay: 1000, timeout: 10000 }, () => {
							cga.walkList([
								cga.isTeamLeader ? [65, 97] : [65, 98],
							], cb);
						});
					})
				});
			});
			return
		},
		walkTo: (cb) => {// 通往山顶的路的muster已经在迷宫的入口地图了
			let mazeInfo = cga.mazeInfo['通往山顶的路']
			let map = cga.GetMapName();
			if (map == mazeInfo.entryMap || (map == mazeInfo.exitMap) || (map.indexOf(mazeInfo.prefix) != -1 && map.indexOf(mazeInfo.suffix) != -1)) {
				cga.findAndWalkMaze('通往山顶的路', mazeInfo.exitMap, () => {
					// 楼梯附近爱掉线，尝试去地图其他地点练级
					cga.walkList([
						[62, 65],
					], cb);
				})
			} else {
				throw new Error('异常地图，请检查')
			}
		},
		isMusterMap: (map, mapXY) => {
			return map == '小岛';
		},
		isDesiredMap: (map, mapXY) => {
			return map == '半山腰';
		}
	},
]

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
var update = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');
// 如果练级地点发生改变，且已经落盘完毕，则将此flag打在人物昵称上
const areaChangedFlag = 'areaChanged'
// 当队内打手不足时，小号需要退队给打手让位，此时需要暂时将队长加入黑名单，并在超时时间之内不再加入此队，防止挤兑。
var blacklist = {}
// 小号退出给打手让位的超时时间。超过则可以再次加入刚才退出的队伍。
const blacklistTimeout = 5000

// 共享队员信息，智能练级的核心部分
const share = (cb) => {
	cga.shareTeammateInfo(thisobj.object.minTeamMemberCount, ['i承认之戒', 'm传送小岛', 'r职责'], (r) => {
		if (typeof r == 'object') {
			cb(r)
		} else if (typeof r == 'boolean' && r === false) {
			console.log('cga.shareTeammateInfo失败，执行回调函数..')
			cb(false)
		} else {
			throw new Error('cga.shareTeammateInfo返回参数类型异常，请检查')
		}
		return
	})
}

// 如果obj有key则增加数值，如果没有则初始化为value
var objUtil = (obj, key, value) => {
	if (obj.hasOwnProperty(key)) {
		if (typeof value == 'object') {
			return
		} else if (typeof value == 'string') {
			return
		} else if (typeof value == 'number') {
			obj[key] += value
		} else {
			throw new Error('不允许的数据类型，请检查。')
		}
	} else {
		obj[key] = value
	}
}

var thisobj = {
	is_enough_teammates: () => {
		return thisobj.object.is_enough_teammates();
	},
	wait_for_teammates_filter: (cb) => {
		thisobj.object.wait_for_teammates_filter(cb);
	},
	wait_for_teammates_timeout: (cb) => {
		thisobj.object.wait_for_teammates_timeout(cb);
	},
	muster: (cb) => {
		thisobj.object.muster(cb);
	},
	isBuildTeamReady: () => {
		return Object.prototype.toString.call(thisobj.object.battleAreaObj) == '[object Object]' ? true : false
	},
	musterWithBuildTeam: (cb) => {
		// 如果有更改队伍的昵称没有清除掉，则清除
		if (cga.GetPlayerInfo().nick == areaChangedFlag) {
			console.log('有称号标记【' + areaChangedFlag + '】残留，清除掉')
			cga.ChangeNickName('')
		}

		// 如果已经在练级集合地，则跳过
		if (thisobj.object.battleAreaObj.isMusterMap(cga.GetMapName(), cga.GetMapXY())) {
			cb(null)
		} else {
			console.log('去【' + thisobj.object.battleAreaObj.name + '】集合处' + (thisobj.object.area.layer > 0 ? '，准备去:【' + thisobj.object.area.layer + '】楼练级。' : ''))
			configMode.manualLoad('战斗赶路')
			thisobj.object.battleAreaObj.muster(cb)
		}
	},
	isDesiredMap: (map, mapXY, mapindex) => {
		return thisobj.object.battleAreaObj.isDesiredMap(map, mapXY, mapindex)
	},
	walkTo: (cb) => {
		thisobj.object.battleAreaObj.walkTo(cb)
	},
	switchArea: (shareInfoObj, units) => {
		var minLv = 160
		var camp = true
		var island = true

		var areaObj = {}

		// 缓存中有队内信息情况
		if (thisobj.object.area) {
			// 队伍和高级地点门票不变
			areaObj.teammates = thisobj.object.area.teammates
			camp = thisobj.object.area.camp
			island = thisobj.object.area.island
			/**
			 * 动态刷新一下最低等级，2种方式：
			 * 1、如果有pos的key，证明units是由cga.GetBattleUnits()制作，是战斗状态计算。
			 * 此方法可让宠物也加入最低等级判断，并更改对应练级场所。防止宠物在不合适的地方练级。
			 * pos0-9代表我方10个单位
			 * 
			 * 2、如果有xpos的key，证明units是由cga.getTeamPlayers()制作，是平时状态计算
			 * 此方法无法计算宠物等级，但进入战斗（1的情况）即可覆盖宠物判断。
			 *  */
			units.forEach(u => {
				if (u.hasOwnProperty('pos') && u.pos < 10 && u.level < minLv) {
					minLv = u.level
				} else if (u.hasOwnProperty('xpos') && u.level < minLv) {
					minLv = u.level
				}
			});
		} else if (shareInfoObj) {// 队内没有缓存信息的情况
			areaObj.teammates = shareInfoObj.teammates

			// 检查高级练级地点的通行许可
			for (var p in shareInfoObj) {
				// 跳过组队信息的key
				if (p == 'teammates') {
					continue
				}
				if (shareInfoObj[p].item['承认之戒'] == '0') {
					camp = false
				}
				if (shareInfoObj[p].mission['传送小岛'] == '0') {
					island = false
				}
				// 注意，此for循环不可使用break，因为要遍历最小等级
				if (shareInfoObj[p].lv < minLv) {
					minLv = shareInfoObj[p].lv
				}
			}
		} else {// 无队内信息情况，一般是单人练级才会进入此逻辑
			console.log('无队内信息情况，一般是单人练级才会进入此逻辑')
			minLv = cga.GetPlayerInfo().level
			camp = cga.getItemCount('承认之戒', true) > 0 ? true : false
			var config = cga.loadPlayerConfig();
			if (config && config['mission'] && config['mission']['传送小岛'] == true) {
				island = true
			} else {
				island = false
			}
		}
		// 由于雪拉威森塔路程近，50层前又可以回补，将1-50级传统练级地点改为雪拉威森塔
		var battleArea = '雪拉威森塔'
		var layer = 0
		if (minLv > 10 && minLv <= 15) {// 10楼不会遇敌，只能1楼练到10级去15楼
			layer = 15
		} else if (minLv > 15 && minLv <= 20) {
			layer = 20
		} else if (minLv > 20 && minLv <= 25) {
			battleArea = '诅咒之迷宫', layer = 1
		} else if (minLv > 25 && minLv <= 30) {
			battleArea = '诅咒之迷宫', layer = 3
		} else if (minLv > 30 && minLv <= 35) {
			layer = 35
		} else if (minLv > 35 && minLv <= 40) {// 雪拉威森塔40楼有睡眠怪，改为去诅咒练级
			battleArea = '诅咒之迷宫', layer = 6
		} else if (minLv > 40 && minLv <= 45) {
			layer = 45
		} else if (minLv > 45 && minLv <= 50) {
			layer = 50
		} else if (minLv > 50 && minLv <= 60) {
			battleArea = '回廊'
		} else if (camp && minLv > 60 && minLv <= 72) {
			battleArea = '营地'
		} else if (camp && minLv > 72 && minLv <= 75) {
			battleArea = '蝎子'
		} else if (camp && minLv > 75 && minLv <= 80) {
			battleArea = '雪拉威森塔', layer = 80
		} else if (camp && minLv > 80 && minLv <= 84) {
			battleArea = '沙滩'
		} else if (camp && minLv > 84 && minLv <= 94) {
			battleArea = '雪拉威森塔', layer = 89
		} else if (camp && minLv > 94 && minLv <= 103) {// 蜥蜴有石化，即便有抗石化依旧容易出现大量阵亡导致宠物忠诚下降，故尽量缩短蜥蜴练级范围
			battleArea = '蜥蜴洞穴上层', layer = 1
		} else if (camp && minLv > 103 && minLv <= 106) {
			battleArea = '黑龙沼泽', layer = 1
		} else if (camp && minLv > 106 && minLv <= 109) {
			battleArea = '黑龙沼泽', layer = 2
		} else if (camp && minLv > 109 && minLv <= 112) {
			battleArea = '黑龙沼泽', layer = 3
		} else if (camp && minLv > 112 && minLv <= 114) {
			battleArea = '黑龙沼泽', layer = 4
		} else if (camp && minLv > 114 && minLv <= 115) {
			battleArea = '旧日迷宫', layer = 1
		} else if (camp && minLv > 115 && minLv <= 116) {
			battleArea = '旧日迷宫', layer = 6
		} else if (camp && minLv > 116 && minLv <= 117) {
			battleArea = '旧日迷宫', layer = 11
		} else if (camp && minLv > 117 && minLv <= 118) {
			battleArea = '旧日迷宫', layer = 16
		} else if (camp && minLv > 118 && minLv <= 125) {
			battleArea = '旧日迷宫', layer = 20
		} else if (camp && minLv > 125 && minLv <= 128) {
			battleArea = '黑龙沼泽', layer = 10
		} else if (camp && minLv > 128 && minLv <= 138) {
			battleArea = '黑龙沼泽', layer = 11
		} else if (island && minLv > 138) {// 半山判定，由于是去迷宫出口练级，所以layer依然是0
			battleArea = '通往山顶的路'
		}
		// 将所有信息填入返回对象
		areaObj.map = battleArea
		areaObj.layer = layer
		areaObj.camp = camp
		areaObj.island = island
		return areaObj
	},
	// 统计每个练级地点出现的敌人数据分布
	statInfo: {},
	// 每场战斗仅需统计一次flag
	hasBattleThink: false,
	// 统计时的地图名称调整，方便观看
	mapTranslate: {
		'通往山顶的路': '半山腰',
		'蜥蜴洞穴上层': '蜥蜴洞穴',
	},
	// 战斗处理，包括敌人数据统计，以及调整练级地点
	battleThink: () => {
		if (thisobj.hasBattleThink) {
			return
		}
		var areaName = null
		if (thisobj.mapTranslate[thisobj.object.area.map]) {
			areaName = thisobj.mapTranslate[thisobj.object.area.map]
		} else {
			areaName = thisobj.object.area.map
		}
		if (thisobj.object.area.layer > 0) {
			areaName = areaName + thisobj.object.area.layer + '楼'
		}
		var units = cga.GetBattleUnits()
		units.forEach((u) => {
			if (u.pos > 9) {
				objUtil(thisobj.statInfo, areaName, {})
				objUtil(thisobj.statInfo[areaName], u.name, {})
				objUtil(thisobj.statInfo[areaName][u.name], u.level, 1)
			}
		});

		let area = thisobj.switchArea(null, units)
		// 如果练级区域或楼层发生变化，则作出调整，并落盘保存
		if (area.map != thisobj.object.area.map || (area.map == thisobj.object.area.map && area.layer != thisobj.object.area.layer)) {
			thisobj.object.area.map = area.map
			thisobj.object.area.layer = area.layer
			thisobj.object.battleAreaObj = battleAreaArray.find((b) => {
				return b.name == thisobj.object.area.map
			});
			// 换水晶模块使用
			global.area = thisobj.object.area
			// 落盘
			update.update_config({ area: thisobj.object.area }, true, () => {
				// 标记已经落盘完毕
				cga.ChangeNickName(areaChangedFlag)
				// 由于练级区域改变，重置怪物数据统计
				thisobj.statInfo = {}
				console.log('练级信息写入完毕，在昵称中展示已完成..')
			})
		}

		thisobj.hasBattleThink = true
	},
	// 计算在某个练级区域的人物经验获取效率以及金币消耗等情况
	startTime: Date.now(),
	startPlayerInfo: cga.GetPlayerInfo(),
	getEfficiency: () => {// 获取经验获取效率、计算金币消耗情况。注意：因为有移动银行可以取钱，所以金币消耗仅供参考。
		let costSec = (Date.now() - thisobj.startTime) / 1000
		let curPlayerInfo = cga.GetPlayerInfo()
		let getExp = curPlayerInfo.xp - thisobj.startPlayerInfo.xp
		let costGold = thisobj.startPlayerInfo.gold - curPlayerInfo.gold
		let costType = costGold > 0 ? '【减少】' : '【增加】'

		if (getExp > 0) {
			console.log('效率播报：【' + thisobj.object.battleAreaObj.name + '】'
				+ '，当前等级【' + curPlayerInfo.level + '】'
				+ '，练级【' + (costSec / 60).toFixed(2) + '】分'
				+ '，获得经验【' + getExp + '】'
				+ '，经验效率【' + (getExp / costSec).toFixed(2) + '】/ 秒'
				+ '，【' + (getExp / costSec * 60).toFixed(2) + '】/ 分'
				+ '，金币' + costType + '【' + Math.abs(costGold) + '】元'
				+ '，金币' + costType + '速率【' + Math.abs(costGold / costSec).toFixed(2) + '】/ 秒'
				+ '，下次升级在【' + ((curPlayerInfo.maxxp - curPlayerInfo.xp) / (getExp / costSec * 60)).toFixed(2) + '】/ 分钟后。'
			)
		}
		return

	},
	think: (ctx) => {
		thisobj.object.think(ctx);
	},
	translate: (pair) => {
		if (pair.field == 'leaderFilter') {
			pair.field = '玩家称号中识别为带队司机的字符';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'leaderX') {
			pair.field = '司机等候坐标x';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'leaderY') {
			pair.field = '司机等候坐标y';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'memberFilter') {
			pair.field = '名字中包含允许入队的字符';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'area') {
			pair.field = '练级信息';
			var str = ''
			Object.keys(pair.value).forEach((key) => {
				if (str.length) {
					str += ', '
				}
				if (key == 'teammates') {
					str += '队员信息: '
					str += '[' + pair.value[key].join(', ') + ']';
				}
				if (key == 'map') {
					str += '练级地图: '
					str += pair.value[key];
				}
				if (key == 'layer') {
					str += '练级地图楼层: '
					str += pair.value[key];
				}
				if (key == 'camp') {
					str += '队伍可否抵达营地: '
					str += pair.value[key] === true ? '可以' : '不可以'
				}
				if (key == 'island') {
					str += '队伍可否抵达小岛: '
					str += pair.value[key] === true ? '可以' : '不可以'
				}
			})
			pair.value = str
			pair.translated = true;
			return true;
		}
		if (pair.field == 'role') {
			pair.field = '队内职责';
			pair.value = (pair.value == 0) ? '队长' : '队员';
			pair.translated = true;
			return true;
		}
		if (pair.field == 'minTeamMemberCount') {
			pair.field = '队伍最小人数';
			pair.value = pair.value;
			pair.translated = true;
			return true;
		}
		if (pair.field == 'timeout') {
			pair.field = '等待队员超时时间(毫秒)';
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig: (obj) => {
		// 智能模式只有1种组队模式
		thisobj.object = teamModeArray[0];
		// 读取练级场所，如果没读取到，脚本会自动在出发前集合并判断去处，然后落盘。
		// configTable不需要一并读取，因为落盘方式改为跳过configTable直接修改对应key并保存。
		// 队伍成员被整合到练级地点对象中，因为队伍组成、练级地点、承认之戒、传送小岛都是高度绑定的。
		// 任何一个属性变动，都是要重新统计所有情况，所以放到1个对象之中。
		if (typeof obj.area == 'object') {
			configTable.area = obj.area
			thisobj.object.area = obj.area;
			thisobj.object.battleAreaObj = battleAreaArray.find((b) => {
				return b.name == thisobj.object.area.map
			});
			// 换水晶模块使用
			global.area = thisobj.object.area
		}

		if (typeof obj.role != 'number') {
			let toInt = parseInt(obj.role)
			if (typeof obj.role == 'string' && !isNaN(toInt)) {
				configTable.role = toInt;
				thisobj.object.role = toInt;
			} else {
				console.error('读取配置：队伍职责失败！只能输入0代表队长，1代表队员');
				return false;
			}
		} else {
			configTable.role = obj.role;
			thisobj.object.role = obj.role;
		}

		cga.isTeamLeader = thisobj.object.role == 0 ? true : false

		if (cga.isTeamLeader) {
			configTable.minTeamMemberCount = obj.minTeamMemberCount;
			thisobj.object.minTeamMemberCount = obj.minTeamMemberCount;
			if (!(thisobj.object.minTeamMemberCount > 0)) {
				console.error('读取配置：队伍最小人数失败！');
				return false;
			}
		}

		if (cga.isTeamLeader) {
			configTable.minBodyguard = obj.minBodyguard;
			thisobj.object.minBodyguard = obj.minBodyguard;
			if (!(thisobj.object.minBodyguard >= 0)) {
				console.error('读取配置：队伍最小打手数失败！');
				return false;
			}
		}

		if (cga.isTeamLeader) {
			configTable.memberFilter = obj.memberFilter;
			thisobj.object.memberFilter = obj.memberFilter;
		}

		configTable.leaderFilter = obj.leaderFilter;
		thisobj.object.leaderFilter = obj.leaderFilter;
		if (!(thisobj.object.leaderFilter)) {
			console.error('读取配置：队长昵称过滤失败！');
			return false;
		}

		if (typeof obj.leaderX != 'number') {
			let toInt = parseInt(obj.leaderX)
			if (typeof obj.leaderX == 'string' && !isNaN(toInt)) {
				configTable.leaderX = toInt;
				thisobj.object.leaderX = toInt;
			} else {
				console.error('读取配置：队长X坐标失败！只能输入0-999的数字');
				return false;
			}
		} else {
			configTable.leaderX = obj.leaderX;
			thisobj.object.leaderX = obj.leaderX;
		}

		if (typeof obj.leaderY != 'number') {
			let toInt = parseInt(obj.leaderY)
			if (typeof obj.leaderY == 'string' && !isNaN(toInt)) {
				configTable.leaderY = toInt;
				thisobj.object.leaderY = toInt;
			} else {
				console.error('读取配置：队长Y坐标失败！只能输入0-999的数字');
				return false;
			}
		} else {
			configTable.leaderY = obj.leaderY;
			thisobj.object.leaderY = obj.leaderY;
		}

		if (typeof obj.timeout != 'number') {
			let toInt = parseInt(obj.timeout)
			if (typeof obj.timeout == 'string' && !isNaN(toInt)) {
				configTable.timeout = toInt;
				thisobj.object.timeout = toInt;
			} else {
				console.warn('组队时改为无限等待，因为超时类型输入错误。超时时间只能输入number或者string数字。')
				configTable.timeout = 0;
				thisobj.object.timeout = 0;
			}
		} else {
			configTable.timeout = obj.timeout;
			thisobj.object.timeout = obj.timeout;
		}

		return true;
	},
	inputcb: (cb) => {

		var stage0 = (cb2) => {
			// 智能模式暂定只有1种模式
			thisobj.object = teamModeArray[0]

			var sayString = '【智能组队】队内职责，输入你在队内的职责，0队长1打手2小号。队长负责带队，可以是输出也可以是小号。打手是非队长的清怪主力。建议队长有清怪能力时，打手2人。队长是小号时，打手3人。';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && (index == 0 || index == 1 || index == 2)) {
					configTable.role = index;
					thisobj.object.role = index;

					var sayString2 = '当前已选择: 你是[' + ['队长', '打手', '小号'] + ']';
					cga.sayLongWords(sayString2, 0, 3, 1);
					setTimeout(cb2, 500);
					return false;
				}

				return true;
			});
		}

		var stage1 = (cb2) => {
			var filterAttribute = '队长昵称'
			var sayString = '【智能组队】请选择' + filterAttribute + '过滤，' + filterAttribute + '中带有此输入字符才会被认定为队长(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果确实需要输入ok，请输入$ok:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (msg !== null && msg.length > 0 && msg.indexOf(':') == -1) {
					if (msg == 'ok') {
						configTable.leaderFilter = null;
						thisobj.object.leaderFilter = null;
					} else if (msg == '$ok') {
						configTable.leaderFilter = 'ok';
						thisobj.object.leaderFilter = 'ok';
					} else {
						configTable.leaderFilter = msg;
						thisobj.object.leaderFilter = msg;
					}

					var sayString2 = '当前已选择:[' + thisobj.object.leaderFilter + ']。为' + filterAttribute + '过滤内容';
					cga.sayLongWords(sayString2, 0, 3, 1);

					if (thisobj.object.role == 0) {
						stage2(cb2)
					} else {
						setTimeout(cb2, 500);
					}

					return false;
				}

				return true;
			});
		}

		var stage2 = (cb2) => {
			var filterAttribute = '队员名称'
			var sayString = '【智能组队】请选择' + filterAttribute + '过滤，' + filterAttribute + '中带有输入字符才符合条件(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果确实需要输入ok，请输入$ok:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (msg !== null && msg.length > 0 && msg.indexOf(':') == -1) {
					if (msg == 'ok') {
						configTable.memberFilter = null;
						thisobj.object.memberFilter = null;
					} else if (msg == '$ok') {
						configTable.memberFilter = 'ok';
						thisobj.object.memberFilter = 'ok';
					} else {
						configTable.memberFilter = msg;
						thisobj.object.memberFilter = msg;
					}

					var sayString2 = '当前已选择:[' + thisobj.object.memberFilter + ']。为' + filterAttribute + '过滤';
					cga.sayLongWords(sayString2, 0, 3, 1);

					setTimeout(stage3, 500, cb2);
					return false;
				}

				return true;
			});
		}

		var stage3 = (cb2) => {
			var sayString = '【智能组队】组队人数，智能组队使用自由组队拼车+固定组队练级模式，拼车成功后自动转为固定组队。请输入自由拼车的最小发车人数(1~5):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 1 && index <= 5) {
					configTable.minTeamMemberCount = index;
					thisobj.object.minTeamMemberCount = index;

					var sayString2 = '当前已选择: 队伍最小人数[' + thisobj.object.minTeamMemberCount + ']人。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					setTimeout(stage4, 500, cb2);
					return false;
				}

				return true;
			});
		}

		var stage4 = (cb2) => {
			var sayString = '【智能组队】请输入自由拼车的最小打手人数(0~4):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 0 && index <= 4) {
					configTable.minBodyguard = index;
					thisobj.object.minBodyguard = index;

					var sayString2 = '当前已选择: 队伍最小打手人数[' + thisobj.object.minBodyguard + ']人。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					setTimeout(cb2, 500);
					return false;
				}

				return true;
			});
		}

		var stage5 = (cb2) => {
			var sayString = '【智能组队】请输入队长站位x坐标(0~999):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 0 && index <= 999) {
					configTable.leaderX = index;
					thisobj.object.leaderX = index;

					setTimeout(cb2, 500);
					return false;
				}

				return true;
			});
		}

		var stage6 = (cb2) => {
			var sayString = '【智能组队】请输入队长站位y坐标(0~999):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index) => {
				if (index !== null && index >= 0 && index <= 999) {
					configTable.leaderY = index;
					thisobj.object.leaderY = index;

					setTimeout(cb2, 500);
					return false;
				}

				return true;
			});
		}

		var stage7 = (cb2) => {
			var sayString = '【智能组队】超时设置，如果固定组队超时，则全员回退至自由组队阶段。请输入组队等待超时时间(毫秒):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val > 0) {
					configTable.timeout = val;
					thisobj.object.timeout = val;

					var sayString2 = '当前已选择等待队员:' + thisobj.object.timeout + '毫秒后超时触发回调。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					setTimeout(cb2, 500);

					return false;
				}

				return true;
			});
		}
		// stage2-4仅队长需要执行，所以在stage1中判断是否执行
		Async.series([stage0, stage1, stage5, stage6, stage7], cb);
	}
}

module.exports = thisobj;