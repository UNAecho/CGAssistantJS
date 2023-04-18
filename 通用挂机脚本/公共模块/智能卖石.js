var cga = global.cga;
var configTable = global.configTable;

const sellerInfo = {
	'工房': {
		pos: [21, 23],
		outSide: '圣骑士营地门口域',
		back: [551, 332, '圣骑士营地'],
	},
	'矮人城镇': {
		pos: [122, 110],
		outSide: '矮人城镇域',
		back: [[231, 434, '矮人城镇']],
	},
	'里谢里雅堡': {
		pos: [30, 77],
		outSide: null,
		back: null,
	},
	'国民会馆': {
		pos: [110, 42],
		outSide: 59801,
		back: [33, 99, 59552],
	},
}

/**
 * 雪拉森威塔卖石NPC[110, 42]
 * 人物站位[110, 43][109, 43]
 */
var thisobj = {
	func: (cb) => {
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();
		var mapindex = cga.GetMapIndex().index3;
		// 首先检查郊外情况
		var region = cga.travel.camp.getRegion(map, mapXY)

		if (region != null) {
			for (const k in sellerInfo) {
				if (sellerInfo[k].outSide !== null && (sellerInfo[k].outSide == region || sellerInfo[k].outSide == mapindex)) {
					if (typeof sellerInfo[k].back == 'function') {
						sellerInfo[k].back(() => {
							thisobj.func(cb)
						})
						return
					}
					cga.walkList(sellerInfo[k].back, () => {
						thisobj.func(cb)
					});
					return
				}
			}
		}

		// 本次商人信息
		var sellObj = sellerInfo[map]
		// 主逻辑
		var go = (cb) => {
			var talkPos = cga.get2RandomSpace(sellObj.pos[0], sellObj.pos[1])
			cga.walkList([talkPos[0]], () => {
				cga.walkTeammateToPosition([
					talkPos[0],
					talkPos[1],
				], () => {
					cga.turnTo(sellObj.pos[0], sellObj.pos[1]);
					cga.sellStone(() => {
						setTimeout(() => {
							if (cga.GetPlayerInfo().gold >= 980000) {
								if (cga.getTeamPlayers().length)
									cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
								setTimeout(cb, 1000);
								return;
							}
							cb(null);
						}, cga.getTeamPlayers().length ? 5000 : 3000);
					});
				});
			});
		}

		if (map == '圣骑士营地' || mapindex == 44692) {
			cga.travel.autopilot('工房', () => {
				thisobj.func(cb)
			})
			return
		}

		console.log('智能卖石，当前地图【' + map + '】')

		// 其他情况，去里堡执行逻辑
		if (!sellObj) {
			cga.travel.falan.toStone('C', () => {
				thisobj.func(cb)
			});
			return
		}

		go(cb)
		return
	},
	isAvailable: (map, mapindex) => {// 本模块的目的就是为了整合全部地点，如果是暂时不持支的情况，就去里堡卖石
		return true
	},
	translate: (pair) => {
		return false;
	},
	loadconfig: (obj) => {
		return true;
	},
	inputcb: (cb) => {
		cb(null);
	}
}

module.exports = thisobj