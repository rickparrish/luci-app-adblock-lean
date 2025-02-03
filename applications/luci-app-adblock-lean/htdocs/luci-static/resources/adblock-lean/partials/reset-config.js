'use strict';
'require baseclass';
'require ui';
'require adblock-lean.helpers as helpers';
'require adblock-lean.rpc as rpc';

var resetConfigClass = baseclass.extend({
	handleResetClick: function () {
		// Display the spinning cursor dialog
		ui.showModal(null, [
			E('p', { class: 'spinning' }, _('Resetting adblock-lean config file')),
		]);

		// Call the resetConfig RPC method and reload the page when it completes
		L.resolveDefault(rpc.resetConfig()).then(function (result) { location.reload() });
	},	

	render: function () {
		// Build the title element
		var titleElement = E('h2', {}, _('adblock-lean config error'));

		// Build the instruction element
		var instructionElement = E([
			E('p', {}, _('adblock-lean\'s config file has an error.')),
			E('p', {}, _('To automatically reset it now, click the Reset button below.')),
			E('p', {}, _('Or to fix it manually, SSH into your router and try executing %s').format('<strong>service adblock-lean start</strong>')),
		]);

		var buttonElement = E('button', {
			'class': 'btn cbi-button cbi-button-positive',
			'click': ui.createHandlerFn(this, this.handleResetClick),
		}, _('Reset Config File'));

		// Combine the various elements into our result variable
		return E([
			titleElement,
			instructionElement,
			buttonElement
		]);
	},
});

return L.Class.extend({
	partial: resetConfigClass,
});