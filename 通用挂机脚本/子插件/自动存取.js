var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	// 属性名称字典
	typeProperty : {
		'item': '道具',
		'gold': '金币',
		'pet': '宠物',
	},
	refreshOrder: () => {
		let orderArr = []

		for (let k in thisobj.autoSaveAndDraw) {
			for (let obj of thisobj.autoSaveAndDraw[k]) {
				let curCount = null
				if(k == 'item'){
					curCount = cga.getItemCount(obj.name)
				}else if(k == 'gold'){
					curCount = cga.GetPlayerInfo().gold
				}else if(k == 'pet'){
					curCount = cga.getPetCount(obj.name)
				}

				if(curCount == null){
					throw new Error('获取数量有误，请检查。')
				}

				if(obj.upper != null && curCount > obj.upper){
					orderArr.push({
						name : obj.name,
						type : k,
						tradeType : 'save',
						count : curCount - obj.upper,
					})
				}else if(obj.lower != null && curCount < obj.lower){
					orderArr.push({
						name : obj.name,
						type : k,
						tradeType : 'draw',
						count : obj.lower - curCount,
					})
				}
				
			}
		}
		return orderArr
	},
	prepare: (cb) => {
		console.log(thisobj.refreshOrder())
		return
	},
	/**
	 * UNAecho:
	 * 自动存取多数都会在城镇内的prepare单人环节进行。
	 * 为了节约性能，think暂不做监控。如有需要请自行修改。
	 */
	think: (ctx) => {
		return
	},
	loadconfig: (obj) => {
		let property = ['name', 'upper', 'lower',]

		if (typeof obj.autoSaveAndDraw == 'object') {
			for (let k in obj.autoSaveAndDraw) {
				if (Object.keys(thisobj.typeProperty).indexOf(k) == -1) {
					console.error('读取配置：自动存取失败！类型' + k + '有误，请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
				if (!obj.autoSaveAndDraw[k] instanceof Array) {
					console.error('读取配置：自动存取失败！' + k + '的value必须为Array，请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
				let arr = obj.autoSaveAndDraw[k]
				if (arr instanceof Array) {
					for (let o of arr) {
						for (let p of property) {
							if (!o.hasOwnProperty(p)) {
								console.error('读取配置：自动存取失败！数据格式有误，属性', property, '必须全部具备。请删除游戏角色对应脚本设置中的json文件，重新运行。');
								return false
							}
						}
					}
				}else{
					console.error('读取配置：自动存取失败！数据格式有误，',Object.keys(thisobj.typeProperty),'所对应的value值必须为Array类型。请删除游戏角色对应脚本设置中的json文件，重新运行。');
					return false
				}
			}
		} else {
			console.error('读取配置：自动存取失败！数据格式有误，请删除游戏角色对应脚本设置中的json文件，重新运行。');
			return false
		}
		thisobj.autoSaveAndDraw = obj.autoSaveAndDraw
		return true;
	},
	inputcb: (cb) => {

		let stage = (obj, cb) => {
			let sayString = null
			let property = {
				'item': '道具',
				'gold': '金币',
				'pet': '宠物',
			}

			for (let k of Object.keys(property)) {
				if (!obj.hasOwnProperty(k)) {
					obj[k] = []
					let inputLoop = (cb) => {
						// 金币不需要输入内容，直接进入上下限环节
						if (k == 'gold') {
							sayString = '【自动存取】请输入是否监测' + property[k] + '的上下限，0不监视1监视。';
							cga.sayLongWords(sayString, 0, 3, 1);

							cga.waitForChatInput((msg, value) => {
								if (value == 0) {
									stage(obj, cb)
									return false
								} else if (value == 1) {
									limit({
										name: '金币',
									}, (r) => {
										obj[k].push(r)
										stage(obj, cb)
									})
									return false
								}
								return true;
							});
							return
						}
						sayString = '【自动存取】请输入' + property[k] + '的监测内容。输入ok结束当前[' + property[k] + ']循环。';
						cga.sayLongWords(sayString, 0, 3, 1);

						cga.waitForChatInput((msg, value) => {
							if (msg && msg == 'ok') {
								stage(obj, cb)
								return false
							} else if (msg && msg.indexOf('输入') == -1) {
								let tmpObj = {
									name: msg,
								}
								sayString = '当前已输入: [' + msg + ']';
								cga.sayLongWords(sayString, 0, 3, 1);
								setTimeout(limit, 1000, tmpObj, (r) => {
									obj[k].push(r)
									inputLoop(cb)
								})
								return false
							}
							return true;
						});
						return
					}
					inputLoop(cb)
					return
				}
			}
			thisobj.autoSaveAndDraw = obj
			configTable.autoSaveAndDraw = obj
			cb(null)
			return
		}

		let limit = (obj, cb) => {
			let sayString = null
			let property = {
				'upper': '上限',
				'lower': '下限',
			}

			for (let k of Object.keys(property)) {
				if (!obj.hasOwnProperty(k)) {
					sayString = '【自动存取】请输入数量' + property[k] + '。输入ok则视为不限制';
					cga.sayLongWords(sayString, 0, 3, 1);
					cga.waitForChatInput((msg, value) => {
						if (msg && msg == 'ok') {
							sayString = '当前已选择: [不限制]';
							cga.sayLongWords(sayString, 0, 3, 1);

							obj[k] = null
							setTimeout(limit, 1000, obj, cb)
							return false
						} else if (value >= 0) {
							sayString = '当前已输入: [' + value + ']';
							cga.sayLongWords(sayString, 0, 3, 1);

							obj[k] = value
							setTimeout(limit, 1000, obj, cb)
							return false
						}
						return true;
					});
					return
				}
			}
			cb(obj)
			return
		}

		let inputObj = {}
		stage(inputObj, cb)
		return
	}
};

module.exports = thisobj;