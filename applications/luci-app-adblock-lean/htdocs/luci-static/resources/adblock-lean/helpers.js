'use strict';

return L.Class.extend({
	getCleanValue: function(value) {
		// Trim the value
		value = value.trim();
	
		// Check for string-quoted value
		// From: https://stackoverflow.com/a/249937
		var m = value.match(/"(?:[^"\\]|\\.)*"/);
		if (m === null) {
			// Not a string-quoted value, remove inline comments
			var hashPos = value.indexOf('#');
			if (hashPos == 0) {
				value = '';
			} else if (hashPos >= 1) {
				value = value.substring(0, hashPos).trim();
			}
		} else {
			// Is a string-quoted value, remove the surrounding quotes
			// From: https://stackoverflow.com/a/18268011
			value = m[0].trim().replace(/^"?|"?$/g, '');
		}
	
		// Return the now-cleaned value
		return value;
	},

	getUnorderedList: function(text) {
		if (!text) { return ''; }
	
		var result = '';
	
		var lines = text.split('\n');
		for (var i = 0; i < lines.length; i++) {
			result += '<li>' + lines[i].replace(/[<]/g, '&lt;') + '</li>';
		}
	
		return '<ol style="list-style: decimal;">' + result + '</ol>';
	},
	
	getUnorderedListWithHeader: function(header, text) {
		if (!text) { return ''; }
		return '<div><strong>' + header + '</strong></div>' + getUnorderedList(text);
	},
});