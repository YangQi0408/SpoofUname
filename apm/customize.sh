#!/system/bin/sh

set_perm_recursive $MODPATH 0 0 0755 0644

NEW_CONFIG="$MODPATH/config.sh"

if [ ! -f "$NEW_CONFIG" ]; then
    touch "$NEW_CONFIG"
fi

mkdir -p "$MODPATH/log"
touch "$MODPATH/log/log.txt"

set_perm "$MODPATH/post-fs-data.sh" 0 0 0755
set_perm "$MODPATH/bin/spoof-uname-cli" 0 0 0755
set_perm "$NEW_CONFIG" 0 0 0644

ui_print "Welcome to SpoofUname!"
