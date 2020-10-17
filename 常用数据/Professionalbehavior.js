module.exports = function(cga,job,behavior,cb) {
    // 提取本地职业信息
    const getprofessionalInfos = require('./ProfessionalInfo.js');
    var professionalInfo = getprofessionalInfos(job)

    // 通用学习动作
    var learn = ()=>{
        cga.AsyncWaitNPCDialog(()=>{
            cga.ClickNPCDialog(0, 0);
            cga.AsyncWaitNPCDialog(()=>{
                setTimeout(() => {
                    cga.ClickNPCDialog(0, -1);
                    setTimeout(() => {
                        cga.AsyncWaitNPCDialog((err, dlg)=>{
                            if(dlg && dlg.message.indexOf('技能栏位') > 0){
                                throw new Error(professionalInfo.skill + '学习失败,你没有技能栏位了')
                            }else if(dlg && dlg.message.indexOf('你的钱') > 0){
                                throw new Error(professionalInfo.skill + '学习失败,你的钱不够了')
                            }else{
                                console.log('技能学习完毕')
                                if(cb){
                                    cb(true)
                                }
                            }
                        });
                    }, 1500);
                }, 1000);
            });
        });	

    }
    if(behavior == 'learning'){
        console.log('professionalInfo.teacherwalk = ' + professionalInfo.teacherwalk)
        if(professionalInfo.teacherlocation == '法兰城'){
            cga.travel.falan.toStone('C', ()=>{
                cga.walkList(professionalInfo.teacherwalk, ()=>{
                    cga.TurnTo(professionalInfo.teacherpos[0], professionalInfo.teacherpos[1]);
                    learn()
                });
            });
        }else{//非法兰城学技能
            cga.SayWords("即将使用传送石，请注意是否开启【" + professionalInfo.teacherlocation+ "】传送权限" , 0, 3, 1);
            var go = ()=>{
                cga.walkList(professionalInfo.teacherwalk, ()=>{
                    if (job.indexOf('抗') >= 0){
                        // 每个书架前面的坐标都不一样，需要特殊定制
                        var templist = [
                            [38, 37, '咒术师的秘密住处'],
                            [11, 0, 15008],
                            [1, 10, 15010],]
                            switch(job){
                                case '抗毒':
                                    templist.push([10, 7])
                                    break;
                                case '抗昏睡':
                                    templist.push([11, 10])
                                    break;
                                case '抗混乱':
                                    templist.push([14, 8])
                                    break;
                                case '抗酒醉':
                                    templist.push([10, 15])
                                    break;
                                case '抗石化':
                                    templist.push([10, 13])
                                    break;
                                case '抗遗忘':
                                    templist.push([15, 9])
                                    break;
                                default:
                                    throw new Error('未知的抗性名称');
                            }
                        cga.turnDir(3);
                        setTimeout(()=>{
                        cga.SayWords('咒术', 0, 3, 1);
                            cga.AsyncWaitNPCDialog(()=>{
                                cga.ClickNPCDialog(1, 0);
                                cga.AsyncWaitMovement({map:15006, delay:1000, timeout:5000}, ()=>{
                                    // 使用特殊定制的walklist
                                    cga.walkList(templist, ()=>{
                                        cga.TurnTo(professionalInfo.teacherpos[0], professionalInfo.teacherpos[1]);
                                        learn()
                                    });
                                });
                            });
                        }, 1500);
                    }else{
                        cga.TurnTo(professionalInfo.teacherpos[0], professionalInfo.teacherpos[1]);
                        learn()
                    }
                });
            }
            if(cga.GetMapIndex().index3 != 15010){
                cga.travel.falan.toTeleRoom(professionalInfo.teacherlocation, ()=>{
                    go()
                });
            }else{
                var poslist = []
                switch(job){
                    case '抗毒':
                        poslist.push([10, 7]);
                        break;
                    case '抗昏睡':
                        poslist.push([11, 10]);
                        break;
                    case '抗混乱':
                        poslist.push([14, 8]);
                        break;
                    case '抗酒醉':
                        poslist.push([10, 15]);
                        break;
                    case '抗石化':
                        poslist.push([10, 13]);
                        break;
                    case '抗遗忘':
                        poslist.push([15, 9]);
                        break;
                    default:
                        throw new Error('未知的抗性名称');
                }
                cga.walkList(poslist, ()=>{
                    cga.TurnTo(professionalInfo.teacherpos[0], professionalInfo.teacherpos[1]);
                    learn()
                });
            }
        }
    }else{//就职、转职、晋级
        console.log('professionalInfo.tutorwalk = ' + professionalInfo.tutorwalk)
        if(professionalInfo.tutorlocation == '法兰城'){
            cga.travel.falan.toStone('C', ()=>{
                cga.walkList(professionalInfo.tutorwalk, ()=>{
                    cga.TurnTo(professionalInfo.tutorpos[0], professionalInfo.tutorpos[1]);
                    cga.AsyncWaitNPCDialog(()=>{
                        //转职
                        if(behavior == 'transfer'){
                            cga.ClickNPCDialog(0, 1);
                            cga.AsyncWaitNPCDialog(()=>{
                                cga.ClickNPCDialog(32, 0);
                                cga.AsyncWaitNPCDialog((err,dlg)=>{
                                    console.log(dlg)
                                    if(dlg && dlg.options == 0){
                                        cga.ClickNPCDialog(0, 0);
                                        cga.AsyncWaitNPCDialog(()=>{
                                            console.log('转职完毕')
                                            return true
                                        });
                                    }
                                });	
                            });	
                        }else if(behavior == 'promote'){//晋级
                            cga.ClickNPCDialog(0, 2);
                            cga.AsyncWaitNPCDialog((err,dlg)=>{
                                console.log(dlg)
                                if(dlg && dlg.options == 0){
                                    cga.ClickNPCDialog(0, 0);
                                    cga.AsyncWaitNPCDialog(()=>{
                                        console.log('晋级完毕')
                                        return true
                                    });
                                }
                            });	
                        }else{//就职
                            cga.ClickNPCDialog(0, 0);
                            cga.AsyncWaitNPCDialog(()=>{
                                console.log('就职完毕')
                                return true
                            });
                        }

                    });			
                });
            })
        }else{//非法兰城职业、职级变动

            var choose = () =>{
                cga.AsyncWaitNPCDialog(()=>{
                    //转职
                    if(behavior == 'transfer'){
                        cga.ClickNPCDialog(0, 1);
                        cga.AsyncWaitNPCDialog(()=>{
                            cga.ClickNPCDialog(32, 0);
                            cga.AsyncWaitNPCDialog((err,dlg)=>{
                                console.log(dlg)
                                if(dlg && dlg.options == 0){
                                    cga.ClickNPCDialog(0, 0);
                                    cga.AsyncWaitNPCDialog(()=>{
                                        console.log('转职完毕')
                                        return true
                                    });
                                }
                            });	
                        });	
                    }else if(behavior == 'promote'){//晋级
                        cga.ClickNPCDialog(0, 2);
                        cga.AsyncWaitNPCDialog((err,dlg)=>{
                            console.log(dlg)
                            if(dlg && dlg.options == 0){
                                cga.ClickNPCDialog(0, 0);
                                cga.AsyncWaitNPCDialog(()=>{
                                    console.log('晋级完毕')
                                    return true
                                });
                            }
                        });	
                    }else{//就职
                        cga.ClickNPCDialog(0, 0);
                        cga.AsyncWaitNPCDialog(()=>{
                            console.log('就职完毕')
                            return true
                        });
                    }

                });
            } 

            cga.travel.falan.toTeleRoom(professionalInfo.tutorlocation, ()=>{
                if (professionalInfo.jobmainname == '格斗士'){
                    cga.walkList(professionalInfo.tutorwalk, ()=>{
                        cga.TurnTo(23,23)
                        cga.AsyncWaitNPCDialog((err, dlg)=>{
                            if(dlg && dlg.message.indexOf('老师') >= 0){
                                cga.ClickNPCDialog(4, -1);
                                return
                            }
                        });
                        cga.AsyncWaitMovement({map:'师范的房间'}, ()=>{
                            cga.walkList([
                                [19,15]], ()=>{
                                    cga.TurnTo(professionalInfo.tutorpos[0], professionalInfo.tutorpos[1]);
                                    choose()
                            });
                        });
                    });
                }else{
                    cga.walkList(professionalInfo.tutorwalk, ()=>{
                        cga.TurnTo(professionalInfo.tutorpos[0], professionalInfo.tutorpos[1]);
                        choose()
                    });
                }

            });
        }
    }
};