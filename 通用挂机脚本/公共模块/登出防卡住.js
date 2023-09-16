var cga = global.cga;
var configTable = global.configTable;

var thisobj = {
	readyToLogBack: false,
	callbackAfterLogBack: null,
	// 将触发单词的转化为监听喊话的内容，根据输入不同的触发单词，实现监听不同内容
	trigger : {
		'logback':'登出防卡住',
		'logback_forced':'登出回避',
	},
	// 初始化监听登出，并且需要在里面写入自定义的登出逻辑
	init: () => {
		cga.waitForChatInput((msg) => {

			if (msg.indexOf('登出防卡住') >= 0 && cga.isInNormalState() && thisobj.readyToLogBack == true) {
				thisobj.readyToLogBack = false;
				cga.logBack(thisobj.callbackAfterLogBack);
				thisobj.callbackAfterLogBack = null;
			}
			// UNAecho:强制登出，多数用于战斗时回避特定敌人
			if (msg.indexOf('登出回避') >= 0 && thisobj.readyToLogBack == true) {
				thisobj.readyToLogBack = false;
				cga.logBack(thisobj.callbackAfterLogBack);
				thisobj.callbackAfterLogBack = null;
			}

			return true;
		});
	},
	// UNAecho:加入触发单词trigger，默认为normal，如果输入强制登出等其它单词，会触发不同的登出逻辑。
	func: (cb,triggerStr='logback') => {
		if(!thisobj.trigger[triggerStr]){
			console.warn('【UNAecho脚本警告】:你输入的触发单词:'+triggerStr+'没有对应逻辑，使用默认登出方式')
			triggerStr='logback'
		}
		thisobj.readyToLogBack = true;
		thisobj.callbackAfterLogBack = cb;

		var retry = () => {
			if (thisobj.readyToLogBack && thisobj.callbackAfterLogBack) {
				cga.SayWords(thisobj.trigger[triggerStr], 0, 3, 1);
				setTimeout(retry, 1000);
			}
		}

		retry();
	},
	translate: (pair) => {
		return false;
	},
	loadconfig: (obj, cb) => {
		return true;
	},
	inputcb: (cb) => {
		cb(null);
	}
}

module.exports = thisobj;