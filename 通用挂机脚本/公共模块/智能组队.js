var Async = require('async');
var teamModeArray = [
{
	name : '智能组队',
	is_enough_teammates : ()=>{//人数是否足够？队友是否都是成员列表里的人？
		// 如果已经记录了车队成员
		if(thisobj.object.teammates){
			var teamplayers = cga.getTeamPlayers();
			if(teamplayers.length == thisobj.object.teammates.length){
				for(var i = 0; i < teamplayers.length; ++i){
					if(!is_array_contain(thisobj.object.teammates, teamplayers[i].name)){
						return false;
					}
				}
				return true;
			}
		}
		// 以下是如果没有记录车队队员，处于拼车的状态
		if(thisobj.object.minTeamMemberCount <= 1){
			return true;
		}
		
		if(!cga.isTeamLeader){
			return true;
		}
		
		var teamplayers = cga.getTeamPlayers();
		
		if(teamplayers.length >= thisobj.object.minTeamMemberCount){
			return true;
		}
		
		return false;
	},
	wait_for_teammates_filter : (cb)=>{
		if(thisobj.object.minTeamMemberCount <= 1){
			cb(true);
			return;
		}
		
		if(!cga.isTeamLeader){
			cb(true);
			return;
		}

		cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
		
		var wait = ()=>{
			cga.waitTeammatesWithFilter(thisobj.object.nameFilter, thisobj.object.minTeamMemberCount,(r)=>{
				if(r){
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
					cb(true);
					return;
				}
				setTimeout(wait, 5000);
			})
		}
		
		wait();
	},
	wait_for_teammates_timeout : (cb)=>{

		if(!cga.isTeamLeader && !thisobj.object.teammates.length){
			cb(true);
			return;
		}

		var remainTime = thisobj.object.timeout > 0 ? thisobj.object.timeout : null

		if(!cga.isTeamLeader){
			
			var waitAdd = ()=>{
				cga.addTeammate(thisobj.object.teammates[0], (r)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					if(thisobj.object.timeout > 0 && remainTime > 0){
						if(remainTime % 60000 == 0){
							console.log('等待队长，还剩' + Math.floor(remainTime / 60000) + '分')
						}
						remainTime -=1000
						setTimeout(waitAdd, 1000);
						return
					}else if(thisobj.object.timeout > 0){
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
				cga.waitTeammates(thisobj.object.teammates, (r,lateList)=>{
					if(r){
						cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
						cb(true);
						return;
					}
					if(thisobj.object.timeout > 0 && remainTime > 0){
						if(remainTime % 60000 == 0){
							console.log('等待队员，还剩' + Math.floor(remainTime / 60000) + '分')
							console.log('迟到队员:',lateList)
						}
						remainTime -=1000
						setTimeout(waitFor, 1000);
						return
					}else if(thisobj.object.timeout > 0){
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
		if(thisobj.object.teammates.length == 0)
			return;
		
		//非危险区域，不用管
		//if(ctx.dangerlevel == 0)
		//	return;
		
		//队长：人数不足，登出
		//队员：人都跑光了，登出
		if((ctx.teamplayers.length < thisobj.object.teammates.length && cga.isTeamLeader) || ctx.teamplayers.length == 0)
		{
			ctx.result = 'logback';
			ctx.reason = '人数不足，登出';
			return;
		}
	}
},
]

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','地狱的回响')
	},5000)
}

var thisobj = {
	is_enough_teammates : ()=>{
		return thisobj.object.is_enough_teammates();
	},
	wait_for_teammates_filter : (cb)=>{
		thisobj.object.wait_for_teammates_filter(cb);
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
		// 智能模式只有1种组队模式
		thisobj.object = teamModeArray[0];

		if(obj.teammates){
			configTable.teammates = obj.teammates;
			thisobj.object.teammates = obj.teammates;	
		}

		if(typeof obj.timeout != 'number'){
			let toInt = parseInt(obj.timeout)
			if(typeof obj.timeout == 'string' && !isNaN(toInt)){
				configTable.timeout = toInt;
				thisobj.object.timeout = toInt;
			}else{
				console.warn('组队时改为无限等待，因为超时类型输入错误。超时时间只能输入number或者string数字。')
				configTable.timeout = 0;
				thisobj.object.timeout = 0;
			}
		}else{
			configTable.timeout = obj.timeout;
			thisobj.object.timeout = obj.timeout;
		}

		configTable.minTeamMemberCount = obj.minTeamMemberCount;
		thisobj.object.minTeamMemberCount = obj.minTeamMemberCount;
		if(!(thisobj.object.minTeamMemberCount > 0)){
			console.error('读取配置：队伍最小人数失败！');
			return false;
		}

		if(typeof obj.role != 'number'){
			let toInt = parseInt(obj.role)
			if(typeof obj.role == 'string' && !isNaN(toInt)){
				configTable.role = toInt;
				thisobj.object.role = toInt;
			}else{
				console.error('读取配置：队伍职责失败！只能输入0代表队长，1代表队员');
				return false;
			}
		}else{
			configTable.role = obj.role;
			thisobj.object.role = obj.role;
		}

		cga.isTeamLeader = thisobj.object.role == 0 ? true : false
		
		return true;
	},
	inputcb : (cb)=>{

		var stage0 = (cb2)=>{
			// 智能模式暂定只有1种模式
			thisobj.object = teamModeArray[0]

			var sayString = '【智能组队】队长设置，输入你是否是队长，0队长1队员:';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && (index == 0 || index == 1)){
					configTable.role = index;
					thisobj.object.role = index;
					
					var sayString2 = '当前已选择: 你是[' + (thisobj.object.role == 0 ? '队长' : '队员') + ']';
					cga.sayLongWords(sayString2, 0, 3, 1);
					if(thisobj.object.role == 0){
						stage1(cb2)
					}else{
						cb2(null)
					}
					return false;
				}
				
				return true;
			});
		}

		var stage1 = (cb2)=>{

			var sayString = '【智能组队】请选择名称过滤，名字中带有输入字符才可入队(名称不可以有半角冒号)，如不需要，请输入ok，如果名称中带有ok，请输入$ok:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(msg !== null && msg.length > 0 && msg.indexOf(':') == -1){
					if(msg == 'ok'){
						configTable.nameFilter = null;
						thisobj.object.nameFilter = null;
	
						cb2(null)
						
						return false;
					}else if(msg == '$ok'){
						configTable.nameFilter = 'ok';
						thisobj.object.nameFilter = 'ok';
					}else{
						configTable.nameFilter = msg;
						thisobj.object.nameFilter = msg;
					}
					
					var sayString2 = '当前已选择:[' + thisobj.object.nameFilter + ']。为名称过滤';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null)
					
					return false;
				}
				
				return true;
			});
		}

		var stage2 = (cb2)=>{
			var sayString = '【智能组队】组队人数，智能组队使用自由组队拼车+固定组队练级模式，拼车成功后自动转为固定组队。请输入自由拼车的最小发车人数(1~5):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && index <= 5){
					configTable.minTeamMemberCount = index;
					thisobj.object.minTeamMemberCount = index;
					
					var sayString2 = '当前已选择: 队伍最小人数[' + thisobj.object.minTeamMemberCount + ']人。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null)		
					return false;
				}
				
				return true;
			});
		}

		var stage3 = (cb2)=>{
			var sayString = '【智能组队】超时设置，如果固定组队超时，则全员回退至自由组队阶段。请输入组队等待超时时间(毫秒):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val > 0){
					configTable.timeout = val;
					thisobj.object.timeout = val;
					
					var sayString2 = '当前已选择等待队员:'+thisobj.object.timeout+'毫秒后超时触发回调。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					cb2(null);
					
					return false;
				}
				
				return true;
			});
		}
		console.log('智能组队输入..')
		var funcs = [];
		// stage1与0绑定，如果是队长才进入stage1
		funcs.push(stage0,stage2,stage3)
		Async.series(funcs, cb);
	}	
}

module.exports = thisobj;