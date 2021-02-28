var cga = global.cga;
var configTable = global.configTable;

module.exports = {
	func: (cb) => {
		var path = [];
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();
		var mapindex = cga.GetMapIndex().index3;

		// 矮人卖石
		if (cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域' || map == '矮人城镇') {
			if (map == '矮人城镇') {
				path = [
					[121, 110],
				];
			}
			else if (map == '肯吉罗岛') {
				path = [
					[231, 434, '矮人城镇'],
					[121, 110],
				];
			}

			cga.walkList(path, () => {
				cga.walkTeammateToPosition([
					[121, 111],
					[121, 110],
				], () => {
					cga.turnTo(122, 110);
					cga.sellStone(() => {
						setTimeout(() => {

							if (cga.GetPlayerInfo().gold >= 990000) {
								if (cga.getTeamPlayers().length)
									cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);

								cga.walkList([
									[163, 104],
								], () => {
									cga.turnDir(0);
									cga.AsyncWaitNPCDialog(() => {
										cga.MoveGold(980000, cga.MOVE_GOLD_TOBANK);
										setTimeout(cb, 1000);
									});
								});
								return;
							}

							cb(null);

						}, cga.getTeamPlayers().length ? 5000 : 3000);
					});
				});
			});
		}// 营地卖石 
		else if (map == '圣骑士营地' || mapindex == 44692 || mapindex == 44693) {
			if (map == '医院') {
				path = [
					[0, 20, '圣骑士营地'],
					[87, 72, '工房'],
					[21, 22],
				];
			}
			else if (map == '圣骑士营地') {
				path = [
					[87, 72, '工房'],
					[21, 22],
				];
			}
			else if (map == '工房') {
				path = [
					[21, 22],
				];
			}

			cga.walkList(path, () => {
				cga.walkTeammateToPosition([
					[21, 22],
					[20, 22],
				], () => {
					cga.turnTo(21, 23);
					cga.sellStone(() => {
						setTimeout(() => {

							if (cga.GetPlayerInfo().gold >= 990000) {
								if (cga.getTeamPlayers().length)
									cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);

								cga.travel.falan.toBank(() => {
									cga.walkList([
										[11, 8],
									], () => {
										cga.turnDir(0);
										cga.AsyncWaitNPCDialog(() => {
											cga.MoveGold(980000, cga.MOVE_GOLD_TOBANK);
											setTimeout(cb, 1000);
										});
									});
								});
								return;
							}

							cb(null);

						}, cga.getTeamPlayers().length ? 5000 : 3000);
					});
				});
			});
		}else if(map == '里谢里雅堡' || map == '艾尔莎岛' || map == '法兰城'){
			var gogogo = ()=>{
				cga.walkList([
					[31, 77],
				], ()=>{
					cga.walkTeammateToPosition([
					[31, 77],
					[31, 76],
					] , ()=>{
						cga.turnTo(30, 77);
						cga.sellStone(()=>{
													
							setTimeout(()=>{
								
								if(cga.GetPlayerInfo().gold >= 990000)
								{
									if(cga.getTeamPlayers().length)
										cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
									
									cga.walkList([
									[30, 37, '圣骑士营地'],
									[116, 105, '银行'],
									[27, 23],
									], ()=>{
										cga.turnDir(0);
										cga.AsyncWaitNPCDialog(()=>{
											cga.MoveGold(980000, cga.MOVE_GOLD_TOBANK);
											setTimeout(()=>{
												cga.walkList([
												[3, 23, '圣骑士营地'],
												], cb);
											}, 1000);
										});
									});
									return;
								}
								
								cb(null);
								
							}, cga.getTeamPlayers().length ? 5000 : 3000);
						});
					});
				});
			}
			cga.travel.falan.toStone('C', gogogo);
		}

	},
	isAvailable: (map, mapindex) => {
		var map = cga.GetMapName();
		var mapXY = cga.GetMapXY();
		var mapindex = cga.GetMapIndex().index3;
		return (map == '里谢里雅堡' || map == '艾尔莎岛' || map == '圣骑士营地' || mapindex == 44692 || mapindex == 44693 || cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域' || map == '矮人城镇') ? true : false;
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