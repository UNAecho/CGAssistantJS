var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){

	global.cga = cga
	var rootdir = cga.getrootdir()
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	var playerinfo = cga.GetPlayerInfo();
	// 提取本地职业数据
	const getprofessionalInfos = require(rootdir + '/常用数据/ProfessionalInfo.js');
	var professionalInfo = getprofessionalInfos(playerinfo.job)
	var job = professionalInfo.jobmainname

	// 导师所在地图
	var NPCRoom = professionalInfo.tutorRoom
	// 导师坐标
	var NPCpos = professionalInfo.tutorpos
	
	// 声望数据
	const reputationInfos = require(rootdir + '/常用数据/reputation.js');
	var titleinfo = reputationInfos.getReputation(playerinfo.titles)

	var missionName = '职业晋级'

	var talkToTutor = (tutorPos, cb)=>{
		var target = cga.getRandomSpace(tutorPos[0],tutorPos[1])
		// 驯兽师导师在柜台里，必须指定唯一对话坐标
		if(job == '驯兽师'){
			target = [13, 10]
		}
		cga.walkList(
			[target], ()=>{
				cga.turnTo(tutorPos[0],tutorPos[1]);
				cga.AsyncWaitNPCDialog(()=>{
					// cga.ClickNPCDialog(0, 0);就职
					// cga.ClickNPCDialog(0, 1);转职
					// cga.ClickNPCDialog(0, 2);提升阶级
					cga.ClickNPCDialog(0, 2);
					cga.AsyncWaitNPCDialog((err,dlg)=>{
						if(dlg && dlg.options == 0){
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog(()=>{
								console.log('晋级完毕')
								cb(true)
								return
							});
						}
					});	
				});
		});	
	}
	// 导师所在领域可以直接传送的地区
	var fastTravel = {
		"伊尔村":true,
		"圣拉鲁卡村":true,
		"亚留特村":true,
		"维诺亚村":true,
		"奇利村":true,
		"加纳村":true,
		"杰诺瓦镇":true,
		"蒂娜村":true,
		"阿巴尼斯村":true,
	}

	var task = cga.task.Task(missionName, [
	{//0
		intro: '1.任务准备',
		workFunc: function(cb2){
			console.log('当前职业通用名称【' + job + '】')
			var jobLv = getprofessionalInfos.getJobLevel(playerinfo.job)
			var repuLv = titleinfo['titleLv']
			var minimumLv = reputationInfos.promoteReputation[jobLv]
			var reputationList = titleinfo['type'] == '战斗系' ? reputationInfos.reputationList : reputationInfos.productReputationList
			if (repuLv < minimumLv){
				console.warn('【UNA脚本警告：】当前声望：【' + reputationList[repuLv].reputation + '】不足以晋级，需要至少【' + reputationList[minimumLv].reputation + '】以上才行。')
			}
			healMode.func(()=>{
				setTimeout(cb2, 1000, true);
			})
		}
	},
	{//1
		intro: '2.出发去职业导师地点',
		workFunc: function(cb2){
			if(professionalInfo.tutorlocation == '法兰城'){
				var go = ()=>{
					try {
						cga.travel.autopilot(NPCRoom,()=>{
							talkToTutor(NPCpos,cb2)
						})
					} catch (error) {
						console.log('[UNA脚本警告]:未知的导师房间导航错误，请联系作者yadhr582855555@hotmail.com修复，error:')
						console.error(error)
					}
					return
				}
				var villageName = cga.travel.switchMainMap()
				if(villageName == '法兰城'){
					go()
				}else{
					cga.travel.falan.toStone('C', go)
				}
			}else{//非法兰城职业、职级变动
				if(fastTravel[professionalInfo.tutorlocation]){
					var go = ()=>{
						try {
							cga.travel.autopilot(NPCRoom,()=>{
								talkToTutor(NPCpos,cb2)
							})
						} catch (error) {
							console.log('[UNA脚本警告]:未知的导师房间导航错误，请联系作者yadhr582855555@hotmail.com修复，error:')
							console.error(error)
						}
						return
					}
					var villageName = cga.travel.switchMainMap()
					if(villageName == professionalInfo.tutorlocation){
						go()
					}else{
						cga.travel.falan.toTeleRoom(professionalInfo.tutorlocation, go)
					}
				}else if(job == '魔术师'){
					cga.travel.falan.toStone('W1', ()=>{
						cga.walkList([
							[22, 88, '芙蕾雅'],
							[298, 148],
						], ()=>{
							cga.task.waitForNPC('神木', ()=>{
								var npc = cga.findNPC('神木');
								if(!npc){
									cb2(false);
									return;
								}
								var target = cga.getRandomSpace(npc.xpos,npc.ypos);
								cga.walkList([
								target
								], ()=>{
									cga.turnTo(npc.xpos, npc.ypos);
									cga.AsyncWaitNPCDialog(()=>{
										cga.SayWords('魔术', 0, 3, 1);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(1, 0);
											cga.AsyncWaitMovement({map:['魔女之家'], delay:1000, timeout:5000}, ()=>{
												talkToTutor(NPCpos,cb2)
											});
										});
									});
								});
							});
						});
					});
				}else if(job == '格斗士'){
					cga.travel.falan.toTeleRoom('奇利村', ()=>{
						cga.walkList(professionalInfo.tutorwalk, ()=>{
							cga.TurnTo(23,23)
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg && dlg.message.indexOf('老师') >= 0){
									cga.ClickNPCDialog(4, -1);
									return
								}
							});
							cga.AsyncWaitMovement({map:'师范的房间'}, ()=>{
								talkToTutor(NPCpos,cb2)
							});
						});
					})
				}else if(job == '教团骑士'){
					cga.travel.falan.toCamp(()=>{
						cga.walkList([
							[52, 68, '曙光营地指挥部'],
							[69, 69, '曙光营地指挥部', 85, 2],
							[97, 13],
						], ()=>{
							cga.TurnTo(97, 14);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg && dlg.message.indexOf('欢迎') >= 0){
									cga.ClickNPCDialog(1, -1);
									return
								}
							});
							cga.waitForLocation({mapindex: 27015, pos : [11, 0]}, ()=>{
								talkToTutor(NPCpos,cb2)
							});
						});
					},true)
				}else if(job == '盗贼'){
					cga.travel.falan.toCity('哥拉尔镇', ()=>{
						cga.walkList([
							[176, 105, '库鲁克斯岛'],
							[405, 407],
							], ()=>{
								cga.TurnTo(407, 407);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(1, -1);
									cga.AsyncWaitMovement({map:47003}, ()=>{
										talkToTutor(NPCpos,cb2)
								});
							});
						});
					});
					return
				}else if(job == '咒术师'){
					cga.travel.falan.toStone('C', () => {
						cga.walkList([
							[17, 53, '法兰城'],
							[22, 88, '芙蕾雅'],
							[201, 166],
						], () => {
							cga.TurnTo(201, 165);
							setTimeout(() => {
								cga.AsyncWaitNPCDialog(() => {
									cga.ClickNPCDialog(1, -1)
									cga.AsyncWaitMovement({ map: 15000, delay: 1000, timeout: 5000 }, () => {
										cga.walkList([
											[20, 8, '莎莲娜海底洞窟 地下2楼'],
											[32, 21],
										], () => {
											cga.TurnTo(31, 22);
											setTimeout(() => {
												cga.SayWords('咒术', 0, 3, 1);
												cga.AsyncWaitNPCDialog(() => {
													cga.ClickNPCDialog(1, 0);
													cga.AsyncWaitMovement({ map: 15006, delay: 1000, timeout: 5000 }, () => {
														cga.walkList([
															[38, 37, '咒术师的秘密住处'],
															[12, 7],
															[10, 0, 15008],
															[10, 1]
														], () => {
															cga.TurnTo(11, 0);
															cga.AsyncWaitNPCDialog(() => {
																cga.ClickNPCDialog(4, 0);
																cga.AsyncWaitNPCDialog(() => {
																	cga.ClickNPCDialog(1, -1)
																	cga.AsyncWaitMovement({ map: 15012, delay: 1000, timeout: 5000 }, () => {
																		talkToTutor(NPCpos,cb2)
																	});
																});
															});
														});
													});
												});
											}, 1500);
										});
									});
								});
							}, 1500);
						});
					})
				}else{
					throw new Error('错误，还未支持到【'+ job + '】，请联系作者yadhr582855555@hotmail.com更新')
				}
			}
		}
	},
	],
	[//任务阶段是否完成
		function(){// 1.任务准备
			return false;
		},
		function(){// 2.出发去职业导师地点
			return false;
		}
	]
	);
	configMode.manualLoad('生产赶路')
	task.doTask(()=>{
		cga.refreshMissonStatus(null,()=>{
			console.log('晋级完毕。跳转至通用挂机脚本')
			var scriptMode = require(rootdir + '\\通用挂机脚本\\公共模块\\跳转其它脚本');
			var body = {
				path : rootdir + "\\通用挂机脚本.js",
			}
			scriptMode.call_ohter_script(body)
		})
	});
});