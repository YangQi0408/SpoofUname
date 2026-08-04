VERSION := v1.0.0
BUILD_DIR := build
APM_DIR := apm
KPM_DIR := kpm

ifndef ANDROID_NDK
    $(error ANDROID_NDK is not set)
endif

FULL_VER := $(shell git rev-list --count HEAD 2>/dev/null)-$(shell git rev-parse --short HEAD 2>/dev/null)
APM_ZIP := $(BUILD_DIR)/SpoofUname_APM_$(VERSION)-$(FULL_VER).zip
KPM_FILE := $(BUILD_DIR)/SpoofUname_KPM_$(VERSION)-$(FULL_VER).kpm
KPM_DEBUG_FILE := $(BUILD_DIR)/SpoofUname_KPM_debug_$(VERSION)-$(FULL_VER).kpm

.PHONY: all clean apm kpm kpm-release kpm-debug

all: $(APM_ZIP) $(KPM_FILE) $(KPM_DEBUG_FILE)

$(BUILD_DIR):
	mkdir -p $@

apm: $(APM_ZIP)

kpm: $(KPM_FILE)

kpm-release: $(KPM_FILE)

kpm-debug: $(KPM_DEBUG_FILE)

$(APM_DIR)/webroot/dist/index.html: $(APM_DIR)/webroot/index.html $(APM_DIR)/webroot/vite.config.js $(APM_DIR)/webroot/package.json $(wildcard $(APM_DIR)/webroot/src/*)
	@cd $(APM_DIR)/webroot && npm ci && npm run build

$(APM_ZIP): $(BUILD_DIR) $(APM_DIR)/cli/build/spoof-uname-cli $(APM_DIR)/webroot/dist/index.html
	@mkdir -p $(BUILD_DIR)/apm_temp/webroot $(BUILD_DIR)/apm_temp/bin
	@cp $(APM_DIR)/module.prop $(APM_DIR)/customize.sh $(APM_DIR)/post-fs-data.sh $(APM_DIR)/service.sh $(APM_DIR)/spoof-common.sh $(BUILD_DIR)/apm_temp/
	@sed -i 's/^version=.*/version=$(VERSION)-$(FULL_VER)/' $(BUILD_DIR)/apm_temp/module.prop
	@sed -i 's/^versionCode=.*/versionCode=$(shell echo $(FULL_VER) | cut -d- -f1)/' $(BUILD_DIR)/apm_temp/module.prop
	@cp -r $(APM_DIR)/webroot/dist/. $(BUILD_DIR)/apm_temp/webroot/
	@cp $(APM_DIR)/cli/build/spoof-uname-cli $(BUILD_DIR)/apm_temp/bin/
	@cd $(BUILD_DIR)/apm_temp && zip -r ../SpoofUname_APM_$(VERSION)-$(FULL_VER).zip .
	@rm -rf $(BUILD_DIR)/apm_temp

$(KPM_FILE): $(BUILD_DIR)
	@$(MAKE) -C $(KPM_DIR) clean
	@$(MAKE) -C $(KPM_DIR) MYKPM_VERSION=$(VERSION)-$(FULL_VER) KP_DIR=$(CURDIR)/third_party/KernelPatch DEBUG=0
	@cp $(KPM_DIR)/build/spoofuname_*.kpm $@

$(KPM_DEBUG_FILE): $(BUILD_DIR)
	@$(MAKE) -C $(KPM_DIR) clean
	@$(MAKE) -C $(KPM_DIR) MYKPM_VERSION=$(VERSION)-$(FULL_VER) KP_DIR=$(CURDIR)/third_party/KernelPatch DEBUG=1
	@cp $(KPM_DIR)/build/spoofuname_*.kpm $@

$(APM_DIR)/cli/build/spoof-uname-cli:
	@$(MAKE) -C $(APM_DIR)/cli

clean:
	@$(MAKE) -C $(APM_DIR)/cli clean
	@$(MAKE) -C $(KPM_DIR) clean
	@rm -rf $(BUILD_DIR)
	@rm -rf $(APM_DIR)/webroot/dist
