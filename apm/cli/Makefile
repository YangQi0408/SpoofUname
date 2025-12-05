# 目标可执行文件名
TARGET   := spoof-uname-cli
# 源代码目录
SRC_DIR  := src
# 头文件目录
INC_DIR  := include
# 构建输出目录
BUILD    := build

# 收集所有源文件
SRCS     := $(foreach d,$(SRC_DIR),$(wildcard $(d)/*.c))
# 生成目标文件列表
OBJS     := $(SRCS:%.c=$(BUILD)/%.o)

# 编译标志
CFLAGS   := -Wall -Wextra -O2 $(patsubst %,-I%,$(INC_DIR)) -MMD
# 链接标志
LDFLAGS  :=

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

# 默认目标：构建 CLI 工具
.PHONY: all
all: $(BUILD)/$(TARGET)

# 链接目标文件生成可执行文件
$(BUILD)/$(TARGET): $(OBJS)
	@echo "正在链接 CLI 工具: $@"
	$(CC) $(LDFLAGS) -o $@ $^
	@echo "CLI 工具构建完成: $@"

# 编译规则：创建目录并编译源文件
$(BUILD)/%.o: %.c | $(BUILD)
	@echo "正在编译: $<"
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

# 创建构建目录
$(BUILD):
	@mkdir -p $(BUILD)

# 清理构建文件
.PHONY: clean
clean:
	@echo "正在清理构建文件..."
	rm -rf $(BUILD)
	@echo "清理完成"

# 安装 CLI 工具到 Android 设备
.PHONY: install
install: $(BUILD)/$(TARGET)
	@echo "正在安装 CLI 工具到设备..."
	adb wait-for-device
	adb push $(BUILD)/$(TARGET) /sdcard/
	adb shell chmod +x /sdcard/$(TARGET)
	@echo "CLI 工具已安装到设备: /sdcard/$(TARGET)"

# 包含自动生成的依赖文件
-include $(OBJS:.o=.d)

.PHONY: help
help:
	@echo "SpoofUname APM CLI 构建系统"
	@echo ""
	@echo "可用目标:"
	@echo "  all      - 构建 CLI 工具 (默认)"
	@echo "  install  - 构建并安装到 Android 设备"
	@echo "  clean    - 清理构建文件"
	@echo "  help     - 显示此帮助信息"
	@echo ""
	@echo "环境变量:"
	@echo "  ANDROID_NDK    - Android NDK 路径 (必须设置)"