/**
 * UNAecho：资深护士NPC补魔计算公式：
 * 战斗系（不包含医生和护士）所消耗的补魔金币大于：
 * (人物等级-1)*15+137
 * 即为资深补魔方便
 * 
 * 举例说明：
 * 若有一个等级为101级的人物，魔法值为4000。根据资深护士补魔的公式，计算结果数值为1637。
 * 当他将魔法耗完(0/4000)需要补魔时，在资深护士处补魔，只需花费1637G，而普通护士处补魔需要花费4000G。
 */
var supplyModeArray = [
	{
		name: '智能回补',
		func: (cb) => {
			var map = cga.GetMapName();
			var mapindex = cga.GetMapIndex().index3;
			var mapXY = cga.GetMapXY();

			console.log('智能回补，当前地图【' + map + '】')

			if (map == '矮人城镇' || cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域') {
				console.log('在矮人城镇域回补..')
				var path = [
					[163, 94],// 资深则站在[163, 95],
				];

				if (map == '肯吉罗岛') {
					path.unshift([231, 434, '矮人城镇']);
				}

				cga.walkList(path, () => {
					cga.turnDir(0);// 资深也是0方向
					setTimeout(cb, 5000);
				});
			} else if (map == '圣骑士营地'  || (cga.travel.camp.getRegion(map, mapXY) == '圣骑士营地门口域') || mapindex == 44692) {
				// 资深的情况
				// var path = [
				// 	[9, 11],
				// 	[9, 12],
				// 	[9, 11],
				// 	[9, 12],
				// 	[9, 11],
				// ];
				var path = [
					[18, 15],
					[17, 15],
					[18, 15],
					[17, 15],
					[18, 15],
				];
				if (map == '肯吉罗岛') {
					path.unshift([95, 72, '医院']);
					path.unshift([551, 332, '圣骑士营地']);
				}
				else if (map == '圣骑士营地') {
					path.unshift([95, 72, '医院']);
				}

				cga.walkList(path, () => {
					cga.TurnTo(18, 14);// 资深cga.TurnTo(11, 11);
					setTimeout(cb, 5000);
				});
			} else if (map == '曙光骑士团营地' || cga.travel.camp.getRegion(map, mapXY) == '曙光骑士团营地域') {
				// 资深的情况
				// var path = [
				// 	[11, 8],
				// 	[10, 8],
				// 	[11, 8],
				// 	[10, 8],
				// 	[11, 8],
				// ];
				var path = [
					[7, 4],
					[7, 5],
					[7, 4],
					[7, 5],
					[7, 4],
				];
				if (map == '芙蕾雅') {
					path.unshift([42, 56, '医院']);
					path.unshift([513, 282, '曙光骑士团营地']);
				}
				else if (map == '曙光骑士团营地') {
					path.unshift([42, 56, '医院']);
				}

				cga.walkList(path, () => {
					cga.TurnTo(9, 4);// 资深cga.TurnTo(11, 6);
					setTimeout(cb, 5000);
				});
			} else if (map == '国民会馆' || (mapindex >= 59801 && mapindex <= 59850)) {
				var layer = mapindex - 59800
				var path = [
					[108, 51],
					[109, 51],
					[108, 51],
					[109, 51],
					[108, 51],
				];
				if (layer >= 1 && layer <= 50) {
					// 最终都会走到1层
					path.unshift([33, 99, 59552]);
					if (layer == 10)
						path.unshift([54, 38, 59801]);
					if (layer == 15)
						path.unshift([137, 69, 59801]);
					if (layer == 20)
						path.unshift([88, 146, 59801]);
					if (layer == 25)
						path.unshift([95, 57, 59801]);
					if (layer == 30)
						path.unshift([68, 33, 59801]);
					if (layer == 35)
						path.unshift([104, 26, 59801]);
					if (layer == 40)
						path.unshift([98, 95, 59801]);
					if (layer == 45)
						path.unshift([98, 29, 59801]);
					if (layer == 50)
						path.unshift([78, 59, 59801]);
				}
				cga.walkList(path, () => {
					cga.TurnTo(108, 52);// 雪塔无资深
					setTimeout(cb, 5000);
				});
			} else {// 如果在异常位置，就去飞碟回补
				console.log('在神域未知地域或其他地图，执行飞碟回补')
				cga.travel.falan.toCastleHospital(() => {
					setTimeout(cb, 5000);
				});
			}
		},
		isLogBack: (map, mapindex) => {
			// 随机迷宫距离营地都较远，且残血走回营地也有机率阵亡。故添加随即迷宫直接登出回补
			if (map.indexOf('黑龙沼泽') >= 0) {
				return true
			} else if (map.indexOf('蜥蜴洞穴') >= 0) {
				return true
			} else if (map.indexOf('隐秘之洞地下') >= 0) {
				return true
			} else if (map.indexOf('小岛') >= 0) {
				return true
			} else if (map.indexOf('通往山顶的路') >= 0) {
				return true
			} else if (map.indexOf('半山腰') >= 0) {
				return true
			}
			return false;
		},
		isAvailable: (map, mapindex) => {
			if (map.indexOf('艾尔莎岛') >= 0) {
				return true
			} else if (map.indexOf('里谢里雅堡') >= 0) {
				return true
			} else if (map.indexOf('肯吉罗岛') >= 0) {
				return true
			} else if (map.indexOf('圣骑士营地') >= 0) {
				return true
			} else if (mapindex == 44692) {
				return true
			} else if (map.indexOf('黑龙沼泽') >= 0) {
				return true
			} else if (map.indexOf('蜥蜴洞穴') >= 0) {
				return true
			} else if (map.indexOf('隐秘之洞地下') >= 0) {
				return true
			} else if (map.indexOf('小岛') >= 0) {
				return true
			} else if (map.indexOf('通往山顶的路') >= 0) {
				return true
			} else if (map.indexOf('半山腰') >= 0) {
				return true
			} else if (map == '国民会馆' || (mapindex >= 59801 && mapindex <= 59850)){
				return true
			} else if (map == '曙光骑士团营地' || cga.travel.camp.getRegion(map, cga.GetMapXY()) == '曙光骑士团营地域') {
				return true
			}
			console.log('isAvailable不可用，请检查。map:', map, ',mapindex:', mapindex)
			return false;
		},
	},
]

var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	func: (cb) => {
		thisobj.object.func(cb);
	},
	isLogBack: (map, mapindex) => {
		return thisobj.object.isLogBack(map, mapindex);
	},
	isAvailable: (map, mapindex) => {
		return thisobj.object.isAvailable(map, mapindex);
	},
	translate: (pair) => {
		// if(pair.field == 'supplyMode'){
		// 	pair.field = '回补方式';
		// 	pair.value = supplyModeArray[pair.value].name;
		// 	pair.translated = true;
		// 	return true;
		// }
		return false;
	},
	loadconfig: (obj) => {
		// for(var i in supplyModeArray){
		// 	if(i == obj.supplyMode){
		// 		configTable.supplyMode = i;
		// 		thisobj.object = supplyModeArray[i];
		// 		break;
		// 	}
		// }

		// if(!thisobj.object){
		// 	console.error('读取配置：回补方式失败！');
		// 	return false;
		// }

		// 智能回补只有1种方式
		thisobj.object = supplyModeArray[0];
		return true;
	},
	inputcb: (cb) => {
		// var sayString = '【智能回补】请选择回补方式:';
		// for(var i in supplyModeArray){
		// 	if(i != 0)
		// 		sayString += ', ';
		// 	sayString += '(' + (parseInt(i) + 1) + ')' + supplyModeArray[i].name;
		// }
		// cga.sayLongWords(sayString, 0, 3, 1);
		// cga.waitForChatInput((msg, index)=>{
		// 	if(index !== null && index >= 1 && supplyModeArray[index - 1]){
		// 		configTable.supplyMode = index - 1;
		// 		thisobj.object = supplyModeArray[index - 1];

		// 		var sayString2 = '当前已选择:[' + thisobj.object.name + ']。';
		// 		cga.sayLongWords(sayString2, 0, 3, 1);

		// 		cb(null);

		// 		return false;
		// 	}

		// 	return true;
		// });
		cb(null)
		return
	}
}

module.exports = thisobj;