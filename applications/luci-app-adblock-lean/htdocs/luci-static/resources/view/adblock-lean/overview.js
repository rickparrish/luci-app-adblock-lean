'use strict';
'require form';
'require fs';
'require rpc';
'require ui';
'require view';
'require adblock-lean.status as statusClass';
'require adblock-lean.missing-config as missingConfigClass';
'require adblock-lean.not-installed as notInstalledClass';

let m, data;

var hageziBaseUrl = 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/';
var hageziBlocklists = [
	{ filename: 'light', name: 'Multi LIGHT' },
	{ filename: 'multi', name: 'Multi NORMAL' },
	{ filename: 'pro', name: 'Multi PRO' },
	{ filename: 'pro.mini', name: 'Multi PRO mini' },
	{ filename: 'pro.plus', name: 'Multi PRO++' },
	{ filename: 'pro.plus.mini', name: 'Multi PRO++ mini ' },
	{ filename: 'ultimate', name: 'Multi ULTIMATE' },
	{ filename: 'ultimate.mini', name: 'Multi ULTIMATE mini ' },
	{ filename: 'fake', name: 'Fake' },
	{ filename: 'popupads', name: 'Pop-Up Ads' },
	{ filename: 'tif', name: 'Threat Intelligence Feeds' },
	{ filename: 'tif.medium', name: 'Threat Intelligence Feeds - Medium' },
	{ filename: 'tif.mini', name: 'Threat Intelligence Feeds - Mini' },
	{ filename: 'doh-vpn-proxy-bypass', name: 'DoH/VPN/TOR/Proxy Bypass' },
	{ filename: 'doh', name: 'Encrypted DNS Servers' },
	{ filename: 'nosafesearch', name: 'Safesearch not supported' },
	{ filename: 'dyndns', name: 'Dynamic DNS' },
	{ filename: 'hoster', name: 'Badware Hoster' },
	{ filename: 'anti.piracy', name: 'Anti Piracy' },
	{ filename: 'gambling', name: 'Gambling' },
	{ filename: 'gambling.medium', name: 'Gambling - Medium' },
	{ filename: 'gambling.mini', name: 'Gambling - Mini' },
	{ filename: 'native.amazon', name: 'Native Tracker - Amazon' },
	{ filename: 'native.apple', name: 'Native Tracker - Apple' },
	{ filename: 'native.huawei', name: 'Native Tracker - Huawei' },
	{ filename: 'native.winoffice', name: 'Native Tracker - Microsoft' },
	{ filename: 'native.tiktok', name: 'Native Tracker - TikTok' },
	{ filename: 'native.tiktok.extended', name: 'Native Tracker - TikTok Aggressive' },
	{ filename: 'native.lgwebos', name: 'Native Tracker - LG webOS' },
	{ filename: 'native.vivo', name: 'Native Tracker - Vivo' },
	{ filename: 'native.oppo-realme', name: 'Native Tracker - OPPO/Realme' },
	{ filename: 'native.xiaomi', name: 'Native Tracker - Xiaomi' },
];

var checkConfig = rpc.declare({
	object: 'luci.adblock-lean',
	method: 'checkConfig',
	params: [],
});

var resetConfig = rpc.declare({
	object: 'luci.adblock-lean',
	method: 'resetConfig',
	params: [],
});

var updateConfig = rpc.declare({
	object: 'luci.adblock-lean',
	method: 'updateConfig',
	params: [],
});

function cleanValue(value) {
	// Trim the value
	value = value.trim();

	// Check for string-quoted value
	// From: https://stackoverflow.com/a/249937
	var m = value.match(/"(?:[^"\\]|\\.)*"/);
	if (m === null) {
		// Not a string-quoted value, remove inline comments
		var hashPos = value.indexOf('#');
		if (hashPos == 0) {
			value = '';
		} else if (hashPos >= 1) {
			value = value.substring(0, hashPos).trim();
		}
	} else {
		// Is a string-quoted value, remove the surrounding quotes
		// From: https://stackoverflow.com/a/18268011
		value = m[0].trim().replace(/^"?|"?$/g, '');
	}

	// Return the now-cleaned value
	return value;
}

function getUnorderedList(text) {
	if (!text) { return ''; }

	var result = '';

	var lines = text.split('\n');
	for (var i = 0; i < lines.length; i++) {
		result += '<li>' + lines[i].replace(/[<]/g, '&lt;') + '</li>';
	}

	return '<ol style="list-style: decimal;">' + result + '</ol>';
}

function getUnorderedListWithHeader(header, text) {
	if (!text) { return ''; }
	return '<div><strong>' + header + '</strong></div>' + getUnorderedList(text);
}

function joinWithSemicolon(text) {
	var lines = (text ?? '').replace(/\r\n/g, '\n').split('\n');
	
	var result = lines[0].trim();

	for (var i = 1; i < lines.length; i++) {
		if (!result.endsWith(';')) {
			result += '; ';
		}
		result += lines[i].trim();
	}

	return result;
}

function parseConfig(config) {
	var result = null
	if (config) {
		// Parse the config file format, converting the key=value lines into an object
		// From: https://stackoverflow.com/a/52043870
		result = config
			// split the data by line
			.split("\n")
			// filter comments
			.filter(row => (row.trim() != '') && !row.trim().startsWith('#') && (row.indexOf('=') > 0))
			// split each row into key and property
			.map(row => {
				var equalsPos = row.indexOf('=');
				var key = row.substring(0, equalsPos);
				var value = row.substring(equalsPos + 1);
				return [key.trim(), cleanValue(value)];
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
	} else {
		// No existing config file, so set defaults
		result = {
			'whitelist_mode': 0,
			'blocklist_urls': [
				hageziBaseUrl + 'pro',
				hageziBaseUrl + 'tif.mini'
			],
			'blocklist_ipv4_urls': [],
			'allowlist_urls': [],
			'dnsmasq_blocklist_urls': [],
			'dnsmasq_blocklist_ipv4_urls': [],
			'dnsmasq_allowlist_urls': [],
			'local_allowlist_path': '/etc/adblock-lean/allowlist',
			'local_blocklist_path': '/etc/adblock-lean/blocklist',
			'test_domains': 'google.com microsoft.com amazon.com',
			'list_part_failed_action': 'SKIP',
			'max_download_retries': 3,
			'min_good_line_count': 80000,
			'min_blocklist_part_line_count': 1,
			'min_blocklist_ipv4_part_line_count': 1,
			'min_allowlist_part_line_count': 1,
			'max_file_part_size_KB': 4000,
			'max_blocklist_file_size_KB': 6000,
			'deduplication': 1,
			'use_compression': 1,
			'initial_dnsmasq_restart': 0,
			'boot_start_delay_s': 120,
			'custom_script': '',
			'cron_schedule': 'disable',
			// TODOX How to handle these keys that could be different on each system?
			// 'DNSMASQ_INSTANCE': 'cfg01411c',
			// 'DNSMASQ_INDEX': 0,
			// 'DNSMASQ_CONF_D': '/tmp/dnsmasq.d',
		};
	}

	// We have a friendly Hagezi Blocklists multi-select, so we need to split those in blocklist_urls into hagezi_blocklists
	result.hagezi_blocklists = [];
	var nonHageziBlocklists = [];
	for (var i = 0; i < result.blocklist_urls.length; i++) {
		if (result.blocklist_urls[i].startsWith(hageziBaseUrl)) {
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
	return { 'config': result };
}

return view.extend({
	handleReset: null,

	handleSaveApply: null,

	handleSave: function (ev) {
		// Remove any existing notifications
		var notifications = document.getElementsByClassName("alert-message");
		for (var i = 0; i < notifications.length; i++) {
			notifications[i].style.display = 'none';
		}

		// Call m.save() with silent=true, because we'll call ui.addNotification to display a banner
		// in the event of an error (with silent=false it displays a modal, which is annoying to dismiss)
		m.save(function() { /* do nothing */ }, true)
			.then((result) => {
				// Marge the hagezi blocklist and other blocklist selections into one array
				var combined_blocklist_urls = [];
				if (data.config.hagezi_blocklists) {
					for (var i = 0; i < data.config.hagezi_blocklists.length; i++) {
						combined_blocklist_urls.push(data.config.hagezi_blocklists[i]);
					}
				}
				if (data.config.blocklist_urls) {
					for (var i = 0; i < data.config.blocklist_urls.length; i++) {
						combined_blocklist_urls.push(data.config.blocklist_urls[i]);
					}
				}

				// Abort if user did not select or enter at least one blocklist
				if (combined_blocklist_urls.length == 0) {
					document.body.scrollTop = document.documentElement.scrollTop = 0;
					ui.addNotification(null, E('p', _('Unable to save modifications: Must select or provide at least one blocklist')), 'error');
					return;
				}

				// enable_custom_script needs to be mapped to custom_script
				if (data.config.enable_custom_script) {
					// User wants to use a custom script, so assign custom_script the default value if it doesn't already have one
					if (!data.config.custom_script) {
						data.config.custom_script = '/usr/libexec/abl_custom-script.sh';
					}
				} else {
					// User doesn't want to use a custom script, so clear the custom_script value
					data.config.custom_script = '';
				}
				
				var config = '\n\
# adblock-lean configuration options\n\
# config_format=v' + statusClass.supportedConfigFormat + '\n\
#\n\
# values must be enclosed in double-quotes\n\
# custom comments are not preserved after automatic config update\n\
\n\
# Whitelist mode: only domains (and their subdomains) included in the allowlist(s) are allowed, all other domains are blocked\n\
# In this mode, if blocklists are used in addition to allowlists, subdomains included in the blocklists will be blocked,\n\
# including subdomains of allowed domains\n\
whitelist_mode="' + data.config.whitelist_mode + '"\n\
\n\
# One or more *raw domain* format blocklist/ipv4 blocklist/allowlist urls separated by spaces\n\
blocklist_urls="' + combined_blocklist_urls.join(' ') + '"\n\
blocklist_ipv4_urls="' + (data.config.blocklist_ipv4_urls ?? []).join(' ') + '"\n\
allowlist_urls="' + (data.config.allowlist_urls ?? []).join(' ') + '"\n\
\n\
# One or more *dnsmasq format* domain blocklist/ipv4 blocklist/allowlist urls separated by spaces\n\
dnsmasq_blocklist_urls="' + (data.config.dnsmasq_blocklist_urls ?? []).join(' ') + '"\n\
dnsmasq_blocklist_ipv4_urls="' + (data.config.dnsmasq_blocklist_ipv4_urls ?? []).join(' ') + '"\n\
dnsmasq_allowlist_urls="' + (data.config.dnsmasq_allowlist_urls ?? []).join(' ') + '"\n\
\n\
# Path to optional local raw allowlist/blocklist domain files in the form:\n\
# site1.com\n\
# site2.com\n\
local_allowlist_path="' + data.config.local_allowlist_path + '"\n\
local_blocklist_path="' + data.config.local_blocklist_path + '"\n\
\n\
# Test domains are automatically querried after loading the blocklist into dnsmasq,\n\
# in order to verify that the blocklist didn\'t break DNS resolution\n\
# If query for any of the test domains fails, previous blocklist is restored from backup\n\
# If backup doesn\'t exist, the blocklist is removed and adblock-lean is stopped\n\
# Leaving this empty will disable verification\n\
test_domains="' + data.config.test_domains + '"\n\
\n\
# List part failed action:\n\
# This option applies to blocklist/allowlist parts which failed to download or couldn\'t pass validation checks\n\
# SKIP - skip failed blocklist file part and continue blocklist generation\n\
# STOP - stop blocklist generation (and fall back to previous blocklist if available)\n\
list_part_failed_action="' + data.config.list_part_failed_action + '"\n\
\n\
# Maximum number of download retries\n\
max_download_retries="' + data.config.max_download_retries + '"\n\
\n\
# Minimum number of good lines in final postprocessed blocklist\n\
min_good_line_count="' + data.config.min_good_line_count + '"\n\
\n\
# Mininum number of lines of any individual downloaded part\n\
min_blocklist_part_line_count="' + data.config.min_blocklist_part_line_count + '"\n\
min_blocklist_ipv4_part_line_count="' + data.config.min_blocklist_ipv4_part_line_count + '"\n\
min_allowlist_part_line_count="' + data.config.min_allowlist_part_line_count + '"\n\
\n\
# Maximum size of any individual downloaded blocklist part\n\
max_file_part_size_KB="' + data.config.max_file_part_size_KB + '"\n\
\n\
# Maximum total size of combined, processed blocklist\n\
max_blocklist_file_size_KB="' + data.config.max_blocklist_file_size_KB + '"\n\
\n\
# Whether to perform sorting and deduplication of entries (usually doesn\'t cause much slowdown, uses a bit more memory) - enable (1) or disable (0)\n\
deduplication="' + ((data.config.deduplication ?? false) ? '1' : '0') + '"\n\
\n\
# compress final blocklist, intermediate blocklist parts and the backup blocklist to save memory - enable (1) or disable (0)\n\
use_compression="' + ((data.config.use_compression ?? false) ? '1' : '0') + '"\n\
\n\
# restart dnsmasq if previous blocklist was extracted and before generation of\n\
# new blocklist thereby to free up memory during generaiton of new blocklist - enable (1) or disable (0)\n\
initial_dnsmasq_restart="' + ((data.config.initial_dnsmasq_restart ?? false) ? '1' : '0') + '"\n\
\n\
# Start delay in seconds when service is started from system boot\n\
boot_start_delay_s="' + data.config.boot_start_delay_s + '"\n\
\n\
# If a path to custom script is specified and that script defines functions \'report_success()\' and \'report_failure()\',\n\
# one of these functions will be executed when adblock-lean completes the execution of some commands,\n\
# with the success or failure message passed in first argument\n\
# report_success() is only executed upon completion of the \'start\' command\n\
# Recommended path is \'/usr/libexec/abl_custom-script.sh\' which the luci app has permission to access\n\
custom_script="' + data.config.custom_script + '"\n\
\n\
# Crontab schedule expression for periodic list updates\n\
cron_schedule="' + data.config.cron_schedule + '"\n\
\n\
# dnsmasq instance and config directory\n\
# normally this should be set automatically by the \'setup\' command\n\
DNSMASQ_INSTANCE="' + data.config.DNSMASQ_INSTANCE + '"\n\
DNSMASQ_INDEX="' + data.config.DNSMASQ_INDEX + '"\n\
DNSMASQ_CONF_D="' + data.config.DNSMASQ_CONF_D + '"\n\
';

				// Save config file
				return fs.write('/etc/adblock-lean/config', config)
					.then(function () {
						document.body.scrollTop = document.documentElement.scrollTop = 0;
						ui.addNotification(null, E('p', _('Config modifications have been saved, reload adblock-lean for changes to take effect.')), 'success');

						// Check if we should save the starter file.  We only do this if custom_script is set
						// to the default path, which we have read/write access to
						if (data.config.custom_script == '/usr/libexec/abl_custom-script.sh') {
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
			})
			.catch((error) => {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Unable to save modifications: %s').format(error.message)), 'error');
			});
	},

	load: function () {
		return Promise.all([
			L.resolveDefault(fs.stat('/etc/init.d/adblock-lean'), ''),
			L.resolveDefault(fs.read_direct('/etc/adblock-lean/config'), ''),
			L.resolveDefault(checkConfig(), '')
		]);
	},

	render: function (loadData) {
		var ablStatEntry = loadData[0];
		var configFile = loadData[1];
		var checkConfigResult = loadData[2];

		// Check if adblock-lean is installed, and if not, display the install view
		if (!L.isObject(ablStatEntry)) {
			this.handleSave = null;
			return new notInstalledClass.view().render();
		}

		// Check if adblock-lean's config file exists, and if not, display the config-missing view
		if (configFile === '') {
			this.handleSave = null;
			return new missingConfigClass.view().render();
		}

		let s, o;
		var status;

		// Check if a configuration update is needed, and if so, display a button to automatically update it as well as
		// instructions for if they want to manually update
		if (checkConfigResult.config_status == 2) {
			// Disable the save button
			this.handleSave = null;

			// Build the title element
			var titleElement = E('h2', {}, _('AdBlock Lean - Configuration Update Needed'));

			// Build the automatic instruction element
			var autoInstructionElement = E('p', {}, _('AdBlock Lean\'s configuration format has changed.<br /><br />\
				Click the Update button below the make the following automatic changes:\
				' + getUnorderedList(checkConfigResult.conf_fixes)));

			var buttonElement = E('button', {
				'class': 'btn cbi-button cbi-button-positive',
				'click': ui.createHandlerFn(this, function () { 
					ui.showModal(null, [
						E('p',
							{ class: 'spinning' },
							_('Updating AdBlock Lean configuration file')
						),
					]);
					L.resolveDefault(updateConfig())
						.then(function (result) { location.reload() });
				}),
			}, [_('Update Configuration File')]);

			// Build the manual instruction element
			var config_format_message = ''
			if (checkConfigResult.curr_config_format != checkConfigResult.def_config_format) {
				config_format_message = '# config_format=v' + checkConfigResult.def_config_format
			}
			var manualInstructionElement = E('p', {}, _('<br /><br />Or, if you\'d like to manually update your config file,\
				these are the changes that are needed:<br /><br />\
				' + getUnorderedListWithHeader('Remove old entries:', checkConfigResult.unexp_entries) + '\
				' + getUnorderedListWithHeader('Add new entries:', checkConfigResult.missing_entries) + '\
				' + getUnorderedListWithHeader('Wrap values in double-quotes and/or remove inline comments:', checkConfigResult.legacy_entries) + '\
				' + getUnorderedListWithHeader('Add/update the config_format comment:', config_format_message)));

			// Combine the various elements into our result variable
			return E([
				titleElement,
				autoInstructionElement,
				buttonElement,
				manualInstructionElement
			]);
		} else if (checkConfigResult.config_status == 1) {
			// Disable the save button
			this.handleSave = null;

			// Build the title element
			var titleElement = E('h2', {}, _('AdBlock Lean - Configuration Error'));

			// Build the instruction element
			var instructionElement = E('p', {}, _('AdBlock Lean\'s configuration file has an error.<br /><br />\
				To automatically reset it now, click the Reset button below.  Or to fix it manually,\
				SSH into your router and try executing <strong>service adblock-lean start</strong>.<br /><br />'));

			var buttonElement = E('button', {
				'class': 'btn cbi-button cbi-button-positive',
				'click': ui.createHandlerFn(this, function () { 
					ui.showModal(null, [
						E('p',
							{ class: 'spinning' },
							_('Resetting AdBlock Lean configuration file')
						),
					]);
					L.resolveDefault(resetConfig())
						.then(function (result) { location.reload() });
				}),
			}, [_('Reset Configuration File')]);

			// Combine the various elements into our result variable
			return E([
				titleElement,
				instructionElement,
				buttonElement
			]);
		}

		// Show the status panel
		status = new statusClass.view();
		status.showButtons = true;
		status.showTitle = true;

		// Ensure the config format matches the format we can support
		if (configFile.indexOf('config_format=v' + statusClass.supportedConfigFormat) == -1) {
			// Disable the save button
			this.handleSave = null;

			// Build the title element
			var titleElement = E('h2', {}, _('AdBlock Lean - Unsupported Configuration'));

			// Build the instruction element
			var instructionElement = E('p', {}, _('The currently installed versions of adblock-lean and luci-app-adblock-lean\
				are not compatable with each other (they do not support the same config format).<br /><br />\
				Check the status panel above to see whether there are updates for one (or both) packages, and update as necessary.<br /><br />\
				NOTE: adblock-lean will continue to function as expected while this incompatability exists, the only functionality\
				you are missing out on is the configuration form.'));

			// Combine the various elements into our result variable
			var result = E([
				E('p', {}, '&nbsp;'),
				titleElement,
				instructionElement
			]);

			return Promise.all([status.render(), result]);
		}

		// Setup the form inputs for each config option
		data = parseConfig(configFile);
		m = new form.JSONMap(data, 'AdBlock Lean - Configuration', _('Configuration of the AdBlock Lean package. \
			For further information please check the <a style="font-weight: bold;" href="https://github.com/lynxthecat/adblock-lean/blob/master/README.md" target="_blank" rel="noreferrer noopener">online documentation</a>'));

		/*
			tabbed config section
		*/
		s = m.section(form.NamedSection, 'config', 'adblock-lean-section');
		s.addremove = false;
		s.tab('general', _('General Settings'));
		s.tab('advanced', _('Advanced Settings'));
		
		/*
			general tab
		*/
		o = s.taboption(
			'general',
			form.MultiValue,
			'hagezi_blocklists',
			_('Hagezi blocklists'),
			_('dnsmasq blocklists provided by hagezi. \
				For blocklist information, please check the <a style="font-weight: bold;" href="https://github.com/hagezi/dns-blocklists/blob/main/README.md" target="_blank" rel="noreferrer noopener">online documentation</a>')
		);
		o.optional = true;
		o.retain = true;
		o.rmempty = false;

		for (var i = 0; i < hageziBlocklists.length; i++) {
			var blocklist = hageziBlocklists[i];
			o.value(hageziBaseUrl + blocklist.filename + '-onlydomains.txt', blocklist.name);
		}

		o = s.taboption(
			'general',
			form.DynamicList,
			'blocklist_urls',
			_('Other blocklist urls'),
			_('dnsmasq blocklist urls')
		);
		o.optional = true;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.DynamicList,
			'allowlist_urls',
			_('Allowlist urls'),
			_('dnsmasq allowlist urls')
		);
		o.optional = true;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Value,
			'max_file_part_size_KB',
			_('Max file size (KB)'),
			_('Maximum size of any individual downloaded blocklist part')
		);
		o.datatype = 'min(1)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Value,
			'max_blocklist_file_size_KB',
			_('Max total size (KB)'),
			_('Maximum total size of combined, processed blocklist')
		);
		o.datatype = 'min(1)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Value,
			'min_good_line_count',
			_('Min good lines'),
			_('Minimum number of good lines in final postprocessed blocklist')
		);
		o.datatype = 'min(1)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Flag,
			'deduplication',
			_('Deduplication'),
			_('Whether to perform sorting and deduplication of entries (usually doesn\'t cause much slowdown, uses a bit more memory)')
		);

		o = s.taboption(
			'general',
			form.Flag,
			'use_compression',
			_('Use compression'),
			_('Compress final blocklist, intermediate blocklist parts and the backup blocklist to save memory')
		);

		o = s.taboption(
			'general',
			form.Flag,
			'initial_dnsmasq_restart',
			_('Restart dnsmasq'),
			_('Restart dnsmasq if previous blocklist was extracted and before generation of new blocklist thereby to free up memory during generaiton of new blocklist')
		);

		o = s.taboption(
			'general',
			form.Flag,
			'enable_custom_script',
			_('Enable custom script'),
			_('Call custom resport_success() and report_failure() functions when certain commands complete.<br />See <b>Custom Script</b> tab for more details.')
		);

		/*
			advanced tab
		*/
		o = s.taboption(
			'advanced',
			form.ListValue,
			'list_part_failed_action',
			_('List part failed action'),
			_('This option applies to blocklist/allowlist parts which failed to download or couldn\'t pass validation checks<br />\
				SKIP - skip failed blocklist file part and continue blocklist generation<br />\
				STOP - stop blocklist generation (and fall back to previous blocklist if available)'),
		);
		o.value('SKIP');
		o.value('STOP');

		o = s.taboption(
			'advanced',
			form.Value,
			'max_download_retries',
			_('Max download retries'),
			_('Maximum number of download retries')
		);
		o.datatype = 'min(0)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.Value,
			'min_blocklist_part_line_count',
			_('Min blocklist part line count'),
			_('Mininum number of lines of any individual downloaded part')
		);
		o.datatype = 'min(1)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.Value,
			'min_allowlist_part_line_count',
			_('Min allowlist part line count'),
			_('Mininum number of lines of any individual downloaded part')
		);
		o.datatype = 'min(1)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.Value,
			'boot_start_delay_s',
			_('Boot start delay (seconds)'),
			_('Start delay in seconds when service is started from system boot')
		);
		o.datatype = 'min(0)';
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		if (status) {
			return Promise.all([status.render(), m.render()]);
		} else {
			return m.render();
		}
	},
});
