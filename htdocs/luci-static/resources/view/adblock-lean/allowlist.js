'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: true,

	filename: 'allowlist',

	instructions: _('This is the local adblock-lean allowlist that will permit certain domain names.<br /> \
		<em><b>Please note:</b></em> add only exactly one domain name per line.'),
});
