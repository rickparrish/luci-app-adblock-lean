@ECHO OFF
SETLOCAL
SET CYGWINHOME=C:\CYGWIN64
SET HOME=%USERPROFILE%
SET CWOLDPATH=%PATH%
SET PATH=%CYGWINHOME%\BIN;%PATH%

CALL clean.cmd

ssh root@OpenWrt.lan service adblock-lean stop
ssh root@OpenWrt.lan service adblock-lean disable
ssh root@OpenWrt.lan rm /etc/rc.d/K4adblock-lean
ssh root@OpenWrt.lan rm /etc/rc.d/S99adblock-lean
ssh root@OpenWrt.lan rm /etc/init.d/adblock-lean
ssh root@OpenWrt.lan rm -rf /root/adblock-lean
ssh root@OpenWrt.lan rm -rf /tmp/adblock-lean
ssh root@OpenWrt.lan rm -rf /tmp/run/adblock-lean
ssh root@OpenWrt.lan rm /usr/libexec/abl_custom-script.sh
