var cga = require('../cgaapi')(function () {

	var getintoturorroom = ()=>{
		cga.TurnTo(11, 0);
		cga.AsyncWaitNPCDialog(() => {
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(1, -1)
				cga.AsyncWaitMovement({ map: 15012, delay: 1000, timeout: 5000 }, () => {
					cga.walkList([
						[11, 11],
					], () => {
						cga.SayWords('已到达咒术就职处', 0, 3, 1);
					});
				});

			});
		});
	}
	cga.travel.falan.toStone('C', () => {
		cga.walkList([
			[17, 53, '法兰城'],
			[22, 88, '芙蕾雅'],
			[201, 166],
		], () => {
			cga.TurnTo(201, 165);
			setTimeout(() => {
				cga.AsyncWaitNPCDialog(() => {
					cga.ClickNPCDialog(1, -1)
					cga.AsyncWaitMovement({ map: 15000, delay: 1000, timeout: 5000 }, () => {
						cga.walkList([
							[20, 8, '莎莲娜海底洞窟 地下2楼'],
							[32, 21],
						], () => {
							cga.TurnTo(31, 22);
							setTimeout(() => {
								cga.SayWords('咒术', 0, 3, 1);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, 0);
									cga.AsyncWaitMovement({ map: 15006, delay: 1000, timeout: 5000 }, () => {
										cga.walkList([
											[38, 37, '咒术师的秘密住处'],
											[12, 7],
											[10, 0, 15008],
											[1, 10, 15010],
											[15, 10]
										], () => {
											// 不去导师房间了，改去技能学习处 
											// getintoturorroom()
											cga.SayWords('已到达技能学习处，看看到处的书架吧', 0, 3, 1);
										});
									});
								});
							}, 1500);

						});
					});
				});
			}, 1500);
		});
	})

});