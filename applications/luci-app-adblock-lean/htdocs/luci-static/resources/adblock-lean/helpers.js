'use strict';
'require adblock-lean.hagezi as hagezi';

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

	parseConfig: function(config) {
		var result = null;
		if (config) {
			// Parse the config file format, converting the key=value lines into an object
			// From: https://stackoverflow.com/a/52043870
			result = config
				// split the data by line
				.split("\n")
				// filter comments
				.filter(row => (row.trim() != '') && !row.trim().startsWith('#') && (row.indexOf('=') > 0))
				// split each row into key and property
				.map(row => {
					var equalsPos = row.indexOf('=');
					var key = row.substring(0, equalsPos);
					var value = row.substring(equalsPos + 1);
					return [key.trim(), helpers.getCleanValue(value)];
				})
				// use reduce to assign key-value pairs to a new object
				// using Array.prototype.reduce
				.reduce((acc, [key, value]) => (acc[key] = value, acc), {});
	
			// *_urls need to be an array, not a space-separated string
			result.blocklist_urls = result.blocklist_urls ? result.blocklist_urls.split(' ') : [];
			result.blocklist_ipv4_urls = result.blocklist_ipv4_urls ? result.blocklist_ipv4_urls.split(' ') : [];
			result.allowlist_urls = result.allowlist_urls ? result.allowlist_urls.split(' ') : [];
			result.dnsmasq_blocklist_urls = result.dnsmasq_blocklist_urls ? result.dnsmasq_blocklist_urls.split(' ') : [];
			result.dnsmasq_blocklist_ipv4_urls = result.dnsmasq_blocklist_ipv4_urls ? result.dnsmasq_blocklist_ipv4_urls.split(' ') : [];
			result.dnsmasq_allowlist_urls = result.dnsmasq_allowlist_urls ? result.dnsmasq_allowlist_urls.split(' ') : [];
		}
	
		// We have a friendly Hagezi Blocklists multi-select, so we need to split those in blocklist_urls into hagezi_blocklists
		result.hagezi_blocklists = [];
		var nonHageziBlocklists = [];
		for (var i = 0; i < result.blocklist_urls.length; i++) {
			if (result.blocklist_urls[i].startsWith(hagezi.baseUrl)) {
				result.hagezi_blocklists.push(result.blocklist_urls[i]);
			} else {
				nonHageziBlocklists.push(result.blocklist_urls[i]);
			}
		}
		result.blocklist_urls = nonHageziBlocklists;
	
		// custom_script needs to be mapped to enable_custom_script
		if (result.custom_script) {
			result.enable_custom_script = 1;
		}
		
		// Set the data variable in the format needed by form.JSONMap()
		return { 'config': result };
	},	
});