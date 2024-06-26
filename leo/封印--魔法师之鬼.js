require('./common').then(cga => {
    //leo.baseInfoPrint();
    leo.monitor.config.keepAlive = false;   //关闭防掉线
    leo.monitor.config.logStatus = false;
    var petIndexMap = {};

    // 宠物临时能力求和，用于判断综合素质
    var hpandmp = 0
    var abilities = 0
    var total = 0

    //宠物目标属性值：血、魔、攻、防、敏
    var petOptions = {
        name: '魔法师之鬼',
        sealCardName: '封印卡（不死系）',
        sealCardLevel: 1,
        autoDropPet: true, //是否自动扔宠，true扔/false不扔
        minHp: 50,
        minMp: 130,
        minAttack: 11,
        minDefensive: 11,
        minAgility: 30,
        petChecker: () => {
            var pets = cga.GetPetsInfo();
            //console.log(leo.logTime()+'宠物数量：'+pets.length);
            for (var i in pets) { 
                var pet = pets[i];
                if (petIndexMap[pet.index] && petIndexMap[pet.index] == 1) {
                    //原有的宠，不做处理
                } else {
                    //新抓到的宠
                    var isDrop = leo.isDropPet(pet, petOptions);
                    hpandmp = pet.maxhp + pet.maxmp
                    abilities = pet.detail.value_attack + pet.detail.value_defensive + pet.detail.value_agility
                    total = hpandmp +abilities
                    if (pet.realname == petOptions.name && pet.level == 1 && isDrop.flag) {
                        if (cga.isInNormalState()) {
                            if(total >=319){
                                console.log('尚可！' + isDrop.info + '虽然有瘸腿数值但是综合指标达标。')
                            }
                            else{
                                cga.DropPet(pet.index);
                                console.log('可惜！丢下宠物' + leo.getPetCalcInfo(pet) + '，' + isDrop.info + '。' + '血魔总和:'+ hpandmp+ '，' +'攻防敏总和：'+ abilities+ '，' +'全能力总和：'+ total);
                            }
                        }
                    } else {
                        leo.log('恭喜！！！！！！抓到宠物' + leo.getPetCalcInfo(pet)+ '血魔总和:'+ hpandmp+ '，' +'攻防敏总和：'+ abilities+ '，' +'全能力总和：'+ total);
                        petIndexMap[pet.index] = 1;
                    }
                }
            }
            //判断是否要购买封印卡
            var sealCardCount = cga.getItemCount(petOptions.sealCardName);
            if (sealCardCount < 10) {
                return true;
            }
        }
    };
    var protect = {
        minHp: 500,
        minMp: 200,
        minPetHp: 500,
        minPetMp: 200,
        maxPetNumber: 4, //超过4只宠物
        checker: petOptions.petChecker
    };
    var isLogBackFirst = false; //启动登出
    var isPrepare = false; //招魂、治疗、补血、卖石
    var prepareOptions = {
        rechargeFlag: 1,
        repairFlag: -1,
        crystalName: '火风的水晶（5：5）',
        doctorName: 'UNAの护士'
    };
    // leo.log('红叶の自动抓【' + petOptions.name + '】存银行脚本，启动~');
    var setting = '预设五围是：【' + petOptions.minHp + '/' + petOptions.minMp + '/' + petOptions.minAttack + '/' + petOptions.minDefensive + '/' + petOptions.minAgility + '】，自动扔宠：【' + (petOptions.autoDropPet ? '已启用' : '未启用') + '】';
    leo.log(setting);
    cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, false); //关闭队聊
    cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false); //关闭组队
    cga.EnableFlags(cga.ENABLE_FLAG_CARD, false); //关闭名片
    cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false); //关闭交易
    var playerinfo = cga.GetPlayerInfo();
    var playerName = playerinfo.name;
    var isTeamLeader = true;
    var bankPetFull = false;
    var pets = cga.GetPetsInfo();
    if (pets.length > 0) {
        console.log('身上已有宠物：');
    }
    for (var i in pets) {
        var pet = pets[i];
        petIndexMap[pet.index] = 1;
        var index = parseInt(pet.index) + 1;
		console.log(index + '  ' + pet.realname + '  LV' + pet.level);
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
            () => leo.waitAfterBattle().then(() => {
                //判断是否要去银行取钱
                playerinfo = cga.GetPlayerInfo();
                if (playerinfo.gold < 1000) {
                    return leo.goto(n => n.falan.bank).then(() => leo.moveGold(20000, cga.MOVE_GOLD_FROMBANK)).then(() => {
                        playerinfo = cga.GetPlayerInfo();
                        if (playerinfo.gold < 1000) {
                            return leo.reject('钱到用时方恨少！请补充足够银子后重新执行脚本！');
                        }
                    });
                }
            }).then(() => {
                //判断人物身上的宠物数量是否等于5
                var pets = cga.GetPetsInfo();
                if (pets.length == 5) {
                    if (bankPetFull) {
                        return leo.reject('背包和银行宠物栏均满，请手动确认');
                    } else {
                        bankPetFull = true;
                        return leo.goto(n => n.falan.bank)
                        .then(() => leo.movePet(1, 101))
                        .then(() => leo.movePet(2, 102))
                        .then(() => leo.movePet(3, 103))
                        .then(() => leo.movePet(4, 104))
                        .then(() => {
                            //更新人物身上的宠物信息
                            var pets = cga.GetPetsInfo();
                            petIndexMap = {};
                            for (var i in pets) {
                                var pet = pets[i];
                                petIndexMap[pet.index] = 1;
                            }
                            return leo.next();
                        });
                    }
                }
            })
            .then(() => {
                //判断是否要购买封印卡
                var sealCardCount = cga.getItemCount(petOptions.sealCardName);
                if (sealCardCount < 20) {
                    return leo.buySealCard(petOptions.sealCardName, 100, petOptions.sealCardLevel);
                }
            })
            .then(() => {
                //地图判断，如果已经在1级宠捕捉点，则继续捕捉
                var currentMap = cga.GetMapName();
                if (currentMap == '雪拉威森塔４１层') {
                    return leo.autoWalkList([
                        [118, 97]
                    ]);
                } else {
                    return leo.todo()
                    .then(()=>leo.sellCastle())
                    .then(() => leo.checkHealth(prepareOptions.doctorName))
                    .then(() => leo.checkCrystal(prepareOptions.crystalName))
                    .then(() => leo.logBack())
                    .then(() => leo.autoWalk([165,153]))
                    .then(() => leo.talkNpc(2,leo.talkNpcSelectorYes,'利夏岛'))
                    .then(() => leo.autoWalk([90,99,'国民会馆']))
                    .then(() => leo.autoWalk([107,52]))
                    .then(() => leo.supply(108, 52))
                    .then(() => leo.autoWalk([108,39,'雪拉威森塔１层']))
                    .then(() => leo.autoWalkList([[73,56],[72,56,'雪拉威森塔４０层']]))
                    .then(() => leo.autoWalk([117,96,'雪拉威森塔４１层']))
                    .then(() => leo.autoWalkList([
                        [118, 97]
                    ]));
                }
            }).then(() => {
                leo.log('到达位置，开始抓宠，请注意是否开启了自动扔宠物。');
                return leo.encounterTeamLeader(protect)
                .then(() => {
                    petOptions.petChecker();
                    return leo.next();
                })
                .then(() => {
                    console.log(leo.logTime() + "触发回补");
                    return leo.logBack().then(() => leo.prepare(prepareOptions));
                });
            }).
            catch ((err) => {
                leo.log(err);
                return leo.delay(60000);
            }));
    });
});