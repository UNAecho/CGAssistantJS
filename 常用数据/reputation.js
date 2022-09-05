// 声望信息，返回传入当前声望需要使用多少次得意技才能提升一个阶段。
// 注意本功能是按照当前声望最小值来计算，因为没有办法获取当前确切声望值是多少。
// 例如，当前是【呢喃的歌声】，那么脚本无视你当前多少声望，一律按照计算【呢喃的歌声】最低值【10000】到【地上的月影】最低值【20000】来计算。也就是需要使用1000次得意技（传教和咒术一次得意技10声望）

const reputationList = [
	{
		reputation: '恶人',
		min: -1,
		max: -3000,
	}, 
	{
		reputation: '忌讳的人',
		min: -2999,
		max: -2000,
	}, 
	{
		reputation: '受挫折的人',
		min: -1999,
		max: -1000,
	}, 
	{
		reputation: '无名的旅人',
		min: -999,
		max: 1999,
	}, {
		reputation: '路旁的落叶',
		min: 2000,
		max: 4999,
	}, {
		reputation: '水面上的小草',
		min: 5000,
		max: 9999,
	},{
		reputation: '呢喃的歌声',
		min: 10000,
		max: 19999,
	},{
		reputation: '地上的月影',
		min: 20000,
		max: 32999,
	},{
		reputation: '奔跑的春风',
		min: 33000,
		max: 49999,
	},{
		reputation: '苍之风云',
		min: 50000,
		max: 69999,
	},{
		reputation: '摇曳的金星',
		min: 70000,
		max: 99999,
	},{
		reputation: '欢喜的慈雨',
		min: 100000,
		max: 129999,
	},{
		reputation: '蕴含的太阳',
		min: 130000,
		max: 159999,
	},{
		reputation: '敬畏的寂静',
		min: 160000,
		max: 199999,
	},{
		reputation: '无尽星空',
		min: 200000,
		max: 999999,
	},
];
/**
 * 注意，【采集】、【制造】、【医生护士鉴定武修防修仙人侦探】虽然共用称号，但是需要的声望数量不同，采集声望需要最少，医生护士鉴定等声望需要最多，故使用医生护士的声望参考，以免过低。
 */
const productReputationList = [
	{
		reputation: '恶人',
		min: -1,
		max: -3000,
	}, 
	{
		reputation: '忌讳的人',
		min: -2999,
		max: -2000,
	}, 
	{
		reputation: '受挫折的人',
		min: -1999,
		max: -1000,
	}, 
	{
		reputation: '无名的旅人',
		min: -999,
		max: 1999,
	}, {
		reputation: '迈步前进者',
		min: 2000,
		max: 3999,
	}, {
		reputation: '追求技巧的人',
		min: 4000,
		max: 5999,
	},{
		reputation: '刻于新月之铭',
		min: 6000,
		max: 8999,
	},{
		reputation: '掌上的明珠',
		min: 9000,
		max: 12999,
	},{
		reputation: '敬虔的技巧',
		min: 13000,
		max: 18999,
	},{
		reputation: '踏入神的领域',
		min: 19000,
		max: 26999,
	},{
		reputation: '贤者',
		min: 27000,
		max: 36999,
	},{
		reputation: '神匠',
		min: 37000,
		max: 46999,
	},{
		reputation: '摘星的技巧',
		min: 47000,
		max: 56999,
	},{
		reputation: '万物创造者',
		min: 57000,
		max: 69999,
	},{
		reputation: '持石之贤者',
		min: 70000,
		max: 999999,
	},
];
var calculate =(inputreputation,percentage) => {
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

module.exports.skillCount = function(inputreputation,percentage) {
	var result = 0
	if(inputreputation == null){
		inputreputation ='路旁的落叶'
		console.log('inputreputation = null ,请注意称号是否有问题，现在默认从【路旁的落叶】开始刷')
		result = calculate(inputreputation,percentage)
	}else if(inputreputation == '无尽星空'){
		console.log('result返回0，都无尽星空了还刷神马。。')
		return result
	}
	else{
		result = calculate(inputreputation,percentage)
	}
	return result;
};

module.exports.getReputation = function(titles) {
	// 如果是异常称号，返回树旁的落叶默认
	var defaultReputation = '路旁的落叶'
	reputationList.forEach(p => {
		for(var i in titles){
			if(titles[i].length == 0){
				continue
			}
			if(titles[i] == p.reputation){
				defaultReputation = titles[i];
				break
			}
		}
	});
	return defaultReputation
}

module.exports.getProductReputationLv = function(titles) {
	var index = null
	for (let i = 0; i < productReputationList.length; i++) {
		for(var t in titles){
			if(titles[t].length == 0){
				continue
			}
			if(titles[t] == productReputationList[i].reputation){
				index = i
				break
			}
		}
	}
	if(index == null){
		throw new Error('称号输入错误,无法查询生产称号等级，请检查')
	}
	return index
}