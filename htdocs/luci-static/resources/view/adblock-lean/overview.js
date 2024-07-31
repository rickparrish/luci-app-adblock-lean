'use strict';
'require view';
'require form';
'require fs';
'require ui';
"require rpc";

let m, data;

var hageziBaseUrl = 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/dnsmasq/';
var hageziBlocklists = [
	{ filename: 'light.txt', name: 'Multi LIGHT' },
	{ filename: 'multi.txt', name: 'Multi NORMAL' },
	{ filename: 'pro.txt', name: 'Multi PRO' },
	{ filename: 'pro.mini.txt', name: 'Multi PRO mini' },
	{ filename: 'pro.plus.txt', name: 'Multi PRO++' },
	{ filename: 'pro.plus.mini.txt', name: 'Multi PRO++ mini ' },
	{ filename: 'ultimate.txt', name: 'Multi ULTIMATE' },
	{ filename: 'ultimate.mini.txt', name: 'Multi ULTIMATE mini ' },
	{ filename: 'fake.txt', name: 'Fake' },
	{ filename: 'popupads.txt', name: 'Pop-Up Ads' },
	{ filename: 'tif.txt', name: 'Threat Intelligence Feeds' },
	{ filename: 'tif.medium.txt', name: 'Threat Intelligence Feeds - Medium' },
	{ filename: 'tif.mini.txt', name: 'Threat Intelligence Feeds - Mini' },
	{ filename: 'tif-ips.txt', name: 'Threat Intelligence Feeds - IPs' },
	{ filename: 'doh-vpn-proxy-bypass.txt', name: 'DoH/VPN/TOR/Proxy Bypass' },
	{ filename: 'doh.txt', name: 'Encrypted DNS Servers' },
	{ filename: 'nosafesearch.txt', name: 'Safesearch not supported' },
	{ filename: 'dyndns.txt', name: 'Dynamic DNS' },
	{ filename: 'hoster.txt', name: 'Badware Hoster' },
	{ filename: 'anti.piracy.txt', name: 'Anti Piracy' },
	{ filename: 'gambling.txt', name: 'Gambling' },
	{ filename: 'gambling.medium.txt', name: 'Gambling - Medium' },
	{ filename: 'gambling.mini.txt', name: 'Gambling - Mini' },
	{ filename: 'native.amazon.txt', name: 'Native Tracker - Amazon' },
	{ filename: 'native.apple.txt', name: 'Native Tracker - Apple' },
	{ filename: 'native.huawei.txt', name: 'Native Tracker - Huawei' },
	{ filename: 'native.winoffice.txt', name: 'Native Tracker - Microsoft' },
	{ filename: 'native.tiktok.txt', name: 'Native Tracker - TikTok' },
	{ filename: 'native.tiktok.extended.txt', name: 'Native Tracker - TikTok Aggressive' },
	{ filename: 'native.lgwebos.txt', name: 'Native Tracker - LG webOS' },
	{ filename: 'native.vivo.txt', name: 'Native Tracker - Vivo' },
	{ filename: 'native.oppo-realme.txt', name: 'Native Tracker - OPPO/Realme' },
	{ filename: 'native.xiaomi.txt', name: 'Native Tracker - Xiomi' },
];

function cleanValue(value) {
	// Remove inline comments
	// TODO This will break if a string value contains a #
	var hashPos = value.indexOf('#');
	if (hashPos == 0) {
		value = '';
	} else if (hashPos >= 1) {
		value = value.substring(0, hashPos).trim();
	}

	// Remove quotation marks surrounding string values
	// From: https://stackoverflow.com/a/18268011
	if (value.indexOf('"') >= 0) {
		value = value.trim().replace(/^"?|"?$/g, '');
	}

	return value;
}

var getStatus = rpc.declare({
	object: "luci.adblock-lean",
	method: "getStatus",
	params: [],
});

async function handleAction(actionName, actionLabel) {
	ui.showModal(null, [
		E("p",
			{ class: "spinning" },
			_(actionLabel + " AdBlock Lean")
		),
	]);
	await fs.exec_direct('/etc/init.d/adblock-lean', [actionName]);
	location.reload();
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
	// Default configuration options
	var obj = {
		'blocklist_urls': [
			hageziBaseUrl + 'pro.txt',
			hageziBaseUrl + 'tif.mini.txt'
		],
		'allowlist_urls': [
		],
		'local_allowlist_path': '',
		'local_blocklist_path': '',
		'min_blocklist_file_part_line_count': 1,
		'max_blocklist_file_part_size_KB': 20000,
		'max_blocklist_file_size_KB': 30000,
		'min_good_line_count': 100000,
		'compress_blocklist': 1,
		'initial_dnsmasq_restart': 0,
		'max_download_retries': 3,
		'download_failed_action': 'SKIP_PARTIAL',
		'rogue_element_action': 'SKIP_PARTIAL',
		'dnsmasq_test_failed_action': 'SKIP_PARTIAL',
		'report_failure': '',
		'report_success': '',
		'boot_start_delay_s': 120,
	};
	var expectedKeys = Object.keys(obj).sort().join(';');

	if (config) {
		// Parse the config file format, converting the key=value lines into an object
		// From: https://stackoverflow.com/a/52043870
		obj = config
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

		// Ensure the expected keys and parsed keys match
		// TODO This check probably needs to be more nuanced.  What I want to avoid is a situation where
		//      adblock-lean adds a new config option that this app doesn't know about yet, to ensure this
		//      app doesn't rewrite an outdated config file format and lose some options in the process.
		//      But the current check would also error out in the situation where adblock-lean is updated
		//      with a new config option, and this app does know about it, but the user's config file doesn't
		//      have an entry for that new option yet.  That shouldn't be considered an error scenario, that
		//      should just prepopulate the form with a sane default for the new config option.
		//      That also means we can't do obj = config.split().filter().map().reduce() above, because that
		//      would clobber the sane default previously set in the var obj = { ... } code.  Instead we'd
		//      have to use a temp object, then loop through its keys to update the values in obj.
		var parsedKeys = Object.keys(obj).sort().join(';');
		if (expectedKeys != parsedKeys) {
			console.log({expectedKeys, parsedKeys});

			// TODO Only going to warn via alert for now, since as mentioned above, the check needs to be improved
			// throw new Error('Did not parse expected keys from config file, see console log for details');
			alert('Warning: Did not parse expected keys from config file, see console log for details');
		}

		// *_urls need to be an array, not a space-separated string
		obj.allowlist_urls = obj.allowlist_urls ? obj.allowlist_urls.split(' ') : [];
		obj.blocklist_urls = obj.blocklist_urls ? obj.blocklist_urls.split(' ') : [];

		// We have a friendly Hagezi Blocklists multi-select, so we need to split those in blocklist_urls into hagezi_blocklists
		obj.hagezi_blocklists = [];
		var nonHageziBlocklists = [];
		for (var i = 0; i < obj.blocklist_urls.length; i++) {
			if (obj.blocklist_urls[i].startsWith(hageziBaseUrl)) {
				obj.hagezi_blocklists.push(obj.blocklist_urls[i]);
			} else {
				nonHageziBlocklists.push(obj.blocklist_urls[i]);
			}
		}
		obj.blocklist_urls = nonHageziBlocklists;
	}

	// Set the data variable in the format needed by form.JSONMap()
	return { 'config': obj };
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

				var config = '# adblock-lean configuration options\n\
\n\
# One or more dnsmasq blocklist urls separated by spaces\n\
blocklist_urls="' + combined_blocklist_urls.join(' ') + '"\n\
\n\
# One or more allowlist urls separated by spaces\n\
allowlist_urls="' + (data.config.allowlist_urls ?? []).join(' ') + '"\n\
\n\
# Path to optional local allowlist/blocklist files in the form:\n\
# site1.com\n\
# site2.com\n\
local_allowlist_path="' + data.config.local_allowlist_path + '"\n\
local_blocklist_path="' + data.config.local_blocklist_path + '"\n\
\n\
# Mininum number of lines of any individual downloaded blocklist part\n\
min_blocklist_file_part_line_count=' + data.config.min_blocklist_file_part_line_count + '\n\
# Maximum size of any individual downloaded blocklist part\n\
max_blocklist_file_part_size_KB=' + data.config.max_blocklist_file_part_size_KB + '\n\
# Maximum total size of combined, processed blocklist\n\
max_blocklist_file_size_KB=' + data.config.max_blocklist_file_size_KB + '\n\
# Minimum number of good lines in final postprocessed blocklist\n\
min_good_line_count=' + data.config.min_good_line_count + '\n\
\n\
# compress blocklist to save memory once blocklist has been loaded\n\
compress_blocklist=' + ((data.config.compress_blocklist ?? false) ? '1' : '0') + ' # enable (1) or disable (0) blocklist compression\n\
\n\
# restart dnsmasq if previous blocklist was extracted and before generation of\n\
# new blocklist thereby to free up memory during generaiton of new blocklist\n\
initial_dnsmasq_restart=' + ((data.config.initial_dnsmasq_restart ?? false) ? '1' : '0') + ' # enable (1) or disable (0) initial dnsmasq restart\n\
\n\
# Maximum number of download retries\n\
max_download_retries=' + data.config.max_download_retries + '\n\
\n\
# Download failed action:\n\
# SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation\n\
# STOP - stop blocklist generation (and fallback to previous blocklist if available)\n\
download_failed_action="' + data.config.download_failed_action + '"\n\
\n\
# Rogue element action:\n\
# SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation\n\
# STOP - stop blocklist generation (and fallback to previous blocklist if available)\n\
# IGNORE - ignore any rogue elements (warning: use with caution)\n\
rogue_element_action="' + data.config.rogue_element_action + '"\n\
\n\
# dnsmasq --test failed action:\n\
# SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation\n\
# STOP - stop blocklist generation (and fallback to previous blocklist if available)\n\
dnsmasq_test_failed_action="' + data.config.dnsmasq_test_failed_action + '"\n\
\n\
# The following shell variables are invoked using:\n\
# \'eval \${report_failure}\' and \'eval \${report_success}\'\n\
# thereby to facilitate sending e.g. mailsend/sms notifications\n\
# The variables \'\${failure_msg}\' and \'\${success_msg}\' can be employed\n\
report_failure="' + joinWithSemicolon(data.config.report_failure) + '"\n\
report_success="' + joinWithSemicolon(data.config.report_success) + '"\n\
\n\
# Start delay in seconds when service is started from system boot\n\
boot_start_delay_s=' + data.config.boot_start_delay_s + '\r\n';

				// Save config file
				return fs.write('/root/adblock-lean/config', config)
					.then(function () {
						document.body.scrollTop = document.documentElement.scrollTop = 0;
						ui.addNotification(null, E('p', _('Config modifications have been saved, reload adblock-lean for changes to take effect.')), 'success');
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
			L.resolveDefault(fs.read_direct('/root/adblock-lean/config'), '')
		]);
	},

	render: function (arr) {
		let s, o;
		var status;

		if (arr[0] == '') {
			// Display a message saying config doesn't exist yet
			ui.addNotification(null, E('p', 
				_('Your AdBlock Lean configuration file does not exist.  Review the options below \
					and click <strong>Save</strong> to configure AdBlock Lean now.')
			), 'info');
		} else {
			// Wrap in try..catch so we can warn the user if the getStatus call failed to return valid json
			try {
				status = new form.JSONMap(data, 'AdBlock Lean - Status');
				s = status.section(form.NamedSection, 'global');
				s.render = L.bind(async function (view, section_id) {
					return E('div', { 'class': 'cbi-section' }, [
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title', 'style': 'margin-bottom:-5px;font-weight:bold;padding-top:0rem;' }, _('Service Status')),
							E('div', { 'class': 'cbi-value-field spinning', 'id': 'service-status', 'style': 'margin-bottom:-5px;color:#37c;font-weight:bold;' }, '\xa0')
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title', 'style': 'margin-bottom:-5px;font-weight:bold;padding-top:0rem;' }, _('Blocklist Status')),
							E('div', { 'class': 'cbi-value-field', 'id': 'blocklist-status', 'style': 'margin-bottom:-5px;color:#37c;font-weight:bold;' }, '-')
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title', 'style': 'margin-bottom:-5px;font-weight:bold;padding-top:0rem;' }, _('dnsmasq Status')),
							E('div', { 'class': 'cbi-value-field', 'id': 'dnsmasq-status', 'style': 'margin-bottom:-5px;color:#37c;font-weight:bold;' }, '-')
						]),
						E('div', { 'class': 'cbi-value' }, [
							E('label', { 'class': 'cbi-value-title', 'style': 'margin-bottom:-5px;font-weight:bold;padding-top:0rem;' }, _('Update Status')),
							E('div', { 'class': 'cbi-value-field', 'id': 'update-status', 'style': 'margin-bottom:-5px;color:#37c;font-weight:bold;' }, '-')
						]),
						E('div', { class: 'right' }, [
							E('button', {
								'id': 'enable-button',
								'class': 'btn cbi-button cbi-button-positive',
								'disabled': 'disabled',
								'click': ui.createHandlerFn(this, function () {
									return handleAction('enable', 'Enabling');
								})
							}, [_('Enable Service')]),
							'\xa0',
							E('button', {
								'id': 'disable-button',
								'class': 'btn cbi-button cbi-button-negative',
								'disabled': 'disabled',
								'click': ui.createHandlerFn(this, function () {
									return handleAction('disable', 'Disabling');
								})
							}, [_('Disable Service')]),
							'\xa0',
							'\xa0',
							'\xa0',
							'\xa0',
							E('button', {
								'id': 'start-button',
								'class': 'btn cbi-button cbi-button-positive',
								'disabled': 'disabled',
								'click': ui.createHandlerFn(this, function () {
									return handleAction('start', 'Activating');
								})
							}, [_('Activate Blocklist')]),
							'\xa0',
							E('button', {
								'id': 'stop-button',
								'class': 'btn cbi-button cbi-button-negative',
								'disabled': 'disabled',
								'click': ui.createHandlerFn(this, function () {
									return handleAction('stop', 'Deactivating');
								})
							}, [_('Deactivate Blocklist')]),
							'\xa0'
						])
					]);
				}, o, this);

				L.resolveDefault(getStatus())
					.then(function (result) {
						var service_status_label = document.getElementById('service-status');
						switch (result.service_status) {
							case 0: 
								service_status_label.textContent = _('AdBlock Lean will autostart on boot'); 
								document.getElementById('disable-button').removeAttribute('disabled');
								break;
							case 1: 
								service_status_label.textContent = _('AdBlock Lean will NOT autostart on boot'); 
								document.getElementById('enable-button').removeAttribute('disabled');
								break;
							case 2: 
								service_status_label.textContent = _('AdBlock Lean is not installed'); 
								break;
							default: 
								service_status_label.textContent = _('Unknown'); 
								break;
						}
						service_status_label.classList.remove('spinning');

						if (result.service_status !== 2) {
							var dnsmasq_status_label = document.getElementById('dnsmasq-status');
							switch (result.dnsmasq_status) {
								case 0: dnsmasq_status_label.textContent = _('dnsmasq is running'); break;
								case 1: dnsmasq_status_label.textContent = _('dnsmasq is NOT running'); break;
								case 2: dnsmasq_status_label.textContent = _('ERROR: Test domain lookup failed'); break;
								case 3: dnsmasq_status_label.textContent = _('ERROR: Test domain resolved to 0.0.0.0'); break;
								default: dnsmasq_status_label.textContent = 'Unknown'; break;
							}

							var blocklist_status_label = document.getElementById('blocklist-status');
							switch (result.blocklist_status) {
								case 0: 
									blocklist_status_label.textContent = _('Blocklist is active.  Good line count: %s.  Last updated %d hour(s) ago.').format(result.blocklist_line_count.toLocaleString(), Math.round(result.blocklist_age_s / 3600.0, 1)); 
									document.getElementById('stop-button').removeAttribute('disabled');
									break;
								case 1: 
									blocklist_status_label.textContent = _('Blocklist is NOT active'); 
									document.getElementById('start-button').removeAttribute('disabled');
									break;
								default: 
									blocklist_status_label.textContent= _('Unknown'); 
									break;
							}

							var update_status_label = document.getElementById('update-status');
							switch (result.update_status) {
								case 0: update_status_label.textContent = _('AdBlock Lean is up to date'); break;
								case 1: update_status_label.textContent = _('An AdBlock Lean update available'); break;
								case 2: update_status_label.textContent = _('ERROR: An error occurred while checking for an AdBlock Lean update'); break;
								default: update_status_label.textContent = _('Unknown'); break;
							}
						}
					}
				);
			} catch (err) {
				console.log({arr, err});

				// The most likely cause for entering this catch is that getStatus failed to run, and the most likely reason
				// for that is because the config file is malformed.  One such cause is the user entering a report_failure
				// or report_success without escaping special character correctly, so we'll tell them to go take a look at
				// the raw config file and fix as needed.
				ui.addNotification(null, E('p', 
					_('ERROR: Failed to get status, which may be because the AdBlock Lean conf gile is malformed. \
					One known cause is entering a <strong>Report failure</strong> or <strong>Report success</strong> \
					command that fails to escape special characters correctly.  Click the <strong>Config</strong> tab \
					at the top of this page to view your raw config file, and fix as necessary.')
				), 'danger');
			}
		}

		// Setup the form inputs for each config option
		data = parseConfig(arr[0]);
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
			o.value(hageziBaseUrl + blocklist.filename, blocklist.name);
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
			'max_blocklist_file_part_size_KB',
			_('Max file size (KB)'),
			_('Maximum size of any individual downloaded blocklist part (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Value,
			'max_blocklist_file_size_KB',
			_('Max total size (KB)'),
			_('Maximum total size of combined, processed blocklist (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Value,
			'min_good_line_count',
			_('Min good lines'),
			_('Minimum number of good lines in final postprocessed blocklist (1-1000000)') // TODO range
		);
		o.datatype = 'range(1,1000000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'general',
			form.Flag,
			'compress_blocklist',
			_('Compress blocklist'),
			_('Compress blocklist to save memory once blocklist has been loaded')
		);

		o = s.taboption(
			'general',
			form.Flag,
			'initial_dnsmasq_restart',
			_('Restart dnsmasq'),
			_('Restart dnsmasq if previous blocklist was extracted and before generation of new blocklist thereby to free up memory during generaiton of new blocklist')
		);

		/*
			advanced tab
		*/
		o = s.taboption(
			'advanced',
			form.ListValue,
			'download_failed_action',
			_('Download failed action'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');

		o = s.taboption(
			'advanced',
			form.ListValue,
			'rogue_element_action',
			_('Rogue element action'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');
		o.value('IGNORE');

		o = s.taboption(
			'advanced',
			form.ListValue,
			'dnsmasq_test_failed_action',
			_('"dnsmasq --test" failed action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
				STOP - stop blocklist generation (and fallback to previous blocklist if available)<br /> \
				IGNORE - ignore any rogue elements (warning: use with caution)'),
		 );
		o.value('SKIP_PARTIAL');
		o.value('STOP');
		
		o = s.taboption(
			'advanced',
			form.Value,
			'max_download_retries',
			_('Max download retries'),
			_('Maximum number of download retries (1-5)') // TODO range
		);
		o.datatype = 'range(1,5)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.Value,
			'min_blocklist_file_part_line_count',
			_('Min line count'),
			_('Mininum number of lines of any individual downloaded blocklist part (1-100000)') // TODO range
		);
		o.datatype = 'range(1,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.Value,
			'boot_start_delay_s',
			_('Boot start delay (seconds)'),
			_('Start delay in seconds when service is started from system boot (0-300)') // TODO range
		);
		o.datatype = 'range(0,300)'; // TODO range		
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.taboption(
			'advanced',
			form.TextValue,
			'report_failure',
			_('Report failure'),
		);
		o.datatype = 'string';
		o.rows = 5;

		o = s.taboption(
			'advanced',
			form.TextValue,
			'report_success',
			_('Report success'),
			_("The following shell variables are invoked using: \
			   'eval \${report_failure}' and 'eval \${report_success}' \
			   thereby to facilitate sending e.g. mailsend/sms notifications. \
			   The variables '\${failure_msg}' and '\${success_msg}' can be employed<br /> \
			   <strong>NB: Don't forget to escape special chars like \" and $ as necessary.</strong>")
		);
		o.datatype = 'string';
		o.rows = 5;

		if (status) {
			return Promise.all([status.render(), m.render()]);
		} else {
			return m.render();
		}
	},
});
