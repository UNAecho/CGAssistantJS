var fs = require('fs');
var cga = require('../cgaapi')(function(){
	global.cga = cga
	var rootdir = cga.getrootdir()
	// 法兰城找医生治疗+招魂
	var healMode = require(rootdir + '/通用挂机脚本/公共模块/治疗和招魂');
	var configMode = require(rootdir + '/通用挂机脚本/公共模块/读取战斗配置');

	var villageName = '杰诺瓦镇'

	var cache = {"lastGameTime" : null , "lastGameSysTime" : null,"lastTimestamp" : Date.now()}

	var fileName = "蒂娜村昼夜切换记录.json"
	var content = null
	try {
		content = JSON.parse(fs.readFileSync(rootdir + '/交通脚本/' + fileName))
	} catch (error) {
		content = {"白天变夜晚" : {"白天结束" : {}, "夜晚开始" : {}}, "夜晚变白天" : {"白天开始" : {}, "夜晚结束" : {}}}
	}

	var writeText = (content, cb)=>{
		fs.writeFile(fileName, JSON.stringify(content), cb);
	}

	var waitForNightVillage = (cb)=>{
		let index = cga.GetMapIndex().index3;

		if(index == 400){
			if(cga.needSupplyInitial({playerhp : 0.5})){
				healMode.func(()=>{
					setTimeout(waitForNightVillage, 1000, cb);
				})
				return
			}
			cga.walkList([
				[570, 275, '蒂娜村'],
			], ()=>{
				setTimeout(waitForNightVillage, 1000, cb);
				}
			);
			return
		}else if(index == 4200 || index == 4210){
			let sysTime = cga.GetSysTime()
			let tmpTimeStamp = Date.now()
			if(cache["lastGameTime"] == null){
				cache["lastGameTime"] = 'daytime'
			}else if(cache["lastGameTime"] == 'night'){
				content["夜晚变白天"]["白天开始"][tmpTimeStamp] = sysTime
				content["夜晚变白天"]["夜晚结束"][cache["lastTimestamp"]] = cache["lastGameSysTime"]

				writeText(content,()=>{
					console.log('时间记录完毕')
				})
				cache["lastGameTime"] = 'daytime'
			}
			cache["lastGameSysTime"] = sysTime
			cache["lastTimestamp"] = tmpTimeStamp

			let tmpList = [[12, 9]]
			if(index == 4200){
				tmpList.unshift([34, 25, 4210])
			}
			cga.walkList(tmpList, ()=>{
					cga.turnDir(6)
					setTimeout(() => {
						cga.walkList([
							[1, 9, '蒂娜村'],
							[29, 21, 400],
						],() => {
							setTimeout(waitForNightVillage, 1000, cb);
						})
					}, 10000);
				});
			return
		}else if(index == 4201){
			let sysTime = cga.GetSysTime()
			let tmpTimeStamp = Date.now()
			if(cache["lastGameTime"] == null){
				cache["lastGameTime"] = 'night'
			}else if(cache["lastGameTime"] == 'daytime'){
				content["白天变夜晚"]["夜晚开始"][tmpTimeStamp] = sysTime
				content["白天变夜晚"]["白天结束"][cache["lastTimestamp"]] = cache["lastGameSysTime"]
				
				writeText(content,()=>{
					console.log('时间记录完毕')
				})
				cache["lastGameTime"] = 'night'
			}
			
			cache["lastGameSysTime"] = sysTime
			cache["lastTimestamp"] = tmpTimeStamp
			if(cga.needSupplyInitial({playerhp : 0.5})){
				healMode.func(()=>{
					setTimeout(waitForNightVillage, 1000, cb);
				})
				return
			}
			cga.walkList([
				[29, 21, 400],
			],() => {
				setTimeout(waitForNightVillage, 10000, cb);
			})
			return
		}else{
			var time = cga.getTimeRange()
			if(time == '黎明' || time == '白天'){
				villageName = '蒂娜村'
			}
			cga.travel.falan.toTeleRoom(villageName, ()=>{
				cga.travel.autopilot('主地图',()=>{
					if(villageName == '蒂娜村'){
						setTimeout(waitForNightVillage, 1000, cb);
						return
					}else{
						cga.walkList([
							[71, 18, '莎莲娜'],
							], ()=>{
								setTimeout(waitForNightVillage, 1000, cb);
							});
					}
				})
			});
		}
	}

	var conclusion = ()=>{
		var content = content = JSON.parse(fs.readFileSync(rootdir + '/交通脚本/' + fileName))
		var dict = {}
        for (const changeType in content) {
            if (Object.hasOwnProperty.call(content, changeType)) {
                const timeRange = content[changeType];
                if(!dict[changeType]){
                    dict[changeType] = {}
                }
                for (const timeEnd in timeRange) {
                    if (Object.hasOwnProperty.call(timeRange, timeEnd)) {
                        const timeEndElement = timeRange[timeEnd];
                        if(!dict[changeType][timeEnd]){
                            dict[changeType][timeEnd] = {}
                        }
                        for (const stamp in timeEndElement) {
                            if (Object.hasOwnProperty.call(timeEndElement, stamp)) {
                                const element = timeEndElement[stamp];
                                for (const k in element) {
                                    if (Object.hasOwnProperty.call(element, k)) {
                                        const v = element[k];
                                        if(!dict[changeType][timeEnd][k]){
                                            dict[changeType][timeEnd][k] = []
                                        }
                                        dict[changeType][timeEnd][k].push(v)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        for (const k in dict) {
            if (Object.hasOwnProperty.call(dict, k)) {
                const element = dict[k];
               for (const e2 in element) {
                if (Object.hasOwnProperty.call(element, e2)) {
                    const element2 = element[e2];
                     for (const e3 in element2) {
                        if (Object.hasOwnProperty.call(element2, e3)) {
                            const element3 = element2[e3];
                            let sum = 0.0
                            let count = 0
                            element3.forEach(e => {
                                sum += e
                                count ++
                            });
                            console.log(k,e2,e3,'avg : ', sum / count)
                        }
                     }
                }
               }
            }
        }
	}
	configMode.manualLoad('生产赶路')
	waitForNightVillage(()=>{
		console.log('结束')
	})
	// conclusion()
});