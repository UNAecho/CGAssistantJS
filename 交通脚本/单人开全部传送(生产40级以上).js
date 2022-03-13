var cga = require('../cgaapi')(function(){

	var transferstatus = {
		shenglaluka:false,
		yier:false,
		yaliute:false,
		weinuoya:false,
		qili:false,
		jiana:false,
		jienuowa:false,
		dina:false,
		abanisi:false,
	}
	
	var waitResponse = (cb3,villageName)=>{
		// 等待NPC响应
		cga.AsyncWaitNPCDialog((err, dlg)=>{
			if(dlg && dlg.message.indexOf('金币') >= 0){
				transferstatus[villageName] = true
				console.log('传送石管理员:'+dlg.message)
				console.log('传送石已经开启过，无需重复开启')
				setTimeout(cb3, 3000, true);
			}
			else if(dlg && dlg.message.indexOf('欢迎') >= 0){
				transferstatus[villageName] = true
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
			// cga.travel.falan.toStone('C', ()=>{
				
			// 	var list = [
			// 	[41, 50, '里谢里雅堡 1楼'],
			// 	[45, 20, '启程之间']
			// 	];
				
			// });
			console.log('TODO:暂时跳过检查传送，强制全部村子都开一遍')
			cb2(true)
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
						setTimeout(waitResponse, 1000, cb2,'shenglaluka');
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
						setTimeout(waitResponse, 1000, cb2,'yier');
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
									setTimeout(waitResponse, 1000, cb2,'yaliute');
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
										setTimeout(waitResponse, 1000, cb2,'weinuoya');
										});
								});
							});
					})
				}, 2500);
			})
		}
	},
	{//5
		intro: '5.补给，并过海底',
		workFunc: function(cb2){
			var readytogo =()=>{
				var goout = ()=>{
					cga.walkList([
						[2, 9, '维诺亚村'],
						[67, 46, '芙蕾雅'],
					], ()=>{
						setTimeout(go, 1000, cb2);
					});
				}
				setTimeout(goout, 3000, cb2);
			}
			
			var go =(cb3)=>{
				var mapindex = cga.GetMapIndex().index3
				var tmplist = [
					[7,37]
				]
				switch (mapindex) {
					case 100:
						tmplist.unshift(
							[343, 497, '索奇亚海底洞窟 地下1楼'],
							[18, 34, '索奇亚海底洞窟 地下2楼'],
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							);
						break;
					case 15005:
						tmplist.unshift(
							[18, 34, '索奇亚海底洞窟 地下2楼'],
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							);
						break;
					case 15003:
						tmplist.unshift(
							[27, 29, '索奇亚海底洞窟 地下1楼'],
							);
						break;
					case 15004:
						break;
					default:
						console.log('错误:你在非规定路线的地图中:【'+cga.GetMapName()+'】')
						break;
				}
				cga.walkList(
					tmplist
					, ()=>{
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
									cb3(true);
									});
								});
							});
					});
			}
			// 入口
			if (cga.GetMapIndex().index3 <15000 || cga.GetMapIndex().index3 > 15999){
				// false:非资深护士回补
				console.log('出发前回补')
				cga.travel.weinuoya.toHospital(readytogo,false)
			}else{
				setTimeout(go, 1000, cb2);
			}
		}
	},
	{//6
		intro: '6.奇力村',
		workFunc: function(cb2){
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
				setTimeout(waitResponse, 1000, cb2,'qili');
				});
		}
	},
	{//7
		intro: '7.在奇力村补给，并过洪恩大风洞（角笛大风穴）',
		workFunc: function(cb2){
			var readytogo =()=>{
				var goout = ()=>{
					cga.walkList([
						[3, 9, '奇利村'],
						[79, 76, '索奇亚'],
					], ()=>{
						setTimeout(go, 1000, cb2);
					});
				}
				setTimeout(goout, 3000, cb2);
			}
			
			var go =(cb3)=>{
				var mapindex = cga.GetMapIndex().index3
				var tmplist = [
					[133, 26, '索奇亚'],
				]
				switch (mapindex) {
					case 300:
						tmplist.unshift(
							[356, 334, '角笛大风穴'],
							);
						break;
					case 13001:
						break;
					default:
						console.log('错误:你在非规定路线的地图中:【'+cga.GetMapName()+'】')
						break;
				}
				cga.walkList(
					tmplist
					, ()=>{
						cb3(true)
					});
			}
			// 入口
			if (cga.GetMapIndex().index3 <13000 || cga.GetMapIndex().index3 > 13999){
				// false:非资深护士回补
				console.log('出发前回补')
				cga.travel.qili.toHospital(readytogo,false)
			}else{
				setTimeout(go, 1000, cb2);
			}
		}
	},
	{//8
		intro: '8.出了洪恩大风洞之后，去加纳村开传送。',
		workFunc: function(cb2){
			cga.walkList([
			[704, 147, '加纳村'],
			[36, 40, '村长的家'],
			[17, 6, '加纳村的传送点'],
			[15, 8],
		], ()=>{
			cga.TurnTo(15, 7);
			setTimeout(waitResponse, 1000, cb2,'jiana');
			});}
	},
	{//9
		intro: '9.杰诺瓦镇',
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
											setTimeout(waitResponse, 1000, cb2,'jienuowa');
											});
									});
								});
							});
					})
				}, 2500);
			});
		}
	},
	{//10
		intro: '10.杰诺瓦镇补给，并避开夜晚，不然会被蒂娜村民fuck',
		workFunc: function(cb2){
			var waitflag = false
			var cycletime = (60 * 1000)<<1
			// 等待天明
			var waitopportunity = (cb4)=>{
				var timerange = cga.getTimeRange()
				if (timerange != '夜晚' && timerange != '黄昏'){
					console.log('天亮了，出发！')
					setTimeout(go, 1000, cb4);
					return
				}else{
					if(!waitflag){
						console.log('等待天明..每【'+cycletime/1000+'】秒检查一次时间')
					}
					waitflag = true
					setTimeout(waitopportunity, cycletime, cb4);
					return
				}
			}
			var readytogo =()=>{
				var goout = ()=>{
					cga.walkList([
						[1, 9, '杰诺瓦镇'],
						// 莎莲娜
						[71, 18, 400],
					], ()=>{
						setTimeout(waitopportunity, 1000, cb2);
					});
				}
				setTimeout(goout, 3000, cb2);
			}
			
			var go =(cb3)=>{
				var mapindex = cga.GetMapIndex().index3
				var tmplist = [
					[570, 275, '蒂娜村'],
				]
				switch (mapindex) {
					case 400:
						break;
					default:
						console.log('错误:你在非规定路线的地图中:【'+cga.GetMapName()+'】')
						break;
				}
				cga.walkList(
					tmplist
					, ()=>{
						cb3(true)
					});
			}
			// 入口
			if (cga.GetMapIndex().index3 >=4000 && cga.GetMapIndex().index3 < 4100){
				// false:非资深护士回补
				console.log('出发前回补')
				cga.travel.jienuowa.toHospital(readytogo,false)
			}else if(cga.getTimeRange() == '夜晚' || cga.getTimeRange() == '黄昏'){
				setTimeout(waitopportunity, 1000, cb2);
			}else{
				setTimeout(go, 1000, cb2);
			}}
	},
	{//11
		intro: '11.蒂娜村',
		workFunc: function(cb2){
			var waitflag = false
			var cycletime = (60 * 1000)<<1
			var tmplist = [
				// 村长的家map.index3是3212
				[29, 60, '村长的家'],
				// 去传送房间的过道房间是3214
				[9, 6, 4213],
				[7, 12, 4214],
				[12, 6,'蒂娜村的传送点'],
				[7, 5],
			]
			// 白天正常逻辑，开传送
			var go = (cb6)=>{
				cga.walkList(
					tmplist, ()=>{
					cga.TurnTo(6, 5);
					setTimeout(waitResponse, 1000, cb6,'dina');
					});
				}
			// 在村口等天亮
			var waitopportunity = (cb5)=>{
				var timerange = cga.getTimeRange()
				if (timerange != '夜晚'){
					list.unshift([570, 275, '蒂娜村'],);
					setTimeout(go, 1000, cb5);
					return
				}else{
					if(!waitflag){
						console.log('等待天明..'+cycletime)
					}
					waitflag = true
					setTimeout(waitopportunity, cycletime, cb5);
					return
				}
			}
			// 从夜晚蒂娜村出去
			var goout = (cb7)=>{
				cga.walkList([
					[29, 21, 400],
				], ()=>{
					setTimeout(waitopportunity, 1000, cb7);
					});
			}
			// 入口
			if (cga.GetMapIndex().index3 ==4201){
				setTimeout(goout, cycletime, cb2);
			}else{
				setTimeout(go, 1000, cb2);
			}
		}

	},
	{//12
		intro: '12.登出补给并传送至杰诺瓦，准备去阿巴尼斯',
		workFunc: function(cb2){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(() => {
					cga.travel.falan.toTeleRoom('杰诺瓦镇', ()=>{
						cga.walkList([
							[14, 6, '村长的家'],
							[1, 10, '杰诺瓦镇'],
							[24, 40, '莎莲娜'],
						], ()=>{
							cb2(true)});
						});
				}, 2500);
			});
		}
	},
	{//13
		intro: '13.出杰诺瓦镇，过通往阿巴尼斯的地下道，来到阿巴尼斯开传送',
		workFunc: function(cb2){
			cga.walkList([
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
				setTimeout(waitResponse, 1000, cb2,'abanisi');
			});}
	},
	],
	[//任务阶段是否完成
		function(){// 传送石检查 TODO:自动去启程之间检查开传状态，写入transferstatus这个dict中
			return true;
		},
		function(){// 圣拉鲁卡村
			return transferstatus.shenglaluka == true? true :false;
		},
		function(){// 伊尔村
			return transferstatus.yier == true? true :false;
		},
		function(){// 亚留特村
			return transferstatus.yaliute == true? true :false;
		},
		function(){// 维诺亚村
			return transferstatus.weinuoya == true? true :false;
		},
		function(){// 过海底
			if (cga.GetMapName() == '索奇亚' && cga.GetMapXY().x <276 && cga.GetMapXY().y >260){
				return true
			}
			return false
		},
		function(){// 奇力村
			return transferstatus.qili == true? true :false;
		},
		function(){// 过洪恩大风洞
			if (cga.GetMapName() == '索奇亚' && cga.GetMapXY().x >400){
				return true
			}
			return false
		},
		function(){// 加纳村
			return transferstatus.jiana == true? true :false;
		},
		function(){// 杰诺瓦镇
			return transferstatus.jienuowa == true? true :false;
		},
		function(){// 杰诺瓦镇补给，并等待白天
			if (transferstatus.jienuowa && cga.GetMapName() == '杰诺瓦镇' && timerange != '夜晚' && timerange != '黄昏'){
				return true
			}
			return false
		},
		function(){// 蒂娜村
			return transferstatus.dina == true? true :false;
		},
		function(){// 登出补给并传送至杰诺瓦，准备去阿巴尼斯[217,455,'杰诺瓦镇'],
			if (transferstatus.jienuowa && transferstatus.dina && cga.GetMapName() == '莎莲娜'){
				return true
			}
			return false
		},
		function(){// 阿巴尼斯
			return transferstatus.abanisi == true? true :false;
		},
	]
	);
	
	task.doTask();
});