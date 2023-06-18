/**
 * UNAecho:角色的model_id其实是贴图id，而角色拿不同的武器，对应不同的贴图。
 * 角色不同的颜色，贴图ID仍然不同。
 * 摸索出一些规律，以红色露比（官方名：乌噜）举例：
 * 1、角色首先是空手有一个model_id为105252
 * 2、斧子的model_id是空手model_id数值减2，105250
 * 3、弓的model_id是空手model_id数值减1，105251
 * 4、剑的model_id是空手model_id数值加1，105253
 * 5、杖的model_id是空手model_id数值加2，105254
 * 6、枪的model_id是空手model_id数值加3，105255
 * 
 * 由此，我们可以得出规律：
 * 每一个游戏角色的每一个颜色，对应6个model_id。以红色露比（官方名：乌噜）举例：
 * 6个model_id对应5种武器的贴图，加上空手（投掷武器也算空手）的贴图。
 * 斧子、弓箭、空手、剑、杖、枪的model_id偏移值为:[-2,-1,0,1,2,3]。
 * 
 * 至此，获取到一个地图上的model_id，即可识别他是哪个角色，哪个颜色，拿什么武器了。
 * 但需要遍历所有角色，落盘所有角色信息，这是个体力活
 * 
 * 而且可以以此规律，推断出一个角色的所有颜色的model_id。颜色的顺序可以由创建角色时，点击右箭头的顺序来定义每个角色的1234颜色
 * 以露比（官方名：乌噜）举例：
 * color 1 为红色露比，model_id范围为105250-105255
 * color 2 为蓝色露比，model_id范围为105256-105261
 * 
 * 但角色和角色之间的顺序，我没有试过，不知道是否时创建角色时的顺序。
 * 
 * 角色一共有28人。但3.0前的老人物有新旧2套外观，所以model_id也会多出来14(人)*4(颜色)*6(武器贴图) = 336 个 model_id。
 * 
 * 目前处于数据收集阶段，需要手工去游戏的创建角色那里修正人物的落盘信息。修正并且检查完毕后，需要给hasCheck字段设为true，程序会根据此flag来修正这个人物的其它信息。
 * 
 */
var fs = require('fs');
var path = require('path');

var filePath = path.join(__dirname, '/常用数据/');
var file = filePath + 'characterInfo.json';

//文件夹处理
if (fs.existsSync(filePath) == false) {
    fs.mkdirSync(filePath);
}

var contentObj = null
try {
    contentObj = JSON.parse(fs.readFileSync(file))
} catch (error) {
    contentObj = {}
}

//定义静态对象
var saveCharacterInfo = {
    update : (model_id,baseObj,color,weapon) => {
        contentObj[model_id] = {
            // 角色官方中文名称
            character_name: baseObj.character_name,
            // 玩家自定义的人物别称，例如露比、小红帽等，此值可自行填写。
            customer_name: baseObj.customer_name,
            // 此model_id使用的武器类型
            weapon: weapon,
            // 角色性别
            sex: baseObj.sex,
            // 角色颜色的index，以创建角色时右箭头的顺序为准。从1开始，4（包含）结束。
            color: color,
            // 玩家自定义的颜色别称，例如露比、小红帽，此值可由自己的主观，自行编辑。
            customer_color: baseObj.customer_color,
            // 角色数据来源的地图上玩家游戏名称，无作用，仅debug使用
            unit_name: baseObj.unit_name,
            // 人工验证的flag。初始化为false，如果人工检测数据无误后，手动在文件中将此FLAG置为true，后续脚本即可以此为基础，给其它hasCheck为false的数据进行修正、更新。
            hasCheck: false,
        }
        // console.log('update:model_id',model_id,'content:',contentObj[model_id])
    },
    // 写入文件。content一般是cga.GetMapUnits()传过来的Object数组
    write: (content, callback) => {
        // 首先检查自身，看看有没有直接可以通过公式直接推断出的新数据。如明确了model_id和武器类型，就可以推断出角色所有model_id
        let keys = Object.keys(contentObj)
        keys.forEach(key => {
            let modelIdInt = parseInt(key)
            // 如果确定了model_id和武器类型，就可以推断出这个角色的所有model_id
            if (contentObj[key].weapon != '' && contentObj[key].color != -1 && typeof cga.character.weaponBias[contentObj[key].weapon] == 'number' && contentObj[key].hasCheck === true) {
                console.log('发现人工验证数据:',contentObj[key],'以此为基准，推断出其它缺失以及修正不正确的采集数据')
                let baseObj = contentObj[key]
                // 人物颜色，每个人物固定4个颜色。每个颜色对应6个model_id。
                for (let i = 1; i < 5; i++) {
                    // 武器种类，上面每个颜色对应6个model_id，实际就是人物6种武器形态贴图，包括空手
                    let weapons = Object.keys(cga.character.weaponBias)
                    for (let j = 0; j < weapons.length; j++) {
                        let modelId = (modelIdInt + (i - baseObj.color) * 6 + cga.character.weaponBias[weapons[j]]).toString()
                        // 如果文件中没有此model_id数据，则进入初始化，开始写入第一份数据。
                        if (!contentObj.hasOwnProperty(modelId)) {
    
                            saveCharacterInfo.update(modelId,baseObj,i,weapons[j])
                            
                            // console.log('根据model_id:', key, '，character_name:', baseObj.character_name, 'weapon', baseObj.weapon, 'sex', baseObj.sex, 'color:', baseObj.color, 'unit_name:', baseObj.unit_name)
                            // console.log('推断出model_id:', modelId, '，character_name:', baseObj.character_name, 'weapon', baseObj.weapon, 'sex', baseObj.sex, 'color:', baseObj.color, 'unit_name:', baseObj.unit_name)
                        }else{// 如果此model_id数据已经存在，尝试更新、修正数据
                            if(contentObj[modelId].hasCheck){
                                console.log('model_id:', modelId,'已经人工验证过，不需要更新')
                                continue
                            }
                            saveCharacterInfo.update(modelId,baseObj,i,weapons[j])
                        }
                    }
                }
            }

        })
        // 然后根据外部传入的数据，尝试新增数据
        content.forEach(obj => {
            // 判断是否是玩家角色
            if (obj.valid == 2 && obj.type == 8 && (obj.flags & 256) == 256) {
                if (!contentObj.hasOwnProperty(obj.model_id)) {
                    saveCharacterInfo.update(obj.model_id, {
                        character_name: '',
                        customer_name: '',
                        sex: -1,
                        color: -1,
                        customer_color: '',
                        unit_name: obj.unit_name,
                        hasCheck: false,
                    },-1,'')
                } else {
                    // console.log('在玩家信息中',obj.model_id,'已经有数据记录，跳过信息采集，使用推断来更新其数据')
                }
            }
        });

        // // 好像JSON.stringify()在写入时本身就有排序功能，如果发现乱序，打开此注释并使用sortObj写入，即可实现排序好的obj
        // // 按照model_id升序排序，方便查看
        // let sortObj = {}
        // keys = Object.keys(contentObj)
        // keys.sort((a, b) => {parseInt(a) - parseInt(b)})
        // keys.forEach(key => {
        //     sortObj[key] = contentObj[key]
        // })

        fs.writeFile(file, JSON.stringify(contentObj), callback);
    },
    //测试写入
    debug: (content, callback) => {
        var now = new Date();
        content = now.toLocaleString() + '：' + content;
        saveCharacterInfo.writeLine(content, callback);
    }
}

module.exports = saveCharacterInfo;