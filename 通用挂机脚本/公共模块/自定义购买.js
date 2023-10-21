/**
 * UNAecho:定义一个自定义购买的常用数据
 * 其中level可自定义等级，视为购买的困难程度，请自行定义。难度在1-10均可。
 * 此数据影响智能制造和采集的所有选择倾向，如果你不知道如何定义，请不要修改此level的数据。
 * 推荐level数值的衡量标准：
 * 1、人物所需等级的限制，如杰诺瓦镇限制过海等级，那么一些线的的购买肯定不能是1级。
 * 2、也可以参考采集技能所定义的物品的等级，但有的物品过早地可以购买，如狩猎5级的胡椒，伊尔村可以购买。狩猎6级的砂糖，维诺亚村可以购买。
 */
var mineArray = [
	{
		level: 1,
		name: '铜',
		display_name: '铜艾夏岛',
		func: (cb) => {
			cga.travel.newisland.toStone('D', () => {
				cga.travel.autopilot('画廊', cb)
			});
		}
	},
];

var cga = global.cga;

var thisobj = {
	func: (cb) => {
		thisobj.object.func(cb);
	},
	check_done: () => {
		return cga.getInventoryItems().length >= 20
	},
	translate: (pair) => {
		return false;
	},
	loadconfig: (obj) => {
		return true;
	},
	inputcb: (cb) => {
		cb(null)
	},
	init: () => {

	}
}

module.exports = thisobj;
module.exports.mineArray = mineArray;