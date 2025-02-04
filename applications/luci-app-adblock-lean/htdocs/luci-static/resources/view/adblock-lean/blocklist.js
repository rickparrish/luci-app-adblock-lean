'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: true,
	
	filename: '/etc/adblock-lean/blocklist',

	instructions: E('div', {}, [
		E('p', {}, _('This is your local adblock-lean blocklist, stored at %s').format('<strong>/etc/adblock-lean/blocklist</strong>')),
		E('p', {}, _('This is useful if the blocklist urls you subscribe to miss something you want to block -- rather than\
		              having to switch to a more restrictive blocklist, you can just list the domain(s) here to ensure they get blocked.')),
		E('p', {}, [
			E('strong', {}, E('em', {}, _('Please note'))),
			': ',
			_('add exactly one domain name per line.'),
		]),
	]),
});
