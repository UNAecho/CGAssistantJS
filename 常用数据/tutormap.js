module.exports = function(cga,job) {
	const gettutorinfo = require('./ProfessionalInfo.js');
	var tutorinfo = gettutorinfo(cga)
	var tutorlocation = tutorinfo.tutorlocation;

	if(job != null){
		cga.SayWords('请输入对应的职业通用名称，例：弓箭手、魔术师', 0, 3, 1);
		cga.waitForChatInput((msg)=>{
			if(msg){
				job = msg
			}
		});
	}else{
		job = tutorinfo.jobmainname
	}

	// 先去导师所在的大地图
	if (tutorlocation == '法兰城' || tutorlocation == '芙蕾雅'){
		cga.travel.falan.toStone('C', ()=>{
			console.log('导师在法兰城一带')
		});
	}else if(tutorlocation == '圣拉鲁卡村'){
		cga.travel.falan.toTeleRoom(tutorlocation, ()=>{
			console.log('导师在 '+ tutorlocation + '，先去 ' + tutorlocation + '..')
			cga.walkList([
				[7, 3, '村长的家'],
				[2, 9, '圣拉鲁卡村'],
				[32, 70, '装备品店'],
				[14, 4, '1楼小房间'],
				[9, 3, '地下工房'],
				],()=>{});
		});
	}else if(tutorlocation == '伊尔村'){
		cga.travel.falan.toTeleRoom(tutorlocation, ()=>{
			console.log('导师在 '+ tutorlocation + '，先去 ' + tutorlocation + '..')
		});
	}else if(tutorlocation == '哥拉尔镇'){
		cga.travel.falan.toCity(tutorlocation, ()=>{
			console.log('导师在 '+ tutorlocation + '，先去 ' + tutorlocation + '..')
		});
	}else if(tutorlocation == '索奇亚'){
		cga.travel.falan.toTeleRoom('奇利村', ()=>{
			console.log('导师在 '+ tutorlocation + '，先去 ' + tutorlocation + '..')
		});
	}else{
		throw new Error('异常职业，如果您是手动输入职业，请检查输入是否有误！例如暗黑骑士与黑暗骑士');
	}
};