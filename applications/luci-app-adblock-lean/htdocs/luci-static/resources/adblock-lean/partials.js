'use strict';
'require adblock-lean.partials.create-config as createConfigClass';
'require adblock-lean.partials.install-abl as installAblClass';
'require adblock-lean.partials.reset-config as resetConfigClass';
'require adblock-lean.partials.display-status as displayStatusClass';
'require adblock-lean.partials.update-config as updateConfigClass';

return L.Class.extend({
	createCreateConfig: function () {
		return new createConfigClass.partial();
	},

	createDisplayStatus: function () {
		return new displayStatusClass.partial();
	},

	createInstallAbl: function () {
		return new installAblClass.partial();
	},

	createResetConfig: function () {
		return new resetConfigClass.partial();
	},

	createUpdateConfig: function (checkConfigResult) {
		var result = new updateConfigClass.partial();
		result.checkConfigResult = checkConfigResult;
		return result;
	},
});