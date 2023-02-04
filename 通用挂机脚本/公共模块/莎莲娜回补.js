var cga = global.cga;
var configTable = global.configTable;
var PF = require('pathfinding');

module.exports = {
	func : (cb)=>{
		console.log('莎莲娜回补模块开始...')
		// TODO 默认非资深回补，需要添加资深回补逻辑
		if(module.exports.isInVillage()){
			cga.travel.toHospital(cb)
			return
		}
		// 杰诺瓦各村口的入口
		const northDoor = [224, 443, 4000]
		const westDoor = [217, 456, 4000]
		const eastDoor = [264, 434, 4000]
		const doorList = [westDoor ,northDoor, eastDoor]

		// 蒂娜村入口
		const dina = [570, 275, 4200]
		// 阿巴尼斯入口
		const abanisi = [184, 161, 4300]
		// 魔法大学入口
		const university = [118, 100, 4400]

		var mapindex = cga.GetMapIndex().index3
		var xy = cga.GetMapXY();
		var x = xy.x
		var y = xy.y

		// 临时用于计算的路径变量
		var tmppath = null
		var tmpWalkList = null

		// 行走最短距离
		module.exports.minDis = !module.exports.minDis ? 999 : module.exports.minDis

		// 400是杰诺瓦和蒂娜郊外的莎莲娜
		if(mapindex == 400){
			// 如果蒂娜村适合回补，就去蒂娜
			if(x > 428 && cga.getTimeRange() == '白天'){
				cga.walkList([
					dina,
					], ()=>{
						setTimeout(module.exports.func, 1500, cb);
					});
				return
			}
			for (var d in doorList){
				try {
					tmppath = PF.Util.expandPath(cga.calculatePath(x, y, doorList[d][0], doorList[d][1], doorList[d][2], null, null, []));
					if(tmppath.length < module.exports.minDis){
						module.exports.minDis = tmppath.length
						tmpWalkList = doorList[d]
					}
				} catch (error) {
					if(error.message.indexOf('下载地图') == -1){
						throw new Error('意料之外的地图计算错误，请检查,error:' + error.message)
					}
				}
			}
		}else if(mapindex == 402){//402是阿巴尼斯和魔法大学外面的莎莲娜。
			if(x < 152){
				tmpWalkList = university
			}else{
				tmpWalkList = abanisi
			}
		}else if(mapindex == 4201){// 误入夜晚蒂娜村
			tmpWalkList = [29,21,'莎莲娜']
		}

		if(!tmpWalkList){
			cb(new Error('错误，当前地图可能不是莎莲娜郊外'))
		}

		cga.walkList([
			tmpWalkList,
			], ()=>{
				setTimeout(module.exports.func, 1500, cb);
			});
		return
	},
	isLogBack : (map, mapindex)=>{
		return false;
	},
	isInVillage : ()=>{
		var mainMapName = cga.travel.switchMainMap()
		var countryArr = ['杰诺瓦镇','魔法大学','阿巴尼斯村','蒂娜村'] 
		if (countryArr.indexOf(mainMapName) != -1){
			return true
		}
		return false
	},
	isAvailable : ()=>{
		// TODO 魔法大学一些任务地图无法回补，需补全
		var mapindex = cga.GetMapIndex().index3
		// 400是杰诺瓦和蒂娜郊外的莎莲娜，402是阿巴尼斯和魔法大学外面的莎莲娜
		if ((mapindex == 400 || mapindex == 402) || module.exports.isInVillage()){
			return true
		}
		
		return false
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