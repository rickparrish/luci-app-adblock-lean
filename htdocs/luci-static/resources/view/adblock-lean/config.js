'use strict';
'require fs';
'require ui';
'require view';

return view.extend({
	handleReset: null,

	handleSaveApply: null,

	handleSave: function (ev) {
		// Remove any existing notifications
		var notifications = document.getElementsByClassName("alert-message");
		for (var i = 0; i < notifications.length; i++) {
			notifications[i].style.display = 'none';
		}

		let value = ((document.querySelector('textarea').value || '').trim().replace(/\r\n/g, '\n'));
		return fs.write('/root/adblock-lean/config', value)
			.then(function () {
				document.querySelector('textarea').value = value;
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Config modifications have been saved, reload adblock-lean for changes to take effect.')), 'success');
			}).catch(function (e) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Unable to save modifications: %s').format(e.message)), 'error');
			});
	},

	load: function () {
		return Promise.all([
			L.resolveDefault(fs.stat('/root/adblock-lean/config'), {}),
			L.resolveDefault(fs.read_direct('/root/adblock-lean/config'), '')
		]);
	},

	render: function (loadData) {
		return E([
			E('p', {},
				_('This is the local adblock-lean config file, /root/adblock-lean/config<br /> \
				<em><b>Please note:</b></em> you should not modify <b>local_allowlist_path</b> or <b>local_blocklist_path</b> \
				as the Allowlist and Blocklist tabs will only work with the default paths.')),
			E('p', {},
				E('textarea', {
					'style': 'width: 100% !important; padding: 5px; font-family: monospace',
					'spellcheck': 'false',
					'wrap': 'off',
					'rows': 25
				}, [loadData[1] ?? ''])
			)
		]);
	},
});
