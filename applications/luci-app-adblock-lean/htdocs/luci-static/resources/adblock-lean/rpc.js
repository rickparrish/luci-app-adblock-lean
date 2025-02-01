'use strict';
'require rpc';

return L.Class.extend({
	getStatus: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'getStatus',
		params: [],
	}),

	install: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'install',
		params: ['preset', 'utils'],
	}),
	
	systemInfo: rpc.declare({
		object: 'system',
		method: 'info'
	}),

	updateAdblockLean: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'updateAdBlockLean',
		params: [],
	}),
	
	updateLuciApp: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'updateLuciApp',
		params: ['url'],
	}),
});