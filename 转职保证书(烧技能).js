require('./leo/common').then(cga => {
	//leo.baseInfoPrint();

	var isMoveGold = true; //是否要去取钱，true-按设定的money取钱，false-直接去刷
	var protect = {
		minHp: 100,
        minMp: 20
    };
    
	var playerinfo = cga.GetPlayerInfo();
	var title = leo.getPlayerSysTitle(playerinfo.titles);
	var count = 0;
	//当前称号进度百分比
	var percentage = 0.0

	const profession = cga.emogua.getPlayerProfession();
	console.log('当前人物职业：【'+profession.name+'】，称号：【'+title+'】');
	
	// 判断是否满称号
	if(title =="无尽星空"){
		leo.todo().then(()=>{return console.log('你都星空了还刷个蛋，脚本结束')});
	}else{//如果不是星空，开始主逻辑。此else覆盖本脚本全部逻辑
		console.log('脚本自动判断需要多少金币烧技能');
	console.log('请不要勾选CGA面板的自动战斗，否则优先级将高于此脚本内的设置');
	var petIndex = playerinfo.petid;
	if(petIndex!=-1){
		//console.log('脚本结束：请先设置不带宠，否则可能导致掉线');
		//return;
		//设置宠物不出战
	    cga.ChangePetState(petIndex, 0);
	}

	// 自动取下水晶，注销掉是因为下面的穿水晶动作一直都不好使，导致无限重买水晶，故取消此动作。
	// emptyIndex = -1是因为下面是-1的话就跳过穿水晶动作
	// var crystal = cga.GetItemsInfo().find(i => i.pos == 7);
	// var emptyIndexes = leo.getEmptyBagIndexes();
    var emptyIndex = -1;
    // if(crystal && emptyIndexes && emptyIndexes.length > 0 ){
    // 	emptyIndex = emptyIndexes[0];
    //     cga.MoveItem(crystal.pos, emptyIndex, -1);
    // }

    if(profession.name == '传教士'){
    	//检查是否有气绝回复技能
    	var skill = cga.findPlayerSkill('气绝回复');
    	if(!skill){
    		console.log('脚本结束：人物没有学习气绝回复技能，请先到亚留特村神官理贾（42.72）处学习');
    		return;
    	}else{
    		//技能设置
		    const sets = [];
			sets.push({
				user: 1,
				check: context => context.playerUnit.curmp < protect.minMp || context.playerUnit.curhp < protect.minHp,
				type: '逃跑',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 4,
				check: context => true,
				type: '防御',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 1,
				check: context => true,
				type: '技能', skillName: '气绝回复', skillLevel: 1,
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 2,
				check: context => true,
				skillName: '防御',
				targets: context => [context.petUnit.pos]
			});
			var firstRoundDelay = 1;	//首回合延迟
			var roundDelay = 1			//每回合延迟
			var force = true ;			//是否强制启用战斗配置
			leo.autoBattle(sets,firstRoundDelay,roundDelay,force);
    	}
    }else if(profession.name == '咒术师'){
    	//检查是否有石化魔法技能
    	var skill = cga.findPlayerSkill('石化魔法');
    	if(!skill){
    		console.log('脚本结束：人物没有学习石化魔法技能，请先到法兰城（120.65）处学习');
    		return;
    	}else{
    		//技能设置
		    const sets = [];
			sets.push({
				user: 1,
				check: context => context.playerUnit.curmp < protect.minMp,
				type: '逃跑',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 4,
				check: context => true,
				type: '防御',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 1,
				check: context => true,
				type: '技能', skillName: '石化魔法', skillLevel: 1,
				targets: context => context.enemies.map(e => e.pos)
			});
			sets.push({
				user: 2,
				check: context => true,
				skillName: '防御',
				targets: context => [context.petUnit.pos]
			});
			var firstRoundDelay = 1;	//首回合延迟
			var roundDelay = 1			//每回合延迟
			var force = true ;			//是否强制启用战斗配置
			leo.autoBattle(sets,firstRoundDelay,roundDelay,force);
    	}
    }else if(profession.name == '巫师'){
    	//检查是否有恢复魔法技能
    	var skill = cga.findPlayerSkill('恢复魔法');
    	if(!skill){
    		console.log('脚本结束：人物没有学习恢复魔法技能，请先到打LB学习');
    		return;
    	}else{
    		//技能设置
		    const sets = [];
			sets.push({
				user: 1,
				check: context => context.playerUnit.curmp < protect.minMp,
				type: '逃跑',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 4,
				check: context => true,
				type: '防御',
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 1,
				check: context => true,
				type: '技能', skillName: '恢复魔法', skillLevel: 1,
				targets: context => [context.player_pos]
			});
			sets.push({
				user: 2,
				check: context => true,
				skillName: '防御',
				targets: context => [context.petUnit.pos]
			});
			var firstRoundDelay = 1;	//首回合延迟
			var roundDelay = 1			//每回合延迟
			var force = true ;			//是否强制启用战斗配置
			leo.autoBattle(sets,firstRoundDelay,roundDelay,force);
    	}
    }else{
    	console.log('脚本结束：人物的职业有误，必须是传教士或者咒术师、巫师');
    	return;
    }

    //拿称号
	var getTitle = () => {
		var per = 0
		return leo.todo()
		.then(()=>leo.goto(n => n.falan.e1))
		.then(()=>leo.autoWalk([230, 84]))
		.then(()=>leo.turnDir(6))
		.then(()=>leo.autoWalk([235, 107]))
		.then(()=>leo.turnDir(2))
		.then(()=>{
			playerinfo = cga.GetPlayerInfo();
			var newTitle = leo.getPlayerSysTitle(playerinfo.titles);
			leo.waitNPCDialog(dlg => {
			if (dlg && dlg.message) {
				if(dlg.message.indexOf('一点兴趣') >= 0||dlg.message.indexOf('新称号而努力') >= 0){
					per = 0
				}else if(dlg.message.indexOf('四分之一') >= 0){
					per = 0.25
				}else if(dlg.message.indexOf('毛毛虫美少女') >= 0){
					per = 0.5
				}else if(dlg.message.indexOf('再加把劲') >= 0){
					per = 0.75
				}else{
					per = 1
				}
				leo.delay(1000);
				if(newTitle == title){
					if(per != percentage){
						console.log('称号未更新但有进展，称号进度前进了【' + ((per - percentage)*100).toString() +'%】')
					}else{
						console.log('【注意】：称号无进展，该转职解声望锁了')
					}
				}else{
					console.log('获得新称号【'+newTitle+'】，当前称号进度为【'+(per*100).toString()+'%】')
					if(newTitle == '蕴含的太阳'){
						console.log('提醒：下次转职可以解锁【敬畏的寂静】，为最终称号前置称号。\n如果要学习其它职业必备技能（如补血、洁净），请注意下次需要转成对应职业。')
					}else if(newTitle == '敬畏的寂静'){
						console.log('提醒：下次转职可以解锁【无尽星空】，如果要学【完美驯兽术】，下一次要转【驯兽师】了')
					}
				}
				return leo.next()
			}
		})})
		.then(()=>leo.autoWalkList([
			[238,111,'银行'],[11,8]
		]))
		.then(()=>leo.turnDir(0))
		.then(()=>leo.moveGold(10000,cga.MOVE_GOLD_FROMBANK))
		.then(()=>leo.autoWalk([2,13,'法兰城']))
		.then(()=>leo.autoWalk([234,108]))
		.then(()=>leo.turnDir(0))
		.then(()=>leo.done());
	}
	//自动判断需要多少钱
	var needGold = 0
	if(!isMoveGold){
		needGold = playerinfo.gold;
	}
	leo.todo()
    //找阿蒙更新称号，并找阿梅问当前称号进度
	.then(()=>{
		return leo.goto(n => n.falan.e2)
		.then(()=>leo.autoWalk([230, 84]))
		.then(()=>leo.turnDir(6))
		.then(()=>leo.autoWalk([235, 107]))
		.then(()=>leo.turnDir(2))
		.then(()=>{
			leo.waitNPCDialog(dlg => {
			if (dlg && dlg.message) {
				if(dlg.message.indexOf('一点兴趣') >= 0||dlg.message.indexOf('新称号而努力') >= 0){
					percentage = 0
				}else if(dlg.message.indexOf('四分之一') >= 0){
					percentage = 0.25
				}else if(dlg.message.indexOf('毛毛虫美少女') >= 0){
					percentage = 0.5
				}else if(dlg.message.indexOf('再加把劲') >= 0){
					percentage = 0.75
				}else{
					percentage = 1
				}
				leo.delay(1000);
				// 计算还需使用多少次得意技
				playerinfo = cga.GetPlayerInfo();
				const reputationInfos = require('./常用数据/reputation.js');
				var skillcount = reputationInfos(leo.getPlayerSysTitle(playerinfo.titles),percentage)
				if(profession.name == '传教士'){
					needGold = skillcount * 5 + 1000
				}else if(profession.name == '咒术师'){
					needGold = skillcount * 5 + 1000
				}else if(profession.name == '巫师'){
					needGold = skillcount * 15 + 1000
				}else{
					console.log('脚本结束：人物的职业有误，必须是传教士或者咒术师、巫师');
					return;
				}
				console.log('当前称号【'+title+'】' + '进度为【' + (percentage*100).toString() +'%】' + ', 需要使用：【'+ skillcount +'】次技能'+', 所消耗的魔币为 : 【' + needGold +'】')
				return leo.next()
			}
		})})
	})
	.then(()=>{
		playerinfo = cga.GetPlayerInfo();
		if(playerinfo.gold != needGold){
			return leo.autoWalkList([
				[238,111,'银行'],[11,8]
			])
			.then(()=>leo.turnDir(0))
			.then(()=>leo.moveGold(playerinfo.gold,cga.MOVE_GOLD_TOBANK))
			.then(()=>leo.moveGold(needGold,cga.MOVE_GOLD_FROMBANK))
			.then(()=>{
				playerinfo = cga.GetPlayerInfo();
				if(playerinfo.gold != needGold){
					return console.log('魔币不足，请检查')
					.then(()=>leo.reject());
				}
			})
			.then(()=>leo.logBack());
		}
	})
	.then(()=>{
		return leo.goto(n => n.castle.x)
		.then(()=>leo.autoWalkList([
			[47,85,'召唤之间'],[27,8,'回廊']
		]));
	})
	.then(()=>{
		return leo.loop(
			()=>leo.todo()
			.then(()=>{
				playerinfo = cga.GetPlayerInfo();
				if(playerinfo.gold <= 1000){
					return leo.log('已刷够魔币')
					.then(()=>{
						console.log('恢复宠物出战状态')
						if(petIndex!=-1){
							//恢复宠物出战状态
						    cga.ChangePetState(petIndex, cga.PET_STATE_BATTLE);
						}
						return leo.delay(500);
					})
					.then(()=>{
						if(emptyIndex!=-1){
							console.log('穿水晶')
							//自动穿上水晶
						    cga.MoveItem(emptyIndex, 7, -1);
						}
						return leo.delay(500);
					})
					.then(()=>getTitle())
					.then(()=>leo.reject());
				}
				var mapInfo = cga.getMapInfo();
				if(mapInfo.name == '回廊'){
					return leo.autoWalk([25,22])
					.then(()=>leo.supply(26,22))
					.then(()=>{
						var nowTime = leo.now();
						var time = parseInt((nowTime - leo.beginTime)/1000/60);//已持续练级时间
						time = time==0?1:time;
						if(count++>0){
							playerinfo = cga.GetPlayerInfo();
							var usedGold = needGold - playerinfo.gold;
							return console.log('第'+count+'轮回补，共耗时'+time+'分钟，已消耗'+usedGold+'魔币');
						}else{
							return leo.next();
						}

					})
					.then(()=>leo.autoWalk([23,19,'灵堂']));
				}
				if(mapInfo.name == '灵堂'){
					return leo.autoWalk([30, 49])
					.then(() => leo.encounterTeamLeader(protect)) 	//队长遇敌
					.then(() => {
                        // console.log(leo.logTime() + "触发回补");
                        return leo.autoWalk([31,48,'回廊'])
                        .then(() => leo.delay(1000));
                    });
				}
				return leo.delay(5000);
			})
		);
	})
	.catch(()=>{return console.log('结束脚本')});
	}
});