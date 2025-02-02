'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: false,
	
	filename: '/usr/libexec/abl_custom-script.sh',

	instructions: E('div', {}, [
		E('p', {}, _('This is the adblock-lean custom script, stored at %s').format('<strong>/usr/libexec/abl_custom-script.sh</strong>')),
		E('p', {}, _('This script should define the functions %s and %s, and one of these functions will be executed when adblock-lean\
			          completes the execution of some commands with the success or failure message passed in first argument.')
					  .format('<strong>report_success()</strong>', '<strong>report_failure()</strong>')),
		E('p', {}, [
			E('strong', {}, E('em', {}, _('Please note'))),
			': ',
			E('span', {}, _('%s is only executed upon completion of the %s command.').format('report_success()', '<strong>start</strong>')),
		]),
	]),
});
