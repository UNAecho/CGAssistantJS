var fs = require('fs');
var cga = require('./cgaapi')(function () {
	global.cga = cga
	// 要复制的文件内容
	let inputPath = cga.getrootdir() + '\\脚本设置\\通用挂机脚本_UNAの厨师.json';
	// 输出的文件序号，左闭合区间。默认2位数。如果结果是个位数字，则使用0来补齐至2位数。
	let startNum = 1
	// 输出的文件序号，右闭合区间。默认2位数。如果结果是个位数字，则使用0来补齐至2位数。
	let endNum = 10
	let fileJson = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

	/**
	 * 以数字为分界线切割，返回Array型结果。
	 * 例：
	 * inputPath = X:XXX\个人配置\个人配置_UNAの仓库01.json
	 * inputPath.split(/\d+/g) = [ 'X:XXX\个人配置\个人配置_UNAの仓库', '.json' ]
	 */
	let splitArr = inputPath.split(/\d+/g)

	let writeFile = (cb) => {
		if (startNum > endNum) {
			console.log('脚本结束。')
			return
		}
		let numToStr = startNum.toString()
		let file = splitArr[0] + (numToStr.length == 1 ? '0' + numToStr : numToStr) + splitArr[1]
		fs.writeFile(file, JSON.stringify(fileJson), () => {
			console.log(file + '写入完毕..')
			startNum += 1
			setTimeout(writeFile, 1000, cb);
		});
	}
	writeFile()
	return
});