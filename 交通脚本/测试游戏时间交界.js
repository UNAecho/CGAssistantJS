var fs = require('fs');
var cga = require('../cgaapi')(function () {
	global.cga = cga
	var rootdir = cga.getrootdir()
	// 法兰城找医生治疗+招魂
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');
	// {
	// 	valid: 2,
	// 	type: 1,
	// 	model_id: 14025,
	// 	unit_id: 7577,
	// 	xpos: 134,
	// 	ypos: 36,
	// 	item_count: 11,
	// 	injury: 0,
	// 	icon: 9,
	// 	level: 1,
	// 	flags: 4096,
	// 	unit_name: '种树的阿姆罗斯',
	// 	nick_name: '',
	// 	title_name: '',
	// 	item_name: '风的水晶碎片'
	//   }

	// 种树的阿姆罗斯出现时间
	// {
	// 	years: 265,
	// 	month: 10,
	// 	days: 19,
	// 	hours: 7,
	// 	mins: 32,
	// 	secs: 5,
	// 	local_time: 1677462174,
	// 	server_time: 1677461024
	// }

	// 荷特普出现时间
	// {
	// 	years: 265,
	// 	month: 10,
	// 	days: 19,
	// 	hours: 16,
	// 	mins: 105,
	// 	secs: 12,
	// 	local_time: 1677466042,
	// 	server_time: 1677464892
	// }
	  

	// 切换时间的基准
	const dawnMark = "神木消失"
	// 阿姆罗斯中午才出现
	const dayMark = "种树的阿姆罗斯出现"
	// 荷特普黄昏或夜晚出现
	const twilightMark = "荷特普出现"
	// 晚上才能看到神木
	const nightMark = "神木出现"

	const dawn = "dawn"
	const day = "day"
	const twilight = "twilight"
	const night = "night"
	const timeDict = { "黎明": dawn, "白天": day, "黄昏": twilight, "夜晚": night, }

	// 方便序列计算
	const timeRange = [dawn, day, twilight, night]
	// lo为上一个时间区域，hi为新的时间区域，可以理解为左右指针，用来灵活表示时间段
	var lo = null
	var hi = null

	const dawn2day = dawn + "2" + day
	const day2twilight = day + "2" + twilight
	const twilight2night = twilight + "2" + night
	const night2dawn = night + "2" + dawn

	const dawnstart = dawn + "start"
	const daystart = day + "start"
	const twilightstart = twilight + "start"
	const nightstart = night + "start"

	const dawnend = dawn + "end"
	const dayend = day + "end"
	const twilightend = twilight + "end"
	const nightend = night + "end"

	var cache = {}

	var fileName = "游戏内时间切换记录.json"
	var filePath = rootdir + '/交通脚本/' + fileName

	var content = null
	try {
		content = JSON.parse(fs.readFileSync(filePath))
	} catch (error) {
		content = {
			dawn2day: {
				dawnend: {}, daystart: {}
			},
			day2twilight: {
				dayend: {}, twilightstart: {}
			},
			twilight2night: {
				twilightend: {}, nightstart: {}
			},
			night2dawn: {
				nightend: {}, dawnstart: {}
			}
		}
	}

	var writeText = (content, cb) => {
		fs.writeFile(filePath, JSON.stringify(content), cb);
	}

	var isChange = (lo, hi, cb) => {
		let result = null
		if (hi == dawn) {
			if (cga.findNPC('神木') == null) {// 神木消失则认为是黎明
				result = {curGameSysTime: cga.GetSysTime(), timestamp: Date.now(), actMark : "神木消失"}
			}
		} else if (hi == day) {
			if (cga.findNPC('种树的阿姆罗斯') != null) {// 种树的阿姆罗斯出现则认为是白天
				result = {curGameSysTime: cga.GetSysTime(), timestamp: Date.now(), actMark : "阿姆罗斯出现" }
			}
		} else if (hi == twilight) {
			if (cga.findNPC('荷特普') != null) {// 荷特普出现则认为是黄昏
				result = {curGameSysTime: cga.GetSysTime(), timestamp: Date.now(), actMark : "荷特普出现" }
			}
		} else {
			if (cga.findNPC('神木') != null) {// 神木出现则认为是夜晚
				result = {curGameSysTime: cga.GetSysTime(), timestamp: Date.now(), actMark : "神木出现" }
			}
		}
		cb(result)
		return
	}

	var SaveRecord = (lo, hi, cb) => {
		var curType = timeDict[cga.getTimeRange()]
		// if(lo != curType){
		// 	cache = {}
		// 	console.log('清空缓存，回到loop，去下一个时间段测试')
		// 	setTimeout(cb, 1000);
		// 	return
		// }

		let timeChangeName = lo + "2" + hi
		let rangeStart = hi + "start"
		let rangeEnd = lo + "end"

		isChange(lo, hi, (r) => {
			if (r === null) {
				cache["gameSysTime"] = cga.GetSysTime()
				cache["timestamp"] = Date.now()
				setTimeout(SaveRecord, 1000, lo, hi, cb);
				return
			} else {
				content[timeChangeName][rangeStart][r.timestamp] = r.curGameSysTime
				content[timeChangeName][rangeEnd][cache["timestamp"]] = cache["gameSysTime"]

				// 除了记录时间，顺便记录一下用什么方式监测的时间
				content[timeChangeName][rangeStart][r.timestamp]["testAct"] = r.actMark
				content[timeChangeName][rangeEnd][cache["timestamp"]]["testAct"] = r.actMark
				writeText(content, () => {
					console.log('时间记录完毕, 当前游戏时间:', r.curGameSysTime)
				})

				// 清空缓存，回到loop，去下一个时间段测试
				cache = {}
				setTimeout(cb, 1000);
				return
			}
		})
	}

	var loop = () => {
		// 先补血
		if(cga.needSupplyInitial({  })){
			cga.travel.falan.toCastleHospital(()=>{
				setTimeout(loop, 3000);
			});
			return;
		}

		var curType = timeDict[cga.getTimeRange()]
		var index = cga.GetMapIndex().index3
		// 计算左右区间
		var timeIndex = timeRange.indexOf(curType)
		lo = curType
		hi = timeIndex == (timeRange.length - 1) ? timeRange[0] : timeRange[timeIndex + 1]

		var goToPos = (pos, cb) => {
			cga.walkList([
				pos,
			], () => {
				// 先看一下标志是否出现
				isChange(lo, hi, (r) => {
					// 如果没有出现标志物，缓存开始工作，进入记录时间变换的主逻辑
					if (r === null) {
						cache["gameSysTime"] = cga.GetSysTime()
						cache["timestamp"] = Date.now()
						setTimeout(SaveRecord, 1000, lo, hi, cb);
						return
					} else {// 如果已经出现，就代表在赶路过程中，时间段已经切换，需要重新回到loop去测试下一个时间段了
						cache = {}
						console.log('赶路过程中时间段已经发生变化，重新进入loop..')
						setTimeout(cb, 1000);
						return
					}
				})
			});
		}

		// 黎明去白天交界处测试
		if (curType == dawn) {
			if (index == 1000) {
				goToPos([134, 37], loop)
			} else {
				cga.travel.falan.toStone('C', (r) => {
					cga.travel.autopilot(1000, () => {
						goToPos([134, 36], loop)
					})
				});
			}
		} else if (curType == day) {// 白天去黄昏交界处测试
			if (index == 59530) {
				goToPos([91, 138], loop)
			} else {
				cga.travel.newisland.toStone('X', ()=>{
					cga.travel.autopilot(59530, () => {
						goToPos([91, 138], loop)
					})
				});
			}
		} else if (curType == twilight) {// 黄昏去夜晚交界处测试
			if (index == 100) {
				goToPos([298, 148], loop)
			} else {
				cga.travel.falan.toStone('W1', ()=>{
					cga.walkList([
						[22, 88, '芙蕾雅'],
						[298, 148],
					], ()=>{
						goToPos([298, 148], loop)
					});
				});
			}
		} else {// 夜晚去黎明交界处测试
			if (index == 100) {
				goToPos([298, 148], loop)
			} else {
				cga.travel.falan.toStone('W1', ()=>{
					cga.walkList([
						[22, 88, '芙蕾雅'],
						[298, 148],
					], ()=>{
						goToPos([298, 148], loop)
					});
				});
			}
		}

	}

	// var waitForNightVillage = (cb) => {
	// 	let index = cga.GetMapIndex().index3;

	// 	if (index == 400) {
	// 		if (cga.needSupplyInitial({ playerhp: 0.5 })) {
	// 			healMode.func(() => {
	// 				setTimeout(waitForNightVillage, 1000, cb);
	// 			})
	// 			return
	// 		}
	// 		cga.walkList([
	// 			[570, 275, '蒂娜村'],
	// 		], () => {
	// 			setTimeout(waitForNightVillage, 1000, cb);
	// 		}
	// 		);
	// 		return
	// 	} else if (index == 4200 || index == 4210) {
	// 		let sysTime = cga.GetSysTime()
	// 		let tmpTimeStamp = Date.now()
	// 		if (cache["gameTime"] == null) {
	// 			cache["gameTime"] = 'daytime'
	// 		} else if (cache["gameTime"] == 'night') {
	// 			content["夜晚变白天"]["白天开始"][tmpTimeStamp] = sysTime
	// 			content["夜晚变白天"]["夜晚结束"][cache["timestamp"]] = cache["gameSysTime"]

	// 			writeText(content, () => {
	// 				console.log('时间记录完毕')
	// 			})
	// 			cache["gameTime"] = 'daytime'
	// 		}
	// 		cache["gameSysTime"] = sysTime
	// 		cache["timestamp"] = tmpTimeStamp

	// 		let tmpList = [[12, 9]]
	// 		if (index == 4200) {
	// 			tmpList.unshift([34, 25, 4210])
	// 		}
	// 		cga.walkList(tmpList, () => {
	// 			cga.turnDir(6)
	// 			setTimeout(() => {
	// 				cga.walkList([
	// 					[1, 9, '蒂娜村'],
	// 					[29, 21, 400],
	// 				], () => {
	// 					setTimeout(waitForNightVillage, 1000, cb);
	// 				})
	// 			}, 10000);
	// 		});
	// 		return
	// 	} else if (index == 4201) {
	// 		let sysTime = cga.GetSysTime()
	// 		let tmpTimeStamp = Date.now()
	// 		if (cache["gameTime"] == null) {
	// 			cache["gameTime"] = 'night'
	// 		} else if (cache["gameTime"] == 'daytime') {
	// 			content["白天变夜晚"]["夜晚开始"][tmpTimeStamp] = sysTime
	// 			content["白天变夜晚"]["白天结束"][cache["timestamp"]] = cache["gameSysTime"]

	// 			writeText(content, () => {
	// 				console.log('时间记录完毕')
	// 			})
	// 			cache["gameTime"] = 'night'
	// 		}

	// 		cache["gameSysTime"] = sysTime
	// 		cache["timestamp"] = tmpTimeStamp
	// 		if (cga.needSupplyInitial({ playerhp: 0.5 })) {
	// 			healMode.func(() => {
	// 				setTimeout(waitForNightVillage, 1000, cb);
	// 			})
	// 			return
	// 		}
	// 		cga.walkList([
	// 			[29, 21, 400],
	// 		], () => {
	// 			setTimeout(waitForNightVillage, 10000, cb);
	// 		})
	// 		return
	// 	} else {
	// 		var time = cga.getTimeRange()
	// 		if (time == '黎明' || time == '白天') {
	// 			villageName = '蒂娜村'
	// 		}
	// 		cga.travel.falan.toTeleRoom(villageName, () => {
	// 			cga.travel.autopilot('主地图', () => {
	// 				if (villageName == '蒂娜村') {
	// 					setTimeout(waitForNightVillage, 1000, cb);
	// 					return
	// 				} else {
	// 					cga.walkList([
	// 						[71, 18, '莎莲娜'],
	// 					], () => {
	// 						setTimeout(waitForNightVillage, 1000, cb);
	// 					});
	// 				}
	// 			})
	// 		});
	// 	}
	// }

	// var conclusion = () => {
	// 	var content = content = JSON.parse(fs.readFileSync(filePath))
	// 	var dict = {}
	// 	for (const changeType in content) {
	// 		if (Object.hasOwnProperty.call(content, changeType)) {
	// 			const timeRange = content[changeType];
	// 			if (!dict[changeType]) {
	// 				dict[changeType] = {}
	// 			}
	// 			for (const timeEnd in timeRange) {
	// 				if (Object.hasOwnProperty.call(timeRange, timeEnd)) {
	// 					const timeEndElement = timeRange[timeEnd];
	// 					if (!dict[changeType][timeEnd]) {
	// 						dict[changeType][timeEnd] = {}
	// 					}
	// 					for (const stamp in timeEndElement) {
	// 						if (Object.hasOwnProperty.call(timeEndElement, stamp)) {
	// 							const element = timeEndElement[stamp];
	// 							for (const k in element) {
	// 								if (Object.hasOwnProperty.call(element, k)) {
	// 									const v = element[k];
	// 									if (!dict[changeType][timeEnd][k]) {
	// 										dict[changeType][timeEnd][k] = []
	// 									}
	// 									dict[changeType][timeEnd][k].push(v)
	// 								}
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}

	// 	for (const k in dict) {
	// 		if (Object.hasOwnProperty.call(dict, k)) {
	// 			const element = dict[k];
	// 			for (const e2 in element) {
	// 				if (Object.hasOwnProperty.call(element, e2)) {
	// 					const element2 = element[e2];
	// 					for (const e3 in element2) {
	// 						if (Object.hasOwnProperty.call(element2, e3)) {
	// 							const element3 = element2[e3];
	// 							let sum = 0.0
	// 							let count = 0
	// 							element3.forEach(e => {
	// 								sum += e
	// 								count++
	// 							});
	// 							console.log(k, e2, e3, 'avg : ', sum / count)
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }
	configMode.manualLoad('生产赶路')
	loop()
});