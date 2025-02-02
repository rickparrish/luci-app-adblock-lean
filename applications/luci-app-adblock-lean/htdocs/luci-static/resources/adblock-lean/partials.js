'use strict';
'require adblock-lean.partials.create-config as createConfigClass';
'require adblock-lean.partials.install-abl as installAblClass';
'require adblock-lean.partials.reset-config as resetConfigClass';
'require adblock-lean.partials.display-status as displayStatusClass';
'require adblock-lean.partials.update-config as updateConfigClass';

return L.Class.extend({
	renderCreateConfig: function () {
		return new createConfigClass.partial().render();
	},

	renderDisplayStatus: function (showButtons, showTitle) {
		var result = new displayStatusClass.partial();
		result.showButtons = showButtons;
		result.showTitle = showTitle;
		return result.render();
	},

	renderInstallAbl: function () {
		return new installAblClass.partial().render();
	},

	renderResetConfig: function () {
		return new resetConfigClass.partial().render();
	},

	renderUpdateConfig: function (checkConfigResult) {
		var result = new updateConfigClass.partial();
		result.checkConfigResult = checkConfigResult;
		return result.render();
	},
});