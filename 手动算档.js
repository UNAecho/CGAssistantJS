var cga = require('./cgaapi')(function () {
    var petGrade = new require('./常用数据/petGrade.js');
    var petInfos = require('./常用数据/petInfo.js');

    var calculateRunning = false

    var retry = ()=>{
        console.log('计算中..')
        if (petGrade.petGrade){
            console.log(petGrade.petGrade)

            var word1 = '【UNA脚本】【宠物算档器】计算完毕，可能为：'+petGrade.petGrade['最可能情况'].grade+'档'
            var word2 = '【UNA脚本】【宠物算档器】【'+petGrade.petGrade['最优掉档'].grade+'】档概率【'+String((petGrade.petGrade['最优掉档'].probability) * 100)+'%】'
            var word3 = '【UNA脚本】【宠物算档器】【'+petGrade.petGrade['最差掉档'].grade+'】档概率【'+String((petGrade.petGrade['最差掉档'].probability) * 100)+'%】'
            var result = (counter)=>{
        
                if(counter == 0){
                    cga.SayWords(word3, 0, 3, 1);
                    return;
                } else if(counter == 3){
                    cga.SayWords(word2, 5, 3, 1);
                } else if(counter == 6){
                    cga.SayWords(word1, 1, 3, 1);
                }
                
                setTimeout(result, 1000, counter-1);
            }
            result(9)

            calculateRunning = false
            return
        }
        setTimeout(retry, 3000);
    }
    
    var sayString = '【UNA脚本】【宠物算档器】请输入要计算的宠物位置(1-5)';
    cga.sayLongWords(sayString, 0, 3, 1);
    cga.waitForChatInput((msg, val)=>{
        if(!calculateRunning && val !== null && val >= 1 && val <= 5){
            
            petGrade.calculate(cga.GetPetInfo(val-1))
            calculateRunning = true
            retry()
            
            // return false;
        }
        
        return true;
    });
})