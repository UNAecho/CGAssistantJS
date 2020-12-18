var cga = global.cga;
var configTable = global.configTable;

// 如果有私人医生，请指定
var personaldoctor = 'UNAの护士'

var thisobj = {
	prepare : (cb)=>{
		var healflag = false
		for(var i in cga.GetPetsInfo()){
			if(cga.GetPetsInfo()[i].health != 0)
			{
				healflag = true
			}
		}
		// 没有受伤宠物，退出治疗宠物模块
		if(!healflag){
			cb(null);
			return;
		}
		
		// if(cga.getTeamPlayers().length){
		// 	cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
		// 	setTimeout(thisobj.prepare, 1000, cb);
		// 	return;
		// }
		
		var retry = ()=>{
			
			var petsinfo = cga.GetPetsInfo();
			var healflag_retry = false
			var healindex = null

			for(var i in petsinfo){
				if(petsinfo.health != 0)
				{	
					healindex = i
					healflag_retry = true
				}
			}
			if(!healflag_retry){
				cb(null);
				return;
			}else{
				cga.travel.falan.toStone('E2', ()=>{
					cga.walkList([
					[221, 83, '医院'],
					[12, 18],
					], ()=>{
						cga.TurnTo(10, 18);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(healindex, 6);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg.message.indexOf('不够') >= 0){
									throw '受伤治疗钱不够！';
								}
								
								cb(null);
							});
						});
					});
				});
			}
		}
		
		cga.travel.falan.toStone('C', ()=>{
			cga.walkList([
			[27, 82],
			], retry);
		});
	},
	think : (ctx)=>{
		var petsinfo = cga.GetPetsInfo();
		for(var i in petsinfo){
			if(petsinfo[i].health != 0)
			{
				ctx.result = 'logback_forced';
				ctx.reason = '受伤宠物医院治疗';
			}
		}

	},
	loadconfig : (obj, cb)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}
};

module.exports = thisobj;