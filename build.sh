#!/bin/bash

# build.sh can be used to test the GitHub Actions workflow(s) locally before pushing to the repo

# The action downloads luci.mk, which works fine when the action is executed via GitHub, but for
# some reason the files aren't found when executing the action locally so this script will manually 
# download it and then clean up after the build completes.

# Download luci.mk
wget https://raw.githubusercontent.com/openwrt/luci/openwrt-23.05/luci.mk

# Execute 'act' to run the GitHub action locally
# Requires https://github.com/nektos/act
~/bin/act

# Delete luci.mk
rm luci.mk