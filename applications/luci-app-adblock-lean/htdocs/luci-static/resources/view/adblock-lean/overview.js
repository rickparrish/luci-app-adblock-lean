'use strict';
'require form';
'require fs';
'require ui';
'require view';
'require adblock-lean.config as config';
'require adblock-lean.hagezi as hagezi';
'require adblock-lean.helpers as helpers';
'require adblock-lean.missing-config as missingConfigClass';
'require adblock-lean.not-installed as notInstalledClass';
'require adblock-lean.rpc as rpc';
'require adblock-lean.status as statusClass';

return view.extend({
	// Holds the form.JSONMap, which is created during render() and accessed during save()
	formMap: null,

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
		this.formMap.save(function() { /* do nothing */ }, true).then((result) => {
			config.save();
		}).catch((error) => {
			document.body.scrollTop = document.documentElement.scrollTop = 0;
			ui.addNotification(null, E('p', _('Unable to save modifications: %s').format(error.message)), 'error');
		});
	},

	load: function () {
		return Promise.all([
			L.resolveDefault(fs.stat('/etc/init.d/adblock-lean'), ''),
			L.resolveDefault(rpc.checkConfig(), '')
		]);
	},

	render: async function (loadData) {
		var ablStatEntry = loadData[0];
		var checkConfigResult = loadData[1];

		// Check if adblock-lean is installed, and if not, display the install view
		if (!L.isObject(ablStatEntry)) {
			this.handleSave = null;
			return new notInstalledClass.view().render();
		}

		// Check if adblock-lean's config file exists, and if not, display the config-missing view
		await config.load();
		if (!config.loaded) {
			this.handleSave = null;
			return new missingConfigClass.view().render();
		}

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
				' + helpers.getUnorderedList(checkConfigResult.conf_fixes)));

			var buttonElement = E('button', {
				'class': 'btn cbi-button cbi-button-positive',
				'click': ui.createHandlerFn(this, function () { 
					ui.showModal(null, [
						E('p',
							{ class: 'spinning' },
							_('Updating AdBlock Lean configuration file')
						),
					]);
					L.resolveDefault(rpc.updateConfig())
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
				' + helpers.getUnorderedListWithHeader('Remove old entries:', checkConfigResult.unexp_entries) + '\
				' + helpers.getUnorderedListWithHeader('Add new entries:', checkConfigResult.missing_entries) + '\
				' + helpers.getUnorderedListWithHeader('Wrap values in double-quotes and/or remove inline comments:', checkConfigResult.legacy_entries) + '\
				' + helpers.getUnorderedListWithHeader('Add/update the config_format comment:', config_format_message)));

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
					L.resolveDefault(rpc.resetConfig())
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
		var status = new statusClass.view();
		status.showButtons = true;
		status.showTitle = true;

		// Ensure the config format matches the format we can support
		if (!config.hasSupportedConfigFormat) {
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
		this.formMap = new form.JSONMap(config.data, 'AdBlock Lean - Configuration', _('Configuration of the AdBlock Lean package. \
			For further information please check the <a style="font-weight: bold;" href="https://github.com/lynxthecat/adblock-lean/blob/master/README.md" target="_blank" rel="noreferrer noopener">online documentation</a>'));

		/*
			tabbed config section
		*/
		var s = this.formMap.section(form.NamedSection, 'config', 'adblock-lean-section');
		s.addremove = false;
		s.tab('general', _('General Settings'));
		s.tab('advanced', _('Advanced Settings'));
		
		/*
			general tab
		*/
		var o = s.taboption(
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

		for (var i = 0; i < hagezi.blocklists.length; i++) {
			var blocklist = hagezi.blocklists[i];
			o.value(hagezi.baseUrl + blocklist.filename + '-onlydomains.txt', blocklist.name);
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
			return Promise.all([status.render(), this.formMap.render()]);
		} else {
			return this.formMap.render();
		}
	},
});
