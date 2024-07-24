'use strict';
'require view';
'require fs';
'require ui';

let notMsg, errMsg;

return view.extend({
	load: function () {
		return Promise.all([
			L.resolveDefault(fs.stat('/root/adblock-lean/config'), {}),
			L.resolveDefault(fs.read_direct('/root/adblock-lean/config'), '')
		]);
	},
	handleSave: function (ev) {
		let value = ((document.querySelector('textarea').value || '').trim().replace(/\r\n/g, '\n'));
		return fs.write('/root/adblock-lean/config', value)
			.then(function () {
				document.querySelector('textarea').value = value;
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				if (!notMsg) {
					ui.addNotification(null, E('p', _('Config modifications have been saved, reload adblock-lean for changes to take effect.')), 'info');
					notMsg = true;
				}
			}).catch(function (e) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				if (!errMsg) {
					ui.addNotification(null, E('p', _('Unable to save modifications: %s').format(e.message)), 'error');
					errMsg = true;
				}
			});
	},
	render: function (arr) {
		var config = arr[1] == null ? '' : arr[1];
		var lines = config.split('\n');
		var rows = lines.length < 25 ? 25 : lines.length + 1;
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
					'rows': rows
				}, [config])
			)
		]);
	},
	handleSaveApply: null,
	handleReset: null
});
