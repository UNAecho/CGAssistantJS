var cga = require(process.env.CGA_DIR_PATH_UTF8+'/cgaapi')(function(){
	var word = '【UNA脚本】欢迎使用UNAの脚本【检查传送石开启状态】模块，脚本会自动识别未开启的传送，并保存记录。'
	cga.SayWords(word, 0, 3, 1);
	cga.travel.falan.checkAllTeleRoom(()=>{})
});