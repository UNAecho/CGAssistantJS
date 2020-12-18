var cga = require('./cgaapi')(function () {

	cga.travel.falan.toCamp(() => {
		cga.walkList([
			[116, 69, 44694],
			[41, 72]], () => {
				cga.TurnTo(41, 70);
				cga.AsyncWaitNPCDialog(()=>{
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						setTimeout(() => {
							cga.ClickNPCDialog(0, -1);
							setTimeout(() => {
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(dlg && dlg.message.indexOf('技能栏位') > 0){
										throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了')
									}else if(dlg && dlg.message.indexOf('你的钱') > 0){
										throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
									}else{
										console.log('技能学习完毕')
										if(cb){
											cb(true)
										}
									}
								});
							}, 1500);
						}, 1000);
					});
				});	
			});
	});
});