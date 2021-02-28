var fs = require('fs');
require('./leo/common').then(cga=>{
	//leo.baseInfoPrint();
	//没有转职保证书也强制转职，可设置成true，默认false，
	var forceChange = false;
	var needGold = 10000;
	var isLogBackFirst = true;
	var prepareOptions = {
        rechargeFlag: 1,
        repairFlag: -1,
        doctorName: ''
    };
	//自动逃跑，注意需要关闭自动战斗，UI上的自动战斗优先级高。
	//战斗设置
	const sets = [];
	sets.push({
		user: 5,
		check: context => true,
		type: '逃跑',
		targets: context => [context.player_pos]
	});
	//     sets.push({
    //     user: 2,
    //     check: context => true,
    //     skillName: '防御',
    //     targets: context => [context.petUnit.pos]
    // });
	var firstRoundDelay = 1;	//首回合延迟
	var roundDelay = 5000			//每回合延迟
	var force = true ;			//是否强制启用战斗配置
	leo.autoBattle(sets,firstRoundDelay,roundDelay,force);

	var isCanChange = true;
	var hasItem = cga.getItemCount('转职保证书') > 0;
	if(!forceChange && !hasItem){
		leo.log('身上【没有】转职保证书！结束脚本');
		isCanChange = false;
	}

	if(hasItem){
		leo.log('身上【有】转职保证书');
	}else{
		leo.log('身上【没有】转职保证书!!!');
	}

	var nexttask = ()=>{
		global.cga = cga
		console.log('准备进入刷声望环节');
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\转职保证书(烧技能).js",
		}
		var settingpath = rootdir +'\\战斗配置\\灵堂烧声望.json';
		var setting = JSON.parse(fs.readFileSync(settingpath))
		scriptMode.call_ohter_script(body,setting)
	
	}
	leo.todo()
	.then(()=>{
		var playerinfo = cga.GetPlayerInfo();
		if(playerinfo.gold < needGold){
			return leo.goto(n => n.falan.bank)
			.then(()=>leo.turnDir(0))
			.then(()=>leo.moveGold(needGold,cga.MOVE_GOLD_FROMBANK))
			.then(()=>{
				playerinfo = cga.GetPlayerInfo();
				if(playerinfo.gold < needGold){
					return leo.log('魔币不足，请检查')
					.then(()=>leo.reject());
				}
			});
		}
	})
	.then(()=>{
		var crystal = cga.GetItemsInfo().find(i => i.pos == 7);
		if(!crystal){
			var crystalName = '水火的水晶（5：5）';
			return leo.buyCrystal(crystalName,1)
			.then(()=>leo.useItemEx(crystalName));
		}
	})
	.then(()=>{
		if(isCanChange){
			var playerinfo = cga.GetPlayerInfo();
			var profession = leo.getPlayerProfession();
			if(profession.name == '传教士'){
				//当前是传教，转成咒术
				leo.log('当前职业：'+playerinfo.job+'，需要转成咒术');
				leo.todo().then(()=>{
					if(isLogBackFirst){
						return leo.logBack();
					}else{
						return leo.next();
					}
				})
				.then(()=>{
					return leo.prepare(prepareOptions)	//招魂、治疗、补血、卖石
					.then(()=>leo.goto(n => n.falan.w1))
					.then(()=>leo.autoWalkList([[22, 88, '芙蕾雅'],[200, 165]]));
				})
				.then(()=>{
					return leo.talkNpc(201, 165,leo.talkNpcSelectorYes,'莎莲娜海底洞窟 地下1楼');
				})
				.then(()=>{
					return leo.autoWalkList([
						[20, 8 ,'莎莲娜海底洞窟 地下2楼'],[32, 21]
					]);
				})
				.then(()=>leo.turnTo(31, 22))
				.then(()=>leo.delay(1000))
				.then(()=>{
					cga.SayWords('咒术', 1, 3, 1);
					return leo.waitNPCDialog(dialog => {
						cga.ClickNPCDialog(1, -1);
						return leo.delay(2000);
					});
				})
				.then(()=>{
					return leo.autoWalkList([
						[38, 37 ,'咒术师的秘密住处'],[10, 0 ,15008],[10, 0]
					]);
				})
				.then(()=>leo.talkNpc(11, 0,leo.talkNpcSelectorYes))
				.then(()=>leo.autoWalk([10, 10]))
				.then(()=>leo.turnTo(11, 10))
				.then(()=>{
		        	if(hasItem){
		        		return leo.talkNpc(0, (dialog) => {
		        			if(dialog && dialog.message && dialog.message.indexOf('我想转职') >= 0){
		        				cga.ClickNPCDialog(0, 1);
		        				return true;
		        			}
		        			if(dialog && dialog.message && dialog.message.indexOf('转职以后') >= 0){
		        				cga.ClickNPCDialog(32, -1);
		        				return true;
		        			}
		        			if(dialog && dialog.message && dialog.message.indexOf('5000个金币') >= 0){
		        				cga.ClickNPCDialog(0, 0);
		        				return false;
		        			}
							return false;
						})
						.then(()=>leo.log('到达转职位置!身上【有】转职保证书，已自动完成转职'));
		        	}else{
		        		return leo.log('到达转职位置!请注意：身上【没有】转职保证书!!!');
		        	}
		        })
		        .then(()=>{
					console.log('脚本结束')
					nexttask()
				});
			}else{
				//当前非传教，转成传教
				leo.log('当前职业：'+playerinfo.job+'，需要转成传教');
				leo.todo().then(()=>{
					if(isLogBackFirst){
						return leo.logBack();
					}else{
						return leo.next();
					}
				})
				.then(()=>leo.goto(n => n.castle.x))
				.then(() => leo.autoWalkList([
		            [41, 14, '法兰城'],
		            [154, 29, '大圣堂的入口'],
		            [14, 7, '礼拜堂'],
		            [23, 0,'大圣堂里面'],
					[15, 11]
		        ]))
				.then(()=>leo.talkNpc(16, 11,leo.talkNpcSelectorYes))
		        .then(()=>leo.autoWalk([16, 9]))
		        .then(()=>leo.turnTo(17, 9))
		        .then(()=>{
		        	if(hasItem){
		        		return leo.talkNpc(0, (dialog) => {
		        			if(dialog && dialog.message && dialog.message.indexOf('我想转职') >= 0){
		        				cga.ClickNPCDialog(0, 1);
		        				return true;
		        			}
		        			if(dialog && dialog.message && dialog.message.indexOf('转职以后') >= 0){
		        				cga.ClickNPCDialog(32, -1);
		        				return true;
		        			}
		        			if(dialog && dialog.message && dialog.message.indexOf('5000个金币') >= 0){
		        				cga.ClickNPCDialog(0, 0);
		        				return false;
		        			}
							return false;
						})
						.then(()=>leo.log('到达转职位置!身上【有】转职保证书，已自动完成转职'));
		        	}else{
		        		return leo.log('到达转职位置!请注意：身上【没有】转职保证书!!!');
		        	}
		        })
				.then(()=>{
					console.log('脚本结束')
					nexttask()
				});
			}
		}
	})
	.catch(console.log);
});