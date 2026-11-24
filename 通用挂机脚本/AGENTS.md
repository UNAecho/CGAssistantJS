# 通用挂机脚本目录索引

- path: `../通用挂机脚本.js`
  desc: 助手加载的入口，读取当前角色配置、装配插件并启动主插件
  doc: 

- path: `主插件/`
  desc: 控制练级、采集、制造等主流程，从所选插件的 execute 开始
  doc:

- path: `子插件/`
  desc: 通过 init、prepare、think 等钩子参与主流程，如自动存取和回补提醒
  doc:

- path: `公共模块/`
  desc: 多个插件按需引用的组队、补给、战斗配置等实现
  doc:
