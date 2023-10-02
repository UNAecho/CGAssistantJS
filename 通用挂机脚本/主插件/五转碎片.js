var fs = require('fs');
var Async = require('async');
var supplyMode = require('./../公共模块/肯吉罗岛回补');
var supplyCastle = require('./../公共模块/里堡回补');
var sellCamp = require('./../公共模块/营地卖石');
var sellCastle = require('./../公共模块/里堡卖石');
var teamMode = require('./../公共模块/组队模式');
var logbackEx = require('./../公共模块/登出防卡住');

var cga = global.cga;
var configTable = global.configTable;

var sellStoreArray = ['不卖石', '卖石'];

var interrupt = require('./../公共模块/interrupt');

var moveThinkInterrupt = new interrupt();
var playerThinkInterrupt = new interrupt();
var playerThinkRunning = false;

var supplyArray = [supplyMode, supplyCastle];

var getSupplyObject = (map, mapindex) => {
	if (typeof map != 'string')
		map = cga.GetMapName();
	if (typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s) => {
		return s.isAvailable(map, mapindex);
	})
}

var sellArray = [sellCamp, sellCastle];

var getSellObject = (map, mapindex) => {
	if (typeof map != 'string')
		map = cga.GetMapName();
	if (typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return sellArray.find((s) => {
		return s.isAvailable(map, mapindex);
	})
}

var loadBattleConfig = () => {
	let fileName = '练级'
	let jobObj = cga.job.getJob()

	if (jobObj.job == '传教士' && jobObj.jobLv >= 1) {
		fileName = '传教士练级'
	} else if (jobObj.job == '格斗士') {
		fileName = '格斗士练级'
	}
	cga.loadBattleConfig(fileName)
	return
}

// 隐秘的徽记、隐秘的徽记换的隐秘的水晶以及打完各洞窟BOSS所获得的净化碎片itemid信息
// key为itemid，value为限制的最少数量。其余信息只是记一下备用
var elementalEmblem = {
	// 隐秘的徽记（地）
	450949: 20,
	// 隐秘的徽记（水）
	450950: 20,
	// 隐秘的徽记（火）
	450951: 20,
	// 隐秘的徽记（风）
	450952: 20,
	// 隐秘的水晶（地）
	450953: 1,
	// 隐秘的水晶（水）
	450954: 1,
	// 隐秘的水晶（火）
	450955: 1,
	// 隐秘的水晶（风）
	450956: 1,
	// 净化的大地碎片
	450957: 1,
	// 净化的流水碎片
	450958: 1,
	// 净化的火焰碎片
	450959: 1,
	// 净化的烈风碎片
	450960: 1,
}

/**
 * 如果对应属性隐秘的徽记大于等于20或者已经换了对应属性隐秘的水晶或者已经过了隐秘之洞最下层的BOSS，视为自己在对应属性的洞窟毕业，在对应位置的昵称标注1，否则标注0
 * 
 * 昵称使用4位数字代表4属性洞窟是否毕业，index的0-3代表地水火风的洞窟，举例:
 * 1001:地属性、风属性洞窟毕业。
 * 0100:水属性洞窟毕业。
 * 0000:所有洞窟都没毕业，都需要从头收集碎片
 * 1111:所有洞窟都毕业。
 */
var showProgress = () => {
	let nick = ''

	if (cga.getItemCount(450949) >= elementalEmblem[450949] || cga.getItemCount(450953) >= elementalEmblem[450953]) {
		nick = nick + '1'
	} else {
		nick = nick + '0'
	}
	if (cga.getItemCount(450950) >= elementalEmblem[450950] || cga.getItemCount(450954) >= elementalEmblem[450954]) {
		nick = nick + '1'
	} else {
		nick = nick + '0'
	}
	if (cga.getItemCount(450951) >= elementalEmblem[450951] || cga.getItemCount(450955) >= elementalEmblem[450955]) {
		nick = nick + '1'
	} else {
		nick = nick + '0'
	}
	if (cga.getItemCount(450952) >= elementalEmblem[450952] || cga.getItemCount(450956) >= elementalEmblem[450956]) {
		nick = nick + '1'
	} else {
		nick = nick + '0'
	}

	if (cga.GetPlayerInfo().nick != nick) {
		console.log('更新需要打的洞窟状态【' + nick + '】')
		cga.ChangeNickName(nick)
	}
	return
}
// 检查本次需要打哪一个洞窟
var getMazeIndex = () => {
	let teamplayers = cga.getTeamPlayers()
	for (let i in teamplayers) {
		for (let nickIdx in teamplayers[i].nick) {
			if (teamplayers[i].nick[nickIdx] == '0') {
				return parseInt(nickIdx)
			}
		}
	}
	return -1
}

var randomMazeArgs = {
	table: null,
	filter: null,
	blacklist: [],
	expectmap: '隐秘之洞地下1层',
};

var battleAreaArray = [
	{
		name: '地洞',
		filter: (obj) => {
			return obj.cell == 3 && obj.mapx >= 450 && obj.mapx <= 600 && obj.mapy >= 200 && obj.mapy <= 300;
		},
		table: [[504, 300], [485, 272], [461, 259], [449, 247], [462, 222], [506, 235], [538, 257], [521, 269], [547, 284]]
	},
	{
		name: '水洞',
		filter: (obj) => {
			return obj.cell == 3 && obj.mapx >= 300 && obj.mapx <= 400 && obj.mapy >= 500 && obj.mapy <= 550;
		},
		table: [[379, 459], [358, 488]],
	},
	{
		name: '火洞',
		filter: (obj) => {
			return obj.cell == 3 && obj.mapx >= 400 && obj.mapx <= 450 && obj.mapy >= 400 && obj.mapy <= 450;
		},
		table: [[422, 417], [412, 439]],
	},
	{
		name: '风洞',
		filter: (obj) => {
			return obj.cell == 3 && obj.mapx >= 300 && obj.mapx <= 450 && obj.mapy >= 150 && obj.mapy <= 300;
		},
		table: [[396, 250], [395, 224], [399, 204]],
	}
]

var walkMazeBack = (cb) => {
	var map = cga.GetMapName();
	if (map == '肯吉罗岛') {
		cb(true);
		return;
	}
	cga.walkRandomMaze(null, (err) => {
		walkMazeBack(cb);
	}, {
		layerNameFilter: (layerIndex) => {
			return layerIndex > 1 ? ('隐秘之洞地下' + (layerIndex - 1) + '层') : '肯吉罗岛';
		},
		entryTileFilter: (e) => {
			return (cga.GetMapName() == '隐秘之洞地下1层') ? (e.colraw == 0) : (e.colraw == 0x2EE0);
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

	if (!cga.isInNormalState())
		return true;

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
				supplyObject.func(loop)
				return false;
			}
			else {
				moveThinkInterrupt.requestInterrupt(() => {
					if (cga.isInNormalState()) {
						// 注销掉出迷宫逻辑，原因是所有迷宫都距离营地补给处太远，直接登出回补
						// walkMazeBack(loop);
						supplyObject.func(loop)
						return true;
					}
					return false;
				});
				return false;
			}
		}
		else if (ctx.result == 'logback' || ctx.result == 'logback_forced') {
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
	var isleader = cga.isTeamLeaderEx();

	// 更新自己四属性的洞窟状态
	showProgress()

	if (isleader && teamMode.is_enough_teammates()) {
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
		if (map == '肯吉罗岛') {
			getSupplyObject().func(loop);
			return;
		}
		if (map == '圣骑士营地') {
			callSubPluginsAsync('prepare', () => {
				if (cga.GetMapName() != '圣骑士营地') {
					loop();
					return;
				}
				playerThinkInterrupt.hasInterrupt();//restore interrupt state
				console.log('playerThink on');
				playerThinkRunning = true;

				// 清理一下多余的徽记
				cga.maintainItem((it) => {
					if (it.itemid == 450949 || it.itemid == 450950 || it.itemid == 450951 || it.itemid == 450952) {
						return true
					}
					return false
				}, 20)

				// 出发去打徽记
				cga.walkList([
					[36, 87, '肯吉罗岛'],
				], () => {
					// 在这里才开始进行辨别去哪个洞窟，原因是loop()刚开始时队员可能会变更称号。
					// 因为cga.walkList([36, 87, '肯吉罗岛'])这个动作有足够的时间给队员变更称号，所以等出了营地的门，就可以决定去哪个洞窟了
					let targetMazeIdx = getMazeIndex()
					if (targetMazeIdx == -1) {
						console.log('五转碎片全队已完成，等待手动接管..')
						playerThinkInterrupt.hasInterrupt();//restore interrupt state
						playerThinkRunning = false;
						return
					}
					// 根据分析出的洞窟，给thisobj.battleArea赋值
					thisobj.battleArea = battleAreaArray[targetMazeIdx]
					console.log('本次需要打【' + thisobj.battleArea.name + '】')

					randomMazeArgs.table = thisobj.battleArea.table;
					randomMazeArgs.filter = thisobj.battleArea.filter;
					cga.getRandomMazeEntrance(randomMazeArgs, loop);
				});
			});
			return;
		}
		if (map == '隐秘之洞地下1层') {
			playerThinkInterrupt.hasInterrupt();//restore interrupt state
			console.log('playerThink on');
			playerThinkRunning = true;

			// 清理一下多余的徽记
			cga.maintainItem((it) => {
				if (it.itemid == 450949 || it.itemid == 450950 || it.itemid == 450951 || it.itemid == 450952) {
					return true
				}
				return false
			}, 20)

			// 打碎片只在1层打，练级请不要使用此脚本，可在【智能练级】中集成此处练级
			var xy = cga.GetMapXY();
			var dir = cga.getRandomSpaceDir(xy.x, xy.y);
			cga.freqMove(dir);
			return;
		}
	} else if (!isleader) {
		console.log('playerThink on');
		playerThinkRunning = true;

		// 清理一下多余的徽记
		cga.maintainItem((it) => {
			if (it.itemid == 450949 || it.itemid == 450950 || it.itemid == 450951 || it.itemid == 450952) {
				return true
			}
			return false
		}, 20)
		return;
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
			supplyObject.func(loop);
			return;
		}
	}

	callSubPluginsAsync('prepare', () => {
		cga.travel.falan.toCamp(() => {
			cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
			], () => {
				teamMode.wait_for_teammates(loop);
			});
		});
	});
}

var thisobj = {
	getDangerLevel: () => {
		var map = cga.GetMapName();

		if (map == '肯吉罗岛')
			return 1;

		if (map.indexOf('隐秘之洞地下') >= 0)
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

		return false;
	},
	loadconfig: (obj) => {

		if (!supplyMode.loadconfig(obj))
			return false;

		if (!teamMode.loadconfig(obj))
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
		Async.series([supplyMode.inputcb, teamMode.inputcb, (cb2) => {
			var sayString = '【五转碎片插件】请选择是否卖石: 0不卖石 1卖石';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val) => {
				if (val !== null && val >= 0 && val <= 1) {
					configTable.sellStore = val;
					thisobj.sellStore = val;

					var sayString2 = '当前已选择:' + sellStoreArray[thisobj.sellStore] + '。';
					cga.sayLongWords(sayString2, 0, 3, 1);

					cb2(null);

					return false;
				}

				return true;
			});
		}], cb);
	},
	execute: () => {
		loadBattleConfig()
		playerThinkTimer();
		cga.registerMoveThink(moveThink);
		callSubPlugins('init');
		logbackEx.init();
		loop();
	},
};

module.exports = thisobj;