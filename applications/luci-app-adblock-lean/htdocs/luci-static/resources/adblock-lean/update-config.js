'use strict';
'require baseclass';
'require ui';
'require adblock-lean.helpers as helpers';
'require adblock-lean.rpc as rpc';

var updateConfigClass = baseclass.extend({
	checkConfigResult: null,

	handleUpdateClick: function () {
		// Display the spinning cursor dialog
		ui.showModal(null, [
			E('p', { class: 'spinning' }, _('Updating adblock-lean config file')),
		]);

		// Call the updateConfig RPC method and reload the page when it completes
		L.resolveDefault(rpc.updateConfig()).then(function (result) { location.reload() });
	},

	render: function () {
		// Build the title element
		var titleElement = E('h1', {}, _('adblock-lean config update needed'));

		// Build the automatic instruction element
		var autoInstructionElement = E([
			E('p', {}, _('adblock-lean\'s config format has changed.')),
			E('p', {}, _('Click the Update button below the make the following automatic changes:' + helpers.getUnorderedList(this.checkConfigResult.conf_fixes))),
		]);

		var buttonElement = E('button', {
			'class': 'btn cbi-button cbi-button-positive',
			'click': ui.createHandlerFn(this, this.handleUpdateClick),
		}, [_('Update Config File')]);

		// Build the manual instruction element
		var manualInstructionElement = E('p', {}, _('<br /><br />Or, if you\'d like to manually update your config file,\
			these are the changes that are needed:<br /><br />\
			' + helpers.getUnorderedListWithHeader('Remove old entries:', this.checkConfigResult.unexp_entries) + '\
			' + helpers.getUnorderedListWithHeader('Add new entries:', this.checkConfigResult.missing_entries) + '\
			' + helpers.getUnorderedListWithHeader('Wrap values in double-quotes and/or remove inline comments:', this.checkConfigResult.legacy_entries)));

		// Combine the various elements into our result variable
		return E([
			titleElement,
			autoInstructionElement,
			buttonElement,
			manualInstructionElement
		]);		
	},
});

return L.Class.extend({
	view: updateConfigClass,
});