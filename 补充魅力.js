var cga = require('./cgaapi')(function () {

	var playerinfo = cga.GetPlayerInfo();
	// 美容前的资产
	var origingold = playerinfo.gold
	// 美容前魅力
	var origincharisma = playerinfo.detail.value_charisma
	// 目标魅力数值
	var targetvalue = 100

	var retry =()=>{
		cga.turnDir(6);
		cga.AsyncWaitNPCDialog(() => {
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, 0);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					cga.ClickNPCDialog(1, 0);
					setTimeout(() => {
						if(dlg && dlg.message.indexOf('不够') >= 0){
							console.log('钱不够了，需要取钱')
							takeMoney(retry)
							return
						}
						var currentinfo = cga.GetPlayerInfo()
						console.log('当前已消费:【' + (origingold - currentinfo.gold)+'】')
						console.log('当前已提升魅力:【' + (currentinfo.detail.value_charisma - origincharisma)+'】')
						if(currentinfo.detail.value_charisma >= targetvalue){
							console.log('魅力提升完毕，执行自动存取来维持收支平衡。如果魔币足够，则退出脚本')
							takeMoney(()=>{
								cga.gui.LoadScript({
									autorestart : false,
								}, (err, result)=>{
									console.log('脚本结束，关闭自动重启脚本。')
								})
							})
							return
						}else{
							retry()
						}
					}, 1000);
				});
			});
		});
	}

	var takeMoney = (cb)=>{
		global.cga = cga
		var path = __dirname+'\\通用挂机脚本\\子插件\\自动存取'
		var obj = require(path);
		obj.prepare(()=>{
			if(cb) cb(null)
		})
		return
	}

    // 获取当前主地图名称
    var villageName = cga.travel.switchMainMap()
    if(villageName == '法兰城'){
        cga.travel.autopilot('美容院',()=>{
			cga.walkList(
				[[15, 10]], retry);
		})
        // cga.travel.toHospital(false,success)
    }else{
		cga.travel.falan.toStone('E1', ()=>{
			cga.travel.autopilot('美容院',()=>{
				cga.walkList(
					[[15, 10]], retry);
			})
		});
    }


});