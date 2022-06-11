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
							console.error('钱不够了，请取钱')
							return
						}
						var currentinfo = cga.GetPlayerInfo()
						console.log('当前已消费:【' + (origingold - currentinfo.gold)+'】')
						console.log('当前已提升魅力:【' + (currentinfo.detail.value_charisma - origincharisma)+'】')
						if(currentinfo.detail.value_charisma >= targetvalue){
							return
						}else{
							retry()
						}
					}, 1000);
				});
			});
		});
	}

    // 当前地图信息
    var mapindex = cga.GetMapIndex().index3
    // 获取当前主地图名称
    var villageName = cga.travel.switchMainMap(mapindex)
    if(villageName == '法兰城'){
        cga.travel.falan.autopilot('美容院',()=>{
			cga.walkList(
				[[15, 10]], retry);
		})
        // cga.travel.toHospital(false,success)
    }else{
        cga.travel.falan.toTeleRoom(target, (r)=>{});
    }


});