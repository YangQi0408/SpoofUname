# SpoofUname
## 简介
使用KernelPatch的内核模块进行Uname信息修改，理论上支持3.18及以上的内核，灵感来源于https://t.me/PrslcChannel/63

**由于作者个人原因，该项目不会被积极开发。**

**警告：**
APM暂不适配SukiSU Ultra，如需使用请手动控制KPM。

## 使用方法
### APatch
1. 下载APM和KPM。
2. 加载/嵌入KPM。
3. 安装APM。
4. 重启（如果在第2步时使用了加载的方式，重启后应重新加载KPM）。
5. 通过APM的Webui进行控制。

### WebUI功能
APM提供了一个Web界面，方便用户进行模块控制：

**主要功能：**
- **获取Uname** - 显示当前系统信息
- **设置RELEASE** - 修改内核release信息
- **设置VERSION** - 修改内核version信息
- **获取KPM状态** - 查看模块当前状态和配置
- **模块开关** - 启用/禁用模块功能
- **清除日志** - 清理操作日志文件

**使用步骤：**
1. 在Superkey字段输入认证密钥
2. 在Release/Version字段输入要伪装的信息
3. 使用相应按钮执行操作
4. KPM状态区域会实时显示模块状态
5. 操作结果显示在下方的输出区域

**日志管理：**
- 日志文件位置：`/data/adb/modules/spoof_uname/log/log.txt`
- 所有操作都会记录在日志中，便于调试和问题排查
- 可通过"清除日志"按钮清理日志文件
### 手动控制KPM
在管理器的KPM页面，点击“参数”并输入命令。

命令清单：

SR \<Release\>   - 修改Release，如“SR 6.1.114514”

SV \<Version\>   - 修改Version，如“SV #1 SMP PREEMPT Wed Aug 20 07:17:20 UTC 2025 aarch64 Toybox”

EN              - 启用模块

DIS             - 关闭模块

## 项目结构
```
SpoofUname/
├── README.md                 # 项目说明文档
├── Makefile                  # 构建脚本
├── LICENSE                   # 许可证文件
├── apm/                      # Android Patch Module
│   ├── module.prop           # 模块属性文件
│   ├── cli/                  # 命令行工具
│   │   ├── src/main.c        # CLI源码
│   │   └── Makefile          # CLI构建脚本
│   └── webroot/              # Web界面
│       ├── index.html        # 主页面
│       ├── index.js          # JavaScript逻辑
│       ├── package.json      # 依赖配置
│       └── node_modules/     # 依赖包
├── kpm/                      # Kernel Patch Module
│   ├── spoofuname.c          # KPM源码
│   ├── kernel/               # 内核头文件
│   └── Makefile              # KPM构建脚本
└── build/                    # 构建输出目录
```

## 构建说明
### 环境要求
- Android NDK (用于编译ARM64架构)
- Git
- Make

### 构建步骤
```bash
# 构建所有组件
make all

# 仅构建APM
make apm

# 仅构建KPM
make kpm

# 清理构建文件
make clean
```

### 输出文件
- `build/SpoofUname_APM_*.zip` - APM模块包
- `build/SpoofUname_KPM_*.kpm` - KPM内核模块

## 注意事项
- 修改内核信息可能影响某些应用的兼容性
- 建议在测试环境中先验证功能
- 日志文件会记录所有操作，但不会记录敏感信息（如SuperKey）
- 模块禁用后，uname信息会恢复为原始值
- 请妥善保管SuperKey，切勿泄露给他人

## 感谢
[KernelPatch](https://github.com/bmax121/KernelPatch/)： 核心功能。

[APatch_kpm](https://github.com/lzghzr/APatch_kpm)：参考部分代码。
