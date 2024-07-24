# luci-app-adblock-lean

This app is my attempt at creating luci-based views for managing [adblock-lean](https://github.com/lynxthecat/adblock-lean).

I've used OpenWrt for a few years, but this is my first experience doing anything more than simply installing and updating it, so definitely use this app at your own risk!

Source for [luci-app-banip](https://github.com/openwrt/luci/tree/openwrt-23.05/applications/luci-app-banip) was used as a reference for this app.  And by used as a reference, I mean I straight up copy/pasted entire files out of that tree and into mine, with only minor changes to package names/paths/etc!

# Installation

In all cases, you'll want to log out of the web interface and back in to force a cache refresh after installing the new package.

## From git

To install the luci-app-adblock-lean to your OpenWrt instance (assuming your OpenWRT instance is on 192.168.1.1):

```
scp -r root/* root@192.168.1.1:/
scp -r htdocs/* root@192.168.1.1:/www/
```

# Required adblock-lean tweaks

The overview page requires a customization in /etc/init.d/adblock-lean.  The code that sets the msgs_dest variable needs to set it to /tmp/adblock-lean-output.luci when called from luci, which I'm currently checking for via the presence of a SERVER_SOFTWARE environment variable:

```
if [[ -t 0 ]]
then
        msgs_dest="/dev/tty"
else
        if [[ -z "${SERVER_SOFTWARE}" ]]
        then
                msgs_dest="/dev/null"
        else
                msgs_dest="/tmp/adblock-lean-output.luci"
        fi
fi
```

It also requires the `printf` call in `log_msg()` to append instead of overwrite:

```
printf "${msg}\n" >> "$msgs_dest"
```

# TODO list

- [ ] Possibly pass an environment variable when calling `/etc/init.d/adblock-lean status` to have it write to a different file for each request, just in case two luci-based requests are sent at the same time.
- [ ] Replace the &lt;textarea&gt; on the `Config` view with separate inputs for each of the configuration options.
  - [ ] For the `blocklist_urls` setting, render that as radio collections, for example:
    - Multi: ( ) Light ( ) Normal ( ) Pro-Full ( ) Pro-Mini ( ) Pro++-Full ( ) Pro++-Mini ( ) Ultimate-Full ( ) Ultimate-Mini
    - Threat Intelligence: ( ) Full ( ) Medium ( ) Mini
    - etc.
  - [ ] Would also need a method for supplying additional blocklists.
- [ ] Start, stop, pause, resume, etc, buttons