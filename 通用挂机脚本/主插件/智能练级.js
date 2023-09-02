/**
 * UNAecho开发笔记：
 * 2023年，为了将所有角色的全自动培养整合成一条龙无人监管流程，特此开发本模块
 * 【智能练级】【智能回补】【智能组队】【智能卖石】【智能培养角色】为绑定模块，必须同时使用，其他模块并不兼容
 * 核心逻辑：
 * 1、人物会自动根据自己的队内职责进行汇报，由队长设置每队的成员数量分配，如3输出1治疗1小号。
 * 2、练级地点，在初期按照人物等级自动适配。而当组队进入战斗时，会有战斗时的playerthink来根据全员10个单位（5人5宠物）来重新规划练级区域。保证战场上最低等级的单位在最适合的区域练级
 * 3、2023.6.9整合了自动做承认之戒、自动做转职保证书、刷声望、自动传咒驯互转模块。
 * 
 * 
 * 回补逻辑：playerthink中发现ctx.result为supply之后，直接调用智能回补模块，补完后重新进入loop
 * 卖石逻辑：队长自己使用公共模块【智能卖石】，队员使用子插件【队员卖石】。
 */


var fs = require('fs');
var Async = require('async');
var supplyMode = require('../公共模块/智能回补');
var sellMode = require('../公共模块/智能卖石');
var teamMode = require('../公共模块/智能组队');
var configMode = require('../公共模块/读取战斗配置');
var update = require('../公共模块/修改配置文件');

var spawnOfAmber4Mode = require('./转职保证书');
var transferMode = require('./传咒驯互转');

var cga = global.cga;
var configTable = global.configTable;
var logbackEx = require('../公共模块/登出防卡住');

var interrupt = require('../公共模块/interrupt');
var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

// 注意回补模块顺序，先从泛用性低的开始放入数组
// 比如在矮人城镇练级，判断当前地图是肯吉罗岛之后，回补模块会直接根据（肯吉罗岛）返回去营地回补了，这是不对的。所以要先放矮人回补在前将后面回补方式短路
// 更新：现在所有的练级地点回补，被整合至一个智能回补模块了
// supplyArray中，如果前面的回补方式isAvailable()返回false的话，就找下一个回补模块
var supplyArray = [supplyMode];

var getSupplyObject = (map, mapindex) => {
	if (typeof map != 'string')
		map = cga.GetMapName();
	if (typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s) => {
		return s.isAvailable(map, mapindex);
	})
}

// 和supply模块一样，先把泛用性低的模块放在前，以免被高泛用性的模块给短路替代了。
// 更新：现在所有的卖石，被整合至一个智能卖石模块了
var sellArray = [sellMode];

var getSellObject = (map, mapindex) => {
	if (typeof map != 'string')
		map = cga.GetMapName();
	if (typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return sellArray.find((s) => {
		return s.isAvailable(map, mapindex);
	})
}

// 自动做承认之戒任务，方便批量练小号时使用
// 曙光营地酒吧有卖冰镇番茄汁料理，回复100魔力，150魔币
var autoRing = (cb) => {
	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3

	/**
	 * 无论是陪打还是正常做任务，最多保留1个承认之戒即可，多了占位置。
	 * 丢弃逻辑（包含装备栏）：
	 * 1个以上：直接无差别丢弃至只剩1个戒指。
	 * 1个：判断是否满耐，不满耐则丢弃。满耐则丢弃任务道具，中断任务
	 * 注意这个方法只适用于丢弃即消失的道具，否则地面可能会被占满，造成无限等待。
	 */
	var dropUseless = (cb2) => {
		let dropItems = cga.getItemsInfoDetail().filter(item => {
			if (item.name == '承认之戒') {
				return true
			}
			return false
		});

		if (dropItems.length > 1) {
			console.log('承认之戒大于1个，丢弃至仅剩1个')
			cga.DropItem(dropItems[0].pos);
			setTimeout(dropUseless, 2000, cb2);
		} else if (dropItems.length == 1) {
			if (dropItems[0].durabilityPer < 1) {
				console.log('承认之戒耐久不满，丢弃去领新的')
				cga.DropItem(dropItems[0].pos);
				setTimeout(dropUseless, 2000, cb2);
			} else {
				console.log('承认之戒是满耐久状态，丢弃怪物碎片，任务完毕')
				let drop = cga.findItem('怪物碎片');
				if (drop != -1) {
					cga.DropItem(drop);
				}
				setTimeout(autoRing, 2000, cb);
			}
		} else {
			setTimeout(cb2, 2000);
			return
		}
	}

	// 回滚因为特殊任务而被修改的诸多配置
	var rollBack = (cb2) => {
		// 任务下面的流程将不再需要大号带，并且单人进行，删除队伍组成
		delete thisobj.autoRing.teammates
		update.update_config({ autoRing: thisobj.autoRing }, true, () => {
			teamMode = require('../公共模块/智能组队');
			thisobj.worktype = 'train'

			// 改为逃跑
			configMode.manualLoad('战斗赶路')

			setTimeout(cb2, 1000)
		})
		return
	}

	// 任务特殊组队模式，在执行任务期间，覆盖掉teamMode，达到playerThink的定制化修改目的
	// 这么做是因为想复用playerThink，而playerThink中的组队模式，和此任务的队伍组成有所不同。
	var taskTeamMode = {
		// 智能组队在战斗中计算练级地点，这里也暂时给短路掉
		battleThink: () => {
			return
		},
		think: (ctx) => {
			if (!thisobj.autoRing.teammates) {
				console.log('thisobj.autoRing.teammates无数据，跳过think阶段')
				return false
			}
			if ((ctx.teamplayers.length < thisobj.autoRing.teammates.length && thisobj.autoRing.part == '队长') || ctx.teamplayers.length == 0) {
				ctx.result = 'logback';
				ctx.reason = '人数不足，登出';
				return false
			}
		}
	}

	if (thisobj.autoRing.aim != '无限循环' && cga.getItemCount('承认之戒', true) >= 1) {
		console.log('角色没有无限循环的任务，结束。')
		setTimeout(cb, 1000);
		return
	}

	if (cga.getItemCount('信') >= 1) {
		cga.travel.falan.toStone('C', (r) => {
			cga.travel.autopilot('谒见之间', () => {
				var obj = { act: 'item', target: '承认之戒', npcpos : [5, 3]}
				cga.askNpcForObj(obj, () => {
					setTimeout(autoRing, 1000, cb);
				})
			})
		})
		return
	}

	if (cga.getItemCount('怪物碎片') >= 1) {
		if (cga.needSupplyInitial({})) {
			supplyMode.func(() => {
				autoRing(cb)
			});
			return;
		}
		// 先处理旧的承认之戒
		dropUseless(() => {
			cga.travel.falan.toCamp(() => {
				cga.walkList([
					[52, 68, '曙光营地指挥部'],
					[69, 69, '曙光营地指挥部', 85, 2],
				], () => {
					var obj = { act: 'item', target: '信', npcpos : [95, 7] }
					cga.askNpcForObj(obj, () => {
						setTimeout(autoRing, 1000, cb);
					})
				});
			}, true)
		})
		return
	}

	// BOSS战斗胜利后房间
	if (mapindex == 44708) {
		// 重置任务数据，因为接下来没有战斗，也没有组队了
		rollBack(() => {
			cga.disbandTeam(() => {
				// 异常情况可能有：背包满了。魔石以及神之金需要自动丢弃，这部分功能在战斗配置中设置。
				var obj = { act: 'item', target: '怪物碎片', npcpos : [14, 14] }
				cga.askNpcForObj(obj, () => {
					setTimeout(autoRing, 1000, cb);
				})
			})
		})
		return
	}
	// BOSS战斗胜利之前的任何环节都需要判断队伍情况，如果被清空，则回到城里重新执行任务
	if (thisobj.autoRing && !thisobj.autoRing.teammates) {
		let doneNick = 'done'
		// 队伍中必须有一个人是没有承认之戒的，否则变成全员陪打，无法接任务
		// 为了任务效率以及稳定性，固定人数为5人，3输出1治疗1小号。
		let cusObj = {
			'check': { 'i承认之戒': { min: 0 }, 'r输出': { sum: 3 }, 'r治疗': { sum: 1 }, 'r小号': { sum: 1 } },
			'part': thisobj.autoRing.part,
			'leaderPos': [thisobj.autoRing.leaderX, thisobj.autoRing.leaderY],
			'leaderFilter': thisobj.autoRing.leaderFilter,
			'dangerLevel': 0,
			'doneNick': doneNick,
		}
		// 队长额外所需数据
		if (thisobj.autoRing.part == '队长') {
			cusObj.memberCnt = 5
		}
		cga.travel.falan.toStone('C', (r) => {
			cga.buildCustomerTeam(cusObj, (r) => {
				// 队员监听队长，需要等到超时，才判断队长是否通过队伍的人员构成，所以需要等待全员done
				cga.checkTeamAllDone(doneNick, () => {
					// 记录本次任务的队伍
					thisobj.autoRing.teammates = r.teammates
					update.update_config({ autoRing: thisobj.autoRing }, true, () => {
						cga.disbandTeam(() => {
							setTimeout(autoRing, 1000, cb);
						})
					})
				})
			})
		});
		return
	}

	// BOSS房间
	if (mapindex == 44707) {
		console.log('抵达BOSS房间')
		if (thisobj.autoRing.part == '队长') {
			cga.walkList([
				[13, 14]
			], () => {
				cga.TurnTo(14, 14);
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(1, 0);
					setTimeout(() => {
						cga.battle.waitBossBattle(44708, () => {
							setTimeout(autoRing, 1000, cb);
						})
					}, 1500);
				});
			});

		} else {
			cga.battle.waitBossBattle(44708, () => {
				setTimeout(autoRing, 1000, cb);
			})
		}

		return
	}

	if (map.indexOf('废墟地下') >= 0) {
		console.log('进入废墟...')
		// 覆盖智能组队的teamMode，为了修改playerThink中的teamMode.think逻辑。在任务结束后，记得还原
		teamMode = taskTeamMode
		// 修改ctx传给回补提醒的思考方式
		thisobj.worktype = 'task'
		// playerThink on开始前，先读取战斗配置。
		configMode.func('节能模式');

		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;

		if (thisobj.autoRing.part == '队长') {
			cga.walkRandomMazeAuto(44707, (r) => {
				setTimeout(autoRing, 1000, cb);
			})
		} else {
			cga.waitForLocation({ mapindex: 44707 }, () => {
				setTimeout(autoRing, 1000, cb);
			});
		}
		return
	}

	if (cga.needSupplyInitial({})) {
		// 小号在交任务信件时可能会在法兰城和营地之间掉一点血，此时无需回城补血，直接在营地内补血即可。不然队长容易等待超时
		if(cga.travel.switchMainMap() == '曙光骑士团营地'){
			cga.travel.toHospital(() => {
				autoRing(cb)
			})
		}else{
			supplyMode.func(() => {
				autoRing(cb)
			});
		}
		return;
	}

	if (cga.travel.switchMainMap() == '曙光骑士团营地' && (cga.getItemCount('承认之戒', true) > 0 || cga.getItemCount('团长的证明') > 0)) {

		// 此任务有bug，拿团长的证明时，信笺不一定被收走，这里丢弃一下
		var letter = cga.findItem('信笺');
		if (letter != -1) {
			cga.DropItem(letter);
		}

		let go =()=>{
			// 加少许延迟，防止过图过快，一部分人流程已经走完，而另一部分人流程还未走完。典型的bug在于过栅栏，一些人已经检测到坐标变化，另一部分人没有检测到
			setTimeout(() => {
				if (thisobj.autoRing.part == '队长') {
					cga.walkList([
						[44, 22, '废墟地下1层']
					], () => {
						setTimeout(autoRing, 1000, cb);
					});
				} else {
					cga.waitForLocation({ mapname: '废墟地下1层' }, () => {
						setTimeout(autoRing, 1000, cb);
					});
				}
			}, 2000);
			return
		}

		// 如果已经过了栅栏
		if(mapindex == 27101 && cga.GetMapXY().x > 40 && cga.getTeamPlayers().length){
			go()
			return
		}

		// 如果没过栅栏，开始等待队伍人齐
		cga.travel.autopilot('主地图', () => {
			// 任务超时时间稍微设置长点，5分钟
			cga.buildTeam({teammates : thisobj.autoRing.teammates, timeout:300000, pos : [53, 47]}, (r) => {
				if (r && r == 'ok') {
					cga.travel.autopilot(27101, () => {
						// 在本任务cga.buildCustomerTeam中，已经规定了必须有1人是没有承认之戒的。
						// 也就是仅有且必有1人会拿到团长证明。
						// 全队与NPC对话，持有【团长的证明】的人会自动将全队带入栅栏(指定坐标)，所以不需要判断各自的【团长的证明】持有情况
						var obj = { act: 'map', target: 27101, pos: [42, 22], npcpos : [40, 22], waitLocation: 27101 }
						cga.askNpcForObj(obj, go)
					})
					return
				} else if (r && r == 'timeout') {// 如果超时，则重置任务相关数据，回去重新组队
					rollBack(autoRing)
					return
				} else {
					throw new Error('cga.buildTeam返回类型错误')
				}

			})
		})
		return
	}

	if (cga.getItemCount('团长的证明') >= 1) {
		cga.travel.falan.toCamp(() => {
			setTimeout(autoRing, 1000, cb);
		}, true)
		return
	}

	if (cga.getItemCount('信笺') >= 1) {
		cga.travel.falan.toCamp(() => {
			cga.walkList([
				[52, 68, '曙光营地指挥部'],
				[69, 69, '曙光营地指挥部', 85, 2],
			], () => {
				var obj = { act: 'item', target: '团长的证明', npcpos : [95, 7] }
				cga.askNpcForObj(obj, () => {
					setTimeout(autoRing, 1000, cb);
				})
			});
		}, true)
		return
	}

	// 正常做任务的号去接任务
	if (cga.getItemCount('承认之戒', true) == 0) {
		cga.travel.falan.toStone('C', (r) => {
			cga.travel.autopilot('谒见之间', () => {
				var obj = { act: 'item', target: '信笺', npcpos : [5, 3] }
				cga.askNpcForObj(obj, () => {
					setTimeout(autoRing, 1000, cb);
				})
			})
		});
		return
	} else {// 陪打队员直接去曙光骑士团营地
		cga.travel.falan.toCamp(() => {
			setTimeout(autoRing, 1000, cb);
		}, true)
	}
	return
}

var walkMazeForward = (cb) => {
	var map = cga.GetMapName();
	if (map == '隐秘之洞地下' + (thisobj.layerLevel) + '层') {
		cb(true);
		return;
	}
	if (map == '蜥蜴洞穴') {
		cb(false);
		return;
	}
	if (map == '蜥蜴洞穴上层第' + (thisobj.layerLevel) + '层') {
		cb(true);
		return;
	}
	if (map == '黑龙沼泽' + (thisobj.layerLevel) + '区') {
		cb(true);
		return;
	}
	if (map == '迷宫入口') {
		cb(false);
		return;
	}
	if (map == '旧日迷宫第' + (thisobj.layerLevel) + '层') {
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err) => {
		if (err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('隐秘之洞地下') >= 0) {
			cb(true);
			return;
		}
		if (err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('蜥蜴洞穴上层') >= 0) {
			cb(true);
			return;
		}
		if (err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('黑龙沼泽') >= 0) {
			cb(true);
			return;
		}
		if (err && err.message == '无法找到迷宫的出口' && cga.GetMapName().indexOf('旧日迷宫第') >= 0) {
			cb(true);
			return;
		}
		walkMazeForward(cb);
	}, {
		layerNameFilter: (layerIndex) => {
			return ('隐秘之洞地下' + (layerIndex + 1) + '层') || ('蜥蜴洞穴上层第' + (layerIndex + 1) + '层') || ('黑龙沼泽' + (layerIndex + 1) + '区');
		},
		entryTileFilter: (e) => {//TODO 整合所有的练级场所的上下楼梯
			return e.colraw == 0x2EE2;
		}
	});
}

var walkMazeBack = (cb) => {
	var map = cga.GetMapName();
	if (map == '迷宫入口') {
		cb(true);
		return;
	}
	if (map == '蜥蜴洞穴') {
		cb(true);
		return;
	}
	if (map == '肯吉罗岛') {
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err) => {
		walkMazeBack(cb);
	}, {
		layerNameFilter: (layerIndex) => {
			return (layerIndex > 1 ? ('隐秘之洞地下' + (layerIndex - 1) + '层') : '肯吉罗岛') || (layerIndex > 1 ? ('蜥蜴洞穴上层第' + (layerIndex - 1) + '层') : '蜥蜴洞穴') || (layerIndex > 1 ? ('黑龙沼泽' + (layerIndex - 1) + '区') : '肯吉罗岛') || (layerIndex > 1 ? ('旧日迷宫第' + (layerIndex - 1) + '层') : '迷宫入口');
		},
		entryTileFilter: (e) => {//TODO 整合所有的练级场所的上下楼梯
			return ((cga.GetMapName() == '隐秘之洞地下1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0)) || ((cga.GetMapName() == '蜥蜴洞穴上层第1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0)) || ((cga.GetMapName() == '黑龙沼泽1区') ? (e.colraw == 0) : (e.colraw == 0x2EE0));
		}
	});
}

var moveThink = (arg) => {

	if (moveThinkInterrupt.hasInterrupt())
		return false;

	if (arg == 'freqMoveMapChanged') {
		playerThinkInterrupt.requestInterrupt();
		return false;
	}

	return true;
}

var playerThink = () => {

	if (!cga.isInNormalState()) {
		// 在切换地图时（包括迷宫上下楼），cga.isInNormalState()其实也是false，但这时无法判断战斗情况。所以这里还是要判断是否在战斗中
		if (cga.isInBattle()) {
			teamMode.battleThink()
		}
		return true;
	}
	// 承认之戒任务，若抵达BOSS房间，则中断playerthink，防止BOSS战受伤后，进入BOSS胜利房间的一瞬间触发回补登出。
	if(cga.GetMapIndex().index3 == 44707){
		console.log('抵达遗迹BOSS房间，playerThink终止')
		return false
	}
	
	// 重置战斗思考flag
	teamMode.hasBattleThink = false

	var playerinfo = cga.GetPlayerInfo();
	var items = cga.GetItemsInfo();

	var ctx = {
		playerinfo: playerinfo,
		petinfo: playerinfo.petid >= 0 ? cga.GetPetInfo(playerinfo.petid) : null,
		teamplayers: cga.getTeamPlayers(),
		dangerlevel: thisobj.getDangerLevel(),
		inventory: items.filter((item) => {
			return item.pos >= 8 && item.pos < 100;
		}),
		equipment: items.filter((item) => {
			return item.pos >= 0 && item.pos < 8;
		}),
		result: null,
		worktype: thisobj.worktype,
	}

	teamMode.think(ctx);

	global.callSubPlugins('think', ctx);

	if (cga.isTeamLeaderEx()) {
		var interruptFromMoveThink = false;

		if (ctx.result == null && playerThinkInterrupt.hasInterrupt()) {
			ctx.result = 'supply';
			interruptFromMoveThink = true;
		}

		var supplyObject = null;

		if (ctx.result == 'supply') {
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			supplyObject = getSupplyObject(map, mapindex);
			if (supplyObject && supplyObject.isLogBack(map, mapindex))
				ctx.result = 'logback';
		}

		if (ctx.result == 'supply' && supplyObject) {
			if (interruptFromMoveThink) {
				// 注销掉出迷宫逻辑，原因是所有迷宫都距离营地补给处太远，直接登出回补
				// walkMazeBack(loop);
				supplyObject.func(loop, ctx)
				return false;
			}
			else {
				moveThinkInterrupt.requestInterrupt(() => {
					if (cga.isInNormalState()) {
						// 注销掉出迷宫逻辑，原因是所有迷宫都距离营地补给处太远，直接登出回补
						// walkMazeBack(loop);
						supplyObject.func(loop, ctx)
						return true;
					}
					return false;
				});
				return false;
			}
		}
		else if (ctx.result == 'logback' || ctx.result == 'logback_forced') {
			if (ctx.reason && ctx.reason.indexOf('发生改变') != -1) {
				cga.SayWords('UNAecho脚本提醒：当前练级区域已经不适合练级，切换练级区域..', 0, 3, 1);
			}
			if (interruptFromMoveThink) {
				logbackEx.func(loop);
				return false;
			}
			else {
				moveThinkInterrupt.requestInterrupt(() => {
					if (cga.isInNormalState()) {
						logbackEx.func(loop);
						return true;
					}
					return false;
				});
				return false;
			}
		}
	} else {
		if (ctx.result == 'logback_forced') {
			logbackEx.func(loop);
			return false;
		}
	}

	return true;
}

var playerThinkTimer = () => {
	if (playerThinkRunning) {
		if (!playerThink()) {
			console.log('playerThink off');
			playerThinkRunning = false;
		}
	}

	setTimeout(playerThinkTimer, 1500);
}

var loop = () => {

	// loop主逻辑之前，检查自己是否有做任务的职责，如果有，先去完成任务
	if (thisobj.autoRing.flag) {
		if (thisobj.autoRing.aim == '无限循环') {
			console.log('人物处于无限循环的陪打状态，进入承认之戒任务..')
			callSubPluginsAsync('prepare', () => {
				setTimeout(autoRing, 1000, loop);
			});
			return
		} else if (thisobj.autoRing.aim == '一次性' && cga.getItemCount('承认之戒', true) == 0 && cga.GetPlayerInfo().level > 60) {
			console.log('监测到你需要承认之戒，但身上没有。进入承认之戒任务..')
			callSubPluginsAsync('prepare', () => {
				setTimeout(autoRing, 1000, loop);
			});
			return
		}
	}

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var mapXY = cga.GetMapXY();

	var isleader = cga.isTeamLeaderEx();

	if (isleader && teamMode.is_enough_teammates()) {
		// 如果队伍符合预期，但是是任务队伍。直接执行任务，不能进入子插件的prepare环节，否则可能会出现登出的情况
		if (teamMode.isTaskTeamReady()) {
			teamMode.doTask(loop)
			return
		}

		// 播报练级效率与练级路上的敌人数据分布
		teamMode.getEfficiency()
		if (Object.keys(teamMode.statInfo).length > 0) {
			console.log('怪物数据分布:', teamMode.statInfo)
		}

		// 矮人城镇逻辑
		if (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域') {
			cga.walkList([
				[231, 434, '矮人城镇'],
			], loop);
			return;
		}
		if (map == '矮人城镇') {
			var go = () => {
				callSubPluginsAsync('prepare', () => {
					if (cga.GetMapName() != '矮人城镇') {
						loop();
						return;
					}

					// playerThink on开始前，先读取战斗配置。
					configMode.think({ skills: cga.GetSkillsInfo() });

					playerThinkInterrupt.hasInterrupt();//restore interrupt state
					console.log('playerThink on');
					playerThinkRunning = true;

					teamMode.walkTo(() => {
						var xy = cga.GetMapXY();
						var dir = cga.getRandomSpaceDir(xy.x, xy.y);
						cga.freqMove(dir);
					})
				});
			}
			// 一般的练级地点都是回补之后到达，矮人城镇则特殊，因为需要从营地走到矮人城镇。
			// 所以loop进入时，需要回补一次，再出发练级。
			// 而营地、国民会馆则不同，因为playerthink中，监听到回补时，不解散队伍，先进行回补，再执行loop
			supplyMode.func(() => {
				if (thisobj.sellStore == 1) {
					var sellObject = getSellObject(map, mapindex);
					if (sellObject) {
						sellObject.func(go);
						return;
					}
				}
				go();
			});
			return;
		}
		// 营地逻辑
		if (map == '医院' && mapindex == 44692) {
			if (thisobj.sellStore == 1) {
				var sellObject = getSellObject(map, mapindex);
				if (sellObject) {
					sellObject.func(loop);
					return;
				}
			}
		}
		if (map == '工房' && mapindex == 44693) {
			cga.walkList([
				[30, 37, '圣骑士营地']
			], loop);
			return;
		}
		if (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '圣骑士营地门口域') {
			getSupplyObject().func(loop);
			return;
		}
		// 由于playerthink的回补会直接回医院回补，而上面mapindex44692已经涵盖了卖石逻辑，所以圣骑士营地这里不需要判断回补和卖石
		if (map == '圣骑士营地') {
			callSubPluginsAsync('prepare', () => {
				if (cga.GetMapName() != '圣骑士营地') {
					loop();
					return;
				}

				// playerThink on开始前，先读取战斗配置。
				configMode.think({ skills: cga.GetSkillsInfo() });

				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;

				teamMode.walkTo(() => {
					if (cga.GetMapName() == '矮人城镇') {
						setTimeout(loop, 1000);
					} else {
						var xy = cga.GetMapXY();
						var dir = cga.getRandomSpaceDir(xy.x, xy.y);
						cga.freqMove(dir);
					}
				})
			});
			return;
		}
		if (map == '国民会馆') {
			var go = () => {
				callSubPluginsAsync('prepare', () => {
					// playerThink on开始前，先读取战斗配置。
					configMode.think({ skills: cga.GetSkillsInfo() });

					playerThinkInterrupt.hasInterrupt();//restore interrupt state
					console.log('playerThink on');
					playerThinkRunning = true;

					teamMode.walkTo(() => {
						var xy = cga.GetMapXY();
						var dir = cga.getRandomSpaceDir(xy.x, xy.y);
						cga.freqMove(dir);
					})
				});
			}
			// 一般的练级地点都是回补之后到达，矮人城镇则特殊，因为需要从营地走到矮人城镇。
			// 所以loop进入时，需要回补一次，再出发练级。
			// 而营地、国民会馆则不同，因为playerthink中，监听到回补时，先进行回补，再执行loop
			if (thisobj.sellStore == 1) {
				var sellObject = getSellObject(map, mapindex);
				if (sellObject) {
					sellObject.func(go);
					return;
				}
			}
			return;
		}

		// 如果已经在练级区域
		if (teamMode.isDesiredMap(map, mapXY, mapindex)) {

			// playerThink on开始前，先读取战斗配置。
			configMode.think({ skills: cga.GetSkillsInfo() });

			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;

			var xy = cga.GetMapXY();
			var dir = cga.getRandomSpaceDir(xy.x, xy.y);
			cga.freqMove(dir);

			return
		}

		// playerThink on开始前，先读取战斗配置。
		configMode.think({ skills: cga.GetSkillsInfo() });

		// 如果不在练级区域，正常在集散地出发
		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;

		teamMode.walkTo(() => {
			var xy = cga.GetMapXY();
			var dir = cga.getRandomSpaceDir(xy.x, xy.y);
			cga.freqMove(dir);
		})

		return
	} else if (!isleader) {
		// 如果队伍符合预期，但是是任务队伍。直接执行任务，不能进入子插件的prepare环节，否则可能会出现登出的情况
		if (teamMode.isTaskTeamReady()) {
			teamMode.doTask(loop)
			return
		}
		
		// 播报练级效率与练级路上的敌人数据分布
		teamMode.getEfficiency()
		if (Object.keys(teamMode.statInfo).length > 0) {
			console.log('怪物数据分布:', teamMode.statInfo)
		}
		// 如果脚本运行时，队员已经在队伍中，但未读取到练级信息，则主动离队，重新进入拼车环节
		if (!teamMode.isBuildTeamReady()) {
			console.log('已经在队伍中，但未读取到练级信息，离队并回到拼车地点重新拼车')
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(loop, 1000);
			return
		}
		// playerThink on开始前，先读取战斗配置。
		configMode.think({ skills: cga.GetSkillsInfo() });

		playerThinkInterrupt.hasInterrupt();//restore interrupt state
		console.log('playerThink on');
		playerThinkRunning = true;

		return
	}

	if (thisobj.sellStore == 1 && cga.getSellStoneItem().length > 0) {
		var sellObject = getSellObject(map, mapindex);
		if (sellObject) {
			sellObject.func(loop);
			return;
		}
	}

	if (cga.needSupplyInitial({ })) {
		var supplyObject = getSupplyObject(map, mapindex);
		if (supplyObject) {
			supplyObject.func(loop, '人物未组队，自行在loop中回补。');
			return;
		}
	}

	// 如果判断任务队伍已就绪
	if (teamMode.isTaskTeamReady()) {
		callSubPluginsAsync('prepare', () => {
			teamMode.doTask(loop)
		});
		return
	}

	// 如果判断练级队伍已就绪
	if (teamMode.isBuildTeamReady()) {
		callSubPluginsAsync('prepare', () => {
			teamMode.musterWithBuildTeam(() => {
				teamMode.wait_for_teammates_timeout((r) => {
					if (!r) {
						console.log('需要重新组队，等待解散队伍..')
						cga.disbandTeam(loop)
						return
					}
					loop()
				})
			})
		});
		return
	}

	// 以前是先组队，再执行子插件的prepare
	// 现在考虑到子插件可能包含自动培养角色，会用到转职、烧声望等功能，需要去其它地方组队，所以改为先prepare再看看是否还需要练级
	callSubPluginsAsync('prepare', () => {
		teamMode.muster(() => {
			teamMode.wait_for_teammates_filter(() => {
				cga.disbandTeam(loop)
			})
		})

	})
}

var thisobj = {
	// 当前正在进行的功能，目前支持train练级和task任务2种模式
	worktype: 'train',
	// 注意：如果新增练级地点，这里的危险等级要添加，否则监听回补那里getDangerLevel为0时，根本不鸟你
	getDangerLevel: () => {
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();
		var mapindex = cga.GetMapIndex().index3;
		// 雪拉威森塔
		if (mapindex > 59800 && mapindex < 59900)
			return 2
		if (map == '盖雷布伦森林')
			return 1;
		if (map == '梅布尔隘地')
			return 1;

		if (map == '布拉基姆高地')
			return 2;
		if (map.indexOf('诅咒') >= 0) {
			return 2;
		}
		if (map.indexOf('回廊') >= 0) {
			return 2;
		}

		if (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域') {
			return 2
		}
		if (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域') {
			return 2
		}

		if (map == '肯吉罗岛' || map == '蜥蜴洞穴')
			return 1;
		if (map.indexOf('隐秘之洞地下') >= 0)
			return 2;
		if (map.indexOf('蜥蜴洞穴上层') >= 0)
			return 2;
		if (map.indexOf('黑龙沼泽') >= 0)
			return 2;
		if (map.indexOf('旧日') >= 0)
			return 2;
		if (map == '小岛')
			return 2;
		if (map.indexOf('通往山顶的路') >= 0)
			return 2;
		if (map.indexOf('半山腰') >= 0)
			return 2;
		if (map.indexOf('废墟地下') >= 0) {// 承认之戒迷宫
			return 2
		}
		return 0;
	},
	translate: (pair) => {

		if (pair.field == 'sellStore') {
			pair.field = '是否卖石';
			pair.value = pair.value == 1 ? '卖石' : '不卖石';
			pair.translated = true;
			return true;
		}

		if (pair.field == 'autoRing') {
			pair.field = '是否自动做承认之戒';
			pair.value = pair.value.flag ? '做' : '不做';
			pair.translated = true;
			return true;
		}

		if (supplyMode.translate(pair))
			return true;

		if (teamMode.translate(pair))
			return true;

		if (configMode.translate(pair))
			return true;

		if (transferMode.translate(pair))
			return true;

		return false;
	},
	loadconfig: (obj) => {

		if (!supplyMode.loadconfig(obj))
			return false;

		if (!teamMode.loadconfig(obj))
			return false;

		if (!configMode.loadconfig(obj))
			return false;

		configTable.sellStore = obj.sellStore;
		thisobj.sellStore = obj.sellStore

		if (thisobj.sellStore == undefined) {
			console.error('读取配置：是否卖石失败！');
			return false;
		}

		if (typeof obj.autoRing == 'object') {
			if (typeof obj.autoRing.flag != 'boolean') {
				console.error('读取配置：承认之戒任务数据失败！智能练级会自动帮做承认之戒任务，请明确输入相关设定。');
				return false
			}

			if (typeof obj.autoRing.part != 'string') {
				console.error('读取配置：承认之戒任务数据失败！智能练级会自动帮做承认之戒任务，请明确输入相关设定。');
				return false
			}

			if (typeof obj.autoRing.aim != 'string' || cga.role.taskRoleArr.indexOf(obj.autoRing.aim) == -1) {
				console.error('读取配置：承认之戒任务数据失败！智能练级会自动帮做承认之戒任务，请明确输入相关设定。');
				return false
			}
			configTable.autoRing = obj.autoRing
			thisobj.autoRing = obj.autoRing;
		} else {
			console.error('读取配置：承认之戒任务数据失败！智能练级会自动帮做承认之戒任务，请明确输入相关设定。');
			return false
		}

		return true;
	},
	inputcb: (cb) => {
		var stage0 = (cb2) => {
			var sayString = '【全自动练级插件】请选择是否卖石: 0不卖石 1卖石';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val >= 0 && val <= 1) {
					configTable.sellStore = val;
					thisobj.sellStore = val;

					var sayString2 = '当前已选择:' + (thisobj.sellStore == 0 ? '不卖石' : '卖石') + '。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}

		var stage1 = (cb2) => {
			var saveObj = {}

			var stage1_1 = (cb3) => {
				var sayString = '【全自动练级插件】【承认之戒】请输入此任务你是队长还是队员，0队长1队员:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && (value == 0 || value == 1)) {
						saveObj.part = value == 0 ? '队长' : '队员'

						sayString = '当前已选择: 你是【' + saveObj.part + '】';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1_2, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_2 = (cb3) => {
				var sayString = '【全自动练级插件】【承认之戒】请输入你做此任务的目的，';
				for (var i in cga.role.taskRoleArr) {
					sayString += i + cga.role.taskRoleArr[i]
				}
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value < cga.role.taskRoleArr.length) {
						saveObj.aim = cga.role.taskRoleArr[value]

						sayString = '当前已选择: 【' + saveObj.aim + '】';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1_3, 500, cb3);
						return false;
					}

					return true;
				});
			}


			var stage1_3 = (cb3) => {
				var sayString = '【全自动练级插件】【承认之戒】请输入任务队长在里谢里雅堡的X坐标:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value >= 0 && value <= 999) {
						saveObj.leaderX = value;

						setTimeout(stage1_4, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_4 = (cb3) => {
				var sayString = '【全自动练级插件】【承认之戒】请输入任务队长在里谢里雅堡的Y坐标:';

				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (value !== null && value >= 0 && value <= 999) {
						saveObj.leaderY = value;

						setTimeout(stage1_5, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1_5 = (cb3) => {
				var sayString = '【全自动练级插件】【承认之戒】请输入队长昵称过滤字符，玩家昵称中带有此输入字符才会被认定为队长(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果队长昵称里面包含ok字符，请输入$ok:';
				cga.sayLongWords(sayString, 0, 3, 1);
				cga.waitForChatInput((msg, value) => {
					if (msg !== null && msg.length > 0 && msg.indexOf(':') == -1) {
						if (msg == 'ok') {
							saveObj.leaderFilter = '';
						} else if (msg == '$ok') {
							saveObj.leaderFilter = 'ok';
						} else {
							saveObj.leaderFilter = msg;
						}

						sayString = '当前已选择玩家昵称:[' + saveObj.leaderFilter + ']为队长标志。';
						cga.sayLongWords(sayString, 0, 3, 1);

						setTimeout(stage1Final, 500, cb3);
						return false;
					}

					return true;
				});
			}

			var stage1Final = (cb3) => {
				configTable.autoRing = saveObj;
				thisobj.autoRing = saveObj;

				cb3(null)
				return
			}

			var sayString = '【全自动练级插件】【承认之戒】请输入是否自动做【承认之戒】任务，0不做1做:';
			cga.sayLongWords(sayString, 0, 3, 1);

			cga.waitForChatInput((msg, value) => {
				if (value !== null && (value == 0 || value == 1)) {
					saveObj.flag = value == 1 ? true : false

					sayString = '当前已选择: 【承认之戒】【' + (saveObj.flag ? '做' : '不做') + '】';
					cga.sayLongWords(sayString, 0, 3, 1);

					// 如果自动做承认之戒，开始输入必要信息
					if (saveObj.flag) {
						setTimeout(stage1_1, 500, cb2);
					} else {
						setTimeout(stage1Final, 500, cb2);
					}
					return false;
				}

				return true;
			});

			return
		}
		Async.series([
			configMode.inputcb,
			supplyMode.inputcb,
			teamMode.inputcb,
			spawnOfAmber4Mode.inputcb,
			stage0,
			stage1,
		], cb);
	},
	execute: () => {
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		loop();
	},
};

module.exports = thisobj;