/**
 * UNAecho: 简易的复制json文件脚本
 * 逻辑为：
 * 输入要复制的文件路径，脚本会自动切割输入的文件名。
 * 以数字为界限分割，例如【通用挂机脚本_UNAの格斗01】会被分割为【通用挂机脚本_UNAの格斗】和【01】
 * 抛弃数字部分，保留文字前缀【通用挂机脚本_UNAの格斗】
 * 将此文件的json内容拷贝至内存中
 * 
 * 然后以startNum和endNum为左右闭区间，不足2位数的补0占位。
 * 从【通用挂机脚本_UNAの格斗】+ startNum 开始写入文件
 * 至【通用挂机脚本_UNAの格斗】+ endNum 结束
 * 将内存中【通用挂机脚本_UNAの格斗01】的json内容全部写入这些文件。
 * 
 * 这样会节约大量时间去写新建小号的json文件。
 */
var fs = require('fs');
var cga = require('./cgaapi')(function () {
	global.cga = cga
	// 要复制的文件内容
	let inputPath = cga.getrootdir() + '\\脚本设置\\通用挂机脚本_UNAの格斗01.json';
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