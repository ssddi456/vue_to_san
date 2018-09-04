vue to san
=============

try transpile vue source to san.

test cases  will show you the power.

### can not do

* this is a one-way transpile,  cannot do san to vue.
* san's data isnt  observers, modify then will not change view, so event handler in loop need data index.
* vue's powerful event syntax sugars havnt been implement in san now.
* san's template ast interpreter is a subset of javascript and has some syntanx difference, so you should take care.
* custom directives are not support in san

in chinese

* 只能单向转换
* 因为san的数据并不是observer，必须通过san的api修改数据才能在视图上反映，因此在模板的循环过程中，各种方法的入参需要传入index而不是data，这点无法简单通过静态变换搞定，具体可以参考san的demo
* vue的事件绑定语法糖san没有对应的内建支持，需要polify，目前还没有做对应的功能。
* san的模板部分支持的js解释器支持的是js的一个子集，可能和vue略有差别。
* san不支持自定义指令。

### 使用建议

拉一个san分支，生成初始代码，在其上进行修改至可用。后续可以在vue和san之间共享部分model和数据层面的业务逻辑。

### API

* vueToSan.vueHTMLToSanHTML(code)

    转换 vue 的模板为 san 的模板

* vueToSan.vueJsToSanJs(code)

    转换 vue 的调用为 san 的调用

* vueToSan.vueToSan(code)

    转换 vue 的单模块文件为 san 的单模块文件
