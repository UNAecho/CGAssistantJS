var cga = require('./cgaapi')(function () {

	let playerinfo = cga.GetPlayerInfo();
	// 美容前的资产
	let origingold = playerinfo.gold
	// 美容前魅力
	let origincharisma = playerinfo.detail.value_charisma
	// 目标魅力数值
	let targetvalue = 100

	let retry = () => {
		cga.turnDir(6);
		cga.AsyncWaitNPCDialog(() => {
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, 0);
				cga.AsyncWaitNPCDialog((err, dlg) => {
					cga.ClickNPCDialog(1, 0);
					setTimeout(() => {
						if (dlg && dlg.message.indexOf('不够') >= 0) {
							console.log('钱不够了，需要取钱')
							takeMoney(main)
							return
						}
						let currentinfo = cga.GetPlayerInfo()
						console.log('当前已消费:【' + (origingold - currentinfo.gold) + '】')
						console.log('当前已提升魅力:【' + (currentinfo.detail.value_charisma - origincharisma) + '】')
						if (currentinfo.detail.value_charisma >= targetvalue) {
							console.log('魅力提升完毕，执行自动存取来维持收支平衡。如果魔币足够，则退出脚本')
							takeMoney(() => {
								cga.gui.LoadScript({
									autorestart: false,
								}, (err, result) => {
									console.log('脚本结束，关闭自动重启脚本。')
								})
							})
							return
						} else {
							retry()
						}
					}, 1000);
				});
			});
		});
	}

	let takeMoney = (cb) => {
		global.cga = cga
		let path = __dirname + '\\通用挂机脚本\\子插件\\自动存取'
		let obj = require(path);
		obj.manualPrepare({
			"gold": [{ "name": "金币", "upper": 300000, "lower": 100000 }]

		}, cb)
		return
	}

	let main = () => {
		// 获取当前主地图名称
		let villageName = cga.travel.switchMainMap()
		if (villageName == '法兰城') {
			cga.travel.autopilot('美容院', () => {
				cga.walkList(
					[[15, 10]], retry);
			})
			// cga.travel.toHospital(false,success)
		} else {
			cga.travel.falan.toStone('E1', () => {
				cga.travel.autopilot('美容院', () => {
					cga.walkList(
						[[15, 10]], retry);
				})
			});
		}
	}

	main()
});