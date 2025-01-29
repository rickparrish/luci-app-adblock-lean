@ECHO OFF
SETLOCAL
SET CYGWINHOME=C:\CYGWIN64
SET HOME=%USERPROFILE%
SET CWOLDPATH=%PATH%
SET PATH=%CYGWINHOME%\BIN;%PATH%

scp -O -r applications/luci-app-adblock-lean/root/* root@OpenWrt.lan:/
scp -O -r applications/luci-app-adblock-lean/htdocs/* root@OpenWrt.lan:/www/
REM scp -O -r ../adblock-lean/adblock-lean root@OpenWrt.lan:/etc/init.d/adblock-lean

ssh root@OpenWrt.lan chmod 755 /usr/libexec/rpcd/luci.adblock-lean
ssh root@OpenWrt.lan chmod 755 /www/luci-static/resources/adblock-lean
ssh root@OpenWrt.lan chmod 644 /www/luci-static/resources/adblock-lean/*
ssh root@OpenWrt.lan chmod 755 /www/luci-static/resources/view/adblock-lean
ssh root@OpenWrt.lan chmod 644 /www/luci-static/resources/view/adblock-lean/*
ssh root@OpenWrt.lan chmod 644 /www/luci-static/resources/view/status/include/70_adblock-lean.js