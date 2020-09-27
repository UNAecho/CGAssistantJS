// 声望信息，返回传入当前声望需要使用多少次得意技才能提升一个阶段。
// 注意本功能是按照当前声望最小值来计算，因为没有办法获取当前确切声望值是多少。
// 例如，当前是【呢喃的歌声】，那么脚本无视你当前多少声望，一律按照计算【呢喃的歌声】最低值【10000】到【地上的月影】最低值【20000】来计算。也就是需要使用1000次得意技（传教和咒术一次得意技10声望）

const { forEach } = require("async");

const skillInfo = [
	{
		name: '补血魔法',
		eachlvcost : 30,
		slotsize: 1,
	},{
		name: '调教',
		eachlvcost : 0,
		slotsize: 1,
	},{
		name: '宠物强化',
		eachlvcost : 0,
		slotsize: 1,
	}
];
const calculate =(inputreputation,percentage) => {
	let count = 0;
	reputationList.forEach(p => {
		if(p.reputation == inputreputation){
			// 如果传入了当前声望百分比，那么就粗略按照已有百分比计算，节约时间与金钱
			if(percentage !=null && parseFloat(percentage) > 0 && parseFloat(percentage) < 1){
				count = Math.ceil((p.max - p.min) * parseFloat(1-percentage) / 10)
			}else{
				// 向上取整
				count = Math.ceil((p.max - p.min) / 10)
			}
		}else{
			//foreach 不支持continue、break效果，continue可以直接return，break不可以实现
			return 
		}
	});
	return count;
};

module.exports = {
    skillsList: function() {
		return skillInfo
	},
    skillInfo: function(inputname) {
		var result = null
		skillInfo.forEach(s =>{
			if(s.name == inputname){
				result = s
			}else{
				//foreach的return是continue的意思
				return
			}
		})
		return result
	}
}