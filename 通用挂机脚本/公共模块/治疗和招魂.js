var fs = require('fs');
var modeArray = [
{
	/**
	 * 本模块是为了方便非通用挂机脚本的一站式治疗+招魂的调用，直接在其他脚本中引用即可使用。
	 */
	name : '治疗和招魂',
	func : (cb)=>{
		if(cga.GetPlayerInfo().souls > 0){
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
				[41, 14, '法兰城'],
				[153, 29, '大圣堂的入口'],
				[14, 7, '礼拜堂'],
				[12, 19],
				], ()=>{
					cga.TurnTo(12, 17);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg.message && dlg.message.indexOf('我将为你取回') >= 0)
						{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg.message && dlg.message.indexOf('不够') >= 0){
									throw new Error('招魂钱不够！');
								}
								
								thisobj.func(cb);
							});
						}
						else
						{
							thisobj.func(cb);
						}
					});
				});
			});
			return;
		}

		if(cga.GetPlayerInfo().health > 0){
			if(personaldoctor){
				console.log('目前正在使用私人医生：【' + personaldoctor +'】，请确保其在工作中。')
			}

			var retry = ()=>{
		
				if(cga.GetPlayerInfo().health == 0){
					
					if(cga.getTeamPlayers().length > 0){
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(thisobj.func, 1500, cb);
						return;
					}
					
					thisobj.func(cb);
					return;
				}
				
				var doctor = cga.findPlayerUnit((u)=>{
	
					//私有号直接指定名称
					if (personaldoctor != undefined && u.unit_name == personaldoctor){
						return true
					}
	
					if((u.injury & 2) == 2 && u.icon == 13)//检测头上的打针图标
						return true;
	
					return ['实习医师','医师','资深医师','御医','超级医生','神医'].find((n)=>{
						return n == u.title_name;
					}) == undefined ? false : true;
				});
							
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
			return;
		}

		var healflag = false
		for(var i in cga.GetPetsInfo()){
			if(cga.GetPetsInfo()[i].health != 0)
			{
				healflag = true
			}
		}

		if(healflag){
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
					thisobj.func(cb);
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
									thisobj.func(cb);
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
			return;
		}

		if(cga.needSupplyInitial({  })){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(()=>{
					thisobj.func(cb);
				}, 3000);
			});
			return;
		}

		setTimeout(cb, 1000)
		return
	},
	think : (ctx)=>{
		return
	}
},
]

var cga = global.cga;
var configTable = global.configTable;

var personaldoctor = "UNAの护士"

var thisobj = {
	func : (cb)=>{
		thisobj.object = modeArray[0]
		thisobj.object.func(cb)
	},
	think : (ctx)=>{
		return
	},
	translate : (pair)=>{
		return false;
	},
	loadconfig : (obj, cb)=>{
		return true;
	},
	inputcb : (cb)=>{
		cb(null);
	}	
}

module.exports = thisobj;