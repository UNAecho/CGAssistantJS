var cga = require('./cgaapi')(function () {

    var workingFlag = false
    
    var sayString = '【UNA脚本】【全世界任意地点自动导航】请输入要去的地图编号';
    cga.sayLongWords(sayString, 0, 3, 1);
    cga.waitForChatInput((msg, val)=>{
        if(!workingFlag && val !== null && val > 0){
            
            workingFlag = true
            cga.travel.falan.autopilot(val,()=>{
                workingFlag = false
                console.log('到达目的地，若想继续使用请再次输入目的地')
            })
        }
        return true;
    });
})