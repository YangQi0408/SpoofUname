MODDIR="/data/adb/modules/spoof_uname"
CLI_PATH="$MODDIR/bin/spoof-uname-cli"
LOG_FILE="$MODDIR/log/log.txt"

mkdir -p "$MODDIR/log"
touch "$LOG_FILE"

sleep 10
if [ ! -f "$CLI_PATH" ]; then
    exit 0
fi

. "$MODDIR/config.sh"

if [ "$autostart" != "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 开机自启已禁用，跳过自动注入" >> "$LOG_FILE"
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 开始注入配置到KPM模块" >> "$LOG_FILE"

if [ -n "$release" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 设置Release: $release" >> "$LOG_FILE"
    $CLI_PATH --set-release "$release"
fi

if [ -n "$version" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 设置Version: $version" >> "$LOG_FILE"
    $CLI_PATH --set-version "$version"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 启用模块" >> "$LOG_FILE"
$CLI_PATH --enable

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 配置注入完成" >> "$LOG_FILE"