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
		]);
	},
	render: function (arr) {
		// Wrap status in try..catch, because if no config file exists the call to luci_status will fail
		try {
			// Save arr to cachedArr if we have a new arr (ie first call, or 5 minutes since last call)
			// Or load the cachedArr into arr if we don't have a new arr (ie not been five minutes since previous call)
			if (arr) {
				cachedArr = arr;
			} else {
				arr = cachedArr;
			}

			var json = JSON.parse(arr[0]);
				
			var status_label;
			switch (json.status) {
				case 0: status_label = 'OK'; break;
				case 1: status_label = 'ERROR: dnsmasq not running'; break;
				case 2: status_label = 'ERROR: Test domain lookup failed'; break;
				case 3: status_label = 'ERROR: Test domain resolved to 0.0.0.0'; break;
				case 4: status_label = 'ERROR: adblock-lean not started'; break;
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
			console.log(err);
		}
	},
});
