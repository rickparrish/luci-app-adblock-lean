'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: true,
	
	filename: 'blocklist',

	instructions: _('This is the local adblock-lean blocklist that will reject certain domain names.<br /> \
		<em><b>Please note:</b></em> add only exactly one domain name per line.'),
});
