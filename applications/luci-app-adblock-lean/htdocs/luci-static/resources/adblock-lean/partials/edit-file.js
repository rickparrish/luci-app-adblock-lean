'use strict';
'require fs';
'require ui';
'require view';

var editFileClass = view.extend({
	// Custom variables
	doLowercase: false,
	filename: 'invalid-filename',
	instructions: '',

	// View-inheriting variables
	handleReset: null,
	handleSaveApply: null,

	handleSave: function (ev) {
		// Remove any existing notifications
		var notifications = document.getElementsByClassName('alert-message');
		for (var i = 0; i < notifications.length; i++) {
			notifications[i].style.display = 'none';
		}

		// Get the value, trim it, and replace \r\n with just \n
		// Also optionally lowercase
		let value = ((document.querySelector('textarea').value || '').trim().replace(/\r\n/g, '\n')) + '\n';
		if (this.doLowercase) {
			value = value.toLowerCase();
		}

		// Save the file
		var that = this;
		return fs.write(this.filename, value)
			.then(function () {
				document.querySelector('textarea').value = value;
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Your changes have been saved.  Reload adblock-lean for changes to take effect.')), 'success');
			}).catch(function (e) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
				ui.addNotification(null, E('p', _('Unable to save changes: %s').format(e.message)), 'error');
			});
	},

	load: function () {
		return Promise.all([
			L.resolveDefault(fs.read_direct(this.filename), '')
		]);
	},
	
	render: function (loadData) {
		return E([
			E('p', {}, this.instructions),
			E('p', {},
				E('textarea', {
					'style': 'width: 100% !important; padding: 5px; font-family: monospace',
					'spellcheck': 'false',
					'wrap': 'off',
					'rows': 25
				}, [loadData[0] ?? ''])
			)
		]);
	},
});

return L.Class.extend({
	partial: editFileClass,
});