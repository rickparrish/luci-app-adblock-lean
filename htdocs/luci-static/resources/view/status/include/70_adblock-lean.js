"require ui";
"require fs";
"require rpc";
"require baseclass";

var cachedArr = null;
var cacheSeconds = 0;

var getStatus = rpc.declare({
	object: "luci.adblock-lean",
	method: "getStatus",
	params: [],
});

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
			L.resolveDefault(getStatus()),
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

		// Wrap in try..catch so we can warn the user if the getStatus call failed to return valid json
		try {
			var service_status_label;
			switch (arr[0].service_status) {
				case 0: service_status_label = _('Enabled'); break;
				case 1: service_status_label = _('Disabled'); break;
				case 2: service_status_label = _('Not installed'); break;
				default: service_status_label = _('Unknown'); break;
			}

			var dnsmasq_status_label;
			switch (arr[0].dnsmasq_status) {
				case 0: dnsmasq_status_label = _('Running'); break;
				case 1: dnsmasq_status_label = _('ERROR: Not running'); break;
				case 2: dnsmasq_status_label = _('ERROR: Test domain lookup failed'); break;
				case 3: dnsmasq_status_label = _('ERROR: Test domain resolved to 0.0.0.0'); break;
				default: dnsmasq_status_label = 'Unknown'; break;
			}

			var blocklist_status_label;
			switch (arr[0].blocklist_status) {
				case 0: blocklist_status_label = _('Active'); break;
				case 1: blocklist_status_label = _('Not active'); break;
				default: blocklist_status_label = _('Unknown'); break;
			}

			var update_status_label;
			switch (arr[0].update_status) {
				case 0: update_status_label = _('Up to date'); break;
				case 1: update_status_label = _('Update available'); break;
				case 2: update_status_label = _('Error checking'); break;
				default: update_status_label = _('Unknown'); break;
			}

			return E(
				"table",
				{ class: "table", id: "adblock-fast_status_table" },
				[
					E("tr", { class: "tr table-titles" }, [
						E("th", { class: "th" }, _("Service status")),
						E("th", { class: "th" }, _("dnsmasq status")),
						E("th", { class: "th" }, _("Blocklist status")),
						E("th", { class: "th" }, _("Blocklist line count")),
						E("th", { class: "th" }, _("Time since blocklist update")),
						E("th", { class: "th" }, _("Update status")),
					]),
					E("tr", { class: "tr" }, [
						E("td", { class: "td" }, service_status_label),
						E("td", { class: "td" }, dnsmasq_status_label),
						E("td", { class: "td" }, blocklist_status_label),
						E("td", { class: "td" }, arr[0].blocklist_line_count.toLocaleString()),
						E("td", { class: "td" }, Math.round(arr[0].blocklist_age_s / 3600, 1) + ' hours'),
						E("td", { class: "td" }, update_status_label),
					]),
				]
			);
		} catch (err) {
			console.log({arr, err});

			// The most likely cause for entering this catch is that getStatus failed to run, and the most likely reason
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
