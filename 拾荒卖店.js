var cga = require('./cgaapi')(function () {
	// 拾荒目标
	var targetitems = [
		'金币',
		'魔石',
		'海苔',
		'蕃茄',
		'印度轻木',
		'苹果薄荷',
		'面包',
		'铜',
		'鹿皮',
		'鸡蛋',
	];
	// 不常见但是可以卖的东西
	var extraitems = [
		// '牛奶',
		// '柠檬草',
		'封印卡（人形系）',
		'封印卡（龙系）',
		'封印卡（野兽系)',
		// '封印卡（昆虫系）',
		// '封印卡（特殊系）',
		'封印卡（金属系）',
		// '封印卡（飞行系）',
		'封印卡（不死系）',
		// '封印卡（植物系）',
	]
	var missionitem = [
		'火的水晶碎片',
		'水的水晶碎片',
		'风的水晶碎片',
		'１怪物硬币',
		// 以下3种素材无法卖店，故暂时注释
		// '秘文之皮',
		// '奇香木',
		// '星之砂',
	]

	// 选择起始捡垃圾服务器线路，在1-10反复循环循环，暂时设定为随机线（重启线路脚本也断了），后续加入持久化再改为顺序换线
	global.serverIndex = Math.ceil(Math.random() * 10);

	// 每个地图的posindex
	global.posindex = 0
	// 巡逻点，是patrollocation的index
	global.locationindex = 0

	// 
	// 丢弃次数，如果丢4次还是丢不掉，判断为周围地面满了
	global.dropcount = 0

	// 人物巡逻地点，尽量选择人多的地方，捡的多:b
	global.patrollocation = [
		{
			map: "艾尔莎岛",
			poslist: [
				// 登出点
				[140, 105],
				// 登出点靠右边一点
				[146, 111],
			]
		},
		{
			map: "里谢里雅堡",
			poslist: [
				// 飞碟附近
				[27, 82],
				[27, 93],
				// 城堡南门附近
				[38, 93],
				// 回廊NPC附近
				[38, 82],
			]
		},
		{
			map: "法兰城",
			poslist: [
				// 城堡南门附近
				[153, 103],
				// 桥头商店附近
				[153, 122],
				// S1、S2传送石中间
				[153, 129],
			]
		},
		// {
		// 	map: "肯吉罗岛",
		// 	poslist: [
		// 		// 营地门口
		// 		[549, 332],
		// 	]
		// },
	]
	// 银行操作
	var moveGold = (money, cb) => {

		//魔币操作： cga.MOVE_GOLD_TOBANK = 1;cga.MOVE_GOLD_FROMBANK =  2;cga.MOVE_GOLD_DROP = 3
		cga.MoveGold(money, cga.MOVE_GOLD_TOBANK);
		setTimeout(cb, 3000);
		return

	}

	// 拾荒规则
	var itemFilter = (unit) => {
		// console.log('name = ' + unit.item_name + ', flags = ' + unit.flags + ', counts = ' + unit.item_count)
		if (unit.flags == 1024) {
			// console.log('name = ' + unit.item_name + ', flags = ' + unit.flags + ', counts = ' + unit.item_count)
			if (targetitems.concat(extraitems).concat(missionitem).indexOf(unit.item_name) != -1) {
				// console.log('name = ' + unit.item_name + ', flags = ' + unit.flags + ', counts = ' + unit.item_count)
				return true;
			}
		}
	}
	// 识别宠物规则
	var petFilter = (unit) => {
		if (unit.flags == 512) {
			return true;
		}
	}
	var missionItemFilter = (item) => {
		// 18310-18313 分别是地水火风四种碎片的itemid
		if (item.count >= 999 && ([18310, 18311, 18312, 18313].indexOf(item.itemid) != -1)) {
			return true;
		}
		// 620032：１怪物硬币
		if (item.count == 50 && ([620032,].indexOf(item.itemid) != -1)) {
			return true;
		}
	}
	// 清理背包规则
	var uselessFilter = (item) => {
		// console.log('name = ' + item.name + ', pos = ' + item.pos + ', type = ' + item.type)

		if (extraitems.indexOf(item.name) != -1 && item.count < 20) {
			console.log('【' + item.name + '】虽然可以卖钱但是少见，故丢弃小于一组的材料来保证物品栏充足')
			return true;
		}

		if (targetitems.concat(missionitem).indexOf(item.name) == -1) {
			// console.log('uselessFilter:name = ' + item.name + 'type = ' + item.type)
			return true;
		}


	}
	var changeserverindex = () => {
		if (cga.IsInGame()) {
			if (global.serverIndex != cga.GetMapIndex().index2) {
				// 4线人较少，替换为8线人较多，增加收益
				if (global.serverIndex == 4) {
					global.serverIndex = 8
					console.log('随机到了【4】线，由于人数较少，改为【' + global.serverIndex + '】线');
				}
				console.log('当前线路：' + cga.GetMapIndex().index2 + '线');
				console.log('预期线路（暂时设定为随机）：' + global.serverIndex + '线');
				cga.gui.LoadAccount({
					server: global.serverIndex,
				}, (err, result) => {
					//登出并换线
					console.log('登出!');
					cga.LogOut();
				})
			} else {
				console.log('当前线路和预期更换线路相同，那么自动顺序换到下一条线')
				global.serverIndex = global.serverIndex > 9 ? 1 : global.serverIndex + 1
				setTimeout(changeserverindex, 500);
			}
		}
	}
	// 主循环
	var loop = () => {

		// var map = cga.GetMapName();
		// var mapindex = cga.GetMapIndex().index3;

		var gogogo = () => {

			if (global.posindex == global.patrollocation[global.locationindex].poslist.length) {
				global.posindex = 0
				global.locationindex += 1
				// console.log('本次地图巡逻完毕，global.posindex置0，global.locationindex + 1 ，值为：' + global.locationindex)
				setTimeout(loop, 500);
				return
			}
			cga.walkList([
				global.patrollocation[global.locationindex].poslist[global.posindex]
			], pickup);

			return
		}

		// 捡拾动作
		var pickup = () => {
			var emptysoltcount = cga.getInventoryEmptySlotCount()

			// 周围11格内地图信息
			var allunits = cga.GetMapUnits()
			// 检查地面有东西的格子上，有没有宠物，如果有，则跳过，否则会一直去捡，但是捡不起来。
			var petpos = allunits.map((m) => {
				return m.flags == 512 ? [m.xpos, m.ypos] : false
			})
			// 地面上有道具的信息，过滤规则为itemFilter()
			var units = allunits.filter(itemFilter);
			// console.log(units)
			for (var p = 0; p < petpos.length; p++) {
				// console.log(petpos[p])
				if (petpos[p]) {
					for (var i = 0; i < units.length; i++) {
						// console.log(units[i])
						// console.log('name =' + units[i].item_name + 'x = ' + units[i].xpos + ',y = ' + units[i].ypos)

						if (units[i].xpos == petpos[p][0] && units[i].ypos == petpos[p][1]) {
							// console.log('name =' + units[i].item_name + 'x = ' + units[i].xpos + ',y = ' + units[i].ypos)
							units.splice(i, 1)
							continue
						}


					}
				}

			}
			// console.log(units)
			// 包满卖钱
			if (emptysoltcount == 0) {
				console.log('包满了！回去卖钱')
				setTimeout(loop, 250);
				return
			}
			if (units && units.length > 0) {
				var i = 0;
				if (i < units.length) {
					var unit = units[i++];
					console.log('发现【' + unit.item_name + '】，坐标【' + unit.xpos + ',' + unit.ypos + '】')
					// 获取一个目标周围空闲的坐标，用于拾取
					walkpos = cga.getRandomSpace(unit.xpos, unit.ypos)
					cga.walkList([
						[walkpos[0], walkpos[1]]
					], () => {
						cga.TurnTo(unit.xpos, unit.ypos)
						cga.AsyncWaitNPCDialog((err, dlg) => {
							if (dlg && dlg.message) {
								setTimeout(gogogo, 500);
							}
							else {
								setTimeout(pickup, 250);
							}
						});
						return
					});
				} else {
					console.log('刚才看到的都捡完了，返回loop逻辑')
					setTimeout(gogogo, 250);
					return
				}
			} else {
				global.posindex += 1
				// console.log('附近没有东西了')
				setTimeout(gogogo, 250);
				return
			}
		}

		var dropUseless = (cb) => {

			var dropitem = cga.getInventoryItems().find(uselessFilter)
			// console.log('dropitem.pos = ' + dropitem.pos)
			if (dropitem) {
				console.log('【' + dropitem.name + '】不是捡拾目标，丢弃')
				cga.DropItem(dropitem.pos);
				global.dropcount += 1
				if (global.dropcount < 4) {
					setTimeout(dropUseless, 500, cb);
				} else {
					console.log('周围地面满了，无法丢弃【' + dropitem.name + '】，执行gogogo方法走走路再丢弃')
					// 重置丢弃次数
					global.dropcount = 0
					// 如果满了
					setTimeout(gogogo, 100, cb);
				}
				return;
			} else {
				setTimeout(gogogo, 100, cb);
			}

		}

		// 去商店，破烂换钱
		var gotosell = (cb) => {
			// console.log('gotosell..')
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[30, 79],
				], () => {
					cga.TurnTo(30, 77);
					var sell = cga.findItemArray((item) => {
						return targetitems.indexOf(item.name) && (item.count > 2 || item.name == '魔石') && missionitem.indexOf(item.name) == -1;
					});
					// console.log(sell)
					var sellArray = sell.map((item) => {
						// 23料理、43血瓶
						if ([23, 43].indexOf(item.type) != -1) {
							item.count /= 3;
						}// 29矿条、30木、31秘文之皮、34蕃茄、35其他食材、36花、40封印卡
						// id：18211是鹿皮，type也是26，特殊处理，因为很多其他物品type也是26
						else if (([29, 30, 31, 34, 35, 36,40].indexOf(item.type) != -1 || item.itemid == 18211) && item.name != '魔石') {
							// console.log('item.name = ' + item.name)
							item.count /= 20;
						} else if (item.name == '魔石') {
							// console.log('item.name = ' + item.name)
							item.count = 1;
						}
						item.count = Math.floor(item.count)
						return item.count > 0 ? item : false;
					});
					// console.log(sellArray)
					cga.sellArray(sellArray, () => {

						var curgold = cga.GetPlayerInfo().gold
						var fragmentforsave = cga.getItemCount(missionItemFilter)
						console.log('当前金钱：' + curgold)

						if (curgold > 980000) {
							console.log()
							cga.travel.falan.toBank(() => {
								cga.walkList([
									[11, 8],
								], () => {
									cga.turnDir(0);
									cga.AsyncWaitNPCDialog(() => {
										setTimeout(() => {
											// 全部存入
											moveGold(curgold, loop)
										}, 2000);
									}, 1000);
								});
							});
							return;
						} else if (fragmentforsave) {
							console.log('水晶碎片满了，需要存银行')
							cga.travel.falan.toBank(() => {
								cga.walkList([
									[11, 8],
								], () => {
									cga.turnDir(0);
									cga.AsyncWaitNPCDialog(() => {
										cga.saveToBankAll(missionItemFilter, 999, (r) => {
											setTimeout(loop, 3000);
										});
									}, 1000);
								});
							});
							return;
						} else {
							if (cga.getInventoryEmptySlotCount() < 3) {
								var posx = Math.floor(Math.random() * 3 + 41);
								var posy = Math.floor(Math.random() * 3 + 69);

								setTimeout(() => {
									cga.walkList([
										[posx, posy]//扔垃圾点，随机范围
									], () => {
										if (cga.getInventoryEmptySlotCount() < 5) {
											dropUseless(cb);
										}
									});
								}, 3000);
							}
							else {
								setTimeout(loop, 250);
							}
						}
						return
					});
				});
			});
		}

		// // 重头开始循环，由于加入自动换线，下面重置动作暂时废弃
		// if (global.locationindex == global.patrollocation.length) {
		// 	global.locationindex = 0
		// }

		// 自动换线
		if (global.locationindex == global.patrollocation.length) {
			console.log('全部目标地图拾荒完毕，准备换线')
			setTimeout(changeserverindex, 500);
			return
		}
		// 包满去换钱
		if (cga.getInventoryEmptySlotCount() == 0) {
			gotosell(loop)
		}// 巡逻捡破烂去
		else {
			// console.log('开始捡破烂..')
			if (global.patrollocation[global.locationindex]['map'] == '里谢里雅堡') {
				cga.travel.falan.toStone('C', gogogo);
			} else if (global.patrollocation[global.locationindex]['map'] == '法兰城') {
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[41, 98, '法兰城']
					], gogogo);
				});
			} else if (global.patrollocation[global.locationindex]['map'] == '艾尔莎岛') {
				cga.travel.newisland.toStone('X', gogogo);
			}
		}
		return
	}

	var targetlenth = targetitems.length + extraitems.length + missionitem.length
	console.log('当前拾荒目标物品种类为：【' + targetlenth + '】个，如果超过19个，那么将无法正常工作，望知悉')

	loop()
});