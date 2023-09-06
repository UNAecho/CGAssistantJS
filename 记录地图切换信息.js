/**
 * UNAecho【开发说明】:递归记录角色当前地图以及其它可抵达地图的所有门的信息。
 * 由于一次性生成数据之后可永久使用，所以忽略时间复杂度。本脚本所使用的方式均采用时间复杂度较大的方式来做，以保证数据质量与生成文件的观感（加入地图名称，并实时排序）。
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
 * 5、落盘数据格式
 * 所有数据会被落盘在filePathDir下
 * 1、所有入口门、出口门信息会被记录为doorInfoFile的json文件
 * 2、所有门之间的代价信息会被记录为doorDstFile的json文件
 * 文件的key、value信息见getDoorId()与getDoor2DoorId()说明
 * 
 * 此外，当最近邻门的距离大于thisobj.nearestThreshold时，会视为上一个入口门没有出口门对应，也就是单向门。
 * 比如法兰城【竞技场的入口】的门[15,6]进到【竞技场】的[34,67]，此时最近邻门是【竞技场】的[58,58]
 * 但肉眼观察得知，实际上出口门是旁边的NPC，而不是[58,58]的cell = 10的门。
 */
let fs = require('fs');
let path = require('path');

// 固定文件路径，如果父目录不存在则创建
let filePathDir = path.join(__dirname, '/常用数据/');
let doorInfoFile = filePathDir + 'doorInfo.json';
let doorDstFile = filePathDir + 'doorDistanceInfo.json';
if (fs.existsSync(filePathDir) == false) {
    fs.mkdirSync(filePathDir);
}

let thisobj = {
    // 设置缓存，避免过度读盘
    cache: {
        // 入口门、出口门之间的信息
        doorInfo: null,
        // 本地图所有门之间的代价信息，此脚本仅计算距离代价。金币(使用传送石)、道具(使用飞机票)等代价请手动加入
        doorDstInfo: null,
        // 入口门ID的缓存
        doorId: null,
        // 每个探索过的地图的door信息缓存
        doorObjs: {}
    },
    separator: '_',
    // 最近邻门的距离阈值，大于此值视为上一个地图的入口门是单向门，不可通过最近邻门返回上一个地图的入口
    nearestThreshold: 6,
    /**
     * 生成门的ID
     * @param {*} doorObj 生成门ID所传参数，包括：
     * mapindex:当前地图index3，这是地图的唯一索引
     * mapname:地图名称，可被mapindex代替，唯一的作用是方便肉眼观感良好与debug排查、手动修改数据等。
     * curpos:使用当前XY坐标代替出口门坐标。仅有入口门被视为单向门时，才会生效。
     * method:抵达方式，此脚本仅有'walk'(用脚走路)一种方式记录，其它方式请【手动】添加'func'为自定义方式。包括对话、转向某方向、使用道具等切换地图的方式，均需记录为'func'。
     * 举例说明：
     * 1、"1000_法兰城_221_83": "1112_医院_12_42_walk"代表：
     * mapindex3为1000，地图名称为法兰城，x=221，y=83的门，用脚走进(walk)后会被传送至mapindex3为1112，地图名称为医院，x=12，y=42的门
     * 2、"1401_竞技场_35_67": "1400_竞技场的入口_14_6_func"代表：
     * mapindex3为1401，地图名称为竞技场，x=35，y=67的门(NPC)，用自定义func(对话)后会被传送至mapindex3为1400，地图名称为竞技场的入口，x=14，y=6的门
     * @returns 
     */
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
    // 门何门之间的ID生成方式，统一使用此函数来连接双方ID
    getDoor2DoorId: (door1Id, door2Id) => {
        return door1Id + '@' + door2Id
    },
    // 黑名单，记录一些不能通过程序自动采集的情况。防止脚本陷入死循环。
    blacklist: [
        // 芙蕾雅魔女之家，无法进入此门，需要夜晚和门口神木NPC说【魔术】进入。
        { mapindex: 100, x: 301, y: 146, mapx: 301, mapy: 146, cell: 10, rawcell: -16374 },
        // 曙光骑士团营地，属于新地图，walklist的数据与传统地图不一致，需要手动登记数据
        { mapindex: 100, x: 513, y: 282, mapx: 513, mapy: 282, cell: 10, rawcell: -16374 }
    ],
    // 给字典按照key升序排序
    sortDict: (dict) => {
        let result = {}
        let keys = Object.keys(dict).sort()

        for (let key of keys) {
            result[key] = dict[key]
        }
        return result
    },
    // 使用cga.calculateDoorDistance()，度量a与b的顺序。本函数结果需要return给Array.sort()使用。
    sortDistance : (XY,a,b)=>{
        // 必须使用cga.calculatePath()的类A*算法计算长度，而非切比雪夫距离。切比雪夫无法计算有障碍物的情况。
        let aDst = cga.calculateDoorDistance({mapx:XY.x,mapy:XY.y},a)
        let bDst = cga.calculateDoorDistance({mapx:XY.x,mapy:XY.y},b)
        if(aDst == bDst){
            return 0
        }else if(aDst < 0){
            return 1
        }else if(bDst < 0){
            return -1
        }
        // console.log('当前',XY,'距离',a,'为',aDst)
        // console.log('当前',XY,'距离',b,'为',bDst)
        return aDst - bDst
    },
    read: (file) => {
        let contentObj = null
        try {
            contentObj = JSON.parse(fs.readFileSync(file))
        } catch (error) {
            contentObj = {}
        }
        return contentObj
    },
    // 使用同步写入，简化代码。
    write: (file, content) => {
        // console.log('写入', content)
        fs.writeFileSync(file, JSON.stringify(content));
    },
    // 由于遍历完毕后，使用随机探索当前地图的方式循环，这里是无法调用cb的。cb留给后续开发使用
    walkAndSave: (cb) => {
        thisobj.cache.doorInfo = thisobj.read(doorInfoFile)
        thisobj.cache.doorDstInfo = thisobj.read(doorDstFile)

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
                // 首先计算各个门之间的代价信息
                console.log('开始记录门何门之间的代价信息，如果当前地图门数量较多，脚本可能会持续运行一段时间，这段时间人物不会有动作。')
                // O(n2)遍历
                for (let door1 of doors) {
                    for (let door2 of doors) {
                        // 跳过计算相同的门
                        if (door1.mapx == door2.mapx && door1.mapy == door2.mapy) {
                            continue
                        }
                        let door1Id = thisobj.getDoorId(Object.assign({
                            mapindex: index,
                            mapname: map,
                        }, door1))
                        let door2Id = thisobj.getDoorId(Object.assign({
                            mapindex: index,
                            mapname: map,
                        }, door2))
                        let dstId = thisobj.getDoor2DoorId(door1Id, door2Id)
                        if (!thisobj.cache.doorDstInfo.hasOwnProperty(dstId)) {
                            let dst = cga.calculateDoorDistance(door1, door2)
                            thisobj.cache.doorDstInfo[dstId] = 'd' + dst.toString()
                        }
                    }
                }
                // 落盘，各个门之间的代价信息部分结束
                thisobj.write(doorDstFile, thisobj.sortDict(thisobj.cache.doorDstInfo))

                // 然后处理入口门、出口门相关信息
                // 先排序，为了将最近邻门移至队尾。注意：不能filter掉无法抵达的门，因为有些无法抵达的门，可由当前地图其它门来抵达。举例案例可以参考法兰城【安其摩酒吧】的地图。
                doors = doors.sort((a, b) => {
                    return thisobj.sortDistance(XY,a,b)
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
                    return thisobj.sortDistance(XY,a,b)
                }).shift()

                // 先获取出入口门的ID与代价。入口门ID就是缓存thisobj.cache.doorId
                // 出口门ID，出口门视为最近邻门。
                let nearestDoorId = thisobj.getDoorId(Object.assign({
                    mapindex: index,
                    mapname: map,
                }, nearest))
                // 出入口门的代价，此脚本仅记录walk方式的距离代价，所以默认为0（用脚走的门何门距离视为0）
                let cost = 0

                // 然后制作出入口落盘信息
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
                    // 单向门距离
                    cost = -1

                    console.log('最近邻门', curObj, '与自己距离大于阈值【' + thisobj.nearestThreshold + '】，视为上一个地图的入口门是单向门。将当前坐标视为出口门。距离代价视为', cost)
                }
                // 登记与入口门对应的出口门
                thisobj.cache.doorInfo[thisobj.cache.doorId] = thisobj.getDoorId(curObj)
                // 同步落盘出入口文件
                thisobj.write(doorInfoFile, thisobj.sortDict(thisobj.cache.doorInfo))

                // 将代价缓存
                thisobj.cache.doorDstInfo[thisobj.getDoor2DoorId(thisobj.cache.doorId, nearestDoorId)] = 'd' + cost.toString()
                // 同步落盘门的代价文件
                thisobj.write(doorDstFile, thisobj.sortDict(thisobj.cache.doorDstInfo))
                setTimeout(loop, 500)
                return
            } else {
                console.log("🚀 ~ file: 记录地图切换信息.js:270 ~ loop ~ doors:", doors)
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