'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: false,
	
	filename: '/etc/adblock-lean/config',

	instructions: _('<p>This is the local AdBlock Lean config file, stored at <b>/etc/adblock-lean/config</b></p>\
		<p>In most cases you should make configuration changes via the <b>Overview</b> page, but if for some reason\
		   you want to view/edit the raw config file, you can do so here.</p>\
		<em><b>Please note:</b></em> you should not modify <b>local_allowlist_path</b> or <b>local_blocklist_path</b>\
		as the Allowlist and Blocklist tabs will only work with the default paths.'),
});
