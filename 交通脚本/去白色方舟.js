var fs = require('fs');
var cga = require('../cgaapi')(function(){
	// 重要信息：59934为【战斗系和准战斗系，通过黑色方舟最终到达白色方舟与露比对话，传送的学第11格技能】的mapindex3
	// 59930为白色方舟入口（四色分歧口）
	global.cga = cga
	var rootdir = cga.getrootdir()
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
	// 提取本地职业数据
	const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');

	//队员信息
	var playerinfo = cga.GetPlayerInfo();

	if(getprofessionalInfos.getJobLevel(playerinfo.job) < 3){
		var sayString = '【UNA脚本提示】你没有达到达到师范/御用(3转)阶段哦..在光之路会被石碑拦住的。';
		cga.sayLongWords(sayString, 0, 3, 1);
		// throw new Error('你没有达到达到师范/御用(3转)阶段哦..在光之路会被石碑拦住的。')
		console.log(sayString)
	}
	// 如没有王冠，加2人小队坐飞象时，目标名称所包含字符的筛选条件。
	var namefilter = "UNA"

	// // 2人小队集合点，队长等待坐标，如无需要，无需更改
	var wait_xpos = 93
	var wait_ypos = 63
	// 队员等待坐标
	var go_xpos = 93
	var go_ypos = 62

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
		else
		{
			return;
		}
	}

	var pass = (cb,npcPos,index,wannaPos)=>{
		setTimeout(() => {
			cga.TurnTo(npcPos[0], npcPos[1]);
		}, 1000);
		cga.AsyncWaitNPCDialog(dialogHandler);
		cga.waitForLocation({mapindex : index, pos : wannaPos}, ()=>{
			setTimeout(() => {
				console.log('到达index:【' +index+ '】，x:【' +wannaPos[0] + '】，y:' + wannaPos[1] + '】')
				if (cb) cb(true)
			}, 2000);
		});
		return
	}
	// 任务核心流程
	var task = cga.task.Task('去白色方舟', [
	{//0
		intro: '0.任务前期准备，包括治疗、招魂等。',
		workFunc: function(cb2){
			healMode.func(()=>{
				cb2(true)
			})
		}
	},
	{//1
		intro: '1.组2人队，坐小飞象去丘斯特村',
		workFunc: function(cb2){
			var retry = ()=>{
				var XY = cga.GetMapXY()
				if (XY.x == 118 && XY.y == 100){
					cga.AsyncWaitNPCDialog(dialogHandler);
					cga.TurnTo(118, 101);
					setTimeout(retry, 5000);
				}
				return
			}

			var go = ()=>{
				var teammates = [];
				var teamplayers = cga.getTeamPlayers();
				
				for(var i in teamplayers)
					teammates[i] = teamplayers[i].name;
				cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false;

				// 队长行动
				if(cga.isTeamLeader){
					cga.walkList([
						[118, 100],
					], ()=>{
						cga.waitForLocation({mapname:'丘斯特村'}, ()=>{
							cb2(true)
						});
						retry()
					});
				} else {//队员行动
					cga.waitForLocation({mapname:'丘斯特村'}, ()=>{
						cb2(true)
					});
				}
			
			}

			var organizeteam = ()=>{
				var teaminfo = cga.getTeamPlayers()
				if(teaminfo.length == 2){
					cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
					setTimeout(go, 1000);
				}else if(teaminfo.length == 0 && cga.GetMapXY().x == wait_xpos && cga.GetMapXY().y == wait_ypos){
					setTimeout(organizeteam, 1000);
				}
				else if(teaminfo.length == 0){
					cga.walkList([
						[go_xpos, go_ypos],
					], ()=>{
						var leader = cga.findPlayerUnit((u)=>{
							if (u.unit_name.indexOf(namefilter) != -1){
								return true
							}
						})
						if(leader && leader.xpos ==wait_xpos && leader.ypos==wait_ypos){
							cga.addTeammate(leader.unit_name, go);
						}else{
							cga.walkList([
								[wait_xpos, wait_ypos],
							], ()=>{
								cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
								setTimeout(organizeteam, 5000);
								return
							});
						}
					});
				}else{
					// 如果队伍人数超过了2，就离队
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					cga.travel.newisland.toStone('X', organizeteam);
				}
				return
			}
			if(cga.needSupplyInitial({  })){
				cga.travel.falan.toCastleHospital(()=>{
					setTimeout(() => {
						cga.travel.newisland.toStone('X', ()=>{
							cga.walkList([
								[165, 153],
							], ()=>{
								pass(organizeteam,[165,154],59522,[93,62])
								return
							});
						});
					}, 5000);
				})
			}else{
				cga.travel.newisland.toStone('X', ()=>{
					var sayString = '【UNA脚本】欢迎使用UNAの脚本，当前功能为【组2人队去白色方舟】';
					cga.sayLongWords(sayString, 0, 3, 1);
					cga.walkList([
						[165, 153],
					], ()=>{
						pass(organizeteam,[165,154],59522,[93,62])
						return
					});
				});
			}
		}
	},
	{//2
		intro: '2.从丘斯特村去港口',
		workFunc: function(cb2){
			var retry = ()=>{
				if (cga.getTeamPlayers().length > 0){
					cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
					console.log('小象还没飞到，5秒后重试')
					setTimeout(retry, 5000);
					return
				}else{
					cga.walkList([
						[130, 88],
					], ()=>{
						pass(cb2,[131,88],59527,[20,19])
						return
					});
				}
			}
			retry()
		}
	},
	{//3
		intro: '3.丘斯特村港口上船',
		workFunc: function(cb2){
			var retry = ()=>{
				cga.AsyncWaitNPCDialog(dialogHandler);
				cga.TurnTo(26, 18);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg && dlg.options == 12){
						cga.waitForLocation({mapname:'修拉特瓦尔号'}, ()=>{
							cb2(true)
						});
						return;
					}
					
					setTimeout(retry, 5000);
				});
			}
			cga.walkList([
				[26, 19],
			], retry);
		}
	},
	{//4
		intro: '4.等待到辛梅尔港，下船',
		workFunc: function(cb2){
			var retry = ()=>{
				cga.TurnTo(18, 19);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg && dlg.message.indexOf('停靠在辛梅尔港') >= 0 && dlg.options == 12){
						cga.ClickNPCDialog(4, -1);
						cga.waitForLocation({mapindex:59528}, ()=>{
							cb2(true)
						});
						return;
					}
					
					setTimeout(retry, 5000);
				});
			}
			cga.walkList([
				[18, 18],
			], retry);
		}
	},
	{//5
		intro: '5.出港，进入辛梅尔',
		workFunc: function(cb2){
			cga.walkList([
				[18, 18],
			], ()=>{
				pass(cb2,[18,17],59526,[189,112])
			});
		}
	},
	{//6
		intro: '6.从辛梅尔去光之路',
		workFunc: function(cb2){
			var sayString = '【UNA脚本提示】辛梅尔可以进行中转补给，(181,82)的公寓中有资深医生、银行、打卡处。还有骑宠技能相关NPC';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.walkList([
				[207, 91,'光之路'],
			], ()=>{
				cb2(true)
			});
		}
	},
	{//7
		intro: '7.在光之路找到石碑，进入白色方舟',
		workFunc: function(cb2){
			cga.walkList([
				[165, 82],
			], ()=>{
				cga.turnDir(6);
				cga.AsyncWaitNPCDialog((err, dlg)=>{
					if(dlg && dlg.message.indexOf('进一步的试练') >= 0 && dlg.options == 12){
						cga.ClickNPCDialog(4, -1);
						cga.waitForLocation({mapindex:59930}, ()=>{
							cb2(true)
						});
						return;
					}else if(dlg && dlg.message.indexOf('无资格者') >= 0 && dlg.options == 1){
						console.error('你没有资格进入，看看是不是声望没到，或者没有三转？')
					}
					return
				});
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){// 前期准备
			return false;
		},
		function(){// 去丘斯特村
			return (cga.GetMapIndex().index3 == 59524) ? true :false;
		},
		function(){// 从丘斯特村去港口
			return (cga.GetMapIndex().index3 == 59527) ? true :false;
		},
		function(){// 丘斯特村港口上船
			return (cga.GetMapName() == '修拉特瓦尔号') ? true :false;
		},
		function(){// 辛梅尔港口下船
			return (cga.GetMapIndex().index3 == 59528) ? true :false;
		},
		function(){// 出港，进入辛梅尔
			return (cga.GetMapIndex().index3 == 59526) ? true :false;
		},
		function(){// 从辛梅尔进入光之路
			return (cga.GetMapIndex().index3 == 59505) ? true :false;
		},
		function(){// 与石碑对话，进入白色方舟
			return (cga.GetMapIndex().index3 == 59930) ? true :false;
		},
	]
	);
	configMode.manualLoad('生产赶路')
	task.doTask(()=>{
		global.cga = cga
		var rootdir = cga.getrootdir()
		var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
		var body = {
			path : rootdir + "\\四转换花.js",
		}
		scriptMode.call_ohter_script(body)
	});
});