var cga = require('../cgaapi')(function(){

	if(cga.GetMapName() != '艾尔莎岛'){
		console.log('需要从新城启动')
		// return;
	}

	cga.travel.falan.toStone('C', ()=>{
		cga.walkList([
			[17, 53, '法兰城'],
			[22, 88,'芙蕾雅'],
			[134, 218, '圣拉鲁卡村'],
			[49, 81, '村长的家'],
			[8, 10, '圣拉鲁卡村的传送点'],
			[15, 4,],
		
		], (r)=>{cga.TurnTo(15,3);})

	})

});