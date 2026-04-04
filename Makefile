VERSION := v0.8.2
BUILD_DIR := build
APM_DIR := apm
KPM_DIR := kpm

ifndef ANDROID_NDK
    $(error ANDROID_NDK is not set)
endif

FULL_VER := $(shell git rev-list --count HEAD 2>/dev/null)-$(shell git rev-parse --short HEAD 2>/dev/null)
APM_ZIP := $(BUILD_DIR)/SpoofUname_APM_$(VERSION)-$(FULL_VER).zip
KPM_FILE := $(BUILD_DIR)/SpoofUname_KPM_$(VERSION)-$(FULL_VER).kpm

.PHONY: all clean apm kpm kpm-build

all: $(APM_ZIP) $(KPM_FILE)

$(BUILD_DIR):
	mkdir -p $@

apm: $(APM_ZIP)

kpm: $(KPM_FILE)

$(APM_ZIP): $(BUILD_DIR) $(APM_DIR)/cli/build/spoof-uname-cli
	@mkdir -p $(BUILD_DIR)/apm_temp/webroot $(BUILD_DIR)/apm_temp/bin
	@cp $(APM_DIR)/module.prop $(APM_DIR)/customize.sh $(APM_DIR)/post-fs-data.sh $(BUILD_DIR)/apm_temp/
	@sed -i 's/^version=.*/version=$(VERSION)-$(FULL_VER)/' $(BUILD_DIR)/apm_temp/module.prop
	@sed -i 's/^versionCode=.*/versionCode=$(shell echo $(FULL_VER) | cut -d- -f1)/' $(BUILD_DIR)/apm_temp/module.prop
	@cp $(APM_DIR)/webroot/index.html $(APM_DIR)/webroot/index.js $(APM_DIR)/webroot/config.js $(BUILD_DIR)/apm_temp/webroot/
	@cp $(APM_DIR)/cli/build/spoof-uname-cli $(BUILD_DIR)/apm_temp/bin/
	@cd $(BUILD_DIR)/apm_temp && zip -r ../SpoofUname_APM_$(VERSION)-$(FULL_VER).zip .
	@rm -rf $(BUILD_DIR)/apm_temp

$(KPM_FILE): $(BUILD_DIR) | kpm-build
	@cp $(KPM_DIR)/build/spoofuname_*.kpm $@

$(APM_DIR)/cli/build/spoof-uname-cli:
	@$(MAKE) -C $(APM_DIR)/cli

kpm-build:
	@$(MAKE) -C $(KPM_DIR) MYKPM_VERSION=$(VERSION)-$(FULL_VER)

clean:
	@$(MAKE) -C $(APM_DIR)/cli clean
	@$(MAKE) -C $(KPM_DIR) clean
	@rm -rf $(BUILD_DIR)
