#!/system/bin/sh

set_perm_recursive $MODPATH 0 0 0755 0644

touch "$MODPATH/config"
mkdir "$MODPATH/log"
touch "$MODPATH/log/log.txt"

set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/bin/spoof-uname-cli" 0 0 0755

ui_print "Welcome to SpoofUname!"