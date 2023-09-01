/**
 * UNAecho:递归记录角色当前地图以及其它可抵达地图的所有门的信息。
 * 比如法兰城的里谢里雅堡出口，与法兰城中的里堡入口相连接。
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
    cache: null,
    separator: '_',
    // 最近邻的距离阈值，大于此值视为上一个地图的入口门是单向门，不可通过最近邻门返回上一个地图的入口
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
        console.log('写入', content)
        fs.writeFileSync(file, JSON.stringify(content));
    },
    walkAndSave: (cb) => {

        let doorIdCache = null
        thisobj.cache = thisobj.read()

        let loop = () => {
            let map = cga.GetMapName();
            let index = cga.GetMapIndex().index3
            let XY = cga.GetMapXY()

            let doors = cga.getDoorCluster().sort((a, b) => {
                // 正常应该使用cga.calculatePath()长度而非切比雪夫距离，由于门最终都是需要遍历一遍的，且进过的门可以跳过，所以这里节约性能，选择切比雪夫距离进行排序
                return cga.chebyshevDistance(XY.x, XY.y, a.mapx, a.mapy) - cga.chebyshevDistance(XY.x, XY.y, b.mapx, b.mapy)
            }).filter((doorObj) => {
                if (cga.isPathAvailable(XY.x, XY.y, doorObj.mapx, doorObj.mapy)) {
                    return true
                }
                console.log(doorObj, '不可抵达，跳过探测。')
                return false
            })

            if (doors.length == 0) {
                throw new Error('【UNAecho脚本提醒】当前地图index:' + index + '当前地图名称:' + map + '没有出口，请手动更新相关信息')
            }

            /**
             * UNAecho:因为已经排过序，所以数组第一个元素必然是最近邻的门
             * 获取最近邻的门（下面会将其称为【出口门】），并从数组中首位移至数组队尾。
             * 这么做是为了防止人物刚进入新的地图就从出口门返回了，导致不能很好地遍历游戏内的所有地图。
             * 接下来就是就近遍历（还是因为排过序）除了出口门的其它所有门，然后记录数据。
             * 由于出口门被移至队尾，所以最后还是会从这里出去，完成当前地图的所有门遍历。
             */
            let nearest = doors.shift()
            // 移至队尾
            doors.push(nearest)
            // 如果没有记录上一次进入的入口信息，则将其与最近邻的门登记为单向门（因为逆向门，也就是出口门的信息被放在数组尾部，会在数组遍历的最后补上）。
            if (doorIdCache && !thisobj.cache.hasOwnProperty(doorIdCache)) {
                // 定义写入磁盘需要的部分信息
                let curObj = {
                    mapindex: index,
                    mapname: map,
                    method: 'walk'
                }
                // 与door信息合并
                Object.assign(nearest, curObj)
                /**
                 * UNAecho：有的时候，虽然抵达新地图时，最近邻门很有可能是与上个地图door的连接门。比如医院的出入口。
                 * 但如果进入地图时，最近邻的门与自己距离过远，则认为此地图最近邻door并不是与上个地图的door连接，或者此地图没有出口（比如小黑屋）
                 * 此时需要手动调整doorInfo.json的地图信息
                 * 
                 * 另外，最近邻的门与自己距离过远的临界值为投影距离大于thisobj.nearestThreshold。
                 * 也就是说，进入地图时，如果最近邻door与自己投影距离大于thisobj.nearestThreshold，则视为上一个door没有连接门。
                 * 注意此处是投影距离，而不是切比雪夫距离。
                 */
                let projectDistance = cga.projectDistance(XY.x, XY.y, nearest.mapx, nearest.mapy)
                if (projectDistance > thisobj.nearestThreshold) {
                    nearest['curpos'] = XY
                    console.log('最近邻门', nearest, '与自己距离大于阈值【' + thisobj.nearestThreshold + '】，视为上一个地图的入口门是单向门。将当前坐标视为上一个门的出口。')
                }
                // 登记与入口门对应的出口门
                thisobj.cache[doorIdCache] = thisobj.getDoorId(nearest)
                // 同步写入文件
                thisobj.write(thisobj.cache)
                setTimeout(loop, 1000)
                return
            } else {
                // 遍历所有没登记过的门
                for (let door of doors) {
                    doorIdCache = thisobj.getDoorId(Object.assign(door, {
                        mapindex: index,
                        mapname: map,
                    }))
                    if (!thisobj.cache.hasOwnProperty(doorIdCache)) {
                        cga.walkList([
                            [door.mapx, door.mapy, '']
                        ], () => {
                            // 由于使用空串做cga.walkList的出口判定，这里给一点延迟，以防cb调用过快导致地图没切换成功时也被认为切换成功了。
                            setTimeout(loop, 1000)
                        });
                        return

                    }
                }
                console.log('当前区域已经全部登记完毕，请更换其它区域')
                cb(null)
                return
            }
        }
        loop()
        return

        // let tmpIndex = null
        // // di:door index
        // for (let di in doors) {
        //     // base点初始化
        //     if(tmpIndex == null){
        //         tmpIndex = di
        //         continue
        //     }
        //     // 当前迭代的door的切比雪夫距离
        //     let doorObj = doors[di]
        //     let doorDistance = cga.chebyshevDistance(XY.x,XY.y,doorObj.mapx,doorObj.mapy)
        //     // 如果当前距离小于缓存距离，则当前door成为新的base点。以此来搜索最近邻door
        //     if(doorDistance < cga.chebyshevDistance(XY.x,XY.y,doors[tmpIndex].mapx,doors[tmpIndex].mapy)){
        //         tmpIndex = di
        //     }
        // }
        // if(tmpIndex == null){
        //     throw new Error('【UNAecho脚本提醒】当前地图index:'+index+'当前地图名称:'+map+'没有出口，请手动更新相关信息')
        // }

        // let projectDistance = cga.projectDistance(XY.x,XY.y,doors[tmpIndex].mapx,doors[tmpIndex].mapy)




        // let tmp = offlineData[i]
        // offlineData[i] = offlineData[0]
        // offlineData[0] = tmp
    }
}

module.exports = thisobj;