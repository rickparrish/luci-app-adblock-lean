'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: true,

	filename: '/etc/adblock-lean/allowlist',

	instructions: _('<p>This is your local AdBlock Lean allowlist, stored at <b>/etc/adblock-lean/allowlist</b></p>\
		<p>This is useful if the blocklist urls you subscribe to block something you need -- rather than having to\
		   manually pause/resume AdBlock Lean when you need to access the domain(s), or having to switch to a more\
		   permissive blocklist, you can just list the domain(s) here to ensure they don\'t get blocked.</p>\
		<p><em><b>Please note:</b></em> add only exactly one domain name per line.</p>'),
});
