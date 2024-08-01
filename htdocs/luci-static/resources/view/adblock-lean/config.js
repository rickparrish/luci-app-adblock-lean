'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: false,
	
	filename: 'config',

	instructions: _('This is the local adblock-lean config file, /root/adblock-lean/config<br /> \
		<em><b>Please note:</b></em> you should not modify <b>local_allowlist_path</b> or <b>local_blocklist_path</b> \
		as the Allowlist and Blocklist tabs will only work with the default paths.'),
});
