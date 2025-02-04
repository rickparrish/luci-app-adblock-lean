'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: false,
	
	filename: '/etc/adblock-lean/config',

	instructions: E('div', {}, [
		E('p', {}, _('This is the adblock-lean config file, stored at %s').format('<strong>/etc/adblock-lean/config</strong>')),
		E('p', {}, _('In most cases you should make configuration changes via the %s page, but if for some reason\
		              you want to view/edit the raw config file, you can do so here.').format('<strong>' + _('Overview') + '</strong>')),
		E('p', {}, [
			E('strong', {}, E('em', {}, _('Please note'))),
			': ',
			E('span', {}, _('you should not modify %s or %s as the Allowlist and Blocklist tabs will only work with the default paths.')
				             .format('<strong>local_allowlist_path</strong>', '<strong>local_blocklist_path</strong>')),
		]),
	]),
});
