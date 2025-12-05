# 默认版本号（可通过外部变量覆盖）
MYKPM_VERSION ?= v0.0.0

# KernelPatch 目录路径（默认为当前目录）
ifndef KP_DIR
    KP_DIR = .
endif

# 获取操作系统名称（转换为小写）
OS_NAME = $(shell uname | tr A-Z a-z)
# 获取系统架构
MACHINE = $(shell uname -m)
# 构建主机标签
HOST_TAG = $(OS_NAME)-$(MACHINE)
# macOS ARM64 特殊处理：使用 x86_64 工具链
ifeq ($(HOST_TAG), darwin-arm64)
    HOST_TAG = darwin-x86_64
endif

# NDK 工具链相对路径
NDK_BIN_DIR := toolchains/llvm/prebuilt/$(HOST_TAG)/bin

# 检查 Android NDK 环境变量
ifndef ANDROID_NDK
    $(error ANDROID_NDK is not set. Please set the ANDROID_NDK environment variable to the path of your Android NDK.)
endif

# NDK 工具链路径
NDK_PATH ?= $(ANDROID_NDK)/$(NDK_BIN_DIR)

# 编译器和链接器
CC := $(NDK_PATH)/aarch64-linux-android31-clang
LD := $(NDK_PATH)/ld.lld

# =============================================================================
# 编译配置
# =============================================================================
# 头文件目录列表
INCLUDE_DIRS := . include patch/include linux/include linux/arch/arm64/include linux/tools/arch/arm64/include

# 生成头文件包含标志
INCLUDE_FLAGS := $(foreach dir,$(INCLUDE_DIRS),-I$(KP_DIR)/kernel/$(dir))

# 编译标志
CFLAGS = -Wall -O2 -fno-PIC -fno-asynchronous-unwind-tables -fno-stack-protector -fno-common -DMYKPM_VERSION=\"$(MYKPM_VERSION)$(MYKPM_VER)\"

# =============================================================================
# 构建目标
# =============================================================================
# 构建输出目录
BUILD_DIR := build
# 确保构建目录存在
$(shell mkdir -p $(BUILD_DIR))

# 目标文件列表
objs := $(BUILD_DIR)/spoofuname.o

# 默认目标：构建 KPM 文件
.PHONY: all
all: $(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm

# 链接目标文件生成 KPM 文件
$(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm: ${objs}
	@echo "正在链接 KPM 文件: $@"
	${CC} -r -o $@ $^
	@echo "KPM 文件构建完成: $@"

# 编译 C 源文件为目标文件
$(BUILD_DIR)/%.o: %.c
	@echo "正在编译: $<"
	${CC} $(CFLAGS) $(INCLUDE_FLAGS) -c -O2 -o $@ $<

# =============================================================================
# 安装和清理
# =============================================================================
# 安装 KPM 到 Android 设备
.PHONY: install
install: $(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm
	@echo "正在安装 KPM 到设备..."
	adb wait-for-device
	adb push $(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm /sdcard/
	@echo "KPM 已推送到设备: /sdcard/spoofuname_$(MYKPM_VERSION).kpm"

# 清理构建文件
.PHONY: clean
clean:
	@echo "正在清理构建文件..."
	rm -rf $(BUILD_DIR)
	@echo "清理完成"

# =============================================================================
# 帮助信息
# =============================================================================
.PHONY: help
help:
	@echo "SpoofUname KPM 构建系统"
	@echo ""
	@echo "可用目标:"
	@echo "  all      - 构建 KPM 文件 (默认)"
	@echo "  install  - 构建并安装到 Android 设备"
	@echo "  clean    - 清理构建文件"
	@echo "  help     - 显示此帮助信息"
	@echo ""
	@echo "环境变量:"
	@echo "  MYKPM_VERSION  - 设置 KPM 版本号 (默认: v0.0.0)"
	@echo "  ANDROID_NDK    - Android NDK 路径 (必须设置)"
	@echo "  KP_DIR         - KernelPatch 源码目录 (默认: .)"
