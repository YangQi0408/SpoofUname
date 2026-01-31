TARGET   := spoof-uname-cli
BUILD    := build
SRCS     := $(wildcard src/*.c)
OBJS     := $(SRCS:src/%.c=$(BUILD)/src/%.o)

CFLAGS   := -Wall -Wextra -O2 -Iinclude -MMD

HOST_TAG := $(shell uname | tr A-Z a-z)-$(shell uname -m)
ifeq ($(HOST_TAG), darwin-arm64)
    HOST_TAG = darwin-x86_64
endif

ifndef ANDROID_NDK
    $(error ANDROID_NDK is not set)
endif

CC := $(ANDROID_NDK)/toolchains/llvm/prebuilt/$(HOST_TAG)/bin/aarch64-linux-android31-clang

.PHONY: all clean
all: $(BUILD)/$(TARGET)

$(BUILD)/$(TARGET): $(OBJS)
	$(CC) -o $@ $^

$(BUILD)/%.o: %.c | $(BUILD)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD):
	@mkdir -p $(BUILD)

clean:
	rm -rf $(BUILD)

-include $(OBJS:.o=.d)