/**
 * UNAecho开发笔记:
 * 练级层数由thisobj.object.area.layer记录，由battleAreaArray中的walkto控制走到多少层
 */
var Async = require('async');
var teamModeArray = [
{
	name : '智能组队',
	is_enough_teammates : ()=>{
		// 如果没有记录练级信息
		if(!thisobj.object.area){
			return false
		}
		// 如果已经记录了车队成员
		var teamplayers = cga.getTeamPlayers();
		if(teamplayers.length >= thisobj.object.area.teammates.length){
			for(var i = 0; i < teamplayers.length; ++i){
				if(!is_array_contain(thisobj.object.area.teammates, teamplayers[i].name)){
					return false;
				}
			}
			return true;
		}
		return false;
	},
	wait_for_teammates_filter : (cb)=>{
		// 如果是单练，跳过组队统计，直接选择练级地点。TODO与组队同步逻辑
		if(thisobj.object.minTeamMemberCount <= 1){
			console.log('单人练级情况123123123123123')
			let areaObj = switchArea()
			thisobj.object.area = areaObj['area']
			update.update_config(areaObj, true, cb)
			return;
		}

		// 队员逻辑
		if(!cga.isTeamLeader){
			var retry = (cb)=>{
				var leader = cga.findPlayerUnit((u)=>{
					if((u.xpos == thisobj.object.leaderX && u.ypos == thisobj.object.leaderY) && (!thisobj.object.leaderFilter || u.nick_name.indexOf(thisobj.object.leaderFilter) != -1)){
						return true;
					}
					return false
				});
				if(leader && cga.getTeamPlayers().length == 0){
					var target = cga.getRandomSpace(leader.xpos,leader.ypos);
					cga.walkList([
					target
					], ()=>{
						cga.addTeammate(leader.unit_name, (r)=>{
							if(r){
								share((shareInfoObj)=>{
									if(typeof shareInfoObj == 'object'){// 共享信息成功，计算去哪里练级
										// 关闭组队
										cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
										// 计算去哪里练级
										let areaObj = switchArea(shareInfoObj)
										// 缓存练级信息结果
										thisobj.object.area = areaObj
										console.log("🚀 ~ file: 智能组队.js:60 ~ share ~ thisobj.object.area:", thisobj.object.area)
										// 先落盘，再在内存中保存结果
										update.update_config({area : thisobj.object.area}, true, ()=>{
											// 获取练级对象
											thisobj.object.battleAreaObj = battleAreaArray.find((b)=>{
												return b.name == thisobj.object.area.map
											});
											cb(true)
										})
									}else if(typeof shareInfoObj == 'boolean' && shareInfoObj === false){// 共享信息过程中有人离队
										setTimeout(retry, 1000, cb);
									}
									return
								})
								return;
							}
							setTimeout(retry, 1000, cb);
						});
					});
				} else {
					setTimeout(retry, 1500,cb);
				}
			}

			retry(cb);
			return
		}
		else {// 队长逻辑
			var wait = ()=>{
				cga.waitTeammatesWithFilter(thisobj.object.memberFilter, thisobj.object.minTeamMemberCount,(r)=>{
					if(r){
						share((shareInfoObj)=>{
							if(typeof shareInfoObj == 'object'){// 共享信息成功，计算去哪里练级
								// 关闭组队
								cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
								// 计算去哪里练级
								let areaObj = switchArea(shareInfoObj)
								// 缓存练级信息结果
								thisobj.object.area = areaObj
								console.log("🚀 ~ file: 智能组队.js:98 ~ share ~ thisobj.object.area:", thisobj.object.area)
								// 先落盘，再在内存中保存结果
								update.update_config({area : thisobj.object.area}, true, ()=>{
									// 获取练级对象
									thisobj.object.battleAreaObj = battleAreaArray.find((b)=>{
										return b.name == thisobj.object.area.map
									});
									cb(true)
								})
							}else if(typeof shareInfoObj == 'boolean' && shareInfoObj === false){// 共享信息过程中有人离队
								setTimeout(wait, 1000);
							}
							return
						})
						return;
					}
					setTimeout(wait, 5000);
				})
			}

			cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true);
			// 挂上标记，队员才能识别队长
			cga.ChangeNickName(thisobj.object.leaderFilter)
			wait();
		}
	},
	wait_for_teammates_timeout : (cb)=>{
		if (!thisobj.object.area.teammates instanceof Array || !thisobj.object.area.teammates.length){
			console.log('【错误】:wait_for_teammates_timeout仅接受固定组队，teammates必须有值才行')
			cb(false)
			return
		}

		cga.waitTeammatesReady(thisobj.object.area.teammates, thisobj.object.timeout,(r)=>{
			if(r && r == 'timeout'){
				console.log('等待组队超时，删除练级相关信息')
				cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
				update.delete_config(['teammates', 'area'], true, ()=>{
					// 练级信息、门票信息都清空
					thisobj.object.battleAreaObj = null
					thisobj.object.area = null
					setTimeout(cb, 3000, false);
				})
			}else if(r && r == 'ok'){
				cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false);
				// 出发前，计算一下当前队伍是否还适合在当前地点练级
				let areaObj = switchArea()
				if (areaObj.map != thisobj.object.area.map){
					console.log('该去【',areaObj.map,'】了')
					console.log('当前练级地点【' + thisobj.object.area.map +'】已经不适合练级，删除练级信息，重新回到拼车地点，开始进行新一轮判断。')
					update.delete_config(['area'], true, ()=>{
						// 练级信息、门票信息都清空
						thisobj.object.battleAreaObj = null
						thisobj.object.area = null
						setTimeout(cb, 3000, false);
					})
				}else if(areaObj.layer != thisobj.object.area.layer){
					console.log('练级层数发生变化，更新脚本配置..')
					// 缓存练级信息结果
					thisobj.object.area = areaObj
					// 先落盘，再在内存中保存结果
					update.update_config({area : thisobj.object.area}, true, ()=>{
						cb(true)
					})
				}else{
					cb(true)
				}
			}else{
				throw new Error('cga.waitTeammatesReady返回类型错误')
			}
		})
	},
	// 在新城集合，为了判断练级目的地。
	// 传送小岛：在里堡2楼图书室问大祭司，看看能否去营地/半山。能去会说【冒险者】【岛上拓荒】，不能去会说【我在等人】
	muster : (cb)=>{
		const key = '传送小岛'
		const checkTicket = (cb2)=> {
			cga.travel.falan.toStone('C', ()=>{
				cga.travel.autopilot(1504,()=>{
					var ask = ()=>{
						cga.turnTo(27, 15);
						cga.AsyncWaitNPCDialog((err, dlg)=>{
							//try again if timeout
							if(err && err.message.indexOf('timeout') > 0){
								setTimeout(ask, 1500);
								return;
							}
							if(dlg){
								if(dlg.message.indexOf('我在等人') >= 0){
									config['mission'][key] = false
									cga.savePlayerConfig(config, cb2);
									return;
								}
								if(dlg.message.indexOf('冒险者') >= 0 || dlg.message.indexOf('岛上拓荒') >= 0){
									config['mission'][key] = true
									cga.savePlayerConfig(config, cb2);
									return;
								}
							}
						});
					}

					cga.walkList([
						[27, 16]
					], ask);
				})
			});
		}

		const go = (cb3)=>{
			if(thisobj.object.minTeamMemberCount <= 1){
				console.log('当前为单独练级，跳过组队判断练级地点阶段')
				setTimeout(cb3, 1000);
				return
			}
			cga.travel.newisland.toStone('X', ()=>{
				// 队员会在wait_for_teammates_filter中自动找加队位置
				cga.walkList([
					[thisobj.object.leaderX, thisobj.object.leaderY]
				], cb3);
			});
		}

		var config = cga.loadPlayerConfig();
		if(!config)
			config = {};
		if(!config.hasOwnProperty('mission'))
			config['mission'] = {}
		if(config['mission'][key] == undefined){
			checkTicket(()=>{
				go(cb)
			})
		}else{
			go(cb)
		}
	},
	think : (ctx)=>{
		//单练模式
		if(thisobj.object.area.teammates.length == 0)
			return;
		
		//非危险区域，不用管
		//if(ctx.dangerlevel == 0)
		//	return;
		
		//队长：人数不足，登出
		//队员：人都跑光了，登出
		if((ctx.teamplayers.length < thisobj.object.area.teammates.length && cga.isTeamLeader) || ctx.teamplayers.length == 0)
		{
			ctx.result = 'logback';
			ctx.reason = '人数不足，登出';
			return;
		}
	}
},
]

/**
 * UNAecho : 雪拉森威塔10-50层传送石坐标：index598开头，第几层就是0几。
 * 如：第1层59801，第10层59810，第25层59825。
 * 只有1、10、15、25、30、35、40、45、50层有传送石，其他层没有。
 * 国民会馆进入1层入口:[108, 39, 59801],
 * 1层回国民会馆:[33, 99, 59552],
 * 下面2个，左边是1楼走到其他楼的传送石，右边是其他楼走到1楼的传送石坐标。
 * [76, 58, 59810],[54, 38, 59801],
 * [76, 56, 59815],[137, 69, 59801],
 * [76, 54, 59820],[88, 146, 59801],
 * [76, 52, 59825],[95, 57, 59801],
 * [72, 60, 59830],[68, 33, 59801],
 * [72, 58, 59835],[104, 26, 59801],
 * [72, 56, 59840],[98, 95, 59801],
 * [72, 54, 59845],[98, 29, 59801],
 * [75, 50, 59850],[78, 59, 59801],
 * 下面是50楼走到其他楼的传送石，
 * 因为走路回补要路过50楼整层，所以最好还是登出回补。没记录走回来的坐标，绝不是因为懒，绝不是。
 * 2023年更新：走回来的坐标都记录在自动寻路中，这次不懒了。
 * [27, 55, 59855],
 * [25, 55, 59860],
 * [23, 55, 59865],
 * [21, 55, 59870],
 * [24, 44, 59875],
 * [22, 44, 59880],
 * [20, 44, 59885],
 * [18, 44, 59890],
 * [16, 44, 59895],
 */
var battleAreaArray = [
	{
		name : '雪拉威森塔',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.askNpcForObj('艾尔莎岛', [165, 154],{act : 'map', target : '利夏岛'},()=>{
					cga.walkList([
						[90, 99, '国民会馆'],
						cga.isTeamLeader ? [108, 42] : [108, 43],
						], cb);
				})
			});
		},
		walkTo : (cb)=>{
			cga.travel.autopilot(59800 + thisobj.object.area.layer,cb)
		},
		isDesiredMap : (map, mapXY, mapindex)=>{
			return mapindex - 59800 == thisobj.object.area.layer ? true : false;
		}
	},
	{
		name : '低地鸡',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[221, 228],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '盖雷布伦森林');
		}
	},
	{
		name : '刀鸡',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[34, 188],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '龙骨',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[111, 206],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '黄金龙骨',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[135, 175],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '银狮',
		muster : (cb)=>{
			cga.travel.newisland.toStone('X', ()=>{
				cga.walkList([
					cga.isTeamLeader ? [144, 106] : [143, 106],
				], cb);
			});
		},
		walkTo : (cb)=>{
			cga.travel.newisland.toStone('D', ()=>{
				cga.walkList([
					[190, 116, '盖雷布伦森林'],
					[231, 222, '布拉基姆高地'],
					[122, 117],
					[147, 117],
				], cb);
			});
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '布拉基姆高地');
		}
	},
	{
		name : '回廊',
		muster : (cb)=>{
			cga.travel.falan.toStone('C', ()=>{
				cga.walkList([
					[52, 72]
					], ()=>{
						cga.TurnTo(54, 72);
						cga.AsyncWaitNPCDialog(()=>{
							cga.ClickNPCDialog(32, 0);
							cga.AsyncWaitNPCDialog(()=>{
								cga.ClickNPCDialog(4, 0);
								cga.AsyncWaitNPCDialog(()=>{
									cga.ClickNPCDialog(4, 0);
									cga.AsyncWaitMovement({map:'过去与现在的回廊', delay:1000, timeout:5000}, ()=>{
										cga.walkList([
											cga.isTeamLeader ? [11, 20] : [10, 20],
										], cb);
									});
								});
							});
						});
					});	
			});
			return
		},
		walkTo : (cb)=>{
			setTimeout(cb, 500);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '过去与现在的回廊');
		}
	},
	{
		name : '营地',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[548, 332],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛');
		}
	},
	{
		name : '蝎子',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			var map = cga.GetMapName();
			if(map == '圣骑士营地'){
				cga.walkList([
					[36, 87, '肯吉罗岛'],
					[384, 245, '蜥蜴洞穴'],
					[12, 2, '肯吉罗岛'],
					[231, 434, '矮人城镇'],
				], cb);
			}else if(map == '矮人城镇'){
				cga.walkList([
					[110, 191, '肯吉罗岛'],
					[233, 439],
				], cb);
			}
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '矮人城镇域');
		}
	},
	{
		name : '沙滩',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[471, 203],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '肯吉罗岛' && cga.travel.camp.getRegion(map, mapXY) == '沙滩域');
		}
	},
	{
		name : '蜥蜴',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[384, 245, '蜥蜴洞穴'],
				[17, 4, '蜥蜴洞穴上层第1层'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '蜥蜴洞穴上层第1层');
		}
	},
	{
		name : '黑龙',
		muster : (cb)=>{
			cga.travel.falan.toCamp(()=>{
				cga.walkList([
				cga.isTeamLeader ? [96, 86] : [97, 86],
				], cb);
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[36, 87, '肯吉罗岛'],
				[424, 345, '黑龙沼泽1区'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '黑龙沼泽1区');
		}
	},
	{
		name : '旧日之地',
		muster : (cb)=>{
			var getHorn = (cb2)=>{
				cga.walkList([
					[116, 69, '总部1楼'],
					], ()=>{
						cga.askNpcForObj('总部1楼', [87, 50],{act : 'item', target : '战斗号角'},()=>{
							cga.walkList([
								[4, 47, '圣骑士营地'],
								], ()=>{
									go(cb2)
								});
						})
					});				
					return;
			}
			var go = (cb2)=>{
				cga.askNpcForObj('圣骑士营地', [120, 81],{act : 'map', target : '旧日之地'},()=>{
					cga.askNpcForObj('旧日之地', [45, 46],{act : 'map', target : '迷宫入口'},()=>{
						cga.walkList([
							cga.isTeamLeader ? [6, 5] : [6, 6],
							], cb2);
					})
				})
			}
			cga.travel.falan.toCamp(()=>{
				if(cga.getItemCount('战斗号角') == 0){
					getHorn(cb)
				}else{
					go(cb)
				}
			});
			return
		},
		walkTo : (cb)=>{
			cga.walkList([
				[9, 5, '旧日迷宫第1层'],
			], cb);
		},
		isDesiredMap : (map, mapXY)=>{
			return (map == '旧日迷宫第1层');
		}
	},
]

var cga = global.cga;
var configTable = global.configTable;
var rootdir = cga.getrootdir()
var update = require(rootdir + '/通用挂机脚本/公共模块/修改配置文件');

// 共享队员信息，智能练级的核心部分
const share = (cb) => {
	cga.shareTeammateInfo(thisobj.object.minTeamMemberCount,['i承认之戒','m传送小岛'],(r)=>{
		if(typeof r == 'object'){
			cb(r)
		}else if(typeof r == 'boolean' && r === false){
			console.log('cga.shareTeammateInfo失败，执行回调函数..')
			cb(false)
		}else{
			throw new Error('cga.shareTeammateInfo返回参数类型异常，请检查')
		}
		return
	})
}

const switchArea = (shareInfoObj) => {

	var minLv = 160
	var camp = true
	var island = true

	var areaObj = {}

	// 缓存中有队内信息情况
	if(thisobj.object.area){
		// 队伍和高级地点门票不变
		areaObj.teammates = thisobj.object.area.teammates
		camp = thisobj.object.area.camp
		island = thisobj.object.area.island
		// 动态刷新一下最低等级
		var teamplayers = cga.getTeamPlayers()
		teamplayers.forEach(t => {
			if (t.level < minLv)
				minLv = t.level
		});
	}else if(shareInfoObj){// 队内没有缓存信息的情况
		var teamplayers = cga.getTeamPlayers()
		// 制作固定队员信息，用于接下来的练级，以及落盘记录持久化。
		var teammates = []
		teamplayers.forEach(t => {
			teammates.push(t.name)
			// 检查队内最低等级
			if (t.level < minLv)
				minLv = t.level
		});

		areaObj.teammates = teammates

		// 检查高级练级地点的通行许可
		for (var p in shareInfoObj) {
			if(shareInfoObj[p].item['承认之戒'] == '0'){
				camp = false
			}
			if(shareInfoObj[p].mission['传送小岛'] == '0'){
				island = false
			}
			// 注意，此for循环不可使用break，因为要遍历最小等级
			if(shareInfoObj[p].lv < minLv){
				minLv = shareInfoObj[p].lv
			}
		}
	}else{// 无队内信息情况，一般是单人练级才会进入此逻辑
		minLv = cga.GetPlayerInfo().level
		camp = cga.getItemCount('承认之戒', true) > 0 ? true : false
		var config = cga.loadPlayerConfig();
		if (config && config['mission'] && config['mission']['传送小岛'] == true){
			island = true
		}else{
			island = false
		}
	}
	// 由于雪拉威森塔路程近，50层前可回补，将1-50级从传统地图改为雪拉威森塔地图
	var battleArea = '雪拉威森塔'
	var layer = 1
	if (minLv > 10 && minLv <= 15) {// 不知什么原因，10楼不会遇敌，只能1楼练到10级去15楼
		layer = 15
	} else if (minLv > 15 && minLv <= 20) {
		layer = 20
	} else if (minLv > 20 && minLv <= 25) {
		layer = 25
	} else if (minLv > 25 && minLv <= 30) {
		layer = 30
	} else if (minLv > 30 && minLv <= 35) {
		layer = 35
	} else if (minLv > 35 && minLv <= 40) {// 注意40楼有睡眠怪
		layer = 40
	} else if (minLv > 40 && minLv <= 45) {
		layer = 45
	} else if (minLv > 45 && minLv <= 50) {
		layer = 50
	} else if (minLv > 50 && minLv <= 60) {
		battleArea = '回廊'
	}
	// 营地判定
	if(camp && minLv > 60 && minLv <= 72) {
		battleArea = '营地'
	} else if (camp && minLv > 72 && minLv <= 80) {
		battleArea = '蝎子'
	} else if (camp && minLv > 80 && minLv <= 97) {// 蜥蜴有石化，即便有抗石化依旧容易出现大量阵亡导致宠物忠诚下降，故在沙滩超额练一段时间
		battleArea = '沙滩'
	} else if (camp && minLv > 97 && minLv <= 105) {
		battleArea = '蜥蜴'
	} else if (camp && minLv > 105 && minLv <= 115) {
		battleArea = '黑龙'
	} else if (camp && minLv > 115) {
		battleArea = '旧日之地'
	}
	// 半山判定
	if(island && minLv > 115 && minLv <= 125) {
		battleArea = '小岛'
	} else if(island && minLv > 125) {
		battleArea = '半山腰'
	}
	// // TODO 去掉
	// battleArea = '雪拉威森塔' ,layer = 15

	// 将所有信息填入返回对象
	areaObj.map = battleArea
	areaObj.layer = layer
	areaObj.camp = camp
	areaObj.island = island
	console.log("🚀 ~ file: 智能组队.js:731 ~ switchArea ~ areaObj:", areaObj)
	return areaObj
}

var thisobj = {
	is_enough_teammates : ()=>{
		return thisobj.object.is_enough_teammates();
	},
	wait_for_teammates_filter : (cb)=>{
		thisobj.object.wait_for_teammates_filter(cb);
	},
	wait_for_teammates_timeout : (cb)=>{
		thisobj.object.wait_for_teammates_timeout(cb);
	},
	muster : (cb)=>{
		thisobj.object.muster(cb);
	},
	isBuildTeamReady : ()=>{
		return Object.prototype.toString.call(thisobj.object.battleAreaObj) == '[object Object]' ? true : false
	},
	musterWithBuildTeam : (cb)=>{
		console.log('去【' + thisobj.object.battleAreaObj.name  + '】集合处')
		thisobj.object.battleAreaObj.muster(cb)
	},
	isDesiredMap : (map, mapXY, mapindex)=>{
		return thisobj.object.battleAreaObj.isDesiredMap(map, mapXY, mapindex)
	},
	walkTo : (cb)=>{
		thisobj.object.battleAreaObj.walkTo(cb)
	},
	think : (ctx)=>{
		thisobj.object.think(ctx);
	},
	translate : (pair)=>{
		if(pair.field == 'teamMode'){
			pair.field = '组队模式';
			pair.value = teamModeArray[pair.value].name;
			pair.translated = true;
			return true;
		}
		if(pair.field == 'teammates'){
			pair.field = '队伍成员';
			pair.value = '['+pair.value.join(', ')+']';
			pair.translated = true;
			return true;
		}
		if(pair.field == 'minTeamMemberCount'){
			pair.field = '队伍最小人数';
			pair.translated = true;
			return true;
		}
		if(pair.field == 'timeout'){
			pair.field = '超时时间(毫秒)';
			pair.translated = true;
			return true;
		}
		return false;
	},
	loadconfig : (obj)=>{
		// 智能模式只有1种组队模式
		thisobj.object = teamModeArray[0];
		// 读取练级场所，如果没读取到，脚本会自动在出发前集合并判断去处，然后落盘。
		// configTable不需要一并读取，因为落盘方式改为跳过configTable直接修改对应key并保存。
		// 队伍成员被整合到练级地点对象中，因为队伍组成、练级地点、承认之戒、传送小岛都是高度绑定的。
		// 任何一个属性变动，都是要重新统计所有情况，所以放到1个对象之中。
		if(typeof obj.area == 'object'){
			configTable.area = obj.area
			thisobj.object.area = obj.area;
			thisobj.object.battleAreaObj = battleAreaArray.find((b)=>{
				return b.name == thisobj.object.area.map
			});
		}

		if(typeof obj.role != 'number'){
			let toInt = parseInt(obj.role)
			if(typeof obj.role == 'string' && !isNaN(toInt)){
				configTable.role = toInt;
				thisobj.object.role = toInt;
			}else{
				console.error('读取配置：队伍职责失败！只能输入0代表队长，1代表队员');
				return false;
			}
		}else{
			configTable.role = obj.role;
			thisobj.object.role = obj.role;
		}

		cga.isTeamLeader = thisobj.object.role == 0 ? true : false

		if (cga.isTeamLeader){
			configTable.minTeamMemberCount = obj.minTeamMemberCount;
			thisobj.object.minTeamMemberCount = obj.minTeamMemberCount;
			if(!(thisobj.object.minTeamMemberCount > 0)){
				console.error('读取配置：队伍最小人数失败！');
				return false;
			}
		}

		if (cga.isTeamLeader){
			configTable.memberFilter = obj.memberFilter;
			thisobj.object.memberFilter = obj.memberFilter;
		}

		configTable.leaderFilter = obj.leaderFilter;
		thisobj.object.leaderFilter = obj.leaderFilter;
		if(!(thisobj.object.leaderFilter)){
			console.error('读取配置：队长昵称过滤失败！');
			return false;
		}

		if(typeof obj.leaderX != 'number'){
			let toInt = parseInt(obj.leaderX)
			if(typeof obj.leaderX == 'string' && !isNaN(toInt)){
				configTable.leaderX = toInt;
				thisobj.object.leaderX = toInt;
			}else{
				console.error('读取配置：队长X坐标失败！只能输入0-999的数字');
				return false;
			}
		}else{
			configTable.leaderX = obj.leaderX;
			thisobj.object.leaderX = obj.leaderX;
		}

		if(typeof obj.leaderY != 'number'){
			let toInt = parseInt(obj.leaderY)
			if(typeof obj.leaderY == 'string' && !isNaN(toInt)){
				configTable.leaderY = toInt;
				thisobj.object.leaderY = toInt;
			}else{
				console.error('读取配置：队长Y坐标失败！只能输入0-999的数字');
				return false;
			}
		}else{
			configTable.leaderY = obj.leaderY;
			thisobj.object.leaderY = obj.leaderY;
		}

		if(typeof obj.timeout != 'number'){
			let toInt = parseInt(obj.timeout)
			if(typeof obj.timeout == 'string' && !isNaN(toInt)){
				configTable.timeout = toInt;
				thisobj.object.timeout = toInt;
			}else{
				console.warn('组队时改为无限等待，因为超时类型输入错误。超时时间只能输入number或者string数字。')
				configTable.timeout = 0;
				thisobj.object.timeout = 0;
			}
		}else{
			configTable.timeout = obj.timeout;
			thisobj.object.timeout = obj.timeout;
		}

		return true;
	},
	inputcb : (cb)=>{

		var stage0 = (cb2)=>{
			// 智能模式暂定只有1种模式
			thisobj.object = teamModeArray[0]

			var sayString = '【智能组队】队长设置，输入你是否是队长，0队长1队员:';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && (index == 0 || index == 1)){
					configTable.role = index;
					thisobj.object.role = index;
					
					var sayString2 = '当前已选择: 你是[' + (thisobj.object.role == 0 ? '队长' : '队员') + ']';
					cga.sayLongWords(sayString2, 0, 3, 1);
					setTimeout(cb2, 500);
					return false;
				}
				
				return true;
			});
		}

		var stage1 = (cb2)=>{
			var filterAttribute = '队长昵称'
			var sayString = '【智能组队】请选择' + filterAttribute + '过滤，' + filterAttribute + '中带有此输入字符才会被认定为队长(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果确实需要输入ok，请输入$ok:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(msg !== null && msg.length > 0 && msg.indexOf(':') == -1){
					if(msg == 'ok'){
						configTable.leaderFilter = null;
						thisobj.object.leaderFilter = null;
					}else if(msg == '$ok'){
						configTable.leaderFilter = 'ok';
						thisobj.object.leaderFilter = 'ok';
					}else{
						configTable.leaderFilter = msg;
						thisobj.object.leaderFilter = msg;
					}
					
					var sayString2 = '当前已选择:[' + thisobj.object.leaderFilter + ']。为' + filterAttribute + '过滤内容';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					if(thisobj.object.role == 0){
						stage2(cb2)
					}else{
						setTimeout(cb2, 500);
					}
					
					return false;
				}
				
				return true;
			});
		}

		var stage2 = (cb2)=>{
			var filterAttribute = '队员名称'
			var sayString = '【智能组队】请选择' + filterAttribute + '过滤，' + filterAttribute + '中带有输入字符才符合条件(区分大小写，不可以有半角冒号)，如不需要，请输入ok，如果确实需要输入ok，请输入$ok:';
			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(msg !== null && msg.length > 0 && msg.indexOf(':') == -1){
					if(msg == 'ok'){
						configTable.memberFilter = null;
						thisobj.object.memberFilter = null;
					}else if(msg == '$ok'){
						configTable.memberFilter = 'ok';
						thisobj.object.memberFilter = 'ok';
					}else{
						configTable.memberFilter = msg;
						thisobj.object.memberFilter = msg;
					}
					
					var sayString2 = '当前已选择:[' + thisobj.object.memberFilter + ']。为' + filterAttribute + '过滤';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					setTimeout(stage3, 500, cb2);
					return false;
				}
				
				return true;
			});
		}
		
		var stage3 = (cb2)=>{
			var sayString = '【智能组队】组队人数，智能组队使用自由组队拼车+固定组队练级模式，拼车成功后自动转为固定组队。请输入自由拼车的最小发车人数(1~5):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 1 && index <= 5){
					configTable.minTeamMemberCount = index;
					thisobj.object.minTeamMemberCount = index;
					
					var sayString2 = '当前已选择: 队伍最小人数[' + thisobj.object.minTeamMemberCount + ']人。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					setTimeout(cb2, 500);
					return false;
				}
				
				return true;
			});
		}

		var stage4 = (cb2)=>{
			var sayString = '【智能组队】请输入队长站位x坐标(0~999):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 0 && index <= 999){
					configTable.leaderX = index;
					thisobj.object.leaderX = index;
					
					setTimeout(cb2, 500);
					return false;
				}
				
				return true;
			});
		}

		var stage5 = (cb2)=>{
			var sayString = '【智能组队】请输入队长站位y坐标(0~999):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, index)=>{
				if(index !== null && index >= 0 && index <= 999){
					configTable.leaderY = index;
					thisobj.object.leaderY = index;
					
					setTimeout(cb2, 500);
					return false;
				}
				
				return true;
			});
		}

		var stage6 = (cb2)=>{
			var sayString = '【智能组队】超时设置，如果固定组队超时，则全员回退至自由组队阶段。请输入组队等待超时时间(毫秒):';

			cga.sayLongWords(sayString, 0, 3, 1);
			cga.waitForChatInput((msg, val)=>{
				if(val !== null && val > 0){
					configTable.timeout = val;
					thisobj.object.timeout = val;
					
					var sayString2 = '当前已选择等待队员:'+thisobj.object.timeout+'毫秒后超时触发回调。';
					cga.sayLongWords(sayString2, 0, 3, 1);
					
					setTimeout(cb2, 500);
					
					return false;
				}
				
				return true;
			});
		}
		// stage2和3仅队长需要执行，所以在stage1中判断是否执行
		Async.series([stage0, stage1, stage4, stage5, stage6], cb);
	}	
}

module.exports = thisobj;