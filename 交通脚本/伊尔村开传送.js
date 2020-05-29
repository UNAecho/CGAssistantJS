var cga = require('../cgaapi')(function(){

	if(cga.GetMapName() != '艾尔莎岛'){
		console.log('需要从新城启动')
		// return;
	}

	cga.travel.falan.toStone('C', ()=>{
		cga.walkList([
			[65, 53, '法兰城'],
			[281, 88,'芙蕾雅'],
			[681, 343, '伊尔村'],
			[47, 83, '村长的家'],
			[14, 17, '伊尔村的传送点'],
			[20, 10,],
		
		], (r)=>{cga.TurnTo(22,10);})

	})

});