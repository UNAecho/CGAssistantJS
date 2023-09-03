/**
 * UNAecho【开发说明】:递归记录角色当前地图以及其它可抵达地图的所有门的信息。
 * 
 * 专有名词解释：
 * 1、门：地图之间切换的格子，可以是NPC，也可以是传送水晶，或传送格子。
 * NPC就是对话可以切换的NPC，或者法兰城东西南北之的传送石。
 * 传送水晶就是角色通过移动进入，切换到其它地图的传送水晶，如随机迷宫的水晶。
 * 传送格子：就是最常见最普通的房间的出入口，比如医院的门。
 * 其实传送水晶或者传送格子，根据我的观察，区别就在于cga.getMapObjects()获取的数据中，cell=3还是=10的区别。
 * 
 * cell=3为出口地图可变传送格，即进入此格，出去以后的地图index3为多种情况。如随机迷宫的水晶；或法兰城咒术任务的公寓入口。
 * cell=10为出口地图固定传送格，即进入此格，出去以后的地图index仅有1种情况。
 * cell = 11不知有什么用处，目前仅有法兰城一些空地的牌子是这个数值，且均为无法抵达
 * 猜测cell = 2是碰撞触发类BOSS，行走碰到即进入战斗。典型案例为哈洞熊男
 * 
 * 2、单向门：进入之后，无法通过移动出来的门。
 * 举例：法兰城【竞技场的入口】的门[15,6]进到【竞技场】的[34,67]（学气功弹房间）。
 * 进入之后只能与[35,67]的NPC对话才能回到【竞技场的入口】的门[15,6]，走路是出不去的。
 * 3、入口门、出口门：
 * 这两个概念是相对的，角色从哪里进，从哪里出即为该次动作的入口门与出口门
 * 还是以法兰城【竞技场的入口】的门[15,6]举例。
 * 从【竞技场的入口】的门[15,6]进入到【竞技场】的[34,67]时，
 * 此时入口门就是【竞技场的入口】的门[15,6]
 * 出口门就是【竞技场】的[34,67]。
 * 哪怕出口门【竞技场】的[34,67]其实并不是门，这里也被称作出口门。
 * 所以入口、出口门只是一种相对概念。
 * 4、最近邻门
 * 获取当前地图所有门，距离自己当前位置最近的门，被认为是上一个入口门的出口门。
 * 这个概念用来登记哪个门与哪个门相通，或者单向连接。
 * 距离：可以用切比雪夫距离，或者cga.calculatePath()长度更为准确，但是性能消耗较大。
 * 因为最终需要遍历所有门，所以用切比雪夫距离作为度量方法，速度更快。
 * 
 * 此外，当最近邻门的距离大于thisobj.nearestThreshold时，会视为上一个入口门没有出口门对应，也就是单向门。
 * 比如法兰城【竞技场的入口】的门[15,6]进到【竞技场】的[34,67]，此时最近邻门是【竞技场】的[58,58]
 * 但肉眼观察得知，实际上出口门是旁边的NPC，而不是[58,58]的cell = 10的门。
 */
let fs = require('fs');
let path = require('path');

// 固定文件路径，如果父目录不存在则创建
let filePath = path.join(__dirname, '/常用数据/');
let file = filePath + 'doorInfo.json';
if (fs.existsSync(filePath) == false) {
    fs.mkdirSync(filePath);
}

let thisobj = {
    // doorInfo.json文件的缓存，避免读盘
    cache: {
        doorInfo: null,
        doorId: null,
        doorObjs: {}
    },
    separator: '_',
    // 最近邻门的距离阈值，大于此值视为上一个地图的入口门是单向门，不可通过最近邻门返回上一个地图的入口
    nearestThreshold: 6,
    getDoorId: (doorObj) => {
        let resultStr = ''

        if (doorObj.hasOwnProperty('mapindex')) {
            resultStr = resultStr + doorObj['mapindex']
        }

        if (doorObj.hasOwnProperty('mapname')) {
            resultStr = resultStr + thisobj.separator + doorObj['mapname']
        }
        // 如果最近邻门过远，则视为没有出口门，将人物当前站立位置视为单向出口门
        if (doorObj.hasOwnProperty('curpos')) {
            resultStr = resultStr + thisobj.separator + doorObj['curpos'].x + thisobj.separator + doorObj['curpos'].y
        } else {
            resultStr = resultStr + thisobj.separator + doorObj['mapx'] + thisobj.separator + doorObj['mapy']
        }

        if (doorObj.hasOwnProperty('method')) {
            resultStr = resultStr + thisobj.separator + doorObj['method']
        }
        return resultStr
    },
    // 黑名单，记录一些不能通过程序自动采集的情况。防止脚本陷入死循环。
    blacklist: [
        // 芙蕾雅魔女之家，无法进入此门，需要夜晚和门口神木NPC说【魔术】进入。
        { mapindex: 100, x: 301, y: 146, mapx: 301, mapy: 146, cell: 10, rawcell: -16374 },
        // 曙光骑士团营地，属于新地图，walklist的数据与传统地图不一致，需要手动登记数据
        { mapindex: 100, x: 513, y: 282, mapx: 513, mapy: 282, cell: 10, rawcell: -16374 }
    ],
    sortDict: (dict) => {
        let result = {}
        let keys = Object.keys(dict).sort()

        for (let key of keys) {
            result[key] = dict[key]
        }
        return result
    },
    read: () => {
        let contentObj = null
        try {
            contentObj = JSON.parse(fs.readFileSync(file))
        } catch (error) {
            contentObj = {}
        }
        return contentObj
    },
    // 使用同步写入，简化代码。
    write: (content) => {
        // console.log('写入', content)
        fs.writeFileSync(file, JSON.stringify(content));
    },
    // 由于遍历完毕后，使用随机探索当前地图的方式循环，这里是无法调用cb的。cb留给后续开发使用
    walkAndSave: (cb) => {
        thisobj.cache.doorInfo = thisobj.read()

        let loop = () => {
            let playerInfo = cga.GetPlayerInfo()
            if (playerInfo.souls > 0 || playerInfo.health > 0) {
                throw new Error('人物受伤或掉魂，这里不进行自动治疗。请自行判断该账号是否有能力独自完成全部地图探索。')
            }
            let map = cga.GetMapName();
            let index = cga.GetMapIndex().index3
            let XY = cga.GetMapXY()
            let doors = null

            let nearest = null
            // 缓存每个地图首次进入的doorObj顺序，否则在遍历中，会因为重新给door排序，而提前走出当前递归的地图，出现遍历不完全的现象。
            if (thisobj.cache.doorObjs.hasOwnProperty(index)) {
                // console.log('当前地图'+index+'已经在进入时排过序，继续以当时的排序方式遍历其余的门..')
                doors = thisobj.cache.doorObjs[index]
            } else {
                console.log('首次进入地图' + index + '缓存所有门的信息..')
                doors = cga.getDoorCluster()

                if (doors.length == 0) {
                    throw new Error('【UNAecho脚本提醒】当前地图index:' + index + '当前地图名称:' + map + '没有出口，请手动更新相关信息')
                } else {
                    console.log('当前地图门的数量:' + doors.length)
                }
                // 不能filter掉无法抵达的门，因为有些无法抵达的门，可由当前地图其它门来抵达。举例案例可以参考法兰城【安其摩酒吧】的地图。
                doors = doors.sort((a, b) => {
                    // 正常应该使用cga.calculatePath()长度而非切比雪夫距离，由于门最终都是需要遍历一遍的，且进过的门可以跳过，所以这里节约性能，选择切比雪夫距离进行排序
                    return cga.chebyshevDistance(XY.x, XY.y, a.mapx, a.mapy) - cga.chebyshevDistance(XY.x, XY.y, b.mapx, b.mapy)
                })

                /**
                 * UNAecho:因为已经按照距离升序排序，所以数组第一个元素必然是最近邻的门
                 * 获取最近邻门，并从数组中首位移至数组队尾。
                 * 这么做是为了防止人物刚进入新的地图就从出口门返回了，导致不能很好地遍历游戏内的所有地图。
                 * 接下来就是就近遍历（还是因为排过序）除了出口门的其它所有门，然后记录数据。
                 * 由于出口门被移至队尾，所以最后还是会从这里出去，完成当前地图的所有门遍历。
                 */
                nearest = doors.shift()
                // 移至队尾
                doors.push(nearest)
                // 将当前door的顺序缓存，再次进入时使用此顺序，不能再次排序
                thisobj.cache.doorObjs[index] = doors
            }

            // 如果没有记录上一次进入的入口门，则将最近邻门标记为此入口门的出口门。
            if (thisobj.cache.doorId && !thisobj.cache.doorInfo.hasOwnProperty(thisobj.cache.doorId)) {
                // 注意这里的最近邻门必须重新获取，因为缓存中的门信息为当前地图首次计算的顺序，和已经走动过的现在顺序不同。
                nearest = cga.getDoorCluster().sort((a, b) => {
                    return cga.chebyshevDistance(XY.x, XY.y, a.mapx, a.mapy) - cga.chebyshevDistance(XY.x, XY.y, b.mapx, b.mapy)
                }).shift()
                // 定义写入磁盘需要的部分信息
                let curObj = {
                    mapindex: index,
                    mapname: map,
                    method: 'walk'
                }
                // 与door信息合并，注意只能用深拷贝。
                Object.assign(curObj, nearest)
                /**
                 * 另外，最近邻的门与自己距离过远的临界值为投影距离大于thisobj.nearestThreshold。
                 * 也就是说，进入地图时，如果最近邻door与自己投影距离大于thisobj.nearestThreshold，则视为上一个door没有连接门。
                 * 注意此处是投影距离，而不是切比雪夫距离。
                 */
                let projectDistance = cga.projectDistance(XY.x, XY.y, curObj.mapx, curObj.mapy)
                // 当最近邻门距离大于thisobj.nearestThreshold，才会被视为单向门
                if (projectDistance > thisobj.nearestThreshold) {
                    curObj['curpos'] = XY
                    console.log('最近邻门', curObj, '与自己距离大于阈值【' + thisobj.nearestThreshold + '】，视为上一个地图的入口门是单向门。将当前坐标视为出口门。')
                }
                // 登记与入口门对应的出口门
                thisobj.cache.doorInfo[thisobj.cache.doorId] = thisobj.getDoorId(curObj)
                // 同步写入文件
                thisobj.write(thisobj.sortDict(thisobj.cache.doorInfo))
                setTimeout(loop, 500)
                return
            } else {
                // 遍历所有没登记过的门
                for (let door of doors) {
                    if (!cga.isPathAvailable(XY.x, XY.y, door.mapx, door.mapy)) {
                        console.log(door, '不可抵达，暂时跳过。')
                        continue
                    }
                    // 禁止进入黑名单房间，防止异常
                    if (thisobj.blacklist.some(blacklistObj => {
                        return blacklistObj.mapindex == index && blacklistObj.mapx == door.mapx && blacklistObj.mapy == door.mapy
                    })) {
                        console.log(door, '为黑名单房间，禁止进入')
                        continue
                    }
                    // 缓存进入门的id
                    thisobj.cache.doorId = thisobj.getDoorId(Object.assign({
                        mapindex: index,
                        mapname: map,
                    }, door))
                    // 如果缓存中没有这个门的信息
                    if (!thisobj.cache.doorInfo.hasOwnProperty(thisobj.cache.doorId)) {
                        // 有拦路BOSS的情况，特殊处理。例如哈洞熊男
                        if (index == 11004 && ((XY.y < 17 && door.mapy > 17) || (XY.y > 17 && door.mapy < 17))) {
                            console.log('当前地图【' + map + '】有boss，先跳过BOSS，再继续逻辑..')
                            cga.walkList([
                                door.mapy < 17 ? [17, 18] : [17, 16]
                            ], () => {
                                cga.ForceMove(XY.y > 17 ? 6 : 2, true);
                                cga.ForceMove(XY.y > 17 ? 6 : 2, true);
                                cga.walkList([
                                    [door.mapx, door.mapy, '']
                                ], () => {
                                    setTimeout(loop, 500)
                                });
                            });
                        } else {
                            cga.walkList([
                                [door.mapx, door.mapy, '']
                            ], () => {
                                // 由于使用空串做cga.walkList的出口判定，这里给一点延迟，以防cb调用过快导致地图没切换成功时也被认为切换成功了。
                                setTimeout(loop, 500)
                            });
                        }
                        return
                    }
                }
                // 遍历所有的门之后，发现全部门的信息都已经在缓存中
                console.log('当前区域已经全部登记完毕，开始随机进入任意一个可抵达的门，完善可能缺失的信息')
                let accessibleDoor = cga.getDoorCluster().filter((doorObj) => {
                    if (cga.isPathAvailable(XY.x, XY.y, doorObj.mapx, doorObj.mapy)) {
                        return true
                    }
                    return false
                })
                let randomDoor = accessibleDoor[Math.floor(Math.random() * accessibleDoor.length)]
                cga.walkList([
                    [randomDoor.mapx, randomDoor.mapy, '']
                ], () => {
                    // 由于使用空串做cga.walkList的出口判定，这里给一点延迟，以防cb调用过快导致地图没切换成功时也被认为切换成功了。
                    setTimeout(loop, 500)
                });
                return
            }
        }
        loop()
        return
    }
}

module.exports = thisobj;