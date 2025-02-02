'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: true,

	filename: '/etc/adblock-lean/allowlist',

	instructions: E('div', {}, [
		E('p', {}, _('This is your local adblock-lean allowlist, stored at %s').format('<strong>/etc/adblock-lean/allowlist</strong>')),
		E('p', {}, _('This is useful if the blocklist urls you subscribe to block something you need -- rather than having to\
		              manually pause/resume adblock-lean when you need to access the domain(s), or having to switch to a more\
		              permissive blocklist, you can just list the domain(s) here to ensure they don\'t get blocked.')),
		E('p', {}, [
			E('strong', {}, E('em', {}, _('Please note'))),
			': ',
			_('add exactly one domain name per line.'),
		]),
	]),
});
