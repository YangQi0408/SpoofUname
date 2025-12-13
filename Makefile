# 项目版本号
VERSION := v0.1.0
# 构建输出目录
BUILD_DIR := build

# APM (Android Patch Module) 目录
APM_DIR := apm
# KPM (Kernel Patch Module) 目录  
KPM_DIR := kpm

# 检查 Android NDK 环境变量是否设置
ifndef ANDROID_NDK
    $(error ANDROID_NDK环境变量未设置。请设置ANDROID_NDK环境变量指向Android NDK路径)
endif

# 最终生成的文件路径
APM_ZIP := $(BUILD_DIR)/SpoofUname_APM_$(VERSION)-$(shell git rev-list --count HEAD 2>/dev/null || echo 1)-$(shell git rev-parse --short HEAD 2>/dev/null || echo unknown).zip
KPM_FILE := $(BUILD_DIR)/SpoofUname_KPM_$(VERSION)-$(shell git rev-list --count HEAD 2>/dev/null || echo 1)-$(shell git rev-parse --short HEAD 2>/dev/null || echo unknown).kpm

# 声明伪目标（不对应实际文件）
.PHONY: all clean apm kpm install install-apm install-kpm update-version restore-version kpm-build

# 默认目标：构建所有模块（APM ZIP 和 KPM 文件）
all: update-version $(APM_ZIP) $(KPM_FILE) restore-version

# 创建构建目录
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

# 仅构建 APM
apm: $(APM_ZIP)

# 仅构建 KPM
kpm: $(KPM_FILE)

# 构建 APM ZIP 包：包含 module.prop、webroot 和 CLI 工具
$(APM_ZIP): $(BUILD_DIR) $(APM_DIR)/cli/build/spoof-uname-cli
	@echo "正在构建APM ZIP..."
	@mkdir -p $(BUILD_DIR)/apm_temp
	# 复制模块属性文件
	@cp $(APM_DIR)/module.prop $(BUILD_DIR)/apm_temp/
	# 复制 Web 界面文件
	@mkdir -p $(BUILD_DIR)/apm_temp/webroot
	@cp $(APM_DIR)/webroot/index.html $(BUILD_DIR)/apm_temp/webroot/
	@cp $(APM_DIR)/webroot/index.js $(BUILD_DIR)/apm_temp/webroot/
	# 复制 CLI 工具
	@mkdir -p $(BUILD_DIR)/apm_temp/bin
	@cp $(APM_DIR)/cli/build/spoof-uname-cli $(BUILD_DIR)/apm_temp/bin/
	# 打包成 ZIP 文件
	@cd $(BUILD_DIR)/apm_temp && zip -r ../SpoofUname_APM_$(VERSION)-`cat $(CURDIR)/.full_version`.zip .
	@rm -rf $(BUILD_DIR)/apm_temp
	@echo "APM ZIP文件已生成: $(APM_ZIP)"

# 复制 KPM 文件到构建目录
$(KPM_FILE): $(BUILD_DIR) kpm-build
	@echo "正在复制KPM文件..."
	@cp $(KPM_DIR)/build/spoofuname_*.kpm $(KPM_FILE)
	@echo "KPM文件已生成: $(KPM_FILE)"

# 构建 APM CLI 工具（依赖子目录的 Makefile）
$(APM_DIR)/cli/build/spoof-uname-cli:
	@echo "正在构建APM CLI工具..."
	@cd $(APM_DIR)/cli && $(MAKE)

# 构建 KPM（依赖子目录的 Makefile）
kpm-build:
	@echo "正在构建KPM..."
	@cd $(KPM_DIR) && MYKPM_VERSION=`cat $(CURDIR)/.full_version` $(MAKE)

# 更新 APM 版本信息：备份原文件，更新版本号和 commit 数量
update-version:
	@echo "正在更新版本信息..."
	@cp $(APM_DIR)/module.prop $(APM_DIR)/module.prop.bak
	# 获取 git commit 数量
	@echo "正在获取commit数量..."
	@git rev-list --count HEAD 2>/dev/null > .commit_count || echo "1" > .commit_count
	# 获取当前 commit 哈希（前7位）
	@git rev-parse --short HEAD 2>/dev/null > .commit_hash || echo "unknown" > .commit_hash
	# 生成完整版本号格式：v0.0.1-<commit数量>-<commit哈希>
	@echo "正在生成完整版本号..."
	@echo "VERSION: $(VERSION)"
	@echo "COMMIT_COUNT: "`cat .commit_count`
	@echo "COMMIT_HASH: "`cat .commit_hash`
	@sed -i 's/^version=.*/version=$(VERSION)-'`cat .commit_count`'-'`cat .commit_hash`'/' $(APM_DIR)/module.prop
	@sed -i 's/^versionCode=.*/versionCode='`cat .commit_count`'/' $(APM_DIR)/module.prop
	@echo "版本号已更新"
	# 保存完整版本号到临时文件供KPM构建使用
	@echo "$(VERSION)-"`cat .commit_count`"-"`cat .commit_hash` > .full_version
	@echo "APM版本已更新为: $(VERSION)-"`cat .commit_count`"-"`cat .commit_hash`, versionCode已设置为: "`cat .commit_count`"
	@rm -f .commit_count .commit_hash

# 恢复 APM 的原始 versionCode
restore-version:
	@if [ -f $(APM_DIR)/module.prop.bak ]; then \
		mv $(APM_DIR)/module.prop.bak $(APM_DIR)/module.prop; \
		echo "APM版本已恢复"; \
	fi
	@rm -f .full_version

# 将 APM ZIP 包推送到 Android 设备
install-apm: $(APM_ZIP)
	@echo "正在安装APM..."
	adb wait-for-device
	adb push $(APM_ZIP) /sdcard/
	@echo "APM已推送到设备: /sdcard/SpoofUname_APM_$(VERSION)-"`cat $(CURDIR)/.full_version`.zip"

# 将 KPM 文件推送到 Android 设备
install-kpm: $(KPM_FILE)
	@echo "正在安装KPM..."
	adb wait-for-device
	adb push $(KPM_FILE) /sdcard/
	@echo "KPM已推送到设备: /sdcard/SpoofUname_KPM_$(VERSION)-"`cat $(CURDIR)/.full_version`.kpm"

# 安装所有到 Android 设备
install: install-apm install-kpm

# 清理所有构建文件和临时文件
clean:
	@echo "正在清理构建文件..."
	# 清理子目录的构建文件
	@cd $(APM_DIR)/cli && $(MAKE) clean
	@cd $(KPM_DIR) && $(MAKE) clean
	# 删除构建目录和备份文件
	@rm -rf $(BUILD_DIR)
	@rm -f $(APM_DIR)/module.prop.bak
	@echo "清理完成"

# 显示帮助信息
help:
	@echo "SpoofUname 构建系统"
	@echo "可用目标:"
	@echo "  all          - 构建所有 (默认)"
	@echo "  apm          - 仅构建APM"
	@echo "  kpm          - 仅构建KPM"
	@echo "  install      - 安装所有到设备"
	@echo "  install-apm  - 仅安装APM到设备"
	@echo "  install-kpm  - 仅安装KPM到设备"
	@echo "  update-version - 更新版本信息"
	@echo "  restore-version - 恢复版本信息"
	@echo "  clean        - 清理所有构建文件"
	@echo "  help         - 显示此帮助信息"