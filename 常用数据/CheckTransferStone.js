module.exports = function(cga,cb) {
    // 获取传送石信息
    const getTransferStoneInfos = require('./TransferStoneInfo.js');
    
    var result = {}



    var check = (cb2)=>{
        console.log('check..')
        var transferStoneInfos = getTransferStoneInfos()
        // transferStoneInfos.forEach(t => {
        //     cga.walkList([t.npcPos], ()=>{
        //         setTimeout(cb2, 1500,true)
        //         return
        //     });
        // });
        setTimeout(cb2, 1500,null)
    }
    var checkmsg = ()=>{
        cga.AsyncWaitNPCDialog((err, dlg)=>{
            // 开了传送
            if(dlg && dlg.message.indexOf('金币') >= 0){
                cga.ClickNPCDialog(32, 0);
                cga.AsyncWaitNPCDialog((dlg)=>{
                    cga.ClickNPCDialog(1, 0);
                    setTimeout(cb2, 3000, true);
                });
            }// 没开
            else if(dlg && dlg.message.indexOf('不能') >= 0){
                cga.ClickNPCDialog(4, 0);
                cga.AsyncWaitNPCDialog((dlg)=>{
                    cga.ClickNPCDialog(1, 0);
                    setTimeout(cb2, 3000, true);
                });
            }// 蒂娜晚上不能传送
            else if(dlg && dlg.message.indexOf('很抱歉，往蒂娜的传送石除了白天以外是不能利用的') >= 0){
                cga.ClickNPCDialog(4, 0);
                cga.AsyncWaitNPCDialog((dlg)=>{
                    cga.ClickNPCDialog(1, 0);
                    setTimeout(cb2, 3000, true);
                });
            }
        });
    }
    // main
    if (cga.GetMapIndex().index3 ==1522){
        setTimeout(check, 1500,cb)
    }else{
        cga.travel.falan.toStone('C', ()=>{
				
            var list = [
            [41, 50, '里谢里雅堡 1楼'],
            [45, 20, '启程之间']
            ];
            cga.walkList(list, ()=>{
                setTimeout(check, 1500,cb)
                return
            });
        });
    }

};