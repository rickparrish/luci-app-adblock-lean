'use strict';
'require adblock-lean.partials.edit-file as editFileClass';

return editFileClass.partial.extend({
	doLowercase: false,
	
	filename: '/usr/libexec/abl_custom-script.sh',

	instructions: _('<p>This is the AdBlock Lean custom script, stored at <b>/usr/libexec/abl_custom-script.sh</b></p>\
		<p>This script should define the functions <b>report_success()</b> and <b>report_failure()</b>, and one of these\
		   functions will be executed when adblock-lean completes the execution of some commands,\
		   with the success or failure message passed in first argument.</p>\
		<p>report_success() is only executed upon completion of the \'start\' command.</p>'),
});
