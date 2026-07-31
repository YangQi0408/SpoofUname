#!/system/bin/sh
# SpoofUname 注入逻辑（供 post-fs-data.sh 与 service.sh 共用）。
#
# 两个启动脚本都会 source 本文件并调用 spoof_inject "<当前阶段>"。
# 只有当 config.sh 中的 boot_stage 与当前阶段匹配时才真正注入，
# 从而实现"开机自启在 post-fs-data 或 service 阶段执行"两种模式。
# 个别设备在 post-fs-data 阶段执行会卡开机，故默认阶段为 service。

MODDIR="/data/adb/modules/spoof_uname"
CLI_PATH="$MODDIR/bin/spoof-uname-cli"
LOG_FILE="$MODDIR/log/log.txt"

# 记一行带时间戳的日志。
spoof_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: $1" >> "$LOG_FILE"
}

# spoof_inject <stage>：在指定启动阶段执行配置注入。
# <stage> 为脚本所处阶段（post-fs-data / service）。
spoof_inject() {
    stage="$1"

    mkdir -p "$MODDIR/log"
    touch "$LOG_FILE"

    if [ ! -f "$CLI_PATH" ]; then
        return 0
    fi

    if [ ! -f "$MODDIR/config.sh" ]; then
        return 0
    fi

    # 载入配置（release / version / enabled / autostart / boot_stage）。
    . "$MODDIR/config.sh"

    if [ "$autostart" != "true" ]; then
        spoof_log "开机自启已禁用，跳过自动注入（$stage）"
        return 0
    fi

    # 未配置 boot_stage 时默认 service，兼容旧配置文件。
    if [ -z "$boot_stage" ]; then
        boot_stage="service"
    fi

    # 仅在配置的阶段与当前阶段一致时注入。
    if [ "$boot_stage" != "$stage" ]; then
        return 0
    fi

    spoof_log "开始注入配置到 KPM 模块（$stage 阶段）"

    if [ -n "$release" ]; then
        spoof_log "设置 Release: $release"
        "$CLI_PATH" --set-release "$release"
    fi

    if [ -n "$version" ]; then
        spoof_log "设置 Version: $version"
        "$CLI_PATH" --set-version "$version"
    fi

    spoof_log "设置内核属性"

    if [ -n "$release" ]; then
        kernel_full=$(echo "$release" | sed 's/-.*//' | cut -d'.' -f1-3)
        kernel_short=$(echo "$release" | sed 's/-.*//' | cut -d'.' -f1-2)
        resetprop -n ro.build.kernel.id "$kernel_full"
        resetprop -n ro.kernel.version "$kernel_short"
        spoof_log "ro.build.kernel.id=$kernel_full, ro.kernel.version=$kernel_short"
    fi

    spoof_log "启用模块"
    "$CLI_PATH" --enable

    spoof_log "配置注入完成（$stage 阶段）"
}
