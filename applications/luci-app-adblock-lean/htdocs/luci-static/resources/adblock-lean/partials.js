'use strict';
'require adblock-lean.partials.missing-config as missingConfigClass';
'require adblock-lean.partials.not-installed as notInstalledClass';
'require adblock-lean.partials.reset-config as resetConfigClass';
'require adblock-lean.partials.status as statusClass';
'require adblock-lean.partials.update-config as updateConfigClass';

return L.Class.extend({
	createMissingConfig: function () {
		return new missingConfigClass.partial();
	},

	createNotInstalled: function () {
		return new notInstalledClass.partial();
	},

	createResetConfig: function () {
		return new resetConfigClass.partial();
	},

	createStatus: function () {
		return new statusClass.partial();
	},

	createUpdateConfig: function (checkConfigResult) {
		var result = new updateConfigClass.partial();
		result.checkConfigResult = checkConfigResult;
		return result;
	},
});