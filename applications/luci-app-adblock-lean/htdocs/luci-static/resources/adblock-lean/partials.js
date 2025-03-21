'use strict';
'require adblock-lean.partials.create-config as createConfigClass';
'require adblock-lean.partials.install-abl as installAblClass';
'require adblock-lean.partials.reboot-router as rebootRouterClass';
'require adblock-lean.partials.reset-config as resetConfigClass';
'require adblock-lean.partials.display-status as displayStatusClass';
'require adblock-lean.partials.update-config as updateConfigClass';
'require adblock-lean.partials.update-software as updateSoftwareClass';

return L.Class.extend({
	renderCreateConfig: function () {
		return new createConfigClass.partial().render();
	},

	renderDisplayStatus: function (showButtons) {
		var result = new displayStatusClass.partial();
		result.showButtons = showButtons;
		return result.render();
	},

	renderInstallAbl: function () {
		return new installAblClass.partial().render();
	},

	renderRebootRouter: function () {
		return new rebootRouterClass.partial().render();
	},

	renderResetConfig: function () {
		return new resetConfigClass.partial().render();
	},

	renderUpdateConfig: function () {
		return new updateConfigClass.partial().render();
	},

	renderUpdateSoftware: function () {
		return new updateSoftwareClass.partial().render();
	},
});