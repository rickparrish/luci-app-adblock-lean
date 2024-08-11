'use strict';
'require adblock-lean.fileeditor as ablfe';

return ablfe.fileEditor.extend({
	doLowercase: false,
	
	filename: 'custom_script',

	instructions: _('<p>This is the AdBlock Lean custom script, stored at <b>/root/adblock-lean/custom_script</b></p>\
		<p>This script should define the functions <b>report_success()</b> and <b>report_failure()</b>, and one of these\
		   functions will be executed when adblock-lean completes the execution of some commands,\
		   with the success or failure message passed in first argument.</p>\
		<p>report_success() is only executed upon completion of the \'start\' command.</p>'),
});
