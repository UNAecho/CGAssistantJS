var teamModeArray = [
{
	name : '固定组队',
	is_enough_teammates : ()=>{//人数是否足够？队友是否都是成员列表里的人？
		
		if(!cga.isTeamLeader && !thisobj.teammates.length){
			return true;
		}
		
		var teamplayers = cga.getTeamPlayers();
		
		if(teamplayers.length == thisobj.teammates.length){
			for(var i = 0; i < teamplayers.length; ++i){
				if(!is_array_contain(thisobj.teammates, teamplayers[i].name)){
					return false;
				}
			}
			return true;
		}

		return false;
	},
	wait_for_teammates : (cb)=>{

		if(!cga.isTeamLeader && !thisobj.teammates.length){
			cb(true);
			return;
		}

		if(!cga.isTeamLeader){
			
			var waitAdd = ()=>{					
				//console.log('waitAdd...');
				cga.addTeammate(thisobj.teammates[0], (r)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					setTimeout(waitAdd, 1000);
				});
			}
			
			waitAdd();
		}
		else 
		{
			var waitFor = ()=>{
				//console.log('waitFor...');
				cga.waitTeammates(thisobj.teammates, (r)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					setTimeout(waitFor, 1000);
				});
			}
			
			waitFor();
		}
	},
	wait_for_teammates_timeout : (cb)=>{

		if(!cga.isTeamLeader && !thisobj.teammates.length){
			cb(true);
			return;
		}

		var remainTime = thisobj.timeout > 0 ? thisobj.timeout : null

		if(!cga.isTeamLeader){
			
			var waitAdd = ()=>{
				//console.log('waitAdd...');
				cga.addTeammate(thisobj.teammates[0], (r)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					if(thisobj.timeout > 0 && remainTime > 0){
						if(remainTime % 60000 == 0){
							console.log('等待队长，还剩' + Math.floor(remainTime / 60000) + '分')
						}
						remainTime -=1000
						setTimeout(waitAdd, 1000);
						return
					}else if(thisobj.timeout > 0){
						console.log('固定组队等待超时，执行回调函数并返回false')
						cb(false)
						return;
					}
					setTimeout(waitAdd, 1000);
				});
			}
			
			waitAdd();
		}
		else 
		{
			var waitFor = ()=>{
				//console.log('waitFor...');
				cga.waitTeammates(thisobj.teammates, (r)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					if(thisobj.timeout > 0 && remainTime > 0){
						if(remainTime % 60000 == 0){
							console.log('等待队员，还剩' + Math.floor(remainTime / 60000) + '分')
						}
						remainTime -=1000
						setTimeout(waitFor, 1000);
						return
					}else if(thisobj.timeout > 0){
						console.log('固定组队等待超时，执行回调函数并返回false')
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						cb(false)
						return;
					}
					setTimeout(waitFor, 1000);
				});
			}
			
			waitFor();
		}
	},
	think : (ctx)=>{
		//单练模式
		if(thisobj.teammates.length == 0)
			return;
		
		//非危险区域，不用管
		//if(ctx.dangerlevel == 0)
		//	return;
		
		//队长：人数不足，登出
		//队员：人都跑光了，登出
		if((ctx.teamplayers.length < thisobj.teammates.length && cga.isTeamLeader) || ctx.teamplayers.length == 0)
		{
			ctx.result = 'logback';
			ctx.reason = '人数不足，登出';
			return;
		}
	}
},
{
	name : '自由组队',
	is_enough_teammates : ()=>{//人数是否足够？
		if(thisobj.minTeamMemberCount <= 1){
			return true;
		}
		
		if(!cga.isTeamLeader){
			return true;
		}
		
		var teamplayers = cga.getTeamPlayers();
		
		if(teamplayers.length >= thisobj.minTeamMemberCount){
			return true;
		}
		
		return false;
	},
	wait_for_teammates : (cb)=>{
		
		if(thisobj.minTeamMemberCount <= 1){
			cb(true);
			return;
		}
		
		if(!cga.isTeamLeader){
			cb(true);
			return;
		}
		
		var wait = ()=>{
			cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
			var teamplayers = cga.getTeamPlayers();			
			if(teamplayers.length >= thisobj.minTeamMemberCount){
				cb(true);
				return;
			}
			
			// cga.SayWords('等待队友中...队伍人数大于等于'+thisobj.minTeamMemberCount+'人即可发车！', 0, 3, 1 );
			// console.log('等待队友中...队伍人数大于等于'+thisobj.minTeamMemberCount+'人即可发车！')
			setTimeout(wait, 5000);
		}
		
		wait();
	},
	think : (ctx)=>{
		
		//单练模式
		if(thisobj.minTeamMemberCount <= 1)
			return;
		
		//非危险区域，不用管
		//if(ctx.dangerlevel == 0)
		//	return;
		
		//人数不足，回补
		if(ctx.teamplayers.length < thisobj.minTeamMemberCount)
		{
			ctx.result = 'supply';
			ctx.reason = '人数不足，回补';
			return;
		}
	}
},
]

var cga = global.cga;
var configTable = global.configTable;

var commonJob = cga.job.getJob().job
// 在烧声望模式中，传咒职业单人在灵堂刷即可，需要单人模式
var skipTeamModeJob = ['传教士','咒术师']

var playerinfo = cga.GetPlayerInfo();

var thisobj = {
	is_enough_teammates : ()=>{
		return thisobj.object.is_enough_teammates();
	},
	wait_for_teammates : (cb)=>{
		thisobj.object.wait_for_teammates(cb);
	},
	wait_for_teammates_timeout : (cb)=>{
		thisobj.object.wait_for_teammates_timeout(cb);
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		if(pair.field == 'teamMode'){
			pair.field = '组队模式';
			pair.value = teamModeArray[pair.value].name;
			pair.translated = true;
			return true;
		}
		if(pair.field == 'teammates'){
			pair.field = '队伍成员';
			pair.value = '['+pair.value.join(', ')+']';
			pair.translated = true;
			return true;
		}
		if(pair.field == 'minTeamMemberCount'){
			pair.field = '队伍最小人数';
			pair.translated = true;
			return true;
		}
		if(pair.field == 'timeout'){
			pair.field = '超时时间(毫秒)';
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		for(var i in teamModeArray){
			if(i == obj.teamMode){
				configTable.teamMode = i;
				thisobj.object = teamModeArray[i];
				break;
			}
		}
		
		if(!thisobj.object){
			console.error('读取配置：组队模式失败！');
			return false;
		}
		
		if(thisobj.object.name == '固定组队'){
			if(configTable.mainPlugin == '烧声望' && global.is_array_contain(skipTeamModeJob,commonJob)){
				configTable.teammates = obj.teammates;
				thisobj.teammates = [];
				console.log('烧技能主插件中，传教士与咒术师需要单人刷，将组队置空,但不改变configTable中的teammates数值，以防写入出现问题')
			}else{
				configTable.teammates = obj.teammates;
				thisobj.teammates = obj.teammates;
			}
			if(!(thisobj.teammates instanceof Array)){
				console.error('读取配置：队伍成员列表失败！');
				return false;
			}
			// 如果没有设置超时时间或异常值，则置零。
			configTable.timeout = obj.timeout;
			thisobj.timeout = obj.timeout;
			if(!(thisobj.timeout > 0)){
				configTable.timeout = 0;
				thisobj.timeout = 0;
			}
			
			cga.isTeamLeader = (!thisobj.teammates.length || thisobj.teammates[0] == playerinfo.name) ? true : false;
		}
		
		if(thisobj.object.name == '自由组队'){
			configTable.minTeamMemberCount = obj.minTeamMemberCount;
			thisobj.minTeamMemberCount = obj.minTeamMemberCount;
			if(!(thisobj.minTeamMemberCount > 0)){
				console.error('读取配置：队伍最小人数失败！');
				return false;
			}
			
			cga.isTeamLeader = true;
		}
		
		return true;
	},
	inputcb : (cb)=>{
		var stage2 = (cb2)=>{
			var sayString = '【公共插件】请选择队伍最小人数 (1~5):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && index <= 5){
					configTable.minTeamMemberCount = index;
					thisobj.minTeamMemberCount = index;
					
					var sayString2 = '当前已选择: 队伍最小人数[' + thisobj.minTeamMemberCount + ']人。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);				
					return false;
				}
				
				return true;
			});
		}

		var stage3 = (cb2)=>{
			var sayString = '【公共插件】请输入等待超时时间(毫秒):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val > 0){
					configTable.timeout = val;
					thisobj.timeout = val;
					
					var sayString2 = '当前已选择等待队员:'+thisobj.timeout+'毫秒后超时触发回调。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		
		var sayString = '【公共插件】请选择组队模式:';
		for(var i in teamModeArray){
			if(i != 0)
				sayString += ', ';
			sayString += '('+ (parseInt(i)+1) + ')' + teamModeArray[i].name;
		}
		cga.sayLongWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, index)=>{
			if(index !== null && index >= 1 && teamModeArray[index - 1]){
				configTable.teamMode = index - 1;
				thisobj.object = teamModeArray[index - 1];
				
				var sayString2 = '当前已选择:[' + thisobj.object.name + ']。';
				cga.sayLongWords(sayString2, 0, 3, 1);
				
				if(thisobj.object.name == '固定组队'){
					var teamplayers = cga.getTeamPlayers();
					var teammates = [];
					for(var i in teamplayers)
						teammates[i] = teamplayers[i].name;
					
					thisobj.teammates = teammates;
					configTable.teammates = teammates;
					
					cga.isTeamLeader = (!teammates.length || teammates[0] == playerinfo.name) ? true : false;

					var sayString3 = '队伍成员:[' + thisobj.teammates.join(', ') + ']。';
					cga.sayLongWords(sayString3, 0, 3, 1);
					
					stage3(cb);
				}
				else if(thisobj.object.name == '自由组队'){
					
					cga.isTeamLeader = true;
					
					stage2(cb);
				}
				
				return false;
			}
			
			return true;
		});
	}	
}

module.exports = thisobj;