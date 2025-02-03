'use strict';
'require baseclass';
'require ui';
'require adblock-lean.config as config';
'require adblock-lean.helpers as helpers';
'require adblock-lean.rpc as rpc';

var updateConfigClass = baseclass.extend({
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
			E('p', {}, _('Click the Update button below the make the following automatic changes:')),
			E('div', {}, helpers.getUnorderedList(config.checkConfigResult.conf_fixes)),
		]);

		var buttonElement = E('button', {
			'class': 'btn cbi-button cbi-button-positive',
			'click': ui.createHandlerFn(this, this.handleUpdateClick),
		}, _('Update Config File'));

		// Build the manual instruction element
		var manualInstructionElement = E([
			E('<br>'),
			E('<br>'),
			E('p', {}, _('Or, if you\'d like to manually update your config file, these are the changes that are needed:')),
			E('div', {}, helpers.getUnorderedListWithHeader(_('Remove old entries:'), config.checkConfigResult.unexp_entries)),
			E('div', {}, helpers.getUnorderedListWithHeader(_('Add new entries:'), config.checkConfigResult.missing_entries)),
			E('div', {}, helpers.getUnorderedListWithHeader(_('Wrap values in double-quotes and/or remove inline comments:'), config.checkConfigResult.legacy_entries)),
		]);

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
	partial: updateConfigClass,
});