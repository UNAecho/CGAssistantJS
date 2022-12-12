var fs = require('fs');
var path = require('path');
var request = require('request');
var cga = require('./cgaapi')(function () {
    global.cga = cga
    var scriptMode = require('./通用挂机脚本/公共模块/跳转其它脚本');
    var switchAccount = require('./通用挂机脚本/公共模块/切换同类账号');
    var petGrade = require('./常用数据/petGrade.js');
    var petInfos = require('./常用数据/petInfo.js');
    var configMode = require('./通用挂机脚本/公共模块/读取战斗配置');
    var testMode = require('./通用挂机脚本/公共模块/莎莲娜回补');
    var log = require('./unalog');
    const reputationInfos = require('./常用数据/reputation.js');
    
    // 提取本地职业数据
    const getprofessionalInfos = require('./常用数据/ProfessionalInfo.js');
    // 拾荒目标
    var targetitems = ['金币', '小护士家庭号', '魔力之泉',
        '海苔',
        '印度轻木',
        '苹果薄荷',
        '面包',
        '铜',
        '鹿皮',
    ];
    // 拾荒规则
    var uselessFilter = (item) => {
        // console.log('name = ' + unit.item_name + ', flags = ' + unit.flags + ', counts = ' + unit.item_count)
        if (targetitems.indexOf(item.name) == -1) {
            return true;

        }

    }

    var playerinfo = cga.GetPlayerInfo();
    var items = cga.GetItemsInfo()
    var pets = cga.GetPetsInfo()
    var equipItems = cga.getEquipItems()
    var units = cga.GetMapUnits()
    var dropitem = cga.getInventoryItems().find(uselessFilter)
    var map = cga.getMapObjects()
    var banks = cga.GetBankItemsInfo();
    var bankGold = cga.GetBankGold();
    var teamplayers = cga.getTeamPlayers();
    var skills = cga.GetSkillsInfo();
    var petindex = cga.findbattlepet()
    var inventory = cga.getInventoryItems();

	var today = new Date().toLocaleString()
    // console.log(typeof today)
    var success = ()=>{
        console.log('成功!')
    }
    // var target = '阿巴尼斯村'
    // // 当前地图信息
    // var mapindex = cga.GetMapIndex().index3
    // // 获取当前主地图名称
    // var villageName = cga.travel.switchMainMap()
    // if(villageName == target){
    //     cga.travel.autopilot('医院',success)
    //     // cga.travel.toHospital(false,success)
    // }else{
    //     cga.travel.falan.toTeleRoom(target, (r)=>{});
    // }
    // cga.AsyncWaitNPCDialog(()=>{
    //     cga.ClickNPCDialog(0, 0);
    //     cga.AsyncWaitNPCDialog((err, dlg)=>{
    //         var store = cga.parseExchangeStoreMsg(dlg);
    //         console.log(store)
    //         if(!store)
    //         {
    //             cb(new Error('商店内容解析失败'));
    //             return;
    //         }
    //         // var buyitem = [];
    //         // var buyCount = parseInt(cga.getItemCount(rawMaterial) / exchangeRatio)

    //         // store.items.forEach((it)=>{
    //         //     if(it.name == targetMaterial && buyCount > 0){
    //         //         buyitem.push({index: it.index, count: buyCount});
    //         //     }
    //         // });

    //         // cga.BuyNPCStore(buyitem);
    //         // cga.AsyncWaitNPCDialog((err, dlg)=>{
    //         //     if (cb) cb(null)
    //         //     return;
    //         // });
    //     });
    // });
    // console.log(getprofessionalInfos(playerinfo.job))
    // cga.travel.falan.toKatieStore(()=>{
    //     cga.walkList([
    //         [15, 12],
    //     ], ()=>{
    //             var itemArray = cga.findItemArray('树苗？');
    //             cga.turnTo(16, 12);
    //             cga.AsyncWaitNPCDialog(()=>{
    //                 cga.SellNPCStore(itemArray);
    //                 cga.AsyncWaitNPCDialog(()=>{
    //                     cb2(true);
    //                 });
    //             });
    //     });
    // });
    // mapCollection = cga.GetMapObjectTable(true).cell
    // for(var i in mapCollection){
    //     // if(mapCollection[i] !=1 && mapCollection[i] !=0){
    //     //     console.log(mapCollection[i])
    //     // }
    //     // if(mapCollection[i] ==1){
    //     //     console.log(mapCollection[i])
    //     // }
    //     // console.log(0xFF & mapCollection[i])
    //     if((0xFF & mapCollection[i]) !=0){
    //         console.log(mapCollection[i] & 0xFF)
    //         console.log(i)
    //     }
    // }
    // console.log(mapCollection)

    var dialogHandler = (err, dlg)=>{
        console.log(dlg)
        if(dlg && (dlg.options & 4) == 4)
        {
            // cga.ClickNPCDialog(4, 0);
            cga.AsyncWaitNPCDialog(dialogHandler);
            return;
        }
        if(dlg && (dlg.options & 32) == 32)
        {
            // cga.ClickNPCDialog(32, 0);
            cga.AsyncWaitNPCDialog(dialogHandler);
            return;
        }
        else if(dlg && dlg.options == 1)
        {	
            // cga.ClickNPCDialog(1, 0);
            cga.AsyncWaitNPCDialog(dialogHandler);
            return;
        }
        else if(dlg && dlg.options == 3)
        {
            // cga.ClickNPCDialog(1, 0);
            cga.AsyncWaitNPCDialog(dialogHandler);
            return;
        }
        else if(dlg && dlg.options == 12)
        {
            // cga.ClickNPCDialog(4, -1);
            cga.AsyncWaitNPCDialog(dialogHandler);
            return;
        }
        return
    }
    cga.AsyncWaitNPCDialog(dialogHandler);

    // var talkNpcSayYesToChangeMap = (cb,npcPosArr,type)=>{
    //     var wait = (cb)=>{
    //         cga.waitForLocation({moving : true , pos : npcPosArr ,leaveteam : true}, ()=>{
    //             var originIndex = cga.GetMapIndex().index3
    //             var originalPos = cga.GetMapXY();
        
    //             var retry=()=>{
    //                 cga.AsyncWaitNPCDialog(dialogHandler);
    //                 cga.TurnTo(npcPosArr[0], npcPosArr[1]);
    //                 if(type == 'index' && cga.GetMapIndex().index3 != originIndex){
    //                     console.log('index发生变化，切换地图成功')
    //                     cb(true)
    //                     return
    //                 }else if(type == 'pos' && pos.x != originalPos.x){
    //                     console.log('x发生变化，切换地图成功')
    //                     cb(true)
    //                     return
    //                 }else if(type == 'pos' && pos.y != originalPos.y){
    //                     console.log('y发生变化，切换地图成功')
    //                     cb(true)
    //                     return
    //                 }
    //                 setTimeout(retry, 5000);
    //                 return
    //             }
        
    //             setTimeout(retry, 1000);
    //         });
    //     }
    
    //     if(cga.isTeamLeader){
    //         var posArr = cga.get2RandomSpace(npcPosArr[0],npcPosArr[1])
    //         cga.walkList([
    //             posArr[0],
    //             posArr[1],
    //             posArr[0],
    //             posArr[1],
    //             posArr[0],
    //         ], ()=>{
    //             cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
    //             setTimeout(() => {
    //                 wait(cb)
    //             }, 1000);
    //         });
    //     }else{
    //         wait(cb)
    //     }
    //     return
    // }
    // var teammates = ["UNAの格斗1","UNAの传教士",]
    // cga.isTeamLeader = (teammates[0] == playerinfo.name || teammates.length == 0) ? true : false
    // talkNpcSayYesToChangeMap(()=>{
    //     console.log('成功！！！')
    // },[165,154],'index')
    
    // var reg = new RegExp(/(?<=<td class="text-danger">)(([\s\S])*?)(?=<\/td>)/g)
    // var reg1 = new RegExp(/(?<=<td class="text-info">)(([\s\S])*?)(?=<\/td>)/g)

    // request.post({
    //     url:'http://www.molibaike.com/Tools/Analyzer',
    //     headers:{
    //         "content-type":"application/x-www-form-urlencoded"
    //     },
    //     form:{
    //         level:1,
    //         id:'26f0f0c8-d8af-4348-a14c-1e4c04b0f0ad',
    //         emptyPoint:0,
    //         'basePoint.Constitution':7,
    //         'basePoint.Strength':7,
    //         'basePoint.Defense':7,
    //         'basePoint.Agile':1,
    //         'basePoint.Intelligence':1,
    //         'bodyPoint.HealthPoint':120,
    //         'bodyPoint.MagicPoint':70,
    //         'bodyPoint.AttachPoint':45,
    //         'bodyPoint.DefensePoint':45,
    //         'bodyPoint.SpeedPoint':26,
    //         'bodyPoint.MindPoint':99,
    //         'bodyPoint.RecoverPoint':104,
    //     }
    // },function (error,response,body) {
    //     if (!error && response.statusCode == 200){
    //         var match = body.match(reg);
    //         var match1 = body.match(reg1);

    //         console.log(match)
    //         // console.log(match1.length)
    //         // console.log(response.toJSON())
    //         // for (i in match){
    //         //     console.log(match[i].replace(/\s+/g, ''))
    //         // }
    //     }
    // })
    // console.log(petGrade.getGrade(cga.GetPetInfo(0)))
    // petGrade.calculate(cga.GetPetInfo(1))
    // var retry = ()=>{
    //     console.log('retry..')
    //     if (petGrade.petGrade){
    //         // console.log(JSON.stringify(petGrade.petGrade))
    //         console.log(petGrade.petGrade)
    //         return
    //     }
    //     setTimeout(retry, 3000);
    // }
    // retry()

    // cga.AsyncWaitNPCDialog(() => {
    //     cga.savePetToBankAll(()=>{
    //         return true
    //     }, 
    //     false, 
    //     (r) => {
    //         if(r){
    //             console.log(typeof r)
    //             if(r.message.indexOf('没有空位') >= 0 && cga.GetPetsInfo().length == 2){
    //                 console.log('银行与身上宠物栏位均已满')
    //                 return
    //             }
    //         }
    //     });
    // });
    // var generateTalkPos =(npcPos)=>{
    //     return cga.get2RandomSpace(npcPos[0],npcPos[1])
    // }
    // console.log(generateTalkPos([140,105]))
    // console.log(cga.buildMapTileMatrix())
    // cga.travel.falan.toCamp(()=>{
    //     console.log('test123')
    // })

    // cga.travel.autopilot('希尔薇亚的家',()=>{
    //     cga.travel.autopilot('主地图',success)
    // })
    // var retry = ()=>{

	// 	var unit = cga.GetMapUnits().find((u)=>{
	// 		if(u.valid == 2 && u.type == 1 && u.model_id != 0 && (u.flags & 4096) != 0 && u.unit_name == '陌生的神官'){
	// 			return true;
    //         }
	// 		return false;
	// 	});

    //     if(unit){
    //         cga.waitForLocation({pos:[unit.xpos, unit.ypos]}, ()=>{
                // configMode.func('节能模式')
    //         });
    //         return
    //     }
    //     setTimeout(retry, 1000);
    // }
    
    // retry()

    // var dict = {}
    // var rootdir = cga.getrootdir()
    // filenames = fs.readdirSync(rootdir + '\\leo')
    // filenames.forEach(file => {
    //     var filepath = rootdir + '\\leo\\'  + file
    //     if (path.extname(filepath) == '.json'){
    //         var itemdroplist = JSON.parse(fs.readFileSync(filepath)).itemdroplist
    //         for (var t in itemdroplist){
    //             if (dict.hasOwnProperty(itemdroplist[t])){
    //                 dict[itemdroplist[t]]++
    //             }else{
    //                 dict[itemdroplist[t]] = 1
    //             }
    //         }
    //     }
    //   }); 
    //   res = []
    //   for (var i in dict){
    //     res.push(i)
    //   }
    //   writefile = rootdir + '\\测试.json'
    //   console.log(writefile)
    //   fs.writeFile(writefile, JSON.stringify(res), (err)=>{
    //     if(err){
    //         console.log('个人配置文件保存失败：');
    //         return;
    //     }			
    //     console.log('成功')
    // });
    // console.log(cga.buildMapCollisionMatrix().matrix)
    // cga.refreshMissonStatus(null)
    // cga.travel.falan.toTeleRoom('圣拉鲁卡村', (r)=>{
        
    // });

    // cga.travel.autopilot(1401,success)
    // cga.travel.falan.toTeleRoom('魔法大学', ()=>{
    //     cga.travel.autopilot(4457,success)
    // });
    // cga.travel.autopilot('魔法大学内部',success)


    // var mainMapName = cga.travel.switchMainMap()
    // var target = '杰诺瓦镇'
    // if(mainMapName == target)
    // {
    //     cga.travel.autopilot('主地图',success)
    // }
    // else
    // {
    //     cga.travel.falan.toTeleRoom(target, ()=>{
    //         cga.travel.autopilot('主地图',success)
    //     });
    // }
    testMode.func(success)
})