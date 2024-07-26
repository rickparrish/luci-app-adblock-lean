"require ui";
"require fs";
"require baseclass";

var cachedArr = null;
var cacheSeconds = 0;

return baseclass.extend({
	title: _("AdBlock Lean"),
	load: function () {
		// Check if it's been 5 minutes since the last check
		// This is because a status check downloads the adblock-lean script to see if an update is avaialble,
		// and I don't think we need to download that every few seconds when the user is at the main Status -> Overview screen!
		var currentSeconds = Math.floor(Date.now() / 1000);
		if (currentSeconds - cacheSeconds < 300) {
			return Promise.resolve();
		}
		cacheSeconds = currentSeconds;

		return Promise.all([
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['luci_status']), ''),
			L.resolveDefault(fs.read_direct('/root/adblock-lean/config'), '')
		]);
	},
	render: function (arr) {
		// Save arr to cachedArr if we have a new arr (ie first call, or 5 minutes since last call)
		// Or load the cachedArr into arr if we don't have a new arr (ie not been five minutes since previous call)
		if (arr) {
			cachedArr = arr;
		} else {
			arr = cachedArr;
		}

		// Return a message saying config doesn't exist yet, if it doesn't exist yet
		if (arr[1] == '') {
			return E([
				E('p', { style: "color: red;" },
					_('Your AdBlock Lean configuration file does not exist.  Click \
						<strong>Services -> AdBlock Lean</strong> to configure AdBlock Lean now.'))
			]);
		}

		// Wrap in try..catch so we can warn the user if the luci_status call failed to return valid json
		try {
			var json = JSON.parse(arr[0]);
				
			var status_label;
			switch (json.status) {
				case 0: status_label = 'Started'; break;
				case 1: status_label = 'ERROR: dnsmasq not running'; break;
				case 2: status_label = 'ERROR: Test domain lookup failed'; break;
				case 3: status_label = 'ERROR: Test domain resolved to 0.0.0.0'; break;
				case 4: status_label = 'Stopped'; break;
				default: status_label = 'Unknown'; break;
			}

			var update_status_label;
			switch (json.update_status) {
				case 0: update_status_label = 'Up to date'; break;
				case 1: update_status_label = 'Update available'; break;
				case 2: update_status_label = 'Error checking'; break;
				default: update_status_label = 'Unknown'; break;
			}

			return E(
				"table",
				{ class: "table", id: "adblock-fast_status_table" },
				[
					E("tr", { class: "tr table-titles" }, [
						E("th", { class: "th" }, _("Status")),
						E("th", { class: "th" }, _("Blocklist line count")),
						E("th", { class: "th" }, _("Time since blocklist update")),
						E("th", { class: "th" }, _("Update status")),
					]),
					E("tr", { class: "tr" }, [
						E("td", { class: "td" }, status_label),
						E("td", { class: "td" }, json.good_line_count),
						E("td", { class: "td" }, Math.round(json.secs_since_blocklist_update / 3600, 1) + ' hours'),
						E("td", { class: "td" }, update_status_label),
					]),
				]
			);
		} catch (err) {
			console.log({arr, err});

			// The most likely cause for entering this catch is that luci_status failed to run, and the most likely reason
			// for that is because the config file is malformed.  One such cause is the user entering a report_failure
			// or report_success without escaping special character correctly, so we'll tell them to go take a look at
			// the raw config file and fix as needed.
			return E([
				E('p', { style: "color: red;" },
					_('ERROR: Failed to load the AdBlock Lean configuration file, which may be because it is malformed. \
						One known cause is entering a <strong>Report failure</strong> or <strong>Report success</strong> \
						command without escaping special characters correctly.  Click the <strong>Config</strong> tab \
						on the <strong>Services -> AdBlock Lean</strong> page to view your raw config file and fix it.'))
			]);
		}
	},
});
