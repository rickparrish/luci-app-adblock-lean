# luci-app-adblock-lean

This app is my attempt at creating luci-based views for managing [adblock-lean](https://github.com/lynxthecat/adblock-lean).

I've used OpenWrt for a few years, but this is my first experience doing anything more than simply installing and updating it, so definitely use this app at your own risk!

Source for [luci-app-banip](https://github.com/openwrt/luci/tree/openwrt-23.05/applications/luci-app-banip) was used as a reference for this app.  And by used as a reference, I mean I straight up copy/pasted entire files out of that tree and into mine, with only minor changes to package names/paths/etc!

Source for [luci-app-adblock-fast](https://github.com/openwrt/luci/tree/master/applications/luci-app-adblock-fast) was also used as a reference for the RPC-portion of this app.

# Installation

In all cases, you'll want to log out of the web interface and back in to force a cache refresh after installing the new package.

## From git

To install the luci-app-adblock-lean to your OpenWrt instance (assuming your OpenWRT instance is on 192.168.1.1):

```
scp -r root/* root@192.168.1.1:/
scp -r htdocs/* root@192.168.1.1:/www/
```

# Required adblock-lean tweaks

A modified adblock-lean is required.
[It can be downloaded here](https://raw.githubusercontent.com/friendly-bits/adblock-lean/improve-processing-logic/adblock-lean)
<!-- luci-app-adblock-lean is compatable with the stock adblock-lean and does not require any modifications. -->

# Screenshot

![image](https://github.com/user-attachments/assets/a3477e02-8cd7-4578-b9be-ac5e6d7c3971)
