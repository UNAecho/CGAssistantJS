require(process.env.CGA_DIR_PATH_UTF8+'/leo').then(async (cga) => {

	//leo.baseInfoPrint();
	leo.say('红叶の护士烧急救脚本，启动~');

	var itemName = '血之耳环的仿造品'
	var playerinfo = cga.GetPlayerInfo();

	var pos = [33, 90];
	var minMp = 100;

	var skillName = '急救';
	var skillLevel = null;
	switch (playerinfo.job) {
		case '实习护士':
			skillLevel = 4;
			break
		case '护士':
			skillLevel = 6;
			break
		case '资深护士':
			skillLevel = 8;
			break
		case '护士长':
			skillLevel = 10;
			break
		case '护理专家':
			skillLevel = 10;
			break
		case '白衣天使':
			skillLevel = 10;
			break
		default:skillLevel = -1
	}
	if(skillLevel == -1){
		console.log('你不是护士，请手动输入需要练级的等级')
		cga.SayWords('你不是护士，请手动输入需要练级的等级(1-10级):', 0, 3, 1);

		cga.waitForChatInput((msg, val)=>{
			val = int(val)
			if(val !== null && val >= 1 && val <= 10){
				skillLevel = val
				cga.SayWords('当前自定义需要练的等级: ' + val, 0, 3, 1);
				return false;
			}
			return true;
		});
		
	}

	// 急救双百专用
	var forgetandlearnskill = ()=>{
		var dialogHandler = (err, dialog)=>{
			if(dialog){
				var hasSkill = cga.findPlayerSkill('急救') ? true : false;
				if( hasSkill )
				{
					if (dialog.type == 16) {
						cga.ClickNPCDialog(-1, 1);
						cga.AsyncWaitNPCDialog(dialogHandler);
						return;
					}
					if (dialog.type == 18) {
						const skillIndex = cga.GetSkillsInfo().sort((a,b) => a.pos - b.pos).findIndex(s => s.name == '急救');
						if (skillIndex > -1) {
							cga.ClickNPCDialog(0, skillIndex);
							cga.AsyncWaitNPCDialog(dialogHandler);
							return;
						}
					}
				}
				if (dialog.options == 12) {
					cga.ClickNPCDialog(4, -1);
					cga.AsyncWaitNPCDialog(dialogHandler);
					return;
				}
				//重新学习
				if (dialog.message.indexOf('已经删除') >= 0 || !hasSkill) {
					setTimeout(()=>{
						cga.TurnTo(12, 30);
						cga.AsyncWaitNPCDialog((dlg)=>{
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog((dlg2)=>{
								cga.ClickNPCDialog(0, 0);
							});
						});
					}, 1000);
					return;
				}
			}
		}
		cga.AsyncWaitNPCDialog(dialogHandler);
	}

	console.log('当前急救技能上限为: ' + skillLevel)

	var skill = cga.findPlayerSkill('急救');

	var takeOff = ()=>{
		playerinfo = cga.GetPlayerInfo();
		if (playerinfo.hp == playerinfo.maxhp) {
			//脱下装备
			var item = cga.getEquipItems().filter(equip => {
                if(equip.name == itemName){
                    return true;
                }
            });
            if(item && item.length > 0){
            	var emptyIndex = leo.getEmptyBagIndexes();
            	if(emptyIndex && emptyIndex.length > 0){
            		cga.MoveItem(item[0].pos, emptyIndex[0], -1);
            	}
            }
            return leo.delay(1000);
		}
	}

	var putOn = ()=>{
		playerinfo = cga.GetPlayerInfo();
		if (playerinfo.hp == playerinfo.maxhp) {
			//穿上装备
			var item = cga.getInventoryItems().filter(equip => {
                if(equip.name == itemName){
                    return true;
                }
            });
            if(item && item.length > 0){
            	cga.UseItem(item[0].pos);
            }
            return leo.delay(1000);
		}
	}

	if(!skill){
		console.error('提示：没有急救技能！');
	}else{
		var currentMap = cga.GetMapName();
        
		leo.todo().then(()=>{
			if (currentMap != '里谢里雅堡') {
				return leo.goto(n => n.castle.x);
        	}
		})
		.then(()=>leo.autoWalk(pos))
		.then(()=>{
			return leo.loop(
				()=>leo.todo()
				.then(()=>{
					if(cga.GetPlayerInfo().mp < minMp){
						return leo.autoWalk([34, 89])
						.then(()=>leo.supply(35, 88))
						.then(()=>leo.autoWalk(pos))
						.then(()=>{
							skill = cga.findPlayerSkill(skillName);
							if(skillLevel <= skill.lv){
						        leo.log('红叶の护士烧急救脚本，提示：技能【'+skillName+'】等级已达到【'+skill.lv+'】，达到或者超过了预设的目标等级【'+skillLevel+'】，脚本结束');
						        return leo.reject();
						    }else{
								return
						    }
						});
					}else{
						skill = cga.findPlayerSkill(skillName);
						if(skillLevel <= skill.lv){
							// 是否刷急救双百
							if(forgetflag){
								return leo.todo()
								.then(()=>leo.autoWalkList([[41, 98, '法兰城'],[82, 83, '医院'],[12, 31]]))
								.then(()=>leo.turnTo(12, 29))
								.then(()=>forgetandlearnskill())
							}else{
								leo.log('红叶の护士烧急救脚本，提示：技能【'+skillName+'】等级已达到【'+skill.lv+'】，达到或者超过了预设的目标等级【'+skillLevel+'】，脚本结束');
								return leo.reject();
							}
						}else{
							return
						}
					}
				})
				.then(()=>{
					const skill = cga.GetSkillsInfo().find(s => s.name == '急救');
					const requireMp = 50;
					playerinfo = cga.GetPlayerInfo();
					if (playerinfo.hp < playerinfo.maxhp && skill && playerinfo.mp >= requireMp) {
						var lv = skill.lv - 1;
						//lv = 0;	//始终用1级技能
						cga.StartWork(skill.index, lv);
						cga.AsyncWaitPlayerMenu((error, players) => setTimeout(() => {
	                        if (players && players.length > 0) {
	                            const index = players.findIndex(p => p.name == playerinfo.name);
	                            if (typeof index == 'number') {
	                                cga.PlayerMenuSelect(index);
	                                cga.AsyncWaitUnitMenu((error, units) => setTimeout(() => {
	                                    if (error) {
	                                        leo.next();
	                                    } else {
	                                        cga.UnitMenuSelect(0);
	                                    }
	                                }, 0));
	                            } else leo.next();
	                        } else leo.next();
	                    }, 0), 2000);
					} else{
						return leo.next();
					}
				})
				.then(()=>putOn())
				.then(()=>takeOff())
				.then(()=>leo.delay(1000))
			);
		});
	}

	var i = 0;
	var autoTalk = ()=>{
		leo.say('说话防掉线',i);
		++i > 4 ? (i = 0) : 0;
		setTimeout(autoTalk, 60000);
	}
	autoTalk();
});