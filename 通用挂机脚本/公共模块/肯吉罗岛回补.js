var supplyModeArray = [
	{
		name : '肯吉罗岛全域资深护士回补',
		func : (cb)=>{
			var map = cga.GetMapName();
			var mapXY = cga.GetMapXY();
			var mapindex = cga.GetMapIndex().index3;

			if(cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域' || map == '矮人城镇'){
				var path = [
					[163, 95],
				];

				if(map == '肯吉罗岛'){
					path.unshift([231, 434, '矮人城镇']);
				}

				cga.walkList(path, ()=>{
					cga.turnDir(0);
					setTimeout(cb, 5000);
				});
			} else if(map == '肯吉罗岛' || map == '圣骑士营地' || mapindex == 44692){
				var path = [
					[9, 11],
					[9, 12],
					[9, 11],
					[9, 12],
					[9, 11],
				];
				if(map == '肯吉罗岛'){
					path.unshift([95, 72, '医院']);
					path.unshift([551, 332, '圣骑士营地']);
				}
				else if(map == '圣骑士营地'){
					path.unshift([95, 72, '医院']);
				}

				cga.walkList(path, ()=>{
					cga.TurnTo(11, 11);
					setTimeout(cb, 5000);
				});
			}else{// 如果在异常位置，就去飞碟回补
				console.log('在神域外，执行飞碟回补')
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(cb, 5000);
				});
			}
		},
		isLogBack: (map, mapindex)=>{
			// 随机迷宫距离营地都较远，且残血走回营地也有机率阵亡。故添加随即迷宫直接登出回补
			return (map.indexOf('黑龙沼泽') >= 0 || map.indexOf('蜥蜴洞穴') >= 0 || map.indexOf('隐秘之洞地下') >= 0) ? true : false;
		},
		isAvailable: (map, mapindex)=>{
			return (map == '艾尔莎岛' || map == '里谢里雅堡' || map == '肯吉罗岛' || map == '圣骑士营地' || mapindex == 44692 || map.indexOf('黑龙沼泽') >= 0 || map.indexOf('蜥蜴洞穴') >= 0 || map.indexOf('隐秘之洞地下') >= 0) ? true : false;
		},
	},
	{
		name: '肯吉罗岛全域普通护士回补',
		func: (cb)=>{
			var map = cga.GetMapName();
			var mapXY = cga.GetMapXY();
			var mapindex = cga.GetMapIndex().index3;

			if(cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域' || map == '矮人城镇'){
				var path = [
					[163, 94],
				];

				if(map == '肯吉罗岛'){
					path.unshift([231, 434, '矮人城镇']);
				}

				cga.walkList(path, ()=>{
					cga.turnDir(0);
					setTimeout(cb, 5000);
				});
			} else if(map == '肯吉罗岛' || map == '圣骑士营地' || mapindex == 44692){
				var path = [
					[18, 15],
					[17, 15],
					[18, 15],
					[17, 15],
					[18, 15],
				];
				if(map == '肯吉罗岛'){
					path.unshift([95, 72, '医院']);
					path.unshift([551, 332, '圣骑士营地']);
				}
				else if(map == '圣骑士营地'){
					path.unshift([95, 72, '医院']);
				}

				cga.walkList(path, ()=>{
					cga.TurnTo(18, 14);
					setTimeout(cb, 5000);
				});
			}else{// 如果在异常位置，就去飞碟回补
				console.log('在神域未知地域或其他地图，执行飞碟回补')
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(cb, 5000);
				});
			}
		},
		isLogBack : (map, mapindex)=>{
			// 随机迷宫距离营地都较远，且残血走回营地也有机率阵亡。故添加随即迷宫直接登出回补
			return (map.indexOf('黑龙沼泽') >= 0 || map.indexOf('蜥蜴洞穴') >= 0 || map.indexOf('隐秘之洞地下') >= 0) ? true : false;
		},
		isAvailable : (map, mapindex)=>{
			return (map == '肯吉罗岛' || map == '圣骑士营地' || mapindex == 44692 || map.indexOf('黑龙沼泽') >= 0 || map.indexOf('蜥蜴洞穴') >= 0 || map.indexOf('隐秘之洞地下') >= 0) ? true : false;
		},
	},
	{
		name : '登出飞碟回补',
		func : (cb)=>{
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(cb, 5000);
			});
		},
		isLogBack : (map, mapindex)=>{
			return true;
		},
		isAvailable : (map, mapindex)=>{
			return true;
		},
	},
	{
		name : '登出曙光营地医院回补',
		func : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
					[42, 56, '曙光营地医院'],
					[11, 8]
				], ()=>{
					cga.TurnTo(11, 6);
					setTimeout(()=>{
						cga.walkList([
							[1, 8, '曙光骑士团营地'],
						], ()=>{
							cga.travel.falan.toCamp(cb);
						});
					}, 5000);
				})
			}, true);
		},
		isLogBack : (map, mapindex)=>{
			return true;
		},
		isAvailable : (map, mapindex)=>{
			return true;
		},
	},
]

var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	func : (cb)=>{
		thisobj.object.func(cb);
	},
	isLogBack : (map, mapindex)=>{
		return thisobj.object.isLogBack(map, mapindex);
	},
	isAvailable : (map, mapindex)=>{
		return thisobj.object.isAvailable(map, mapindex);
	},
	translate : (pair)=>{
		if(pair.field == 'supplyMode'){
			pair.field = '回补方式';
			pair.value = supplyModeArray[pair.value].name;
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		for(var i in supplyModeArray){
			if(i == obj.supplyMode){
				configTable.supplyMode = i;
				thisobj.object = supplyModeArray[i];
				break;
			}
		}

		if(!thisobj.object){
			console.error('读取配置：回补方式失败！');
			return false;
		}

		return true;
	},
	inputcb : (cb)=>{
		var sayString = '【全自动肯吉罗岛练级插件】请选择回补方式:';
		for(var i in supplyModeArray){
			if(i != 0)
				sayString += ', ';
			sayString += '(' + (parseInt(i) + 1) + ')' + supplyModeArray[i].name;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && supplyModeArray[index - 1]){
				configTable.supplyMode = index - 1;
				thisobj.object = supplyModeArray[index - 1];

				var sayString2 = '当前已选择:[' + thisobj.object.name + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);

				cb(null);

				return false;
			}

			return true;
		});
	}
}

module.exports = thisobj;