'use strict';
'require view';
'require form';
'require fs';
'require ui';

let m, data;

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

function parseConfig(config) {
	// Default configuration options
	var obj = {
		'blocklist_urls': [
			'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/dnsmasq/light.txt'
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
	}

	// Set the data variable in the format needed by form.JSONMap()
	return { 'config': obj };
}

return view.extend({
	load: function () {
		return Promise.all([
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['luci_status']), ''),
			L.resolveDefault(fs.read_direct('/root/adblock-lean/config'), '')
		]);
	},
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
				// Grab values for keys that might not exist
				// var blocklist_urls = data.config.blocklist_urls ? data.config.blocklist_urls.join(' ') : "";
				// var allowlist_urls = data.config.allowlist_urls ? data.config.allowlist_urls.join(' ') : "";
				// var compress_blocklist = data.config.compress_blocklist ? 1 : 0;
				// var initial_dnsmasq_restart = data.config.initial_dnsmasq_restart ? 1 : 0;

				var config = '# adblock-lean configuration options\n\
\n\
# One or more dnsmasq blocklist urls separated by spaces\n\
blocklist_urls="' + (data.config.blocklist_urls ?? []).join(' ') + '"\n\
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
report_failure="' + (data.config.report_failure ?? '') + '"\n\
report_success="' + (data.config.report_success ?? '') + '"\n\
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
	render: function (arr) {
		let s, o;

		var status = new form.JSONMap(data, 'AdBlock Lean - Status');
		s = status.section(form.NamedSection, 'global');
		s.render = L.bind(async function (view, section_id) {
			var json = JSON.parse(arr[0]);
			
			var status_label;
			switch (json.status) {
				case 0: status_label = 'OK'; break;
				case 1: status_label = 'ERROR: dnsmasq not started'; break;
				case 2: status_label = 'ERROR: Test domain lookup failed'; break;
				case 3: status_label = 'ERROR: Test domain resolved to 0.0.0.0'; break;
				case 4: status_label = 'ERROR: adblock-lean not started'; break;
				default: status_label = 'Unknown'; break;
			}

			var update_status_label;
			switch (json.update_status) {
				case 0: update_status_label = 'Up to date'; break;
				case 1: update_status_label = 'Update available'; break;
				case 2: update_status_label = 'Error checking'; break;
				default: update_status_label = 'Unknown'; break;
			}

			return E(
				"table",
				{ class: "table", id: "adblock-fast_status_table" },
				[
					E("tr", { class: "tr table-titles" }, [
						E("th", { class: "th" }, _("Status")),
						E("th", { class: "th" }, _("Blocklist line count")),
						E("th", { class: "th" }, _("Update status")),
					]),
					E("tr", { class: "tr" }, [
						E("td", { class: "td" }, status_label),
						E("td", { class: "td" }, json.good_line_count),
						E("td", { class: "td" }, update_status_label),
					]),
				]
			);
		}, o, this);

		// Setup the form inputs for each config option
		data = parseConfig(arr[1]);
		m = new form.JSONMap(data, 'AdBlock Lean - Configuration', _('Configuration of the AdBlock Lean package. \
			For further information please check the <a style="color:#37c;font-weight:bold;" href="https://github.com/lynxthecat/adblock-lean" target="_blank" rel="noreferrer noopener" >online documentation</a>'));

		s = m.section(
			form.NamedSection,
			'config',
			'adblock-lean-section'
		);

		o = s.option(
			form.DynamicList,
			'blocklist_urls',
			_('Blocklist Urls'),
			_('One or more dnsmasq blocklist urls')
		);
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.DynamicList,
			'allowlist_urls',
			_('Allowlist Urls'),
			_('Zero or more dnsmasq allowlist urls')
		);
		o.optional = true;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Value,
			'min_blocklist_file_part_line_count',
			_('Min line count'),
			_('Mininum number of lines of any individual downloaded blocklist part (1-100000)') // TODO range
		);
		o.datatype = 'range(1,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Value,
			'max_blocklist_file_part_size_KB',
			_('Max file size (KB)'),
			_('Maximum size of any individual downloaded blocklist part (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Value,
			'max_blocklist_file_size_KB',
			_('Max total size (KB)'),
			_('Maximum total size of combined, processed blocklist (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Value,
			'min_good_line_count',
			_('Min good lines'),
			_('Minimum number of good lines in final postprocessed blocklist (1-1000000)') // TODO range
		);
		o.datatype = 'range(1,1000000)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Flag,
			'compress_blocklist',
			_('Compress blocklist'),
			_('Compress blocklist to save memory once blocklist has been loaded')
		);

		o = s.option(
			form.Flag,
			'initial_dnsmasq_restart',
			_('Restart dnsmasq'),
			_('Restart dnsmasq if previous blocklist was extracted and before generation of new blocklist thereby to free up memory during generaiton of new blocklist')
		);

		o = s.option(
			form.Value,
			'max_download_retries',
			_('Max download retries'),
			_('Maximum number of download retries (1-5)') // TODO range
		);
		o.datatype = 'range(1,5)'; // TODO range
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.ListValue,
			'download_failed_action',
			_('Download failed action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');

		o = s.option(
			form.ListValue,
			'rogue_element_action',
			_('Rogue element action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)<br /> \
			   IGNORE - ignore any rogue elements (warning: use with caution)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');
		o.value('IGNORE');

		o = s.option(
			form.ListValue,
			'dnsmasq_test_failed_action',
			_('"dnsmasq --test" failed action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');

		o = s.option(
			form.Value,
			'report_failure',
			_('Report failure'),
		);
		o.datatype = 'string';

		o = s.option(
			form.Value,
			'report_success',
			_('Report success'),
			_("The following shell variables are invoked using: \
			   'eval \${report_failure}' and 'eval \${report_success}' \
			   thereby to facilitate sending e.g. mailsend/sms notifications. \
			   The variables '\${failure_msg}' and '\${success_msg}' can be employed")
		);
		o.datatype = 'string';

		o = s.option(
			form.Value,
			'boot_start_delay_s',
			_('Boot start delay (s)'),
			_('Start delay in seconds when service is started from system boot (0-300)') // TODO range
		);
		o.datatype = 'range(0,300)'; // TODO range		
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		return Promise.all([status.render(), m.render()]);
	},
	handleSaveApply: null,
	handleReset: null
});
