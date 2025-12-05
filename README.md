# SpoofUname
## 简介
使用KernelPatch的内核模块进行Uname信息修改，理论上支持3.18及以上的内核，灵感来源于https://t.me/PrslcChannel/63

**由于作者个人原因，该项目不会被积极开发。**

**警告：**
APM暂不适配SukiSU Ultra，如需使用请手动控制KPM。
## 使用方法
### 通用
1. 下载APM和KPM。
2. 加载/嵌入KPM。
3. 安装APM。
4. 重启（如果在第2步时使用了加载的方式，重启后应重新加载KPM）。
5. 通过APM的Webui进行控制。
### 手动控制KPM
在管理器的KPM页面，点击“参数”并输入命令。

命令清单：

SR \<Release\>   - 修改Release，如“SR 6.1.114514”

SV \<Version\>   - 修改Version，如“SV #1 SMP PREEMPT Wed Aug 20 07:17:20 UTC 2025 aarch64 Toybox”

EN              - 启用模块

DIS             - 关闭模块

## 感谢
[KernelPatch](https://github.com/bmax121/KernelPatch/)： 核心功能。

[APatch_kpm](https://github.com/lzghzr/APatch_kpm)：参考部分代码。
