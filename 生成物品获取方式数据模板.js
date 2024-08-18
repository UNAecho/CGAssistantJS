/**
 * 
 */
let fs = require('fs');
let path = require('path');
var cga = require('./cgaapi')(function () {

    let file =  './常用数据/gatherData.json';
    const materials = [
        '小麦粉','牛奶'
    ]
    
    let content = []

    for (let i = 0; i < materials.length; i++) {
        m = materials[i]
        content.push(
            {
                level : 0,
                name : m,
                sell : 0,
                methods : [
                    {
                        // 获取方式为使用技能的采集。
                        type:'gather',
                        // 采集地点所属国家
                        country : '',
                        // 采集时，角色需要定居的城市。如果不需要，请置为空串或null。
                        settlecity : '',
                        // 采集过程中，角色补给（HP/MP）的主地图
                        supplycity : '',
                        // 采集地点的mapindex
                        mapindex : 0,
                        // 采集效率，自定义单位。如打满一车是几分钟，或者每分钟采集数量等等。但请保证所有物品的单位均一致。否则外部调用API无法比对效率。
                        efficiency : 0,
                        // 角色从supplycity走到采集地点的函数
                        forward : null,
                        // 角色从采集地点走到supplycity的函数
                        back : null,
                    },
                    {
                        // 获取方式为购买
                        type:'buy',
                        // 购买NPC所在国家
                        country : '',
                        // 购买时，角色需要定居的城市
                        settlecity : '',
                        // 购买NPC所在村镇
                        storecity : '',
                        // 购买NPC所在mapindex
                        mapindex : 0,
                        // 购买NPC坐标
                        npcpos : [],
                        // 价格，可自定义，但请统一单位。如商店的+1按钮的单价，还是多少钱一组。
                        currency : 0,
                        // 角色从storecity走到购买商店的函数
                        forward : null,
                    },
                    {
                        // 获取方式为商店以物易物兑换
                        type:'exchange',
                        // 兑换NPC所在国家
                        country : '',
                        // 兑换时，角色需要定居的城市
                        settlecity : '',
                        // 兑换NPC所在村镇
                        storecity : '',
                        // 兑换NPC所在mapindex
                        mapindex : 0,
                        // 兑换NPC坐标
                        npcpos : [],
                        // 兑换商店的源材料在设定上只能是1种。如曙光骑士团医院2楼的蕃茄兑换小麦粉、鸡蛋、青椒、葱都是蕃茄
                        currency : '',
                        // 角色从storecity走到兑换商店的函数
                        forward : null,
                    },
                ]
            }
        )
        
    }
    fs.writeFileSync(file, JSON.stringify(content));
})