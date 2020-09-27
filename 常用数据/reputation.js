// 声望信息，返回传入当前声望需要使用多少次得意技才能提升一个阶段。
// 注意本功能是按照当前声望最小值来计算，因为没有办法获取当前确切声望值是多少。
// 例如，当前是【呢喃的歌声】，那么脚本无视你当前多少声望，一律按照计算【呢喃的歌声】最低值【10000】到【地上的月影】最低值【20000】来计算。也就是需要使用1000次得意技（传教和咒术一次得意技10声望）

const reputationList = [
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

module.exports = function(inputreputation,percentage) {
	var result = 0
	if(inputreputation == null){
		throw new Error('必须传入当前声望，否则无法计算')
	}else if(inputreputation == '无尽星空'){
		console.log('result返回0，都无尽星空了还刷神马。。')
		return result
	}
	else{
		result = calculate(inputreputation,percentage)
	}
	return result;
};
