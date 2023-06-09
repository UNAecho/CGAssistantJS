var cga = global.cga;
var configTable = global.configTable;

/**
 * 由于灵堂练级效率极低，现已改为刷声望专用回补方式
 * **/ 
module.exports = {
	func : (cb)=>{
		var map = cga.GetMapName();
		if (map == '灵堂'){
			cga.walkList([
				[31, 48, '回廊'],
				[25, 22],
				], ()=>{
					cga.TurnTo(27, 22);
					setTimeout(cb, 5000, null);
				});
		}else if (map == '回廊'){
			cga.walkList([
				[25, 22],
				], ()=>{
					cga.TurnTo(27, 22);
					setTimeout(cb, 5000, null);
				});
		}else{
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(cb, 5000);
			});
		}
	},
	isLogBack : (map, mapindex)=>{
		return false;
	},
	isAvailable : (map, mapindex)=>{
		return map == '灵堂' || map == '回廊' || '里谢里雅堡';
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}
}