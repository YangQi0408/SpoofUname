#!/system/bin/sh
# post-fs-data 阶段入口。仅当 config.sh 的 boot_stage=post-fs-data 时注入。
# 注：个别设备在此阶段执行会卡开机，默认阶段为 service（见 service.sh）。

MODDIR="/data/adb/modules/spoof_uname"
. "$MODDIR/spoof-common.sh"

spoof_inject "post-fs-data"
