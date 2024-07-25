"require ui";
"require fs";
"require baseclass";

var cachedArr;

return baseclass.extend({
	title: _("AdBlock Lean"),
	load: function () {
		if (cachedArr) {
			return Promise.resolve();
		}

		return Promise.all([
			// TODO Requires adblock-lean to output status to stdio
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['status']), ''),
		]);
	},
	render: function (arr) {
		// If we have the cached array data, use that
		if (cachedArr) {
			arr = cachedArr;
		} else {
			cachedArr = arr;
		}

		var status = arr[0] ?? '';
		var lines = status.split('\n');
		var rows = lines.length < 5 ? 5 : lines.length + 1;
		
		// Remove the temp file if we're not using cached array data (ie only delete on first load)
		if (!cachedArr) {
			var output_filename = '/tmp/adblock-lean-output.luci';
			fs.remove(output_filename);
		}

		return E([
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
});
