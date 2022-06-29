var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	func : (cb)=>{
		var mapindex = cga.GetMapIndex().index3;
		
		var path = [];
		if(mapindex == 2110){
			path.unshift(
				[11, 5],
				);
			cga.walkList(path, ()=>{
				cga.TurnTo(13, 5);
				setTimeout(cb, 5000);
			});
			return
		}else if(mapindex == 2100){
			path.unshift(
				[61, 53, 2110],
				);
		}else if(mapindex == 100){
			path.unshift(
				[330, 481, 2100],
				);
		}else if(mapindex == 15005){
			path.unshift(
				[10, 5, 100],
				);
		}else if(mapindex == 15003){
			path.unshift(
				[49, 46, 15005],
				);
		}else if(mapindex == 15004){
			path.unshift(
				[24, 13, 15003],
				);
		}
		cga.walkList(path, ()=>{
			thisobj.func(cb)
		});
	},
	isLogBack : (map, mapindex)=>{
		return false;
	},
	isAvailable : (map, mapindex)=>{
		if(mapindex == 2110 || mapindex == 2100 || mapindex == 100 || mapindex == 15003 || mapindex == 15004 || mapindex == 15005)
			return true;
		
		return false;
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

module.exports = thisobj;