var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){
	
	var originalPos = cga.GetMapXY();
	var originalDir = cga.GetPlayerInfo().direction;

	// 如需私人治疗，请自定义名字中的特殊字符
	var namefilter = "UNA"
	var skill = cga.findPlayerSkill('治疗');
	
	if(!skill)
	{
		console.error('提示：没有治疗技能！');
	}
	
	var loop = ()=>{

		if(cga.GetMapName() != '里谢里雅堡'){
			cga.travel.falan.toStone('C', loop);
			return
		}

		originalPos = cga.GetMapXY();
		originalDir = cga.GetPlayerInfo().direction;

		if(skill){
			var requiremp = 25 + skill.lv * 5;
			
			//补魔
			if (cga.GetPlayerInfo().mp < requiremp){
				cga.walkList([
				[34, 89],
				], ()=>{
					cga.turnTo(35, 88);
					setTimeout(()=>{
						cga.walkList([
						[originalPos.x, originalPos.y],
						], ()=>{
							cga.turnDir(originalDir);
							loop();
						});
					}, 3000);
				})
				
				return;
			}
		}
		//寻找队伍里带拐杖的玩家
		
		var teamplayers = cga.getTeamPlayers();
		
		var index = -1;
		
		for(var i in teamplayers){
			if(teamplayers[i].injury && teamplayers[i].name.indexOf(namefilter) >=0){
				index = i;
				break;
			}
		}

		//找到了
		if(skill && index != -1){
			cga.StartWork(skill.index, skill.lv-1);
			cga.AsyncWaitPlayerMenu((err, players)=>{
				
				if(players){
					for(var i in players){
						if(players[i].name == teamplayers[index].name){
							
							cga.AsyncWaitUnitMenu((err, units)=>{
								cga.AsyncWaitWorkingResult(()=>{
									loop();
								});
								cga.UnitMenuSelect(0);
							});
							cga.PlayerMenuSelect(i);
							break;
						}
					}
					return;
				}
				setTimeout(loop, 1000);
			});
			return;
		}
		//说话防掉线
		cga.SayWords('', 0, 3, 1);
		setTimeout(loop, 1000);
	}
	
	loop();
});