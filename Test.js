var fs = require('fs');
var path = require('path');
var cga = require('./cgaapi')(function () {
    global.cga = cga
    var scriptMode = require('./通用挂机脚本/公共模块/跳转其它脚本');
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
    var banks = cga.GetBankGold();
    var teamplayers = cga.getTeamPlayers();
 
    var petindex = cga.findbattlepet()

	
    console.log(teamplayers.length)
    // var settings = cga.gui.LoadSettings(a,(err, result)=>{
    //     console.log(result);
    //     // process.exit([code])退出Node.js，值默认0（成功），1为失败。
    //     // setTimeout(process.exit(0), 5000);
    // })

    // var path = require("path");
    // console.log(path.join(__dirname,'./'))
    // scriptMode.call_ohter_script(body,null)





})