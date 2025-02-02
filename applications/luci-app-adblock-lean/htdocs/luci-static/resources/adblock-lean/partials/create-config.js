'use strict';
'require baseclass';

var createConfigClass = baseclass.extend({
	render: function () {
		// Build the title element
		var titleElement = E('h1', {}, _('adblock-lean config missing'));

		// Build the instruction element
		var instructionElements = E([
			E('p', {}, _('adblock-lean is installed but the config file is missing.')),
			E('p', {}, _('If you installed adblock-lean via this app, a config file should have been created for you, which means something went \
				          wrong and you should <a %s>create an issue here</a>.')
						.format('href="https://github.com/rickparrish/luci-app-adblock-lean/issues" target="_blank" rel="noreferrer"')),
			E('p', {}, _('Either way, you should now <a %s>manually create a config file following the instructions here</a>.')
				        .format('href="https://github.com/lynxthecat/adblock-lean" target="_blank" rel="noreferrer"')),
			E('p', {}, _('Once you\'ve created a config file, please reload this page.')),
		]);

		// Return the combined elements
		return E([
			titleElement,
			instructionElements,
		]);
	},
});

return L.Class.extend({
	partial: createConfigClass,
});