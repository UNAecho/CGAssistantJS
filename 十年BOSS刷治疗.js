var cga = require('./cgaapi')(function(){
	// 指定私人医生
	var personaldoctor = 'UNAの护士'
	var interrupt = require('./通用挂机脚本/公共模块/interrupt');
	var moveThinkInterrupt = new interrupt();
	var dialogHandler = (err, dlg)=>{

		if(dlg && (dlg.options & 4) == 4)
		{
			cga.ClickNPCDialog(4, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		if(dlg && (dlg.options & 32) == 32)
		{
			cga.ClickNPCDialog(32, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else if(dlg && dlg.options == 1)
		{
			cga.ClickNPCDialog(1, 0);
			return;
		}else if(dlg && dlg.options == 8)
		{
			cga.ClickNPCDialog(8, 0);
			return;
		}
		else if(dlg && dlg.options == 3)
		{
			cga.ClickNPCDialog(1, 0);
			cga.AsyncWaitNPCDialog(dialogHandler);
			return;
		}
		else
		{
			return;
		}
	}

	var needsupply =()=>{
		if(cga.GetPlayerInfo().health == 0){
			setTimeout(loop, 1500);
			return;
		}
		
		var retry = ()=>{
			
			if(cga.GetPlayerInfo().health == 0){
				
				if(cga.getTeamPlayers().length > 0){
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					setTimeout(loop, 1500);
					return;
				}
				return;
			}

			var doctor = cga.findPlayerUnit((u)=>{
				if (u.unit_name == personaldoctor){
				return true
			}});
						
			if(doctor && cga.getTeamPlayers().length == 0){
				var target = cga.getRandomSpace(doctor.xpos,doctor.ypos);
				cga.walkList([
				target
				], ()=>{
					cga.addTeammate(doctor.unit_name, (r)=>{
						setTimeout(retry, 1500);
					})
				});
			} else {
				setTimeout(retry, 1500);
			}
		}
		
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
			[27, 82],
			], retry);
		});
	}

	var waitBOSS = ()=>{
		if(cga.isInBattle())
		{
			setTimeout(waitBOSS, 1000);
			return;
		}
		
		return
	}

	var fight = ()=>{
		if(cga.GetPlayerInfo().health == 0){
			cga.turnTo(15, 110);
			cga.AsyncWaitNPCDialog(dialogHandler);
			setTimeout(waitBOSS, 1500);
		}
	}
	var battle = ()=>{
		// console.log('cga.GetPlayerInfo().health = ' + cga.GetPlayerInfo().health)
		if(cga.GetPlayerInfo().health >0){

			moveThinkInterrupt.requestInterrupt(()=>{
				if(cga.isInNormalState()){
					needsupply()
					return true;
				}
				return false;
			});
			return false;

		}else{
			setTimeout(fight, 1500);
		}
		setTimeout(battle, 500);
		return
	}
	var loop = ()=>{

		if(cga.GetPlayerInfo().health >0){

			moveThinkInterrupt.requestInterrupt(()=>{
				if(cga.isInNormalState()){
					needsupply()
					return true;
				}
				return false;
			});
			return false;

		}

		//进入追忆之路
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
			[30, 81]
			], ()=>{
				cga.turnTo(30, 80);
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.AsyncWaitMovement({map:'追忆之路', delay:1000, timeout:5000}, (err)=>{
					if(err){//不知道什么原因没进去，重试一次
						loop()
						return;
					}
					cga.walkList([
						[15, 111]
						], ()=>{
							cga.turnTo(15, 110);
							cga.AsyncWaitNPCDialog(dialogHandler);
							battle()
							return
						});
				});
			});
		});
	}

	
	loop();
});