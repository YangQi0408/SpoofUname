VERSION := v0.6.0
BUILD_DIR := build
APM_DIR := apm
KPM_DIR := kpm

ifndef ANDROID_NDK
    $(error ANDROID_NDK环境变量未设置)
endif

FULL_VER := $(shell git rev-list --count HEAD 2>/dev/null)-$(shell git rev-parse --short HEAD 2>/dev/null)
APM_ZIP := $(BUILD_DIR)/SpoofUname_APM_$(VERSION)-$(FULL_VER).zip
KPM_FILE := $(BUILD_DIR)/SpoofUname_KPM_$(VERSION)-$(FULL_VER).kpm

.PHONY: all clean apm kpm install install-apm install-kpm kpm-build restore-version

all: $(APM_ZIP) $(KPM_FILE) restore-version

$(BUILD_DIR):
	mkdir -p $@

apm: $(APM_ZIP)

kpm: $(KPM_FILE)

$(APM_ZIP): $(BUILD_DIR) $(APM_DIR)/cli/build/spoof-uname-cli | update-version
	@mkdir -p $(BUILD_DIR)/apm_temp/webroot $(BUILD_DIR)/apm_temp/bin
	@cp $(APM_DIR)/module.prop $(APM_DIR)/customize.sh $(APM_DIR)/service.sh $(BUILD_DIR)/apm_temp/
	@cp $(APM_DIR)/webroot/{index.html,index.js,config.js} $(BUILD_DIR)/apm_temp/webroot/
	@cp $(APM_DIR)/cli/build/spoof-uname-cli $(BUILD_DIR)/apm_temp/bin/
	@cd $(BUILD_DIR)/apm_temp && zip -r ../SpoofUname_APM_$(VERSION)-$(FULL_VER).zip .
	@rm -rf $(BUILD_DIR)/apm_temp

$(KPM_FILE): $(BUILD_DIR) | update-version kpm-build
	@cp $(KPM_DIR)/build/spoofuname_*.kpm $@

$(APM_DIR)/cli/build/spoof-uname-cli:
	@$(MAKE) -C $(APM_DIR)/cli

kpm-build:
	@$(MAKE) -C $(KPM_DIR) MYKPM_VERSION=$(FULL_VER)

update-version:
	@cp $(APM_DIR)/module.prop $(APM_DIR)/module.prop.bak
	@sed -i 's/^version=.*/version=$(VERSION)-$(FULL_VER)/' $(APM_DIR)/module.prop
	@sed -i 's/^versionCode=.*/versionCode=$(shell echo $(FULL_VER) | cut -d- -f1)/' $(APM_DIR)/module.prop

restore-version:
	@mv -f $(APM_DIR)/module.prop.bak $(APM_DIR)/module.prop 2>/dev/null || true

install-apm: $(APM_ZIP)
	adb wait-for-device && adb push $(APM_ZIP) /sdcard/

install-kpm: $(KPM_FILE)
	adb wait-for-device && adb push $(KPM_FILE) /sdcard/

install: install-apm install-kpm

clean:
	@$(MAKE) -C $(APM_DIR)/cli clean
	@$(MAKE) -C $(KPM_DIR) clean
	@rm -rf $(BUILD_DIR) $(APM_DIR)/module.prop.bak

help:
	@echo "SpoofUname 构建系统"
	@echo "  all          - 构建所有 (默认)"
	@echo "  apm          - 仅构建APM"
	@echo "  kpm          - 仅构建KPM"
	@echo "  install      - 安装所有到设备"
	@echo "  install-apm  - 仅安装APM到设备"
	@echo "  install-kpm  - 仅安装KPM到设备"
	@echo "  clean        - 清理所有构建文件"
	@echo "  restore-version - 恢复module.prop原始版本"
	@echo "  help         - 显示此帮助信息"