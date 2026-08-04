# SpoofUname

使用 KernelPatch 的内核模块进行 Uname 信息修改，理论上支持 3.18 及以上的内核。

灵感来源于 [PrslcChannel](https://t.me/PrslcChannel/63)

> **由于作者个人原因，该项目不会被积极开发。**

## 兼容性

理论上支持所有 KernelPatch 和 Root 实现。

## 使用方法

1. 下载 APM 和 KPM
2. 加载/嵌入 KPM
3. 安装 APM
4. 重启（如果在第 2 步时使用了加载的方式，重启后应重新加载 KPM）
5. 通过 APM 的 WebUI 进行控制

> 如果需要使用开机自启就必须嵌入 KPM。

### WebUI 功能

APM 提供了一个 WebUI 界面，方便用户进行模块控制：

**主要功能：**

- **模块开关** — 启用/禁用 Uname 伪装，即时生效
- **设置 RELEASE / VERSION** — 修改内核 release / version 信息
- **还原为设备原值** — 单独清除某个字段的伪装，恢复该字段的设备原始值（另一字段不受影响）
- **获取 Uname** — 显示当前系统信息（`uname -a`）
- **实时状态** — 顶部展示模块启用状态与当前生效的 release / version
- **开机自启** — 重启后自动重放配置（需嵌入 KPM）
- **启动阶段** — 选择开机注入在 `service`（默认，兼容性好）或 `post-fs-data` 阶段执行
- **操作日志** — 查看 / 清除操作日志

**使用步骤：**

1. 在 Release / Version 字段输入要伪装的信息，失焦后自动应用并保存
2. 点击字段旁的还原按钮可将该字段恢复为设备原值
3. 顶部状态区实时显示模块状态与当前生效值

**日志管理：**

- 日志文件位置：`/data/adb/modules/spoof_uname/log/log.txt`
- 所有操作都会记录在日志中，便于调试和问题排查
- 可通过日志卡片的清除按钮清理日志文件

### 手动控制 KPM

在管理器的 KPM 页面，点击"参数"并输入命令：

| 命令           | 说明                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| `SR <Release>` | 修改 Release，如 `SR 6.1.114514`                                                 |
| `SV <Version>` | 修改 Version，如 `SV #1 SMP PREEMPT Wed Aug 20 07:17:20 UTC 2025 aarch64 Toybox` |
| `CR`           | 清除 Release 伪装，恢复设备原值                                                  |
| `CV`           | 清除 Version 伪装，恢复设备原值                                                  |
| `EN`           | 启用模块                                                                         |
| `DIS`          | 关闭模块                                                                         |

## 项目结构

```
SpoofUname/
├── Makefile                   # 顶层构建脚本
├── .gitmodules                # 子模块配置
├── LICENSE                    # 许可证文件
├── apm/                       # Android Patch Module
│   ├── module.prop            # 模块属性文件
│   ├── customize.sh           # 安装脚本
│   ├── spoof-common.sh        # 开机注入共享逻辑
│   ├── post-fs-data.sh        # post-fs-data 阶段入口
│   ├── service.sh             # service 阶段入口（默认）
│   ├── cli/                   # 命令行工具
│   │   ├── src/main.c
│   │   └── Makefile
│   └── webroot/               # WebUI 界面（Vite + Material Web）
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       └── src/               # main.js / ksu.js / style.css
├── common.h                   # KPM 和 APM 共享的头文件
├── kpm/                       # Kernel Patch Module
│   ├── spoofuname.c           # KPM 核心源码
│   └── Makefile               # KPM 构建脚本
├── third_party/               # 第三方依赖
│   └── KernelPatch/           # KernelPatch 子模块
├── .github/workflows/         # CI 工作流
│   └── build.yml
└── build/                     # 构建输出目录
```

> `third_party/KernelPatch` 为 git 子模块，克隆后需执行 `git submodule update --init --recursive`。
> WebUI 为 Vite 项目，构建 APM 时会自动执行 `npm ci && npm run build`（需 Node/npm）。

## 构建说明

### 环境要求

- **Android NDK**（用于编译 ARM64 架构）
- **Node.js / npm**（用于构建 WebUI）
- Git
- Make

### 构建步骤

```bash
# 克隆仓库并初始化子模块
git clone --recursive https://github.com/<your-repo>/SpoofUname
cd SpoofUname

# 构建所有组件（同时产出无日志和带日志两个 KPM 版本）
ANDROID_NDK=/path/to/ndk make

# 仅构建 APM
ANDROID_NDK=/path/to/ndk make apm

# 仅构建 KPM（无日志）
ANDROID_NDK=/path/to/ndk make kpm-release

# 仅构建 KPM（带日志）
ANDROID_NDK=/path/to/ndk make kpm-debug

# 清理构建文件
make clean
```

### 输出文件

| 文件                               | 说明                                 |
| ---------------------------------- | ------------------------------------ |
| `build/SpoofUname_APM_*.zip`       | APM 模块包（CLI + WebUI + 启动脚本） |
| `build/SpoofUname_KPM_*.kpm`       | KPM 内核模块（无日志，适合日常使用） |
| `build/SpoofUname_KPM_debug_*.kpm` | KPM 内核模块（带日志，用于调试）     |

> DEBUG 版本会输出内核日志到 `dmesg`，便于开发调试。**请勿在正式环境中使用 DEBUG 版本**，大量日志可能导致 `logd` 内存持续增长。

### 通过 GitHub Actions 构建

推送至 `main` 分支时，CI 会自动构建并发布 Pre-release，产物为原始文件，无额外 zip 层。

## 注意事项

- 修改内核信息可能影响某些应用的兼容性
- 建议在测试环境中先验证功能
- 日志文件会记录所有操作，便于调试和问题排查
- 模块禁用后，uname 信息会恢复为原始值；也可用还原功能（WebUI 按钮或 `CR`/`CV` 命令）单独还原某个字段
- 配置文件位于：`/data/adb/modules/spoof_uname/config.sh`
- 开机自启功能必须**嵌入** KPM
- 开机注入默认在 `service` 阶段执行；若个别设备在 `post-fs-data` 阶段注入会卡开机，可在 WebUI 切换启动阶段（配置项 `boot_stage`）

## 技术原理

SpoofUname 通过 KPM（Kernel Patch Module）利用 KernelPatch 框架的 inline hook 机制，劫持 `uname` 系统调用，在内核态直接替换返回缓冲区中的 release 和 version 字段。控制指令通过复用 `reboot` 系统调用的参数空间进行通信。

## 感谢

- [KernelPatch](https://github.com/bmax121/KernelPatch/) — 核心框架
- [APatch_kpm](https://github.com/lzghzr/APatch_kpm) — 参考代码
