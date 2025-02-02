// TODOX ui stuff should probably be throws that can be caught in overview.js?
'use strict';
'require fs';
'require adblock-lean.hagezi as hagezi';
'require adblock-lean.helpers as helpers';
'require adblock-lean.rpc as rpc';

return L.Class.extend({
	checkConfigResult: null,
	data: { 'config': null },
	hasSupportedConfigFormat: false,
	loaded: false,
	rawConfig: null,
	supportedConfigFormat: 6,

	load: async function () {
		this.rawConfig = await fs.read_direct('/etc/adblock-lean/config');
		if (this.rawConfig) {
			this.loaded = true;

			// Parse the config file format, converting the key=value lines into an object
			// From: https://stackoverflow.com/a/52043870
			var result = this.rawConfig
				// split the data by line
				.split("\n")
				// filter comments
				.filter(row => (row.trim() != '') && !row.trim().startsWith('#') && (row.indexOf('=') > 0))
				// split each row into key and property
				.map(row => {
					var equalsPos = row.indexOf('=');
					var key = row.substring(0, equalsPos);
					var value = row.substring(equalsPos + 1);
					return [key.trim(), helpers.getCleanValue(value)];
				})
				// use reduce to assign key-value pairs to a new object
				// using Array.prototype.reduce
				.reduce((acc, [key, value]) => (acc[key] = value, acc), {});
	
			// *_urls need to be an array, not a space-separated string
			result.blocklist_urls = result.blocklist_urls ? result.blocklist_urls.split(' ') : [];
			result.blocklist_ipv4_urls = result.blocklist_ipv4_urls ? result.blocklist_ipv4_urls.split(' ') : [];
			result.allowlist_urls = result.allowlist_urls ? result.allowlist_urls.split(' ') : [];
			result.dnsmasq_blocklist_urls = result.dnsmasq_blocklist_urls ? result.dnsmasq_blocklist_urls.split(' ') : [];
			result.dnsmasq_blocklist_ipv4_urls = result.dnsmasq_blocklist_ipv4_urls ? result.dnsmasq_blocklist_ipv4_urls.split(' ') : [];
			result.dnsmasq_allowlist_urls = result.dnsmasq_allowlist_urls ? result.dnsmasq_allowlist_urls.split(' ') : [];

			// We have a friendly Hagezi Blocklists multi-select, so we need to split those in blocklist_urls into hagezi_blocklists
			result.hagezi_blocklists = [];
			var nonHageziBlocklists = [];
			for (var i = 0; i < result.blocklist_urls.length; i++) {
				if (result.blocklist_urls[i].startsWith(hagezi.baseUrl)) {
					result.hagezi_blocklists.push(result.blocklist_urls[i]);
				} else {
					nonHageziBlocklists.push(result.blocklist_urls[i]);
				}
			}
			result.blocklist_urls = nonHageziBlocklists;
		
			// custom_script needs to be mapped to enable_custom_script
			if (result.custom_script) {
				result.enable_custom_script = 1;
			}

			// Set the data variable in the format needed by form.JSONMap()
			this.data.config = result;

			// Set the hasSupportedConfigFormat flag
			this.hasSupportedConfigFormat = (this.rawConfig.indexOf('config_format=v' + this.supportedConfigFormat) >= 0)

			// Call the checkConfig RPC method to see if an update/reset is needed
			this.checkConfigResult = await rpc.checkConfig();
		}
	},

	save: function() {
		var data = this.data.config;

		// Marge the hagezi blocklist and other blocklist selections into one array
		var combined_blocklist_urls = [];
		if (data.hagezi_blocklists) {
			for (var i = 0; i < data.hagezi_blocklists.length; i++) {
				combined_blocklist_urls.push(data.hagezi_blocklists[i]);
			}
		}
		if (data.blocklist_urls) {
			for (var i = 0; i < data.blocklist_urls.length; i++) {
				combined_blocklist_urls.push(data.blocklist_urls[i]);
			}
		}

		// Abort if user did not select or enter at least one blocklist
		if (combined_blocklist_urls.length == 0) {
			document.body.scrollTop = document.documentElement.scrollTop = 0;
			ui.addNotification(null, E('p', _('Unable to save modifications: Must select or provide at least one blocklist')), 'error');
			return;
		}

		// enable_custom_script needs to be mapped to custom_script
		if (data.enable_custom_script) {
			// User wants to use a custom script, so assign custom_script the default value if it doesn't already have one
			if (!data.custom_script) {
				data.custom_script = '/usr/libexec/abl_custom-script.sh';
			}
		} else {
			// User doesn't want to use a custom script, so clear the custom_script value
			data.custom_script = '';
		}
		
		var config = '\n\
# adblock-lean configuration options\n\
# config_format=v' + this.supportedConfigFormat + '\n\
#\n\
# values must be enclosed in double-quotes\n\
# custom comments are not preserved after automatic config update\n\
\n\
# Whitelist mode: only domains (and their subdomains) included in the allowlist(s) are allowed, all other domains are blocked\n\
# In this mode, if blocklists are used in addition to allowlists, subdomains included in the blocklists will be blocked,\n\
# including subdomains of allowed domains\n\
whitelist_mode="' + data.whitelist_mode + '"\n\
\n\
# One or more *raw domain* format blocklist/ipv4 blocklist/allowlist urls separated by spaces\n\
blocklist_urls="' + combined_blocklist_urls.join(' ') + '"\n\
blocklist_ipv4_urls="' + (data.blocklist_ipv4_urls ?? []).join(' ') + '"\n\
allowlist_urls="' + (data.allowlist_urls ?? []).join(' ') + '"\n\
\n\
# One or more *dnsmasq format* domain blocklist/ipv4 blocklist/allowlist urls separated by spaces\n\
dnsmasq_blocklist_urls="' + (data.dnsmasq_blocklist_urls ?? []).join(' ') + '"\n\
dnsmasq_blocklist_ipv4_urls="' + (data.dnsmasq_blocklist_ipv4_urls ?? []).join(' ') + '"\n\
dnsmasq_allowlist_urls="' + (data.dnsmasq_allowlist_urls ?? []).join(' ') + '"\n\
\n\
# Path to optional local raw allowlist/blocklist domain files in the form:\n\
# site1.com\n\
# site2.com\n\
local_allowlist_path="' + data.local_allowlist_path + '"\n\
local_blocklist_path="' + data.local_blocklist_path + '"\n\
\n\
# Test domains are automatically querried after loading the blocklist into dnsmasq,\n\
# in order to verify that the blocklist didn\'t break DNS resolution\n\
# If query for any of the test domains fails, previous blocklist is restored from backup\n\
# If backup doesn\'t exist, the blocklist is removed and adblock-lean is stopped\n\
# Leaving this empty will disable verification\n\
test_domains="' + data.test_domains + '"\n\
\n\
# List part failed action:\n\
# This option applies to blocklist/allowlist parts which failed to download or couldn\'t pass validation checks\n\
# SKIP - skip failed blocklist file part and continue blocklist generation\n\
# STOP - stop blocklist generation (and fall back to previous blocklist if available)\n\
list_part_failed_action="' + data.list_part_failed_action + '"\n\
\n\
# Maximum number of download retries\n\
max_download_retries="' + data.max_download_retries + '"\n\
\n\
# Minimum number of good lines in final postprocessed blocklist\n\
min_good_line_count="' + data.min_good_line_count + '"\n\
\n\
# Mininum number of lines of any individual downloaded part\n\
min_blocklist_part_line_count="' + data.min_blocklist_part_line_count + '"\n\
min_blocklist_ipv4_part_line_count="' + data.min_blocklist_ipv4_part_line_count + '"\n\
min_allowlist_part_line_count="' + data.min_allowlist_part_line_count + '"\n\
\n\
# Maximum size of any individual downloaded blocklist part\n\
max_file_part_size_KB="' + data.max_file_part_size_KB + '"\n\
\n\
# Maximum total size of combined, processed blocklist\n\
max_blocklist_file_size_KB="' + data.max_blocklist_file_size_KB + '"\n\
\n\
# Whether to perform sorting and deduplication of entries (usually doesn\'t cause much slowdown, uses a bit more memory) - enable (1) or disable (0)\n\
deduplication="' + ((data.deduplication ?? false) ? '1' : '0') + '"\n\
\n\
# compress final blocklist, intermediate blocklist parts and the backup blocklist to save memory - enable (1) or disable (0)\n\
use_compression="' + ((data.use_compression ?? false) ? '1' : '0') + '"\n\
\n\
# restart dnsmasq if previous blocklist was extracted and before generation of\n\
# new blocklist thereby to free up memory during generaiton of new blocklist - enable (1) or disable (0)\n\
initial_dnsmasq_restart="' + ((data.initial_dnsmasq_restart ?? false) ? '1' : '0') + '"\n\
\n\
# Start delay in seconds when service is started from system boot\n\
boot_start_delay_s="' + data.boot_start_delay_s + '"\n\
\n\
# If a path to custom script is specified and that script defines functions \'report_success()\' and \'report_failure()\',\n\
# one of these functions will be executed when adblock-lean completes the execution of some commands,\n\
# with the success or failure message passed in first argument\n\
# report_success() is only executed upon completion of the \'start\' command\n\
# Recommended path is \'/usr/libexec/abl_custom-script.sh\' which the luci app has permission to access\n\
custom_script="' + data.custom_script + '"\n\
\n\
# Crontab schedule expression for periodic list updates\n\
cron_schedule="' + data.cron_schedule + '"\n\
\n\
# dnsmasq instance and config directory\n\
# normally this should be set automatically by the \'setup\' command\n\
DNSMASQ_INSTANCE="' + data.DNSMASQ_INSTANCE + '"\n\
DNSMASQ_INDEX="' + data.DNSMASQ_INDEX + '"\n\
DNSMASQ_CONF_D="' + data.DNSMASQ_CONF_D + '"\n\
';

		// Save config file
		return fs.write('/etc/adblock-lean/config', config)
			.then(function () {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Config modifications have been saved, reload adblock-lean for changes to take effect.')), 'success');

				// Check if we should save the starter file.  We only do this if custom_script is set
				// to the default path, which we have read/write access to
				if (data.custom_script == '/usr/libexec/abl_custom-script.sh') {
					fs.stat('/usr/libexec/abl_custom-script.sh')
						.then(function(result) {
							// Do nothing, file exists so we don't want to create it
						})
						.catch(function (e) {
							if (e.name == 'NotFoundError') {
								// File not found, so we can create the starter file
								fs.write('/usr/libexec/abl_custom-script.sh', '# AdBlock Lean custom script for reporting success/failure conditions\n\
\n\
report_failure() {\n\
# Example to send an email:\n\
# mailsend -port 587 -smtp smtp-relay.brevo.com -auth -f FROM@EMAIL.com -t TO@EMAIL.com -user BREVO@USERNAME.com -pass PASSWORD -sub "AdBlock Lean Failure Report" -M "$1"\n\
\n\
# Example to request an http(s) url:\n\
# uclient-fetch -q -O - --post-data="$1" https://hc-ping.com/<uuid>/fail\n\
\n\
:\n\
}\n\
\n\
report_success() {\n\
# Example to send an email:\n\
# mailsend -port 587 -smtp smtp-relay.brevo.com -auth -f FROM@EMAIL.com -t TO@EMAIL.com -user BREVO@USERNAME.com -pass PASSWORD -sub "AdBlock Lean Success Report" -M "$1"\n\
\n\
# Example to request an http(s) url:\n\
# uclient-fetch -q -O - --post-data="$1" https://hc-ping.com/<uuid>\n\
\n\
:\n\
}\n');
							}
						});
				}
			}).catch(function (e) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Unable to save modifications: %s').format(e.message)), 'error');
			});	
	}
});