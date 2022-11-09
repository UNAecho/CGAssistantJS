var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	prepare : (cb)=>{
		if(cga.GetPlayerInfo().souls == 0){
			cb(null);
			return;
		}
		
		if(cga.getTeamPlayers().length){
			cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
			setTimeout(thisobj.prepare, 1000, cb);
			return;
		}
		// UNAecho:添加在国外招魂的逻辑
		console.log('【注意】检测到人物掉魂，去招魂。')

		var villageName = cga.travel.switchMainMap()

		var tmplist = []
		var tmpTurnDir = null

		var talkToNPC = (tmpTurnDir)=>{
			cga.turnDir(tmpTurnDir)
			cga.AsyncWaitNPCDialog((err, dlg)=>{
				if(dlg.message && dlg.message.indexOf('我将为你取回') >= 0)
				{
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg.message && dlg.message.indexOf('不够') >= 0){
							throw new Error('招魂钱不够！');
						}
						
						cb(null);
					});
				}
				else
				{
					cb(null);
				}
			});
		}

		if(villageName == '哥拉尔镇'){
			tmplist.push(
				[160, 199, '白之宫殿'],
				[47, 36, 43210],
				[61, 46],
				)
			tmpTurnDir = 0

			cga.travel.autopilot('主地图',()=>{
				cga.walkList(tmplist, ()=>{
					talkToNPC(tmpTurnDir)
				});
			})
			return
		}else if(villageName == '阿凯鲁法村'){
			// TODO
			// tmplist.push(
			// 	[160, 199, '白之宫殿'],
			// 	[47, 36, 43210],
			// 	[61, 46],
			// 	)
			// tmpTurnDir = 0

			// cga.travel.autopilot('主地图',()=>{
			// 	cga.walkList(tmplist, ()=>{
			// 		talkToNPC(tmpTurnDir)
			// 	});
			// })
			// return
		}else{
			tmpTurnDir = 6

			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
				[41, 14, '法兰城'],
				[153, 29, '大圣堂的入口'],
				[14, 7, '礼拜堂'],
				[12, 19],
				], ()=>{
					talkToNPC(tmpTurnDir)
				});
			});
			return
		}
	},
	think : (ctx)=>{
		if(cga.GetPlayerInfo().souls != 0)
		{
			ctx.result = 'logback_forced';
			ctx.reason = '掉魂自动招魂';
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