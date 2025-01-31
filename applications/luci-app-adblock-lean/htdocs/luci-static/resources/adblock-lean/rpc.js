'use strict';
'require rpc';

return L.Class.extend({
	install: rpc.declare({
		object: 'luci.adblock-lean',
		method: 'install',
		params: ['preset', 'utils'],
	}),
	
	systemInfo: rpc.declare({
		object: 'system',
		method: 'info'
	}),
});