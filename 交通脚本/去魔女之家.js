var cga = require('../cgaapi')(function(){

	cga.travel.falan.toStone('W1', ()=>{
		cga.walkList([
			[22, 88, '芙蕾雅'],
			[298, 148],
		], ()=>{
			cga.task.waitForNPC('神木', ()=>{
				var npc = cga.findNPC('神木');
				var target = cga.getRandomSpace(npc.xpos,npc.ypos);
				cga.walkList([
				target
				], ()=>{
					cga.turnTo(npc.xpos, npc.ypos);
					cga.AsyncWaitNPCDialog(()=>{
						cga.SayWords('魔术', 0, 3, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({map:['魔女之家'], delay:1000, timeout:5000}, ()=>{
								console.log('到达魔女之家')
							});
						});
					});
				});
			});
		});
	});
});