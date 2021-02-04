var cga = require('./cgaapi')(function () {

	var next = () => {
		cga.walkList([
			[141, 105]
		], () => {
			cga.turnTo(142, 105);
			cga.AsyncWaitNPCDialog(() => {
				cga.ClickNPCDialog(4, -1);

				cga.travel.newisland.toPUB(() => {
					cga.walkList([
						[31, 21],
					], () => {
						cga.TurnTo(30, 20);
						cga.AsyncWaitNPCDialog(() => {
							cga.SayWords('朵拉', 0, 3, 1);
							cga.AsyncWaitNPCDialog(() => {
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, 0);

									cga.travel.newisland.toStone('X', () => {
										cga.walkList([
											[130, 50, '盖雷布伦森林'],
											[246, 76, '路路耶博士的家'],
										], () => {
											cga.WalkTo(3, 10);

										});
									});
								});
							});
						});
					});
				});
			});
		});
	};

	var map = cga.GetMapName();

	if (map == '召唤之间') {
		cga.walkList([
			[4, 10],
		], ()=>{
			cga.TurnTo(4, 9);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(32, -1);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(1, -1);
						cga.LogBack();
						cga.travel.falan.toCity('艾尔莎岛', next);
					});
				});
			});
		});
	}

	else if (map == '法兰城' || map == '里谢里雅堡') {
		cga.travel.falan.toCity('艾尔莎岛', next);
	}
	else {
		cga.travel.newisland.toStone('X', next)
	}




});