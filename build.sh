#!/bin/bash

# Download luci.mk
wget https://raw.githubusercontent.com/openwrt/luci/openwrt-23.05/luci.mk

# Execute 'act' to run the github action locally
~/bin/act

# Delete luci.mk
rm luci.mk