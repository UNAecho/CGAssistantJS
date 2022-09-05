var cga = require('../cgaapi')(function(){


	cga.travel.falan.toTeleRoom('魔法大学', ()=>{
		cga.walkList([
		[74, 93, '魔法大学内部'],
		[40, 21],
		],()=>{
			cga.gui.LoadScript({
				autorestart : false,
			}, (err, result)=>{
				console.log('到达魔法大学，脚本结束。');
			})
		});
		return;
	});
});