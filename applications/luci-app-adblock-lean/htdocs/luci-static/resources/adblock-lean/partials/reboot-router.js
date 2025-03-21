'use strict';
'require baseclass';

var rebootRouterClass = baseclass.extend({
	render: function () {
		// Build the title element
		var titleElement = E('h2', {}, _('Router reboot needed'));

		// Build the instruction element
		var instructionElement = E([
			E('p', {}, _('luci-app-adblock-lean is unable to access one of the adblock-lean files, which is usually because rpcd rules need to be reloaded.')),
			E('p', {}, _('Please try rebooting your router, as it\'s usually the quickest way to resolve this type of problem.')),
		]);

		// Return the combined elements
		return E([
			titleElement,
			instructionElement
		]);
	},
});

return L.Class.extend({
	partial: rebootRouterClass,
});