var fs = require('fs');
var Async = require('async');

var cga = global.cga;
var configTable = global.configTable;

var rootdir = cga.getrootdir()
var updateConfig = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');
var teamMode = require(rootdir + '/通用挂机脚本/公共模块/组队模式');
var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

// 提取本地职业数据
const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config({'mainPlugin' : '智能练级'})
	},5000)
}

// 由于道具服有精灵变身、商城卡等一系列切换性别的方法，故需要手动指定性别。
var teammates = null
var gender = false
// 男女交易蜡烛时的朝向
var genderDir = null

var teamMale = [
	"UNAの格斗3",
	"UNAの战斧2",
	"UNAの战斧3",
	"UNAの封印4",
	"UNAの封印2",
];

var teamFemale = [
	"UNAの传教士",
	"UNAの格斗03",
	"UNAの格斗04",
	"UNAの咒术师",
	"UNAの巫师",
];

var playerinfo = cga.GetPlayerInfo();
var myname = playerinfo.name;

for (var i in teamMale){
	if(teamMale[i] == playerinfo.name){
		gender = true
		teammates = teamMale
		genderDir = 2
		// console.log((teammates[0] == playerinfo.name || teammates.length == 0) ? '队长' : '不是')
	}
}
for (var i in teamFemale){
	if(teamFemale[i] == playerinfo.name){
		teammates = teamFemale
		genderDir = 6
	}
}

if (teammates === null){
	console.error('错误，请检查男女队数组是否有自己的名字')
}

cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false


// 没有2转无法解本任务
if(getprofessionalInfos.getJobLevel(playerinfo.job) < 2){
	var sayString = '【UNA脚本提示】你没有2转，无法做/陪跑UD任务。';
	cga.sayLongWords(sayString, 0, 3, 1);
	console.error(sayString)
}
// 随机喊话，避免冲突导致统计bug
var say1 = () =>{
	var randomtime = Math.ceil(Math.random()*9000) + Math.ceil(Math.random()*1000)
	setTimeout(() => {
		cga.SayWords('1', 0, 3, 1);
	}, randomtime);
	// 规避统计异常，如冲突，和队长没捕捉到信息，再说一次防止无限等待。
	setTimeout(() => {
		cga.SayWords('1', 0, 3, 1);
	}, Math.ceil(Math.random()*10000));
}

// 监听换蜡烛信号，全局生效
cga.waitTeammateSay((player, msg)=>{

	if(msg.indexOf('拿烛台') >= 0){
		// var mapindex = cga.GetMapIndex().index3

		if(cga.findItem(18492) != -1 && !gender){
			say1()
		}else if(cga.findItem(18496) != -1 && gender){
			say1()
		}
		// if(mapindex == 24003){
		// 	if(cga.findItem(18492) != -1 && gender){
		// 		say1()
		// 	}else if(cga.findItem(18496) != -1 && !gender){
		// 		say1()
		// 	}
		// }else if(mapindex == 24004){
		// 	if(cga.findItem(18497) != -1 && gender){
		// 		say1()
		// 	}else if(cga.findItem(18493) != -1 && !gender){
		// 		say1()
		// 	}
		// }else if(mapindex == 24005){
		// 	if(cga.findItem(18494) != -1 && gender){
		// 		say1()
		// 	}else if(cga.findItem(18498) != -1 && !gender){
		// 		say1()
		// 	}
		// }
	}

	if(msg.indexOf('交易蜡烛') >= 0){
		var mapindex = cga.GetMapIndex().index3
		var XY = cga.GetMapXY()
		var myItem = null
		var waitForItem = null
		var waitForPos = []
		if(mapindex == 24003){
			myItem = gender ? '誓言的红烛台':'誓言的白烛台'
			waitForItem = gender ? '誓言的白烛台':'誓言的红烛台'
			waitForPos[0] = XY.x
			waitForPos[1] = gender ? (XY.y + 2):(XY.y - 2)
			waitCandle(0, myItem, waitForItem, waitForPos, say1);
		}else if(mapindex == 24004){
			myItem = gender ? '誓言的白烛台':'誓言的红烛台'
			waitForItem = gender ? '誓言的红烛台':'誓言的白烛台'
			waitForPos[0] = XY.x
			waitForPos[1] = gender ? (XY.y + 2):(XY.y - 2)
			waitCandle(1, myItem, waitForItem, waitForPos, say1);
		}else if(mapindex == 24005){
			myItem = gender ? '誓言的红烛台':'誓言的白烛台'
			waitForItem = gender ? '誓言的白烛台':'誓言的红烛台'
			waitForPos[0] = XY.x
			waitForPos[1] = gender ? (XY.y + 2):(XY.y - 2)
			waitCandle(2, myItem, waitForItem, waitForPos, say1);
		}
	}

	return true;
});

var dialogHandler = (err, dlg)=>{
	if(dlg && (dlg.options & 4) == 4)
	{
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if(dlg && (dlg.options & 32) == 32)
	{
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 1)
	{	
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 3)
	{
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if(dlg && dlg.options == 12)
	{
		cga.ClickNPCDialog(4, -1);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	return
}

var talkNpcSayYesToChangeMap = (cb,npcPosArr,type)=>{
	var wait = (cb)=>{
		cga.waitForLocation({moving : true , pos : npcPosArr ,leaveteam : true}, ()=>{
			var originIndex = cga.GetMapIndex().index3
			var originalPos = cga.GetMapXY();
	
			var retry=()=>{
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.TurnTo(npcPosArr[0], npcPosArr[1]);
				if(type == 'index' && cga.GetMapIndex().index3 != originIndex){
					console.log('index发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.x != originalPos.x){
					console.log('x发生变化，切换地图成功')
					cb(true)
					return
				}else if(type == 'pos' && pos.y != originalPos.y){
					console.log('y发生变化，切换地图成功')
					cb(true)
					return
				}
				setTimeout(retry, 5000);
				return
			}
	
			setTimeout(retry, 1000);
		});
	}

    if(cga.isTeamLeader){
		var posArr = cga.get2RandomSpace(npcPosArr[0],npcPosArr[1])
		cga.walkList([
			posArr[0],
			posArr[1],
			posArr[0],
			posArr[1],
			posArr[0],
		], ()=>{
			setTimeout(() => {
				cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
				wait(cb)
			}, 2000);
		});
    }else{
		wait(cb)
    }
	return
}


var candleTable = [
	{
		'誓言的白烛台' : 18492,// 一层女性持有，要交给男性
		'誓言的红烛台' : 18496,// 一层男性持有，要交给女性
	},
	{
		'誓言的白烛台' : 18493,// 二层男性持有，要交给女性
		'誓言的红烛台' : 18497,// 二层女性持有，要交给男性
	},
	{
		'誓言的白烛台' : 18494,// 三层女性持有，要交给男性
		'誓言的红烛台' : 18498,// 三层男性持有，要交给女性
	},
]

var	waitCandle = (layerIndex, myItem, waitForItem, waitForPos, cb)=>{
		
	cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false);
	cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true);
	
	cga.TurnTo(waitForPos[0], waitForPos[1]);

	var stuffs = 
	{
		itemFilter : (item)=>{
			if(item.itemid == candleTable[layerIndex][myItem]){
				return true;
			}
			return false;
		}
	}

	var waitChat = ()=>{
		cga.AsyncWaitChatMsg((err, r)=>{
			if(r && r.unitid != -1)
			{
				var findpos = r.msg.indexOf(': UNA开启者脚本等待换烛台');
				if(findpos > 0)
				{
					var playername = r.msg.substr(0, findpos);
					
					if(myname != playername)
					{
						var playerunit = cga.findPlayerUnit(playername);
						if(playerunit != null && playerunit.xpos == waitForPos[0] && playerunit.ypos ==waitForPos[1])
						{
							cga.positiveTrade(playername, stuffs, undefined, result => {
								if (result && result.success == true){
									cb(true);
								} else {
									waitChat();
								}
							});
							return;
						}
					}
				}
			}
			
			waitChat();
		}, 5000);
	}
	
	var waitTrade = ()=>{
		cga.waitTrade(stuffs, null, (results)=>{
			if(results && results.success == true)
			{
				cb(true);
			}
			else
			{
				cga.SayWords('UNA开启者脚本等待换烛台，['+myItem+']交换'+'['+waitForItem+']', 0, 3, 1);
				waitTrade();
			}
		}, 5000);
	}

	if(gender)
		waitChat();
	else
		waitTrade();
}

var task = cga.task.Task('开启者', [
	{//1
		intro: '1.进行一些前期处理工作',
		workFunc: function(cb2){
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
				return;
			}else{
				cb2(true)
			}
		}
	},
	{//2
		intro: '2.前往杰诺瓦镇，出镇北门至莎莲娜岛（260.359）处与阿斯提亚神官对话，选“是”进入参道。',
		workFunc: function(cb2){

			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							leaderGo();
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							memberGo();
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}
			var leaderGo =()=>{
				cga.travel.autopilot('主地图',()=>{
					cga.walkList([
						[31, 27, 400],
					], ()=>{
						talkNpcSayYesToChangeMap(cb2,[260,359],'index')
					});
				})
			}
			var memberGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[260,359],'index')
			}

			cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
				if(gender){
					cga.walkList([
						cga.isTeamLeader ? [7, 8] : [6, 7],
						], wait);
				}else{
					cga.walkList([
						cga.isTeamLeader ? [6, 8] : [6, 7],
						], wait);
				}
			});
		}
	},
	{//3
		intro: '3.通过参道抵达阿斯提亚镇，前往（101.72）处抵达神殿。',
		workFunc: function(cb2){
			
			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							leaderGo();
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							memberGo();
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}
			var leaderGo =()=>{
				cga.walkList([
					[27, 11, 14011],
					[34, 12, 14012],
					[16, 9, 14013],
					[34, 9, 14014],
					[24, 8, 14015],
					[18, 28, 14016],
					[22, 10, 4100],
					[101, 72, 4130],
				], ()=>{
					cga.waitForLocation({mapname : '神殿'}, ()=>{
						cb2(true);
					});
				});
			}
			var memberGo =()=>{
				cga.waitForLocation({mapname : '神殿'}, ()=>{
					cb2(true);
				});
			}
			cga.walkList([
				cga.isTeamLeader ? [8, 34] : [7, 34],
			], wait);
		}
	},
	{//4
		intro: '4.在神殿补给后，通过（20.22）处楼梯进入大厅，与克里斯夫多祭司（26.23）对话，选“是”传送至圣餐之间。',
		workFunc: function(cb2){
			if(cga.isTeamLeader){
				cga.walkList([
					[25, 11, 4140],
					[17, 9],
					[17, 10],
					[17, 9],
					[17, 10],
					[17, 9],
				], ()=>{
					setTimeout(() => {
						cga.turnTo(18, 9);
					}, 1000);
					setTimeout(() => {
						cga.walkList([
							[5, 9, 4130],
							[20, 22, 4142],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[26,23],'index')
						});
					}, 5000);
				});
			}else{
				cga.waitForLocation({mapname : '大厅'}, ()=>{
					talkNpcSayYesToChangeMap(cb2,[26,23],'index')
				});
			}
		}
	},
	{//5
		intro: '5.与阿斯提亚神官（40.12）对话，传送至圣坛。',
		workFunc: function(cb2){
			cga.waitForLocation({mapname : '圣坛'}, ()=>{
				cb2(true)
			});

			cga.walkList([
				[39, 12],
			], ()=>{
				setTimeout(() => {
					cga.turnTo(40, 12);
					cga.AsyncWaitNPCDialog((err, dlg)=>{
						if(dlg && dlg.message.indexOf('还给我') >= 0){
							cga.ClickNPCDialog(1, -1);
							setTimeout(()=>{
								cga.turnTo(40, 12);
								cga.AsyncWaitNPCDialog(dialogHandler);
							}, 1000);
							return
						}
						else if(dlg && dlg.message.indexOf('等着你') >= 0){
							cga.ClickNPCDialog(1, -1);
						}
					});
				}, 1000);
			});
		}
	},
	{//6
		intro: '6.进入圣坛第一层组队。',
		workFunc: function(cb2){
			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}

			if(gender){
				cga.walkList([
					cga.isTeamLeader ? [10, 24] : [9, 24],
					], wait);
			}else{
				cga.walkList([
					cga.isTeamLeader ? [11, 75] : [10, 75],
					], wait);
			}
		}
	},
	{//7
		intro: '7.领取蜡烛。',
		workFunc: function(cb2){
			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							if(gender){
								leaderMaleGo();
							}else{
								leaderFemaleGo()
							}
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							if(gender){
								memberMaleGo();
							}else{
								memberFemaleGo()
							}
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}

			var leaderMaleGo =()=>{
				cga.walkList([
					[24, 24, '圣坛', 24, 19],
				], leaderMaleGo2);
			}

			var leaderMaleGo2 =()=>{
				cga.walkList([
					[30, 29],
					[29, 29],
					[30, 29],
					[29, 29],
					[30, 29],
				], ()=>{
					setTimeout(()=>{
						cga.cleanInventory(1, ()=>{
							cga.TurnTo(29, 30);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.SayWords('拿烛台，完成后说“1”！', 0, 3, 1);
								});
							});
						});
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[24, 19, '圣坛', 24, 24],
						], ()=>{
							cb2(true)
						});
					});
				});
			}

			var memberMaleGo =()=>{
				cga.waitForLocation({mapindex : 24003, pos : [29, 30]}, ()=>{
					setTimeout(()=>{
						cga.cleanInventory(1, ()=>{
							cga.TurnTo(29, 30);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitNPCDialog(()=>{
									setTimeout(()=>{
										if(cga.findItem(18496) != -1){
											cb2(true);				
										}
									}, 1500);
								});
							});
						});
					}, 3000);
				});
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[24, 76, '圣坛', 24, 71],
				], leaderFemaleGo2);
			}

			var leaderFemaleGo2 =()=>{
				cga.walkList([
					[30, 80],
					[29, 80],
					[30, 80],
					[29, 80],
					[30, 80],
				], ()=>{
					setTimeout(()=>{
						cga.cleanInventory(1, ()=>{
							cga.TurnTo(29, 81);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitNPCDialog(()=>{
									cga.SayWords('拿烛台，完成后说“1”！', 0, 3, 1);
								});
							});
						});
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[24, 71, '圣坛', 24, 76],
						], ()=>{
							cb2(true)
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				cga.waitForLocation({mapindex : 24003, pos : [29, 81]}, ()=>{
					setTimeout(()=>{
						cga.cleanInventory(1, ()=>{
							cga.TurnTo(29, 81);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1);
								cga.AsyncWaitNPCDialog(()=>{
									setTimeout(()=>{
										if(cga.findItem(18492) != -1){
											cb2(true);				
										}			
									}, 1500);
								});
							});
						});
					}, 3000);
				});
			}
			// 下楼梯拿蜡烛可能会出现切地图报错bug，故添加位置判断。
			var XY = cga.GetMapXY()
			if(
				(XY.x >= 24 && XY.x <= 34 && XY.y >= 71 && XY.y <= 90) || 
				(XY.x >= 24 && XY.x <= 34 && XY.y >= 12 && XY.y <= 36)
			){
				if(gender){
					if(cga.isTeamLeader){
						leaderMaleGo2()
					}else{
						memberMaleGo()
					}
				}else{
					if(cga.isTeamLeader){
						leaderFemaleGo2()
					}else{
						memberFemaleGo()
					}
				}
			}else{
				if(gender){
					if(cga.isTeamLeader){
						leaderMaleGo()
					}else{
						memberMaleGo()
					}
				}else{
					if(cga.isTeamLeader){
						leaderFemaleGo()
					}else{
						memberFemaleGo()
					}
				}
			}
		}
	},
	{//8
		intro: '8.第1次交换蜡烛',
		workFunc: function(cb2){
			var leaderMaleGo =()=>{
				cga.walkList([
					[69, 47],
					[74, 47],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						setTimeout(cb2, 1000, true);
					});
				});
			}

			var memberMaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[69, 49],
					[74, 49],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛，请说出交换蜡烛的方式。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[81, 80, '圣坛', 73, 82],
							[97, 34, '圣坛', 103, 34],
						], ()=>{
							setTimeout(cb2, 1000, true);
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			if(cga.isTeamLeader){
				if(gender){
					leaderMaleGo();
				}else{
					leaderFemaleGo()
				}
			}else{
				if(gender){
					memberMaleGo();
				}else{
					memberFemaleGo()
				}
			}
		
		}
	},
	{//9
		intro: '9.第1次交换蜡烛之后出发去第二层(交换蜡烛为全局动作，队员直接会跳到这一步)',
		workFunc: function(cb2){
			if(gender){
				talkNpcSayYesToChangeMap(cb2,[101,58],'index')
			}else{
				talkNpcSayYesToChangeMap(cb2,[111,34],'index')
			}
		}
	},
	{//10
		intro: '10.进入圣坛第2层组队。',
		workFunc: function(cb2){
			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}

			if(gender){
				cga.walkList([
					cga.isTeamLeader ? [9, 85] : [9, 86],
					], wait);
			}else{
				cga.walkList([
					cga.isTeamLeader ? [9, 17] : [9, 16],
					], wait);
			}
		}
	},
	{//11
		intro: '11.第2次交换蜡烛。',
		workFunc: function(cb2){

			var leaderMaleGo =()=>{
				cga.walkList([
					[7, 54, '圣坛', 7, 49],
					[15, 53, '圣坛', 22, 53],
					[26, 53, '圣坛', 31, 50],
					[60, 3, '圣坛', 59, 10],
					[100, 16, '圣坛', 100, 22],
					[80, 50],
					[84, 50],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[106, 45, '圣坛', 115, 44],
							[128, 44, '圣坛', 135, 43],
						], ()=>{
							cga.waitForLocation({mapname : '圣坛', pos : [135, 43]}, ()=>{
								setTimeout(cb2, 1000, true);
							});
						});
					});
				});
			}

			var memberMaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[14, 29, '圣坛', 19, 27],
					[31, 70, '圣坛', 31, 65],
					[74, 82, '圣坛', 75, 76],
					[62, 64, '圣坛', 68, 63],
					[80, 52],
					[84, 52],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛，请说出交换蜡烛的方式。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[68, 62, '圣坛', 62, 63],
							[94, 71, '圣坛', 95, 65],
							[67, 34, '圣坛', 61, 36],
							[58, 47, '圣坛', 58, 51],
						], ()=>{
							cga.waitForLocation({mapname : '圣坛', pos : [58, 51]}, ()=>{
								setTimeout(cb2, 1000, true);
							});
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			if(cga.isTeamLeader){
				if(gender){
					leaderMaleGo();
				}else{
					leaderFemaleGo()
				}
			}else{
				if(gender){
					memberMaleGo();
				}else{
					memberFemaleGo()
				}
			}
		}
	},
	{//12
		intro: '12.第2次交换蜡烛之后出发去第三层(交换蜡烛为全局动作，队员直接会跳到这一步)',
		workFunc: function(cb2){
			if(gender){
				talkNpcSayYesToChangeMap(cb2,[142,12],'index')
			}else{
				talkNpcSayYesToChangeMap(cb2,[135,78],'index')
			}
		}
	},
	{//13
		intro: '13.进入圣坛第3层组队。',
		workFunc: function(cb2){
			var wait = ()=>{
				if(cga.isTeamLeader){
					cga.waitTeammates(teammates, (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}else{
					cga.addTeammate(teammates[0], (r)=>{
						if(r){
							setTimeout(cb2, 1000, true);
							return;
						}
						setTimeout(wait, 1000);
					});
				}

			}

			if(gender){
				cga.walkList([
					cga.isTeamLeader ? [15, 16] : [14, 16],
					], wait);
			}else{
				cga.walkList([
					cga.isTeamLeader ? [16, 82] : [15, 82],
					], wait);
			}
		}
	},
	{//14
		intro: '14.第3次交换蜡烛',
		workFunc: function(cb2){

			var leaderMaleGo =()=>{
				cga.walkList([
					[23, 15, '圣坛', 32, 15],
					[36, 23, '圣坛', 36, 31],
					[37, 46, '圣坛', 37, 53],
					[36, 68, '圣坛', 36, 75],
					[47, 80, '圣坛', 56, 80],
					[60, 75, '圣坛', 60, 68],
					[56, 60, '圣坛', 47, 60],
					[47, 60, '圣坛', 56, 60],
					[71, 60, '圣坛', 78, 60],
					[83, 95, '圣坛', 88, 94],
					[140, 28, '圣坛', 135, 33],
					[134, 39],
					[139, 39],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[135, 33, '圣坛', 140, 28],
							[88, 94, '圣坛', 83, 95],
						], ()=>{
							cga.waitForLocation({mapname : '圣坛', pos : [83, 95]}, ()=>{
								setTimeout(cb2, 1000, true);
							});
						});
					});
				});
			}

			var memberMaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[76, 30, '圣坛', 78, 25],
					[98, 16, '圣坛', 106, 16],
					[110, 24, '圣坛', 110, 32],
					[111, 47, '圣坛', 111, 54],
					[121, 60, '圣坛', 130, 60],
					[135, 54, '圣坛', 135, 47],
					[134, 41],
					[139, 41],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('开始交易蜡烛，请说出交换蜡烛的方式。全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[135, 47, '圣坛', 135, 54],
							[130, 60, '圣坛', 121, 60],
							[111, 54, '圣坛', 111, 47],
							[110, 32, '圣坛', 110, 24],
							[106, 16, '圣坛', 98, 16],
						], ()=>{
							cga.waitForLocation({mapname : '圣坛', pos : [98, 16]}, ()=>{
								setTimeout(cb2, 1000, true);
							});
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				setTimeout(cb2, 1000, true);
			}

			if(cga.isTeamLeader){
				if(gender){
					leaderMaleGo();
				}else{
					leaderFemaleGo()
				}
			}else{
				if(gender){
					memberMaleGo();
				}else{
					memberFemaleGo()
				}
			}
		}
	},
	{//15
		intro: '15.第3次交换蜡烛之后出发去阿尔杰斯的慈悲(交换蜡烛为全局动作，队员直接会跳到这一步)',
		workFunc: function(cb2){
			if(gender){
				talkNpcSayYesToChangeMap(cb2,[82,63],'index')
			}else{
				talkNpcSayYesToChangeMap(cb2,[82,43],'index')
			}
		}
	},
	{//16
		intro: '16.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。',
		workFunc: function(cb2){
			cga.waitForLocation({mapindex : 24001}, ()=>{
				cb2(true)
			});

			setTimeout(() => {
				cga.walkList([
					[91, 49],
				], ()=>{
					setTimeout(() => {
						cga.turnTo(92, 49);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0);
						});
					}, 1000);
				});
			}, 2000);
		}
	},
	{//17
		intro: '17.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。',
		workFunc: function(cb2){
			var battleWords = '【UNA脚本提示】BOSS信息：Lv.65犹大，血量约7500，邪魔系，属性：全50，抗咒；技能：攻击、圣盾、崩击、乾坤一掷、战栗袭心、反击（奇数回合）、超强补血魔法（间隔2回合）、魔法封印（第一回合、每4回合；效果持续到下回合）'
			var suggest = '【UNA脚本提示】打法建议：按照火焰之刃/亡灵→冰怪→犹大→武装骷髅的顺序击杀，【人远程攻击，宠防御】。注意不能打死犹大前面的卡位的武装骷髅。'
			var tips = (counter)=>{

				if(counter == 0){
					return;
				} else if(counter == 3){
					cga.SayWords(suggest, 1, 3, 1);
					console.log(suggest)
				} else if(counter == 6){
					cga.SayWords(battleWords, 0, 3, 1);
					console.log(battleWords)
				}
				
				setTimeout(tips, 1000, counter-1);
			}

			cga.waitForLocation({mapindex : 24000}, ()=>{
				cb2(true)
			});
			cga.walkList([
				[10, 8],
			], ()=>{
				setTimeout(() => {
					configMode.manualLoad('手动BOSS')
					tips(9)
				}, 1000);
			});
		}
	},
	{//18
		intro: '18.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。',
		workFunc: function(cb2){
			var words1 = '【UNA脚本提示】UD任务一个人物一生完成一次即可，转职后再晋阶只需重新完成晋阶任务，无需完成包括本任务的其他任务'
			var words2 = '【UNA脚本提示】圣餐之间与各位置阿斯提亚僧兵对话可习得全部超强状态魔法，每种技能学习耗费10000G'
			var tips = (counter)=>{

				if(counter == 0){
					cb2(true)
					return;
				} else if(counter == 3){
					cga.SayWords(words2, 1, 3, 1);
				} else if(counter == 6){
					cga.SayWords(words1, 0, 3, 1);
				}
				
				setTimeout(tips, 1000, counter-1);
			}

			cga.waitForLocation({mapindex : 24007}, ()=>{
				tips(9)
			});
			// 解散队伍，各自与布鲁梅尔对话，完成任务。
			if(cga.isTeamLeader){
				setTimeout(() => {
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					/**
					 * 人物需要站在[26,13]处，与进入法兰城竞技场一样，直接cga.turnTo(27, 13)即可进入【香蒂的房间】(index:5013)
					 * NPC香蒂：[10,7],对话1000金币买设计图，并强制传送到圣餐之间，是否一并完成任务，没有试过。
					 * NPC朵葡：[10,6],对话1000金币买设计图，并强制传送到圣餐之间，是否一并完成任务，没有试过。
					 * 两人对话均为多个【下一步】按钮，与多个【确定】【取消】按钮，建议直接递归点击
					 */
					var suggest = '【UNA脚本提示】支线提醒：此处可以进入香蒂的房间，购买完成后强制传送到圣餐之间，但不确定是否算是完成UD任务，请注意。'
					cga.SayWords(suggest, 1, 3, 1);
				}, 1000);
			}
			cga.walkList([
				[16, 9],
			], ()=>{
				setTimeout(() => {
					cga.AsyncWaitNPCDialog(dialogHandler);
					cga.turnTo(17, 9);
				}, 1000);
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){//0.前期处理。
			return false;
		},
		function(){//1.进入参道。
			return cga.GetMapIndex().index3 == 14010 ? true :false
		},
		function(){//2.进入阿斯提亚镇神殿。
			return cga.GetMapIndex().index3 == 4130 ? true :false
		},
		function(){//3.进入圣餐之间。
			return cga.GetMapIndex().index3 == 24006 ? true :false
		},
		function(){//4.进入圣坛。
			return cga.GetMapIndex().index3 == 24003 ? true :false
		},
		function(){//5.进入圣坛第一层组队。
			var mapindex = cga.GetMapIndex().index3
			// 由于男女必须同数量，所以用哪个人物人数判断都行
			if(mapindex == 24003 && cga.getTeamPlayers().length == teamMale.length){
				return true
			}
			return false;
		},
		function(){//6.领取蜡烛。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24003){
				if(gender && cga.findItem(18496) != -1){
					return true
				}else if(!gender && cga.findItem(18492) != -1){
					return true
				}
			}
			return false;
		},
		function(){//7.第1次交换蜡烛。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24003){
				if(gender && cga.findItem(18492) != -1){
					return true
				}else if(!gender && cga.findItem(18496) != -1){
					return true
				}
			}
			return false;
		},
		function(){//8.第1次交换蜡烛之后出发去第二层。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24004){
				if(gender && cga.findItem(18493) != -1){
					return true
				}else if(!gender && cga.findItem(18497) != -1){
					return true
				}
			}
			return false;
		},
		function(){//9.进入圣坛第二层组队。
			var mapindex = cga.GetMapIndex().index3
			// 由于男女必须同数量，所以用哪个人物人数判断都行
			if(mapindex == 24004 && cga.getTeamPlayers().length == teamMale.length){
				return true
			}
			return false;
		},
		function(){//10.第2次交换蜡烛。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24004){
				if(gender && cga.findItem(18497) != -1){
					return true
				}else if(!gender && cga.findItem(18493) != -1){
					return true
				}
			}
			return false;
		},
		function(){//11.第2次交换蜡烛之后出发去第三层。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24005){
				if(gender && cga.findItem(18498) != -1){
					return true
				}else if(!gender && cga.findItem(18494) != -1){
					return true
				}
			}
			return false;
		},
		function(){//12.进入圣坛第3层组队。
			var mapindex = cga.GetMapIndex().index3
			// 由于男女必须同数量，所以用哪个人物人数判断都行
			if(mapindex == 24005 && cga.getTeamPlayers().length == teamMale.length){
				return true
			}
			return false;
		},
		function(){//13.第3次交换蜡烛。
			var mapindex = cga.GetMapIndex().index3
			if(mapindex == 24005){
				if(gender && cga.findItem(18494) != -1){
					return true
				}else if(!gender && cga.findItem(18498) != -1){
					return true
				}
			}
			return false;
		},
		function(){//14.第3次交换蜡烛后通过圣坛抵达阿尔杰斯的慈悲。
			return cga.GetMapIndex().index3 == 24002 ? true :false
		},
		function(){//15.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。
			return cga.GetMapIndex().index3 == 24001 ? true :false
		},
		function(){//16.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。
			return false;
		},
		function(){//17.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。
			return cga.GetMapIndex().index3 == 24007 ? true :false
		},
	]
	);

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		cga.SayWords('欢迎使用【UNAの脚本】，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			var minssionObj = {"开启者" : true}
			cga.refreshMissonStatus(minssionObj)
			return
		});
		return false;
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		if(teamMode.translate(pair))
			return true;
		
		// if(pair.field == 'listenPort'){
		// 	pair.field = '监听端口';
		// 	pair.value = pair.value;
		// 	pair.translated = true;
		// 	return true;
		// }
		return false;
	},
	loadconfig : (obj)=>{

		// if(!teamMode.loadconfig(obj))
		// 	return false;
		
		// configTable.listenPort = obj.listenPort;
		// thisobj.listenPort = obj.listenPort
		
		// if(!thisobj.listenPort){
		// 	console.error('读取配置：监听端口失败！');
		// 	return false;
		// }
		
		return true;
	},
	inputcb : (cb)=>{
		Async.series([teamMode.inputcb, 
	], cb);
	},
	execute : ()=>{
		// io.listen(thisobj.listenPort);
		callSubPlugins('init');
		configMode.manualLoad('练级')
		loop();
	},
}

module.exports = thisobj;