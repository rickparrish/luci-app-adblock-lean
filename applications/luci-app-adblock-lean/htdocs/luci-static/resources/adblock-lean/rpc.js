'use strict';
'require rpc';

return L.Class.extend({
	checkConfig: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'checkConfig',
		params: [],
	}),
	
	getStatus: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'getStatus',
		params: [],
	}),

	installAbl: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'installAbl',
		params: ['preset', 'utils'],
	}),
	
	resetConfig: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'resetConfig',
		params: [],
	}),

	systemInfo: rpc.declare({
		object: 'system',
		method: 'info'
	}),

	updateAbl: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'updateAbl',
		params: [],
	}),
	
	updateConfig: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'updateConfig',
		params: [],
	}),
	
	updateLuciApp: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'updateLuciApp',
		params: ['url'],
	}),
});