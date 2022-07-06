var fs = require('fs');
var cga = require('../cgaapi')(function(){

	var config = cga.loadPlayerConfig()

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

	var waitResponse = (cb3)=>{
		// 等待NPC响应
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			if(dlg && dlg.message.indexOf('金币') >= 0){
				console.log('传送石管理员:'+dlg.message)
				console.log('传送石已经开启过，无需重复开启')
				setTimeout(cb3, 3000, true);
			}
			else if(dlg && dlg.message.indexOf('欢迎') >= 0){
				console.log('传送石管理员:'+dlg.message)
				console.log('开传成功')
				setTimeout(cb3, 3000, true);
			}
			else if(dlg && dlg.message.indexOf('不能') >= 0){
				console.log('传送石管理员:'+dlg.message)
				console.log('无法开传，请检查')
				setTimeout(waitResponse, 3000, cb3);
			}
		});
	}
	//任务核心流程
	var task = cga.task.Task('单人开全部传送(生产40级以上)', [
	{//0
		intro: '0.检查开传状态',
		workFunc: function(cb2){
			cga.travel.falan.checkAllTeleRoom(()=>{
				setTimeout(() => {
					config = cga.loadPlayerConfig()
					cb2(true)
				}, 3000);
			})
		}
	},
	{//1
		intro: '1.圣拉鲁卡村',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.walkList([
						[17, 53, '法兰城'],
						[22, 88,'芙蕾雅'],
						[134, 218, '圣拉鲁卡村'],
						[49, 81, '村长的家'],
						[8, 10, '圣拉鲁卡村的传送点'],
						[15, 4,],
					], ()=>{
						cga.TurnTo(15,3);
						setTimeout(waitResponse, 1000, cb2);
					})
				}, 2500);
			})
		}
	},
	{//2
		intro: '2.伊尔村',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.walkList([
						[65, 53, '法兰城'],
						[281, 88,'芙蕾雅'],
						[681, 343, '伊尔村'],
						[47, 83, '村长的家'],
						[14, 17, '伊尔村的传送点'],
						[20, 10,],
					], ()=>{
						cga.TurnTo(22,10);
						setTimeout(waitResponse, 1000, cb2);
					})
				}, 2500);
			})
		}
	},
	{//3
		intro: '3.亚留特村',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.walkList([
						[27, 82],
						[41,98,'法兰城'],
						[281, 88, '芙蕾雅'],
						[672,223,'哈巴鲁东边洞穴 地下1楼'],
						[41,8,'哈巴鲁东边洞穴 地下2楼'],
						[17,18]
						], ()=>{
							cga.ForceMove(6, true);
							cga.ForceMove(6, true);
							cga.walkList([
								[16,11,'哈巴鲁东边洞穴 地下1楼'],
								[30,4,'芙蕾雅'],
								[596,84,'亚留特村'],
								[49,65],[49,47],
								[56,48,2412],
								[22,9,2499],
								[5,13],[4,14],[5,13],[4,14],[5,13]
								], ()=>{
									cga.turnTo(5, 14);
									setTimeout(waitResponse, 1000, cb2);
								});
						});
				}, 2500);
			})
		}
	},
	{//4
		intro: '4.维诺亚村',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.walkList([
						[41, 98, '法兰城'],
						//南门
						[153, 241, '芙蕾雅'],
						[473, 316],
					], ()=>{
						cga.TurnTo(472, 316);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(4, -1);
							cga.AsyncWaitMovement({map:'维诺亚洞穴 地下1楼', delay:1000, timeout:5000}, (err)=>{
								if(err){
									console.error('出错，请检查..')
									return;
								}
								cga.walkList([
									[20,59,'维诺亚洞穴 地下2楼'],
									[24,81,'维诺亚洞穴 地下3楼'],
									[26,64,'芙蕾雅'],
									[330,480,'维诺亚村'],
									[40,36,'村长的家'],
									[18,10,'村长家的小房间'],
									[8,2,'维诺亚村的传送点'],
									[4,3],
									], ()=>{
										cga.TurnTo(5, 4);
										setTimeout(waitResponse, 1000, cb2);
										});
								});
							});
					})
				}, 2500);
			})
		}
	},
	{//5
		intro: '5.奇利村',
		workFunc: function(cb2){
			var mapindex = cga.GetMapIndex().index3
			var villageName = cga.travel.switchMainMap(mapindex)
			if(villageName == '维诺亚村'){
				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(false,()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					})
				}else{
					cga.travel.falan.autopilot('主地图',()=>{
						cga.walkList([
							[67, 46, '芙蕾雅'],
							[343, 497, '索奇亚海底洞窟 地下1楼'],
							[18, 34, '索奇亚海底洞窟 地下2楼'],
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							[7,37]
						], ()=>{
							cga.TurnTo(8, 37);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, -1)
									cga.AsyncWaitMovement({map:'索奇亚', delay:1000, timeout:5000}, (err)=>{
										if(err){
											console.error('出错，请检查..')
											return;
										}
										cga.walkList([
											[274, 294, '奇利村'],
											// 村长的家map.index3是3212
											[50, 63, 3212],
											// 去传送房间的过道房间是3214
											[10, 15, 3214],
											[5, 3, '奇利村的传送点'],
											[12, 8]
										], ()=>{
											cga.TurnTo(13, 8);
											setTimeout(waitResponse, 1000, cb2);
											});
										});
									});
								});
						});
					})
				}
			}else{
				cga.travel.falan.toTeleRoom('维诺亚村', ()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
			}
		}
	},
	{//6
		intro: '6.加纳村',
		workFunc: function(cb2){
			var mapindex = cga.GetMapIndex().index3
			var villageName = cga.travel.switchMainMap(mapindex)
			if(villageName == '奇利村'){
				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(false,()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					})
				}else{
					cga.travel.falan.autopilot('主地图',()=>{
						cga.walkList([
							[79, 76, '索奇亚'],
							[356, 334, '角笛大风穴'],
							[133, 26, '索奇亚'],
						], ()=>{
							cga.walkList([
								[704, 147, '加纳村'],
								[36, 40, '村长的家'],
								[17, 6, '加纳村的传送点'],
								[15, 8],
							], ()=>{
								cga.TurnTo(15, 7);
								setTimeout(waitResponse, 1000, cb2);
								})
						});
					})
				}
			}else{
				cga.travel.falan.toTeleRoom('奇利村', ()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
			}
		}
	},
	{//7
		intro: '7.杰诺瓦镇',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.walkList([
						//里谢里雅堡西门
						[17, 53, '法兰城'],
						//西门
						[22, 88, '芙蕾雅'],
					], ()=>{
						cga.walkList([
							[201, 166],
						], ()=>{
							cga.TurnTo(201, 165);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(1, -1)
								cga.AsyncWaitMovement({map:15000, delay:1000, timeout:5000}, (err)=>{
									if(err){
										console.error('出错，请检查..')
										return;
									}
									cga.walkList([
										[20,8,'莎莲娜海底洞窟 地下2楼'],
										[11,9,'莎莲娜海底洞窟 地下1楼'],
										[24,11,'莎莲娜'],
										[217,455,'杰诺瓦镇'],
										[58,43,'村长的家'],
										[13,7,'杰诺瓦镇的传送点'],
										[7,8],
										], ()=>{
											cga.TurnTo(7, 7);
											setTimeout(waitResponse, 1000, cb2);
											});
									});
								});
							});
					})
				}, 2500);
			});
		}
	},
	{//8
		intro: '8.蒂娜村，并避开夜晚，不然会被蒂娜村民fuck',
		workFunc: function(cb2){
			var waitflag = false
			var cycletime = (60 * 1000)<<1
			// 等待天明
			var waitopportunity = (cb3,cycletime)=>{
				var timerange = cga.getTimeRange()
				if (timerange != '夜晚' && timerange != '黄昏'){
					console.log('天亮了，开始动身')
					setTimeout(cb3, 1000);
					return
				}else{
					if(!waitflag){
						console.log('等待天明..每【'+cycletime/1000+'】秒检查一次时间')
					}
					waitflag = true
					setTimeout(waitopportunity, cycletime, cb3);
					return
				}
			}
			var checkin = ()=>{
				cga.travel.falan.autopilot('传送石',()=>{
					cga.walkList(
						[[7, 5],], ()=>{
						cga.TurnTo(6, 5);
						setTimeout(waitResponse, 1000, cb2);
						});
				})
			}
			var retry = (cb4)=>{
				cga.walkList([
					[570, 275, '蒂娜村'],
				], ()=>{
					if(cga.GetMapIndex().index3 == 4200){
						console.log('进入白天蒂娜村了')
						setTimeout(cb4, 1000);
						return
					}else{
						cga.walkList([
							[29, 21, 400],
						], ()=>{
							setTimeout(retry, cycletime);
							return
						});
					}
				});
			}
			var setout = ()=>{
				var mapindex = cga.GetMapIndex().index3
				var villageName = cga.travel.switchMainMap(mapindex)
				if(villageName == '杰诺瓦镇'){
					if(cga.needSupplyInitial({  })){
						cga.travel.toHospital(false,()=>{
							setTimeout(()=>{
								cb2('restart stage');
							}, 3000);
						})
					}else{
						cga.travel.falan.autopilot('主地图',()=>{
							cga.walkList([
								[71, 18, 400],
							], ()=>{
								if(cga.GetMapIndex().index3 == 4200){
									checkin()
								}else{
									retry(checkin)
								}
							});
						})
					}
				}else{
					cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					});
				}
			}
			waitopportunity(setout,cycletime)
		}
	},
	{//9
		intro: '9.阿巴尼斯村',
		workFunc: function(cb2){
			var mapindex = cga.GetMapIndex().index3
			var villageName = cga.travel.switchMainMap(mapindex)
			if(villageName == '杰诺瓦镇'){
				if(cga.needSupplyInitial({  })){
					cga.travel.toHospital(false,()=>{
						setTimeout(()=>{
							cb2('restart stage');
						}, 3000);
					})
				}else{
					cga.travel.falan.autopilot('主地图',()=>{
						cga.walkList([
							[24, 40, '莎莲娜'],
							//杰诺瓦侧入口
							[235,338,'莎莲娜西方洞窟'],
							[45,9,14001],
							[57,13,14002],
							[36,7,'莎莲娜'],
							[183,161,'阿巴尼斯村'],
							[36,54,'村长的家'],
							[6,5,4313],
							[9,9,'阿巴尼斯村的传送点'],
							[5,14],
						], ()=>{
							cga.TurnTo(5,15)
							setTimeout(waitResponse, 1000, cb2);
						});
					})
				}
			}else{
				cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
					setTimeout(()=>{
						cb2('restart stage');
					}, 3000);
				});
			}
		}
	},
	{//10
		intro: '10.检查完成状态',
		workFunc: function(cb2){
			cga.travel.falan.checkAllTeleRoom(()=>{
				cb2(true)
			})
		}
	},
	],
	[//任务阶段是否完成
		function(){// 传送石检查
			return false;
		},
		function(){// 圣拉鲁卡村
			return (config && config['圣拉鲁卡村']) == true? true :false;
		},
		function(){// 伊尔村
			return (config && config['伊尔村']) == true? true :false;
		},
		function(){// 亚留特村
			return (config && config['亚留特村']) == true? true :false;
		},
		function(){// 维诺亚村
			return (config && config['维诺亚村']) == true? true :false;
		},
		function(){// 奇利村
			return (config && config['奇利村']) == true? true :false;
		},
		function(){// 加纳村
			return (config && config['加纳村']) == true? true :false;
		},
		function(){// 杰诺瓦镇
			return (config && config['杰诺瓦镇']) == true? true :false;
		},
		function(){// 蒂娜村
			return (config && config['蒂娜村']) == true? true :false;
		},
		function(){// 阿巴尼斯
			return (config && config['阿巴尼斯村']) == true? true :false;
		},
		function(){// 重新保存状态
			return false
		},
	]
	);
	loadBattleConfig()
	task.anyStepDone = false;
	task.doTask();
});