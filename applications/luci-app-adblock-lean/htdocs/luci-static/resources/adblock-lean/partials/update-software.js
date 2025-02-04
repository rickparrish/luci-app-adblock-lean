'use strict';
'require baseclass';

var updateSoftwareClass = baseclass.extend({
	render: function () {
		// Build the title element
		var titleElement = E('h2', {}, _('adblock-lean software update needed'));

		// Build the instruction element
		var instructionElement = E([
			E('p', {}, _('The currently installed versions of adblock-lean and luci-app-adblock-lean are not compatable with each other \
				          (they do not support the same config format).')),
			E('p', {}, _('Check the status panel above to see whether there are updates for one (or both) packages, and update as necessary.')),
			E('p', {}, _('NOTE: adblock-lean will continue to function as expected while this incompatability exists, the only functionality \
				          you are missing out on is the configuration form.'))
		]);

		// Return the combined elements
		return E([
			titleElement,
			instructionElement
		]);
	},
});

return L.Class.extend({
	partial: updateSoftwareClass,
});