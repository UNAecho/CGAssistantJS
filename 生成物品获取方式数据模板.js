/**
 * 
 */
let fs = require('fs');
let path = require('path');
var cga = require('./cgaapi')(function () {

    let file =  './常用数据/gatherData.json';
    const materials = [
        '小麦粉',
        '牛奶',
        '蕃茄',
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
                        // 采集技能名称
                        skill : '',
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
                        // 角色从supplycity走到采集地点的函数，注意，要走到采集的pos，而不是走到采集地图。
                        // 注意：forward和back可以为null。这个做法仅为了占位（让其他逻辑判断这里为null时，可以知道这个method的数据还不完善），在完善所有物品数据之前，是一种无奈之举。
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
                        // 兑换比例（简化比例，各自除以最大公约数），默认0:0。需要后续手动填写
                        // 如曙光骑士团医院2楼的蕃茄兑换商店，20个蕃茄可以换16个小麦粉或是12个鸡蛋或是8根葱或是8个青椒。那么currency为蕃茄，目标为小麦粉时，ratio为20:16=5:4。
                        ratio : "0:0",
                        // 角色从storecity走到兑换商店的函数
                        forward : null,
                    },
                ]
            }
        )
        
    }
    fs.writeFileSync(file, JSON.stringify(content));
})