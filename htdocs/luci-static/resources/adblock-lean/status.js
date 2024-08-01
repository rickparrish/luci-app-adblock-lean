'use strict';
'require baseclass';
'require fs';
'require rpc';
'require ui';

var getStatus = rpc.declare({
	object: 'luci.adblock-lean',
	method: 'getStatus',
	params: [],
});

async function handleAction(actionName, actionLabel) {
	ui.showModal(null, [
		E('p',
			{ class: 'spinning' },
			_(actionLabel + ' AdBlock Lean')
		),
	]);
	await fs.exec_direct('/etc/init.d/adblock-lean', [actionName]);
	location.reload();
}

var statusClass = baseclass.extend({
	showButtons: false,

	showTitle: false,

	render: function () {
		// Build the title element, if showTitle is true
		var titleElement = this.showTitle ? E('h2', {}, _('AdBlock Lean - Status')) : E('div');

		// Build the table element with the status placeholders
		var tableElement = E('table', { 'class': 'table' }, [
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
				E('td', { 'class': 'td left', 'width': '33%' }, _('Update Status')),
				E('td', { 'class': 'td left', 'id': 'update-status' }, '-')
			]),
		]);

		// Build the button element collection, if showButtons is true
		var buttonElements = E('div');
		if (this.showButtons) {
			buttonElements = E('div', { class: 'right' }, [
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function () { return handleAction('enable', 'Enabling'); }),
					'disabled': 'disabled',
					'id': 'enable-button',
				}, [_('Enable Service')]),
				'\xa0',
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function () { return handleAction('disable', 'Disabling'); }),
					'disabled': 'disabled',
					'id': 'disable-button',
				}, [_('Disable Service')]),
				'\xa0',
				'\xa0',
				'\xa0',
				'\xa0',
				E('button', {
					'class': 'btn cbi-button cbi-button-positive',
					'click': ui.createHandlerFn(this, function () { return handleAction('start', 'Activating'); }),
					'disabled': 'disabled',
					'id': 'start-button',
				}, [_('Activate Blocklist')]),
				'\xa0',
				E('button', {
					'class': 'btn cbi-button cbi-button-negative',
					'click': ui.createHandlerFn(this, function () { return handleAction('stop', 'Deactivating'); }),
					'disabled': 'disabled',
					'id': 'stop-button',
				}, [_('Deactivate Blocklist')]),
				'\xa0'
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
		L.resolveDefault(getStatus())
			.then(function (result) {
				var serviceStatus = document.getElementById('service-status');
				serviceStatus.classList.remove('spinning');
				switch (result.service_status) {
					case 0:
						serviceStatus.textContent = _('AdBlock Lean will autostart on boot');
						if (that.showButtons) {
							document.getElementById('disable-button').removeAttribute('disabled');
						}
						break;
					case 1:
						serviceStatus.textContent = _('AdBlock Lean will NOT autostart on boot');
						if (that.showButtons) {
							document.getElementById('enable-button').removeAttribute('disabled');
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
								document.getElementById('stop-button').removeAttribute('disabled');
							}
							break;
						case 1:
							blocklistStatus.textContent = _('Blocklist is NOT active');
							if (that.showButtons) {
								document.getElementById('start-button').removeAttribute('disabled');
							}
							break;
						default:
							blocklistStatus.textContent= _('Unknown');
							break;
					}

					var updateStatus = document.getElementById('update-status');
					switch (result.update_status) {
						case 0:
							updateStatus.textContent = _('AdBlock Lean is up to date');
							break;
						case 1:
							updateStatus.textContent = _('An AdBlock Lean update available');
							break;
						case 2:
							updateStatus.textContent = _('ERROR: An error occurred while checking for an AdBlock Lean update');
							break;
						default:
							updateStatus.textContent = _('Unknown');
							break;
					}
				}
			}
		);

		return result;
	},
});

return L.Class.extend({
	status: statusClass,
});