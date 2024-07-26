"require ui";
"require fs";
"require baseclass";

return baseclass.extend({
	title: _("AdBlock Lean"),
	load: function () {
		return Promise.all([
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['luci_status']), ''),
		]);
	},
	render: function (arr) {
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
	},
});
