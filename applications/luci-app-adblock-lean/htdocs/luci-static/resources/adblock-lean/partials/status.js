'use strict';
'require baseclass';
'require fs';
'require ui';
'require adblock-lean.config as config';
'require adblock-lean.rpc as rpc';

var statusClass = baseclass.extend({
	showButtons: false,
	showTitle: false,

	statusResult: null,
	latestLuciAppResult: null,
	
	handleAction: async function(actionName, actionLabel) {
		ui.showModal(null, [
			E('p',
				{ class: 'spinning' },
				_(actionLabel + ' AdBlock Lean...')
			),
		]);
		await fs.exec_direct('/etc/init.d/adblock-lean', [actionName]);
		location.reload();
	},
	
	handleRpc: async function(actionFunc, actionLabel) {
		ui.showModal(null, [
			E('p',
				{ class: 'spinning' },
				actionLabel
			),
		]);
		L.resolveDefault(actionFunc()).then(function (result) { location.reload() });
	},
	
	setLuciAppUpdateStatus: function(showButtons) {
		if (this.statusResult && this.latestLuciAppResult) {
			var updateStatus = document.getElementById('laabl-update-status');
	
			/*
			If the luci app is not installed, then this.statusResult.laabl_package_info will be blank.
			This shouldn't ever happen to anyone but me, so we'll report it as an error condition.
			*/
			if (!this.statusResult.laabl_package_info) {
				updateStatus.textContent = _('An error occurred while checking update status (missing package info)');
				return;
			}
	
			/*
			this.statusResult.laabl_package_info will look like this:
				Package: luci-app-adblock-lean
				Version: git-24.229.78998-f9aed0d
				Depends: libc, luci-base
				Status: install user installed
				Architecture: all
				Installed-Time: 1723846085
			So we need to parse the Version: line
			*/
			var currentVersion = this.statusResult.laabl_package_info.match(/Version[:]\s?(.*?)\s/)[1];
			if (!currentVersion) {
				updateStatus.textContent = _('An error occurred while checking update status (missing current version)');
				return;
			}
	
			/*
			this.latestLuciAppResult will contain this (snipped irrelevant bits):
				{
					"assets": [
						{
							"name": "luci-app-adblock-lean_git-24.229.78998-f9aed0d_all.ipk",
							"browser_download_url": "https://github.com/rickparrish/luci-app-adblock-lean/releases/download/latest/luci-app-adblock-lean_git-24.229.78998-f9aed0d_all.ipk"
						}
					],
				}
			So we need to check assets[0].name to see if it contains currentVersion.  If it does, we're up to date.  If it doesn't, we can update using assets[0].browser_download_url
			*/
			if (this.latestLuciAppResult.assets[0].name.indexOf(currentVersion) == -1) {
				updateStatus.textContent = _('An update is available');
	
				if (showButtons) {
					document.getElementById('update-laabl-button').style.display = 'inline-block';
				}
			} else {
				updateStatus.textContent = _('Up to date');
			}
		}
	},
	
	updateAdblockLean: async function () {
		await rpc.updateAdblockLean(this.latestLuciAppResult.assets[0].browser_download_url);
	},
	
	render: function () {
		// Build the title element, if showTitle is true
		var titleElement = this.showTitle ? E('h2', {}, _('AdBlock Lean - Status')) : E('div');

		// Build the table element with the status placeholders
		var tableElement = E('table', { 'class': 'table', 'style': 'margin-bottom: 5px;' }, [
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('Service Status')),
				E('td', { 'class': 'td left spinning', 'id': 'service-status' }, '\xa0')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('Blocklist Status')),
				E('td', { 'class': 'td left', 'id': 'blocklist-status' }, '-')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('dnsmasq Status')),
				E('td', { 'class': 'td left', 'id': 'dnsmasq-status' }, '-')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('AdBlock Lean Update Status')),
				E('td', { 'class': 'td left', 'id': 'abl-update-status' }, '-')
			]),
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('LuCI App Update Status')),
				E('td', { 'class': 'td left', 'id': 'laabl-update-status' }, '-')
			]),
		]);

		// Build the button element collection, if showButtons is true
		var buttonElements = E('div');
		if (this.showButtons) {
			buttonElements = E('div', { class: 'right' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('enable', 'Enabling'); }),
					'style': 'display: none',
					'id': 'enable-button',
				}, [_('Enable Service')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('disable', 'Disabling'); }),
					'style': 'display: none',
					'id': 'disable-button',
				}, [_('Disable Service')]),
				'\xa0',
				'\xa0',
				'\xa0',
				'\xa0',
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('start', 'Activating'); }),
					'style': 'display: none',
					'id': 'start-button',
				}, [_('Activate Blocklist')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('resume', 'Resuming'); }),
					'style': 'display: none',
					'id': 'resume-button',
				}, [_('Resume Blocklist')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('pause', 'Pausing'); }),
					'style': 'display: none',
					'id': 'pause-button',
				}, [_('Pause Blocklist')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('stop', 'Deactivating'); }),
					'style': 'display: none',
					'id': 'stop-button',
				}, [_('Deactivate Blocklist')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-reload',
					'click': ui.createHandlerFn(this, function () { return this.handleAction('reload', 'Reloading'); }),
					'style': 'display: none',
					'id': 'reload-button',
				}, [_('Reload Blocklist')]),
				'\xa0',
				'\xa0',
				'\xa0',
				'\xa0',
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, function () { return this.handleRpc(rpc.updateAdblockLean, 'Updating AdBlock Lean...'); }),
					'style': 'display: none',
					'id': 'update-abl-button',
				}, [_('Update AdBlock Lean')]),
				E('button', {
					'class': 'btn cbi-button cbi-button-action',
					'click': ui.createHandlerFn(this, function () { return this.handleRpc(this.updateLuciApp, 'Updating LuCI App...'); }),
					'style': 'display: none',
					'id': 'update-laabl-button',
				}, [_('Update LuCI App')]),
			]);
		}
		
		// Combine the various elements into our result variable
		var result = E([
			titleElement,
			tableElement,
			buttonElements
		]);

		// Call the getStatus() method via RPC, then update the status placeholders with the result
		var that = this;
		L.resolveDefault(rpc.getStatus())
			.then(function (result) {
				var serviceStatus = document.getElementById('service-status');
				serviceStatus.classList.remove('spinning');
				switch (result.service_status) {
					case 0:
						serviceStatus.textContent = _('AdBlock Lean will autostart on boot');
						if (that.showButtons) {
							document.getElementById('disable-button').style.display = 'inline-block';
						}
						break;
					case 1:
						serviceStatus.textContent = _('AdBlock Lean will NOT autostart on boot');
						if (that.showButtons) {
							document.getElementById('enable-button').style.display = 'inline-block';
						}
						break;
					case 2:
						serviceStatus.textContent = _('AdBlock Lean is not installed');
						break;
					default:
						serviceStatus.textContent = _('Unknown');
						break;
				}

				if (result.service_status !== 2) {
					var dnsmasqStatus = document.getElementById('dnsmasq-status');
					switch (result.dnsmasq_status) {
						case 0:
							dnsmasqStatus.textContent = _('dnsmasq is running');
							break;
						case 1:
							dnsmasqStatus.textContent = _('dnsmasq is NOT running');
							break;
						case 2:
							dnsmasqStatus.textContent = _('ERROR: Test domain lookup failed');
							break;
						case 3:
							dnsmasqStatus.textContent = _('ERROR: Test domain resolved to 0.0.0.0');
							break;
						default:
							dnsmasqStatus.textContent = 'Unknown';
							break;
					}

					var blocklistStatus = document.getElementById('blocklist-status');
					switch (result.blocklist_status) {
						case 0:
							blocklistStatus.textContent = _('Blocklist is active.  Good line count: %s.  Last updated %d hour(s) ago.')
								.format(result.blocklist_line_count.toLocaleString(), Math.round(result.blocklist_age_s / 3600.0, 1));
							if (that.showButtons) {
								document.getElementById('pause-button').style.display = 'inline-block';
								document.getElementById('stop-button').style.display = 'inline-block';
								document.getElementById('reload-button').style.display = 'inline-block';
							}
							break;
						case 1:
							blocklistStatus.textContent = _('Error checking blocklist status, try again in a minute');
							break;
						case 2:
							blocklistStatus.textContent = _('AdBlock Lean is performing an action: %s').format(result.pid_action);
							break;
						case 3:
							blocklistStatus.textContent = _('Blocklist is NOT active (paused)');
							if (that.showButtons) {
								document.getElementById('resume-button').style.display = 'inline-block';
								document.getElementById('stop-button').style.display = 'inline-block';
							}
							break;
						case 4:
							blocklistStatus.textContent = _('Blocklist is NOT active (stopped)');
							if (that.showButtons) {
								document.getElementById('start-button').style.display = 'inline-block';
							}
							break;
						default:
							blocklistStatus.textContent= _('Unknown');
							break;
					}

					var updateStatus = document.getElementById('abl-update-status');
					switch (result.update_status) {
						case 0:
							updateStatus.textContent = _('Up to date');
							break;
						case 1:
							if (result.update_config_format > config.supportedConfigFormat) {
								updateStatus.textContent = _('An update is available, but it uses a newer config format than the LuCI App supports,\
									so you will need to update the LuCI App before you can install the latest AdBlock Lean');
							} else {
								updateStatus.textContent = _('An update is available');
							
								if (that.showButtons) {
									document.getElementById('update-abl-button').style.display = 'inline-block';
								}
							}
							break;
						case 2:
							updateStatus.textContent = _('An error occurred while checking update status (checking adblock-lean status)');
							break;
						default:
							updateStatus.textContent = _('Unknown');
							break;
					}
				}

				that.statusResult = result;
				that.setLuciAppUpdateStatus(that.showButtons);
			}
		);

		// Get the latest luci-app-adblock-lean release details
		L.get('https://api.github.com/repos/rickparrish/luci-app-adblock-lean/releases/tags/latest', '', function(xhr, data) {
			if (data) {
				that.latestLuciAppResult = data;
				that.setLuciAppUpdateStatus(that.showButtons);
			} else {
				var updateStatus = document.getElementById('laabl-update-status');
				updateStatus.textContent = _('An error occurred while checking update status (checking luci-app-adblock-lean status)');
			}
		});

		return result;
	},
});

return L.Class.extend({
	partial: statusClass,
});