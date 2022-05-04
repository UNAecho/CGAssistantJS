var cga = global.cga;
var configTable = global.configTable;

/**
 * 由于灵堂练级效率极低，现已改为刷声望专用回补方式
 * 会根据回补金币的消耗，来判断使用了几次得意技，进而得知烧声望的进度。
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
		}else{
			cga.walkList([
				[25, 22],
				], ()=>{
					cga.TurnTo(27, 22);
					setTimeout(cb, 5000, null);
				});
		}
	},
	isLogBack : (map, mapindex)=>{
		return false;
	},
	isAvailable : (map, mapindex)=>{
		return map == '灵堂' || map == '回廊';
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