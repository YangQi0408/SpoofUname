MYKPM_VERSION ?= v0.0.0
BUILD_DIR := build
KP_DIR ?= ../third_party/KernelPatch
DEBUG ?= 0

HOST_TAG := $(shell uname | tr A-Z a-z)-$(shell uname -m)
ifeq ($(HOST_TAG), darwin-arm64)
    HOST_TAG = darwin-x86_64
endif

ifndef ANDROID_NDK
    $(error ANDROID_NDK is not set)
endif

CC := $(ANDROID_NDK)/toolchains/llvm/prebuilt/$(HOST_TAG)/bin/aarch64-linux-android31-clang

INCLUDE_DIRS := . include patch/include linux/include linux/arch/arm64/include linux/tools/arch/arm64/include
INCLUDE_FLAGS := $(foreach dir,$(INCLUDE_DIRS),-I$(KP_DIR)/kernel/$(dir))
CFLAGS = -Wall -O2 -fno-PIC -fno-asynchronous-unwind-tables -fno-stack-protector -fno-common -DMYKPM_VERSION=\"$(MYKPM_VERSION)\"

ifeq ($(DEBUG), 1)
CFLAGS += -DSPOOF_DEBUG
endif

.PHONY: all clean
all: $(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm

$(BUILD_DIR)/spoofuname_$(MYKPM_VERSION).kpm: $(BUILD_DIR)/spoofuname.o
	$(CC) -r -o $@ $^

$(BUILD_DIR)/%.o: %.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDE_FLAGS) -c $< -o $@

$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

clean:
	rm -rf $(BUILD_DIR)
