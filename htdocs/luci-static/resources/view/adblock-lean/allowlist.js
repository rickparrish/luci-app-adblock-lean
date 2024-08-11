'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: true,

	filename: 'allowlist',

	instructions: _('<p>This is your local AdBlock Lean allowlist, where you can specify domain names NOT to block.</p>\
		<p>This is useful if the blocklist urls you subscribe to block something you need -- rather than having to\
		   manually pause/resume AdBlock Lean when you need to access the domain(s), or having to switch to a more\
		   permissive blocklist, you can just list the domain(s) here to ensure they don\'t get blocked.</p>\
		<p><em><b>Please note:</b></em> add only exactly one domain name per line.</p>'),
});
