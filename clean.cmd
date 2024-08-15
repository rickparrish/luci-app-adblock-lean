@ECHO OFF
SETLOCAL
SET CYGWINHOME=C:\CYGWIN64
SET HOME=%USERPROFILE%
SET CWOLDPATH=%PATH%
SET PATH=%CYGWINHOME%\BIN;%PATH%

ssh root@OpenWrt.lan rm -rf /www/luci-static/resources/adblock-lean
ssh root@OpenWrt.lan rm -rf /www/luci-static/resources/view/adblock-lean
ssh root@OpenWrt.lan rm /www/luci-static/resources/view/status/include/70_adblock-lean.js
ssh root@OpenWrt.lan rm /usr/share/rpcd/acl.d/luci-app-adblock-lean.json
ssh root@OpenWrt.lan rm /usr/share/luci/menu.d/luci-app-adblock-lean.json
ssh root@OpenWrt.lan rm /usr/libexec/rpcd/luci.adblock-lean