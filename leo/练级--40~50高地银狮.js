require(process.env.CGA_DIR_PATH+'/leo').then(async (cga) => {
    leo.baseInfoPrint();                    //显示基础信息
    leo.moveTimeout = 20;                  //遇敌速度
    leo.monitor.config.keepAlive = false;   //关闭防掉线
    leo.monitor.config.logStatus = false;   //关闭战斗状态提示
    //自动跟随队长换线，设置为true时，需要先提前与队长交换名片
    leo.monitor.config.autoChangeLineForLeader = false;
    var battleStatus = false;   //队长打印战斗明细
    var sellStone = false; //卖魔石

    let teams = [//自行修改角色名称，可以再加更多的队伍
        ['队长01','小号01','小号02','小号03','小号04'],
        ['队长02','小号05','小号06','小号07','小号08'],
        ['队长03','小号09','小号10','小号11','小号12'],
        ['队长04','小号13','小号14','小号15','小号16'],
        ['队长05','小号17','小号18','小号19','小号20'],
    ];

    let playerName = cga.GetPlayerInfo().name;
    let teammates = leo.findMyTeam(teams);
    if(teammates == null){
        await leo.log('红叶の高地银狮脚本，未找到队伍，请确认配置是否正确')
        return leo.delay(1000*60*60*2);
    }else{
        await leo.log('红叶の高地银狮脚本，推荐40~50级使用，启动~');
        await leo.log('我的队伍是：['+teammates.join(',')+']')
    }
    let teamLeader = teammates[0];
    let teamPlayerCount = teammates.length;
    let isTeamLeader = false;
    if (playerName == teamLeader) {
        isTeamLeader = true;
        await leo.log('我是队长，预设队伍人数【'+teamPlayerCount+'】');
        if(battleStatus){
            leo.battleMonitor.start(cga);
        }
    }else{
        await leo.log('我是队员，队长是【'+teamLeader+'】');
    }

    var protect = {
        //contactType遇敌类型：-1-旧遇敌，0-按地图自适应，1-东西移动，2-南北移动，
        //3-随机移动，4-画小圈圈，5-画中圈圈，6-画大圈圈，7-画十字，8-画8字
        contactType: 0,
        visible: false, 
        minHp: 150,
        minMp: 100,
        minPetHp: 100,
        minPetMp: 60,
        minTeamNumber: teamPlayerCount
    };
    var isPrepare = false; //招魂、治疗、补血、卖石
    var isLogBackFirst = false; //启动登出
    var meetingPoint = 1; //集合点1~3
    var prepareOptions = {
        rechargeFlag: 1,
        repairFlag: -1,
        crystalName: '水火的水晶（5：5）',
        doctorName: '医道之殇'
    };
    
    cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true); //开启队聊
    cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true); //开启组队
    cga.EnableFlags(cga.ENABLE_FLAG_CARD, false); //关闭名片
    cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false); //关闭交易
    if (isTeamLeader) {
        protect.minMp = 350; //队长是传教，回城魔值至少要大于等于一次祈祷的魔
    }

    leo.todo().then(() => {
        //登出
        if (isLogBackFirst) {
            return leo.logBack();
        } else {
            return leo.next();
        }
    }).then(() => {
        //招魂、治疗、补血、卖石
        if (isPrepare) {
            return leo.logBack().then(() => leo.prepare(prepareOptions));
        } else {
            return leo.next();
        }
    }).then(() => {
        return leo.loop(
            () => leo.waitAfterBattle()
            .then(() => leo.checkHealth(prepareOptions.doctorName))
            //.then(() => leo.checkCrystal(prepareOptions.crystalName))
            .then(() => {
                //完成组队
                var teamplayers = cga.getTeamPlayers();
                if ((isTeamLeader && teamplayers.length >= protect.minTeamNumber)
                		|| (!isTeamLeader && teamplayers.length > 0)) {
                    //console.log('组队已就绪');
                    return leo.next();
                } else {
                    console.log(leo.logTime() + '寻找队伍');
                    return leo.logBack()
                    .then(() => {
                        if (isTeamLeader) {
                            cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true); //开启组队
                            return leo.autoWalk([155,100])
                            .then(() => leo.buildTeamBlock(teamPlayerCount,teammates));
                        } else {
                            return leo.autoWalk([154,100])
                            .then(() => leo.enterTeamBlock(teamLeader));
                        }
                    });
                }
            }).then(() => {
                //练级
                if (isTeamLeader) {
                    var currentMap = cga.GetMapName();
                    if (currentMap == '艾尔莎岛') {
                        return leo.autoWalk([157, 93])
                        .then(() => leo.turnDir(0))
                        .then(() => leo.delay(500));
                    }
                    if (currentMap == '艾夏岛') {
                        if(sellStone){
                            return leo.autoWalk([102,115,'冒险者旅馆'])
                            .then(() => leo.autoWalk([37,30]))
                            .then(() => leo.walkList([
                                [38,30],
                                [37,30],
                                [38,30],
                                [37,30]
                            ]))
                            .then(()=>leo.sell(37, 29))
                            .then(()=>leo.delay(3000))
                            .then(()=>leo.autoWalkList([
                                [38,48,'艾夏岛'],[112,81,'医院'],[35,46]
                            ]))
                            .then(() => leo.walkList([
                                [35,45],
                                [35,46],
                                [35,45],
                                [35,46]
                            ]))
                            .then(()=>leo.supply(36,46))
                            .then(()=>leo.statistics(leo.beginTime, leo.oldXp)) //打印统计信息
                            .then(()=>leo.autoWalkList([
                                [28,52,'艾夏岛'],[190,116,'盖雷布伦森林']
                            ]));
                        }else{
                            return leo.autoWalk([112,81,'医院'])
                            .then(() => leo.autoWalk([35,46]))
                            .then(() => leo.walkList([
                                [35,45],
                                [35,46],
                                [35,45],
                                [35,46]
                            ]))
                            .then(()=>leo.supply(36,46))
                            .then(()=>leo.statistics(leo.beginTime, leo.oldXp)) //打印统计信息
                            .then(()=>leo.autoWalkList([
                                [28,52,'艾夏岛'],[190,116,'盖雷布伦森林']
                            ]));
                        }
                        
                    }
                    if (currentMap == '盖雷布伦森林') {
                        return leo.autoWalkList([
                            [231, 222, '布拉基姆高地']
                        ]);
                    }
                    if (currentMap == '布拉基姆高地') {
                        return leo.autoWalkList([
                            [148, 116],[147,117]
                        ])
                        .then(()=>{
                            console.log(leo.logTime() + '开始战斗');
                            return leo.encounterTeamLeader(protect) //队长遇敌
                            .then(() => {
                                console.log(leo.logTime() + "登出回补");
                                return leo.logBack();
                            });
                        });
                    }
                } else {
                    var mapInfo = leo.getMapInfo();
                    if (mapInfo.name == '冒险者旅馆' && mapInfo.y == 30 && (mapInfo.x == 37 || mapInfo.x == 38)) {
                        return leo.sell(37, 29).then(() => leo.delay(2000));
                    }
                    if (mapInfo.name == '医院' && mapInfo.x == 35 && (mapInfo.y == 45 || mapInfo.y == 46)) {
                        return leo.supply(36,46).then(() => {
						    return leo.statistics(leo.beginTime, leo.oldXp);//打印统计信息
                        });
                    }
                    if (mapInfo.name.indexOf('布拉基姆高地')!=-1){
                        return leo.encounterTeammate(protect, '布拉基姆高地'); //队员遇敌
                    }
                }
                //console.log('延时3秒');
                return leo.delay(3000);
            }).
            catch (console.log));
    });
});