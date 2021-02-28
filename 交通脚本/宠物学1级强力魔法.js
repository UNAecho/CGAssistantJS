var cga = require('../cgaapi')(function () {

	cga.travel.falan.toStone('W1', () => {
		cga.walkList([
			[106, 38, '旅馆'],
			[23, 12]
		], () => {
			cga.turnDir(6);
		});
	});


});