var fs = require('fs');
var Async = require('async');
var updateConfig = require('../公共模块/修改配置文件');
var teamMode = require('../公共模块/组队模式');

var cga = global.cga;
var configTable = global.configTable;

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','全自动练级')
	},5000)
}

var playerinfo = cga.GetPlayerInfo();
var teammates = null
var gender = false

// 由于道具服有精灵变身、商城卡等一系列切换性别的方法，故需要手动指定性别。
var teamMale = [
	"UNAの格斗1",
	"UNAの战斧2",
	"UNAの格斗3",
];

var teamFemale = [
	"UNAの传教士2",
	"UNAの护士",
	"UNAの圣骑士",
];

var playerinfo = cga.GetPlayerInfo();
for (var i in teamMale){
	if(teamMale[i] == playerinfo.name){
		gender = true
		teammates = teamMale
		// console.log((teammates[0] == playerinfo.name || teammates.length == 0) ? '队长' : '不是')
	}
}
for (var i in teamFemale){
	if(teamFemale[i] == playerinfo.name){
		teammates = teamFemale
	}
}

if (teammates === null){
	console.error('错误，请检查男女队数组是否有自己的名字')
}

cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false


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

var loadBattleConfig = ()=>{
	var checkSkill = ()=>{
		var skills = cga.GetSkillsInfo();
		var job = '其他';
		skills.filter((sk)=>{
			if(sk.name.indexOf('补血魔法') >= 0 && sk.lv >= 4){
				job = '传教士'
			}else if(sk.name.indexOf('恢复魔法') >= 0 && sk.lv >= 4){
				job = '巫师'
			}else if(sk.name.indexOf('气功弹') >= 0 && sk.lv >= 4){
				job = '格斗士'
			}else if(sk.name.indexOf('暗黑骑士之力') >= 0){
				job = '暗黑骑士'
			}else if(sk.name.indexOf('神圣光芒') >= 0){
				job = '圣骑士'
			}
			return '';
		});
		return job;
	}
	

	var settingpath = cga.getrootdir() + '\\战斗配置\\'
	var role = checkSkill()
	if (role == '传教士'){
		settingpath = settingpath + 'BOSS传教.json'

	}else if (role == '巫师'){
		settingpath = settingpath + 'BOSS巫师.json'

	}else if (role == '格斗士'){
		settingpath = settingpath + 'BOSS格斗.json'

	}else if (role == '暗黑骑士'){
		settingpath = settingpath + 'BOSS暗黑骑士.json'

	}else if (role == '圣骑士'){
		settingpath = settingpath + 'BOSS圣骑士.json'

	}else{
		settingpath = settingpath + 'BOSS合击.json'
	}

	var setting = JSON.parse(fs.readFileSync(settingpath))

	cga.gui.LoadSettings(setting, (err, result)=>{
		if(err){
			console.log(err);
			return;
		}else{
			console.log('读取战斗配置【'+settingpath+'】成功')
		}
	})
	return
}

var task = cga.task.Task('时空之门1', [
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
				cga.travel.falan.autopilot('主地图',()=>{
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
	{//4
		intro: '4.与阿斯提亚神官（40.12）对话，传送至圣坛。',
		workFunc: function(cb2){
			cga.waitForLocation({mapname : '圣坛'}, ()=>{
				cb2(true)
			});

			cga.walkList([
				[39, 12],
			], ()=>{
				setTimeout(() => {
					cga.AsyncWaitNPCDialog(dialogHandler);
					cga.turnTo(40, 12);
				}, 1000);
			});
		}
	},
	{//5
		intro: '5.领取蜡烛。',
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
									setTimeout(()=>{
										cga.SayWords('1', 0, 3, 1);						
									}, 1500);
								});
							});
						});
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, cb2);
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
										cga.SayWords('1', 0, 3, 1);	
										cb2(true);				
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
									setTimeout(()=>{
										cga.SayWords('1', 0, 3, 1);						
									}, 1500);
								});
							});
						});
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, cb2);
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
										cga.SayWords('1', 0, 3, 1);	
										cb2(true);				
									}, 1500);
								});
							});
						});
					}, 3000);
				});
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
	{//6
		intro: '6.第1次交换蜡烛',
		workFunc: function(cb2){
			// 打开交易
			cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true)

			var retry = ()=>{
				console.log('retry...')
				if(gender && cga.GetMapXY().y == 47){
					cga.turnDir(2)
				}else if(!gender && cga.GetMapXY().y == 49){
					cga.turnDir(6)
				}

				if (cga.findItem(18496) != -1 && !gender){// 女性拿到红蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}else if(cga.findItem(18492) != -1 && gender){// 男性拿到白蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}
				setTimeout(retry, 1000);
			}

			var leaderMaleGo =()=>{
				cga.walkList([
					[24, 19, '圣坛', 24, 24],
					[69, 47],
					[74, 47],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('由于存在可能看不见对方的bug，请手动交易蜡烛，全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						talkNpcSayYesToChangeMap(cb2,[101,58],'index')
					});
				});
			}

			var memberMaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[101,58],'index')
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[24, 71, '圣坛', 24, 76],
					[69, 49],
					[74, 49],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('由于存在可能看不见对方的bug，请手动交易蜡烛，全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[81, 80, '圣坛', 73, 82],
							[97, 34, '圣坛', 103, 34],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[111,34],'index')
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[111,34],'index')
			}

			// 监视背包直至收到目标物品
			retry()

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
	{//7
		intro: '7.第2次交换蜡烛。',
		workFunc: function(cb2){
			
			// 打开交易
			cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true)

			var retry = ()=>{
				if(gender && cga.GetMapXY().y == 50){
					cga.turnDir(2)
				}else if(!gender && cga.GetMapXY().y == 52){
					cga.turnDir(6)
				}

				if (cga.findItem(18493) != -1 && !gender){// 女性拿到白蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}else if(cga.findItem(18497) != -1 && gender){// 男性拿到红蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}
				setTimeout(retry, 1000);
			}

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
					[7, 54, '圣坛', 7, 49],
					[15, 53, '圣坛', 22, 53],
					[26, 53, '圣坛', 31, 50],
					[60, 3, '圣坛', 59, 10],
					[100, 16, '圣坛', 100, 22],
					[80, 50],
					[84, 50],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('由于存在可能看不见对方的bug，请手动交易蜡烛，全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[106, 45, '圣坛', 115, 44],
							[128, 44, '圣坛', 135, 43],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[142,12],'index')
						});
					});
				});
			}

			var memberMaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[142,12],'index')
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
						cga.SayWords('由于存在可能看不见对方的bug，请手动交易蜡烛，全队完成后会自动报【1】从而继续脚本', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[68, 62, '圣坛', 62, 63],
							[94, 71, '圣坛', 95, 65],
							[67, 34, '圣坛', 61, 36],
							[58, 47, '圣坛', 58, 51],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[135,78],'index')
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[135,78],'index')
			}

			// 监视背包直至收到目标物品
			retry()

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
	{//8
		intro: '8.第3次交换蜡烛，通过圣坛抵达阿尔杰斯的慈悲。',
		workFunc: function(cb2){
			
			
			// 打开交易
			cga.EnableFlags(cga.ENABLE_FLAG_TRADE, true)

			var retry = ()=>{
				if (cga.findItem(18498) != -1 && !gender){// 女性拿到红蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}else if(cga.findItem(18494) != -1 && gender){// 男性拿到白蜡烛
					cga.SayWords('1', 0, 3, 1);
					return
				}
				setTimeout(retry, 1000);
			}

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
					[23, 15, '圣坛', 32, 15],
					[36, 23, '圣坛', 36, 31],
					[37, 46, '圣坛', 37, 53],
					[36, 68, '圣坛', 36, 75],
					[47, 80, '圣坛', 56, 80],
					[60, 75, '圣坛', 60, 68],
					[56, 60, '圣坛', 47, 60],
					[47, 60, '圣坛', 56, 60],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('男性走到【56,60】处，方向向下(dir 3)可以与桥上女性快捷交换蜡烛！全队【手动】交换完毕，脚本则自动继续', 0, 3, 1);
						cga.turnDir(3)
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[71, 60, '圣坛', 78, 60],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[82,63],'index')
						});
					});
				});
			}

			var memberMaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[82,63],'index')
			}

			var leaderFemaleGo =()=>{
				cga.walkList([
					[54, 62],
				], ()=>{
					setTimeout(()=>{
						cga.SayWords('女性走到【54,62】处，方向向上(dir 7)可以与桥上男性快捷交换蜡烛！全队【手动】交换完毕，脚本则自动继续', 0, 3, 1);
					}, 1500);
					
					cga.waitTeammateSayNextStage(teammates, ()=>{
						cga.walkList([
							[76, 30, '圣坛', 78, 25],
						], ()=>{
							talkNpcSayYesToChangeMap(cb2,[82,43],'index')
						});
					});
				});
			}

			var memberFemaleGo =()=>{
				talkNpcSayYesToChangeMap(cb2,[82,43],'index')
			}

			// 监视背包直至收到目标物品
			retry()

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
	{//9
		intro: '9.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。',
		workFunc: function(cb2){
			cga.waitForLocation({mapindex : 24001}, ()=>{
			cb2(true)
			});

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
		}
	},
	{//10
		intro: '10.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。',
		workFunc: function(cb2){
			var battleWords = '【UNA脚本提示】BOSS信息：Lv.65犹大，血量约7500，邪魔系，属性：全50，抗咒；技能：攻击、圣盾、崩击、乾坤一掷、战栗袭心、反击（奇数回合）、超强补血魔法（间隔2回合）、魔法封印（第一回合、每4回合；效果持续到下回合）'
			var suggest = '【UNA脚本提示】打法建议：按照火焰之刃/亡灵→冰怪→犹大→武装骷髅的顺序击杀，【人远程攻击，宠防御】。注意不能打死犹大前面的卡位的武装骷髅。'
			var tips = (counter)=>{

				if(counter == 0){
					return;
				} else if(counter == 3){
					cga.SayWords(suggest, 1, 3, 1);
				} else if(counter == 6){
					cga.SayWords(battleWords, 0, 3, 1);
				}
				
				setTimeout(tips, 1000, counter-1);
			}

			cga.waitForLocation({mapindex : 24000}, ()=>{
				cb2(true)
			});
	
			cga.walkList([
				[10, 8],
			], ()=>{
				tips(9)
			});
		}
	},
	{//11
		intro: '11.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。',
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
		function(){//5.领取蜡烛。
			return false;
		},
		function(){//6.第1次交换蜡烛。
			return false;
		},
		function(){//7.第2次交换蜡烛。
			return false;
		},
		function(){//8.第3次交换蜡烛，通过圣坛抵达阿尔杰斯的慈悲。
			return cga.GetMapIndex().index3 == 24002 ? true :false
		},
		function(){//9.与阿斯提亚神官（93.49）对话，传送至洗礼的试炼。
			return cga.GetMapIndex().index3 == 24001 ? true :false
		},
		function(){//10.选择真正需要完成UD人物的人物，进行自由组队，不限男女。与犹大（15.8）对话进入战斗。
			return false;
		},
		function(){//11.战斗胜利后传送至开启者之间，与布鲁梅尔（17.9）对话获得称号“开启者”并传送回圣餐之间，任务完结。
			return cga.GetMapIndex().index3 == 24007 ? true :false
		},
	]
	);

var loop = ()=>{
	callSubPluginsAsync('prepare', ()=>{
		cga.SayWords('欢迎使用【UNAの脚本】，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);
		task.doTask(()=>{
			console.log('【' + configTable.mainPlugin + '】任务完成')
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
		loadBattleConfig()
		loop();
	},
}

module.exports = thisobj;