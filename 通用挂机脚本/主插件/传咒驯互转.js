var fs = require('fs');
var Async = require('async');
var updateConfig = require('./../公共模块/修改配置文件');
var teamMode = require('./../公共模块/组队模式');
var supplyCastle = require('./../公共模块/里堡回补');

var cga = global.cga;
var configTable = global.configTable;

var supplyArray = [
	supplyCastle
];

var getSupplyObject = (map, mapindex)=>{
	if(typeof map != 'string')
		map = cga.GetMapName();
	if(typeof mapindex != 'number')
		mapindex = cga.GetMapIndex().index3;
	return supplyArray.find((s)=>{
		return s.isAvailable(map, mapindex);
	})
}

// 提取本地职业数据
const getprofessionalInfos = require('../../常用数据/ProfessionalInfo.js');
// 提取本地职业信息
const getProfessionalbehavior = require('../../常用数据/Professionalbehavior.js');
// 声望数据
const reputationInfos = require('../../常用数据/reputation.js');

var jump = ()=>{
	setTimeout(()=>{
		updateConfig.update_config('mainPlugin','烧声望')
	},5000)
}

var loadBattleConfig = ()=>{

	var settingpath = cga.getrootdir() + '\\战斗配置\\生产赶路.json'

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

var transferJob = (behavior,cb) =>{
	cga.AsyncWaitNPCDialog(()=>{
		//转职
		if(behavior == 'transfer'){
			cga.ClickNPCDialog(0, 1);
			cga.AsyncWaitNPCDialog(()=>{
				cga.ClickNPCDialog(32, 0);
				cga.AsyncWaitNPCDialog((err,dlg)=>{
					console.log(dlg)
					if(dlg && dlg.options == 0){
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							console.log('转职完毕')
							cb(true)
							return
						});
					}
				});	
			});	
		}else if(behavior == 'promote'){//晋级
			cga.ClickNPCDialog(0, 2);
			cga.AsyncWaitNPCDialog((err,dlg)=>{
				console.log(dlg)
				if(dlg && dlg.options == 0){
					cga.ClickNPCDialog(0, 0);
					cga.AsyncWaitNPCDialog(()=>{
						console.log('晋级完毕')
						cb(true)
						return
					});
				}
			});	
		}else{//就职
			cga.ClickNPCDialog(0, 0);
			cga.AsyncWaitNPCDialog(()=>{
				console.log('就职完毕')
				cb(true)
				return
			});
		}

	});
} 

var dialogHandler = (err, dlg) => {
	if (dlg && (dlg.options & 4) == 4) {
		cga.ClickNPCDialog(4, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	if (dlg && (dlg.options & 32) == 32) {
		cga.ClickNPCDialog(32, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if (dlg && dlg.options == 12) {
		cga.ClickNPCDialog(1, 0);
		cga.AsyncWaitNPCDialog(dialogHandler);
		return;
	}
	else if (dlg && dlg.options == 1) {
		cga.ClickNPCDialog(1, 0);
		return;
	}
	else {
		return;
	}
}

// 传教学技能动作
var learn = (cb) => {
	cga.AsyncWaitNPCDialog(() => {
		cga.ClickNPCDialog(0, 0);
		cga.AsyncWaitNPCDialog(() => {
			setTimeout(() => {
				cga.ClickNPCDialog(0, -1);
				setTimeout(() => {
					cga.AsyncWaitNPCDialog((err, dlg) => {
						if (dlg && dlg.message.indexOf('技能栏位') > 0) {
							throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了')
						} else if (dlg && dlg.message.indexOf('你的钱') > 0) {
							throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
						} else {
							console.log('技能学习完毕')
							cb(true)
						}
					});
				}, 1500);
			}, 1000);
		});
	});

}

var taskMissionary = ['就职传教士', [
	{
		intro: '1.前往法兰城大圣堂里面，就职处',
		workFunc: function (cb2) {
			cga.travel.falan.toStone('C', () => {
				cga.walkList([
					[41, 14, '法兰城'],
					[154, 29, '大圣堂的入口'],
					[14, 7, '礼拜堂'],
					[23, 0, '大圣堂里面'],
					[16, 10]
				], () => {
					cb2(true);
				});
			});
		}
	},
	{
		intro: '2.就职答题',
		workFunc: function (cb2) {
			cga.turnDir(2);

			cga.AsyncWaitNPCDialog(dialogHandler);

			var retry = ()=>{
				if(cga.getItemCount('僧侣适性检查合格证') > 0){
					cb2(true)
					return
				}
				setTimeout(retry, 2000);
			}
			setTimeout(retry, 2000);
			return
		}
	},
	{
		intro: '3、与相关职业就职人员对话，就职成功，任务完结。',
		workFunc: (cb2) => {
			cga.turnDir(7);
			transferJob('transfer',cb2)
		}
	},
	{
		intro: '4、学习单体补血，以备不时之需。',
		workFunc: (cb2) => {
			if (cga.GetMapName() == '大圣堂里面') {
				cga.walkList([
					[13, 7]
				], () => {
					cga.turnDir(7);
					cga.AsyncWaitNPCDialog(dialogHandler);
					// 传教学习技能房间
					cga.AsyncWaitMovement({ map: 1208 }, () => {
						cga.walkList([
							[14, 11]
						], () => {
							cga.turnDir(6);
							learn(cb2)
						});
					})
				});
			} else {
				cga.travel.falan.toStone('C', () => {
					cga.walkList([
						[41, 14, '法兰城'],
						[154, 29, '大圣堂的入口'],
						[14, 7, '礼拜堂'],
						[23, 0, '大圣堂里面'],
						[13, 7]
					], () => {
						cga.turnDir(7);
						cga.AsyncWaitNPCDialog(dialogHandler);
						// 传教学习技能房间
						cga.AsyncWaitMovement({ map: 1208 }, () => {
							cga.walkList([
								[14, 11]
							], () => {
								cga.turnDir(6);
								learn(cb2)
							});
						})
					});
				});
			}

		}
	}
],
	[//任务阶段是否完成
		function () {//是否在就职地图
			return (cga.GetMapIndex().index3 == 1207) ? true : false;
		},
		function () {
			return (cga.getItemCount('僧侣适性检查合格证') > 0) ? true : false;
		},
		function () {
			return cga.GetPlayerInfo().job.indexOf('传教士') != -1 ? true : false;
		},
		function () {
			return (cga.findPlayerSkill('补血魔法') && cga.GetPlayerInfo().job.indexOf('传教士') != -1) ? true : false;
		}
	]
];

var taskWarlock = ['咒术就职', [
	{//0
		intro: '1.进入莎莲娜海底洞窟。前往莎莲娜海底洞窟地下2楼调查（31.22）处，输入“咒术”，变更场景。3.往南行走进入咒术师的秘密住处（38.37），与咒术师希索普（13.7）对话，选“是”获得【咒器·红念珠】。',
		workFunc: function(cb2){
						
			var go = ()=>{
				cga.walkList([
				[14, 6, '村长的家'],
				[1, 10, '杰诺瓦镇'],
				[24, 40, '莎莲娜'],
				[196, 443, '莎莲娜海底洞窟 地下1楼'],
				[14, 41, '莎莲娜海底洞窟 地下2楼'],
				[32, 21],
				], ()=>{
					cga.TurnTo(31, 22);
					setTimeout(()=>{
					cga.SayWords('咒术', 0, 3, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({map:15006, delay:1000, timeout:5000}, ()=>{
								cga.walkList([
								[38, 37, '咒术师的秘密住处'],
								[12, 7],
								[12, 8],
								[12, 7],
								[12, 8],
								[12, 7],
								], ()=>{
									cga.cleanInventory(1, ()=>{
										cga.TurnTo(14, 7);
										cga.AsyncWaitNPCDialog(()=>{
											cga.ClickNPCDialog(4, 0);
											cga.AsyncWaitNPCDialog(()=>{
												setTimeout(cb2, 1000,true);
											});										
										});
									});
								});
							});
						});
					}, 1500);
				});
			}
			
			cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
				go();
			});
		}
	},
	{//1
		intro: '2.前往法兰城豪宅（96.148），通过厨房的垃圾箱（33.22），进入豪宅地下。由（9.5）处上楼，通过镜子（33.10）进入镜中的豪宅。',
		workFunc: function(cb2){
			var go = ()=>{
				cga.walkList([
				[96, 149, '豪宅'],
				[33, 22, '豪宅  地下'],
				[9, 5, '豪宅'],
				[33, 10, '镜中的豪宅'],
				[35, 2],
				], ()=>{
					cga.cleanInventory(1, ()=>{
						cga.TurnTo(35, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							setTimeout(()=>{
								cga.walkList([
								[36, 9],
								], ()=>{
									cga.TurnTo(36, 10);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(4, 0);
										cga.AsyncWaitMovement({x:36, y:11, delay:1000, timeout:5000}, ()=>{
											cga.walkList([
											[27, 67, '豪宅'],
											[58, 66, '豪宅  地下'],
											[41, 23, '豪宅'],
											[59, 6, '豪宅  2楼'],
											[16, 9, '镜中的豪宅  2楼'],
											[40, 10],
											], ()=>{
												cga.cleanInventory(1, ()=>{
													cga.TurnTo(41, 10);
													cga.AsyncWaitNPCDialog(()=>{
														cga.ClickNPCDialog(4, 0);
														setTimeout(()=>{
															cga.walkList([
															[40,16],
															], ()=>{
																cga.TurnTo(40, 17);
																cga.AsyncWaitNPCDialog(()=>{
																	cga.ClickNPCDialog(4, 0);
																	cga.AsyncWaitMovement({x:40, y:18, delay:1000, timeout:5000}, ()=>{
																		cga.walkList([
																		[17, 61, '豪宅  2楼'],
																		[5, 23, '豪宅  阁楼'],
																		[14, 30, '镜中的豪宅  阁楼'],
																		[14, 36, '镜中的豪宅  2楼'],
																		[11, 35],
																		], ()=>{
																			cga.cleanInventory(1, ()=>{
																				cga.TurnTo(12, 35);
																				cga.AsyncWaitNPCDialog(()=>{
																					cga.ClickNPCDialog(4, 0);
																					setTimeout(()=>{
																						cga.walkList([
																						[16, 51, '镜中的豪宅  阁楼'],
																						[23, 20],
																						], ()=>{
																							cga.TurnTo(23, 19);
																							cga.AsyncWaitNPCDialog(()=>{
																								cga.ClickNPCDialog(4, 0);
																								cga.AsyncWaitMovement({x:23, y:18, delay:1000, timeout:5000}, ()=>{
																									cga.walkList([
																									[23, 11],
																									[22, 11],
																									[23, 11],
																									[22, 11],
																									[23, 11],
																									], cb2);
																								});
																							});
																						});
																					}, 1500);
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
										});
									});
								});
							}, 1500);
						});
					});
				})
			}
			
			cga.travel.falan.toStone('W2', go);
			
		}
	},
	{//2
		intro: '3.与罗蕾儿（23.10）对话，选“是”获得【神器·紫念珠】。再次与罗蕾儿对话传送回豪宅（32.45）处。',
		workFunc: function(cb2){
			cga.cleanInventory(1, ()=>{
				cga.TurnTo(23, 10);
				cga.AsyncWaitNPCDialog((err)=>{					
					if(err){
						console.log(err);
						cga.walkList([ [23, 11], [22, 11] ], ()=>{
							cb2('restart stage');
						});
						return;
					}
					
					cga.ClickNPCDialog(32, 0);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(32, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							setTimeout(cb2, 1000, true);
						});
					});
				});	
			});			
		}
	},
	{//3
		intro: '4.返回莎莲娜海底洞窟咒术师的秘密住处与咒术师希索普对话，交出【咒器·红念珠】、【神器·紫念珠】获得【咒术师推荐信】。',
		workFunc: function(cb2){

			var go = ()=>{
				cga.walkList([
				[14, 6, '村长的家'],
				[1, 10, '杰诺瓦镇'],
				[24, 40, '莎莲娜'],
				[196, 443, '莎莲娜海底洞窟 地下1楼'],
				[14, 41, '莎莲娜海底洞窟 地下2楼'],
				[32, 21],
				], ()=>{
					cga.TurnTo(31, 22);
					setTimeout(()=>{
					cga.SayWords('咒术', 0, 3, 1);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({map:15006, delay:1000, timeout:5000}, ()=>{
								cga.walkList([
								[38, 37, '咒术师的秘密住处'],
								[12, 7],
								], ()=>{
									cga.TurnTo(14, 7);
									cga.AsyncWaitNPCDialog(()=>{
										cga.ClickNPCDialog(4, 0);
										cga.AsyncWaitNPCDialog(()=>{
											cb2(true);
										});										
									});
								});
							});
						});
					}, 1500);
				});
			}
			
			cga.travel.falan.toTeleRoom('杰诺瓦镇', go);

		}
	},
	{//4
		intro: '5.与相关职业就职人员对话，转职成功，任务完结。',
		workFunc: (cb2)=>{

			var toWarlockRoom =(cb3)=>{
				cga.walkList([
					[10, 0, 15008],
					[10, 0]
				], () => {
					cga.TurnTo(11, 0);
					cga.AsyncWaitNPCDialog(() => {
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog(() => {
							cga.ClickNPCDialog(1, -1)
							cga.AsyncWaitMovement({ map: 15012, delay: 1000, timeout: 5000 }, () => {
								cga.walkList([
									[11, 11],
								], () => {
									cga.TurnTo(11, 10);
									transferJob('transfer',cb3)
								});
							});
			
						});
					});
				});
			}
			// 本阶段mian开始处
			if (cga.GetMapIndex().index3 == 15007){
				setTimeout(toWarlockRoom, 1500,cb2);
			}else{
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
													], () => {
														setTimeout(toWarlockRoom, 1500,cb2);
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
			}
		}	
	}
	],
	[//任务阶段是否完成
		function(){
			return (cga.getItemCount('咒器·红念珠') >= 1) ? true : false;
		},
		function(){
			return ((cga.GetMapName() == '镜中的豪宅  阁楼') && cga.GetMapXY().y < 19 ) ? true : false;
		},
		function(){
			return (cga.getItemCount('咒器·红念珠') >= 1 && cga.getItemCount('神器·紫念珠') >= 1) ? true : false;
		},
		function(){
			return (cga.getItemCount('咒术师推荐信') >= 1) ? true : false;
		},function(){
			return (cga.GetPlayerInfo().job.indexOf('咒') != -1  || cga.GetPlayerInfo().job.indexOf('降') != -1) ? true : false;
		},
	]
];

	var taskTamer = ['就职驯兽师', [
		{
			intro: '1.与法兰城平民武器贩售处（150.122）对话，购买就职职业对应的武器。',
			workFunc: function(cb2){
				var findWeap = cga.findItem((item)=>{
					return item.type == 5;
				})
				if(findWeap >= 8)
				{
					cga.UseItem(findWeap);
					setTimeout(cb2, 1000, true);
					return;
				}
				
				cga.travel.falan.toStone('B1', ()=>{
					cga.turnTo(150, 122);
					cga.AsyncWaitNPCDialog(()=>{
						cga.ClickNPCDialog(0, 0);
						cga.AsyncWaitNPCDialog(()=>{
							cga.BuyNPCStore([{index:5, count:1}]);
							cga.AsyncWaitNPCDialog((err, dlg)=>{
								if(dlg && dlg.message.indexOf('谢谢') >= 0){
									cga.UseItem(cga.findItem((item)=>{
										return item.type == 5;
									}));
									setTimeout(cb2, 1000, true);
									return;
								}
								else
								{
									cb2(false);
									return;
								}
							});
						});
					});
				});
			}
		},
		{
			intro: '2.到法兰城的东医院[224.87]内找护士买“止痛药”',
			workFunc: function(cb2){
				cga.travel.falan.toEastHospital(function(r){
					var npc = cga.findNPC('药剂师波洛姆');
					if(!npc){
						cb2(false);
						return;
					}
					cga.walkList([
					[npc.xpos-1, npc.ypos]
					], (r)=>{
						cga.turnTo(npc.xpos, npc.ypos);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(0, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.BuyNPCStore([{index:1, count:1}]);
								cga.AsyncWaitNPCDialog((err, dlg)=>{
									if(dlg && dlg.message.indexOf('请保重') >= 0){
										cb2(true);
										return;
									}
									else
									{
										cb2(false);
										return;
									}
								});
							});
						});
					});
				});
			}
		},
		{
			intro: '3.接著再到公会[73.60]，把止痛药交给安布伦后他会给你一张“通行证” ',
			workFunc: function(cb2){
				cga.travel.falan.toStone('W1', ()=>{
					cga.walkList([
						[73, 60, '职业公会'],
						[8, 6]
					], (r)=>{
						cga.turnTo(10, 6);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.walkList([
									[9, 24, '法兰城'],
									[63, 79],
								], ()=>{
									cb2(true);
								})
							});
						});
					});
				});
			}
		},
		{
			intro: '4、出西门进国营第24坑道（351.146），在一楼左方找哈鲁迪亚说话就可以进入试练洞窟。直闯6F大厅，和波洛米亚（23.15）交谈后就可以拿到推荐信。',
			workFunc: (cb2)=>{
				cga.travel.falan.toStone('W1', (r)=>{
					cga.walkList([
						[22, 87, '芙蕾雅'],
						[351, 145, '国营第24坑道 地下1楼'],
						[9, 15],
					], (r)=>{
						cga.TurnTo(9, 13);
						cga.AsyncWaitNPCDialog((dlg)=>{
							cga.ClickNPCDialog(1, 0);
							cga.AsyncWaitMovement({x: 7, y: 15}, ()=>{
								cga.walkList([
									[9, 5, '试炼之洞窟 第1层'],
									[33, 31, '试炼之洞窟 第2层'],
									[22, 42, '试炼之洞窟 第3层'],
									[42, 34, '试炼之洞窟 第4层'],
									[27, 12, '试炼之洞窟 第5层'],
									[39, 36, '试炼之洞窟 大厅'],
									[23, 20],
								], (r)=>{
									var job = cga.GetPlayerInfo().job;
									if(job == '游民'){
										cga.walkList([
										[23, 17]
										], (r)=>{
											cga.turnDir(6);
											cga.AsyncWaitNPCDialog(()=>{
												cga.ClickNPCDialog(1, 0);
												setTimeout(cb2, 1000, true);
											});
										});
									} else {
										cga.walkList([
										[22, 12],
										[23, 12],
										], (r)=>{
											cga.SayWords('驯兽师', 0, 0, 0);
											cga.AsyncWaitNPCDialog((err, dlg)=>{
												if(dlg && dlg.message.indexOf('那就拿去吧') >= 0){
													cga.ClickNPCDialog(1, 0);
													setTimeout(cb2, 1000, true);
												}
												else
												{
													cb2(false);
													return;
												}
											});
										});
									}
								});
							});
						});
					});
				});
			}	
		},
		{
			intro: '5、返回法兰城与相关职业就职人员对话，转职成功，任务完结。',
			workFunc: (cb2)=>{
				cga.travel.falan.toStone('W1', (r)=>{
					cga.walkList([
						[73, 60, '职业公会'],
						[13, 10],
					], (r)=>{
						cga.turnTo(13, 8);
						transferJob('transfer',cb2)
					});
				});
			}	
		}
		],
		[//任务阶段是否完成
			function(){//小刀
				var job = cga.GetPlayerInfo().job;
				if(job == '游民' && cga.getItemCount((item)=>{
					return item.type == 5 && item.pos < 8;
				}, true) > 0) return true;
				
				if(job != '游民')
					return true;
				
				return false;
			},
			function(){//止痛药
				return (cga.getItemCount('#18233') > 0) ? true : false;
			},
			function(){//试炼洞穴通行证
				return (cga.getItemCount('#18100') > 0) ? true : false;
			},
			function(){ 
				return (cga.getItemCount('驯兽师推荐信') > 0) ? true : false;
			},
			function(){ 
				return (cga.GetPlayerInfo().job.indexOf('驯兽师') != -1) ? true : false;
			}
		]
	];
// 假循环，只是为了写法一致。本loop仅执行一次。
var loop = ()=>{

	var map = cga.GetMapName();
	var mapindex = cga.GetMapIndex().index3;
	var playerinfo = cga.GetPlayerInfo();

	cga.SayWords('欢迎使用【UNAの脚本】全自动保证书+转职+刷声望流程，当前正在进行：【'+configTable.mainPlugin+'】阶段。', 0, 3, 1);

	var professionalInfo = getprofessionalInfos(playerinfo.job)
	var job = professionalInfo.jobmainname
	var title = reputationInfos.getReputation(playerinfo.titles)
	console.log('传咒驯互转开始，当前职业为:' + job)

	if((title == '敬畏的寂静' || title == '无尽星空') && cga.findPlayerSkill('完美调教术')){
		console.log('恭喜！称号已满，并且拥有完美调教术，此号已经可以随意使用了！')
		//TODO 完成账号毕业后续流程
		return
	}

	callSubPluginsAsync('prepare', ()=>{

		if(cga.needSupplyInitial() && playerinfo.gold > 10000){
			var supplyObject = getSupplyObject(map, mapindex);
			if(supplyObject)
			{
				supplyObject.func(loop);
				return;
			}
		}

		// 由于cga.task是单例模式，在同一个脚本中多次定义就会被覆盖，无法声明多个任务，并选择性使用。
		// 故将任务拆分成数组形式，在使用的时候安插进cga.task中。
		if(title == '敬畏的寂静' || title == '无尽星空'){
			console.log('称号满但没有完美调教术，那么进行传咒驯互转的最后一站:转职驯兽')
			var task = cga.task.Task(taskTamer[0],taskTamer[1],taskTamer[2])
			//TODO 完成账号毕业后续流程
			task.doTask(jump)
		}else if(job == '传教士'){
			console.log('称号没满，准备转职为:咒术师')
			var task = cga.task.Task(taskWarlock[0],taskWarlock[1],taskWarlock[2])
			task.doTask(jump)
		}else{
			console.log('称号没满，准备转职为:传教士')
			var task = cga.task.Task(taskMissionary[0],taskMissionary[1],taskMissionary[2])
			task.anyStepDone = false;
			task.doTask(jump)
		}
	});
}

var thisobj = {
	getDangerLevel : ()=>{
		return 0;
	},
	translate : (pair)=>{
		
		// if(teamMode.translate(pair))
		// 	return true;
		
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
		// 	(cb2)=>{
		// 	var sayString = '【转职保证书插件】请选择服务监听端口: 1000~65535';
		// 	cga.sayLongWords(sayString, 0, 3, 1);
		// 	cga.waitForChatInput((msg, val)=>{
		// 		if(val !== null && val >= 1000 && val <= 65535){
		// 			configTable.listenPort = val;
		// 			thisobj.listenPort = val;
					
		// 			var sayString2 = '当前已选择:监听端口='+thisobj.listenPort+'。';
		// 			cga.sayLongWords(sayString2, 0, 3, 1);
					
		// 			cb2(null);
					
		// 			return false;
		// 		}
				
		// 		return true;
		// 	});
		// }
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