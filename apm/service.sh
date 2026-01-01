#!/system/bin/sh



MODDIR="/data/adb/modules/spoof_uname"
CONFIG_FILE="$MODDIR/config"
CLI_PATH="$MODDIR/bin/spoof-uname-cli"
LOG_FILE="$MODDIR/log/log.txt"

# 确保日志目录存在
mkdir -p "$MODDIR/log"
touch "$LOG_FILE"

sleep 10
if [ ! -f "$CONFIG_FILE" ]; then
    exit 0
fi

if [ ! -f "$CLI_PATH" ]; then
    exit 0
fi

# 读取配置文件
RELEASE=$(grep "^release=" "$CONFIG_FILE" | cut -d'=' -f2)
VERSION=$(grep "^version=" "$CONFIG_FILE" | cut -d'=' -f2)
ENABLED=$(grep "^enabled=" "$CONFIG_FILE" | cut -d'=' -f2)
SUPERKEY=$(grep "^superkey=" "$CONFIG_FILE" | cut -d'=' -f2)
AUTOSTART=$(grep "^autostart=" "$CONFIG_FILE" | cut -d'=' -f2)

# 检查是否启用开机自启
if [ "$AUTOSTART" != "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 开机自启已禁用，跳过自动注入" >> "$MODDIR/log/log.txt"
    exit 0
fi

if [ -z "$SUPERKEY" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 未找到SuperKey，请先在Web界面设置" >> "$MODDIR/log/log.txt"
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 开始注入配置到KPM模块" >> "$MODDIR/log/log.txt"

if [ -n "$RELEASE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 设置Release: $RELEASE" >> "$MODDIR/log/log.txt"
    $CLI_PATH -s "$SUPERKEY" -r "$RELEASE"
fi

if [ -n "$VERSION" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 设置Version: $VERSION" >> "$MODDIR/log/log.txt"
    $CLI_PATH -s "$SUPERKEY" -v "$VERSION"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 启用模块" >> "$MODDIR/log/log.txt"
$CLI_PATH -s "$SUPERKEY" -e

echo "[$(date '+%Y-%m-%d %H:%M:%S')] SpoofUname: 配置注入完成" >> "$MODDIR/log/log.txt"