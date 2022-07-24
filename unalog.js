//log 日志操作封装
var fs = require('fs');
var path = require('path');
var util = require('util');

var now = new Date();
var filePath = path.join(__dirname, '/unalog/');
var file = filePath + util.format('%s%s%s.txt', now.getFullYear(), now.getMonth() + 1, now.getDate());

//文件夹处理
if (fs.existsSync(filePath) == false) {
    fs.mkdirSync(filePath);
}

//定义静态对象
var log = {
    //写入文字
    write: (content, callback) => {
        var writeable = fs.createWriteStream(file, {
            flags: 'a+',
            defaultEncoding: 'utf8'
        });
        writeable.on('finish', () => {
            if (callback) callback();
        });
        writeable.on('error', err => {
            console.info('写入异常,' + err);
        });
        writeable.write(content);
        //结束写入
        writeable.end();
    },
    //写入一行
    writeLine: (content, callback) => {
        content += '\r\n';
        log.write(content, callback);
    },
    //测试写入
    debug: (content, callback) => {
        var now = new Date();
        content = now.toLocaleString() + '：' + content;
        log.writeLine(content, callback);
    }
}

module.exports = log;