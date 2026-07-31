#!/system/bin/sh
# service 阶段入口（默认启动阶段）。晚于 post-fs-data，兼容性更好，
# 可避免个别设备在 post-fs-data 阶段注入导致的卡开机。
# 仅当 config.sh 的 boot_stage=service 时注入。

MODDIR="/data/adb/modules/spoof_uname"
. "$MODDIR/spoof-common.sh"

spoof_inject "service"
