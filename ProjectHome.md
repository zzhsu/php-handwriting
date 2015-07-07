基于PHP+MySQL的手写识别输入法。

Demo可以参考如下链接：
http://bbs.zdic.net/handwriting/

数据库可以导入如下文件夹中的数据：
\资料\测试数据

使用工具：帝国备份王(Empirebak)，“默认编码”填入“latin1”，默认数据库名为“hdwg”。

至于算法，可以参考我的QQ空间：
http://user.qzone.qq.com/229547798/blog/1251899904

不过因为考虑到PHP的性能问题，最终在程序中，算法又有了若干简化。

总体来说应该还是算属于SVM机器学习算法的。

理论上支持全部Unicode，甚至包括尚未正式收录的文字。