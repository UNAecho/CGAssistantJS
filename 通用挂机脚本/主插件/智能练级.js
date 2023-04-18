/**
 * UNAecho开发笔记：
 * 2023年，为了将所有角色的全自动培养整合成一条龙无人监管流程，特此开发本模块
 * 【智能练级】【智能回补】【智能组队】【智能卖石】为绑定模块，必须同时使用，其他模块并不兼容
 * 核心逻辑：
 * 	1、读取练级
 * TODO 练级的muster如果运行时就已经在集合地，直接跳过
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

var cga = global.cga;
var configTable = global.configTable;
var logbackEx = require('../公共模块/登出防卡住');

var interrupt = require('../公共模块/interrupt');
var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var cachedEntrance = null;
var blacklistEntrance = [];

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
				cga.SayWords('UNA脚本提醒：当前练级区域已经不适合练级，切换练级区域..', 0, 3, 1);
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

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var mapXY = cga.GetMapXY();

	var isleader = cga.isTeamLeaderEx();

	if (isleader && teamMode.is_enough_teammates()) {
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

	if (cga.needSupplyInitial()) {
		var supplyObject = getSupplyObject(map, mapindex);
		if (supplyObject) {
			supplyObject.func(loop, '人物未组队，自行在loop中回补。');
			return;
		}
	}

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

	teamMode.muster(() => {
		teamMode.wait_for_teammates_filter(() => {
			cga.disbandTeam(loop)
		})
	})
}

var thisobj = {
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

		return 0;
	},
	translate: (pair) => {

		if (pair.field == 'sellStore') {
			pair.field = '是否卖石';
			pair.value = pair.value == 1 ? '卖石' : '不卖石';
			pair.translated = true;
			return true;
		}

		if (supplyMode.translate(pair))
			return true;

		if (teamMode.translate(pair))
			return true;

		if (configMode.translate(pair))
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

		return true;
	},
	inputcb: (cb) => {
		Async.series([configMode.inputcb, supplyMode.inputcb, teamMode.inputcb, (cb2) => {
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
		},
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