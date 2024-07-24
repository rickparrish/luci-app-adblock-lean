'use strict';
'require view';
'require fs';
'require ui';

let notMsg, errMsg;

return view.extend({
	load: function () {
		
		return Promise.all([
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['status']), '')
		]);
	},
	render: async function (arr) {
		var output_filename = '/tmp/adblock-lean-output.luci';
		var lines = await fs.lines(output_filename);
		var rows = lines.length < 5 ? 5 : lines.length + 1;
		await fs.remove(output_filename);

		return E([
			E('h2', {}, _('Status')),
			E('p', {},
				E('textarea', {
					'style': 'width: 100% !important; padding: 5px; font-family: monospace',
					'spellcheck': 'false',
					'wrap': 'off',
					'rows': rows
				}, [lines.join('\r\n')])
			)
		]);
	},
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
