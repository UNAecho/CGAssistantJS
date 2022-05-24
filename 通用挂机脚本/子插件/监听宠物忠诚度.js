var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	prepare : (cb)=>{// prepare步骤时候取消低忠诚出战
		var playerinfo = cga.GetPlayerInfo();
		if(playerinfo.petid == -1){
			cb(null);
			return
		}
		var petinfo = cga.GetPetInfo(playerinfo.petid)
		
		if(petinfo && petinfo.loyality < thisobj.minLoyality){
			cga.ChangePetState(playerinfo.petid, 0)
			var tempmsg = '【UNA脚本警告】:出战宠物低于设置最低【'+thisobj.minLoyality+'】忠诚，取消宠物出战防止宠物逃跑。'
			console.log(tempmsg)
			setTimeout(() => {
				cga.SayWords(tempmsg, 0, 3, 1)
			}, 1000);
			
		}
		cb(null)
		return
	},
	init : ()=>{
		/**
		 * 会在init里再执行一次prepare一样的逻辑，是考虑到在prepare模块前可能遭遇战斗。
		 * 比如营地模块，prepare是在圣骑士营地开始，而去这里前，要经历法兰城外的踩地雷战斗。
		 * */ 
		var playerinfo = cga.GetPlayerInfo();
		if(playerinfo.petid == -1){
			return
		}
		var petinfo = cga.GetPetInfo(playerinfo.petid)
		
		if(petinfo && petinfo.loyality < thisobj.minLoyality){
			cga.ChangePetState(playerinfo.petid, 0)
			var tempmsg = '【UNA脚本警告】:出战宠物低于设置最低【'+thisobj.minLoyality+'】忠诚，取消宠物出战防止宠物逃跑。'
			console.log(tempmsg)
			setTimeout(() => {
				cga.SayWords(tempmsg, 0, 3, 1)
			}, 1000);
		}
		return
	},
	think : (ctx)=>{// playerthink步骤时候取消低忠诚出战
		if (ctx.petinfo != null && ctx.petinfo.loyality < thisobj.minLoyality){
			cga.ChangePetState(ctx.petinfo.index, 1)
			var tempmsg = '【UNA脚本警告】:出战宠物低于设置最低【'+thisobj.minLoyality+'】忠诚，取消宠物出战防止宠物逃跑。'
			console.log(tempmsg)
			setTimeout(() => {
				cga.SayWords(tempmsg, 0, 3, 1)
			}, 1000);
		}
		var goodpetindex = cga.findbattlepet()
		if (ctx.petinfo === null && goodpetindex != -1){
			var tempmsg = '【UNA脚本提示】:宠物栏中有高于最低【'+thisobj.minLoyality+'】忠诚且未受伤的宠物，派出作战。'
			cga.ChangePetState(goodpetindex, cga.PET_STATE_BATTLE)
			setTimeout(() => {
				cga.SayWords(tempmsg, 0, 3, 1)
			}, 1000);
		}
	},
	loadconfig : (obj, cb)=>{
		if(obj.minLoyality != undefined)
		{
			configTable.minLoyality = obj.minLoyality;
			thisobj.minLoyality = obj.minLoyality;
		}
		
		if(thisobj.minLoyality === undefined){
			console.error('读取配置：监听宠物忠诚度失败！');
			return false;
		}
		return true
	},
	inputcb : (cb)=>{
		var sayString = '【监听宠物忠诚度】请输入宠物最低忠诚度(不包含，例如输入60，则59才触发保护。):';

		cga.SayWords(sayString, 0, 3, 1);
		cga.waitForChatInput((msg, val)=>{
			
			if(val !== null && val >= 0 && val <= 100){
				configTable['minLoyality'] = val;
				thisobj['minLoyality'] = val;
				
				var sayString2 = '当前已选择宠物忠诚小于[' + configTable['minLoyality'] + ']收回宠物。';
				cga.SayWords(sayString2, 0, 3, 1);
				
				cb(null);
				return false;
			}
			
			return true;
		});
	}
};

module.exports = thisobj;