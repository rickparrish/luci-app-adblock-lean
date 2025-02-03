'require baseclass';
'require fs';
'require adblock-lean.partials as partials';

var lastLoad = 0;

return baseclass.extend({
	title: _('adblock-lean'),

	load: function () {
		// Check if it's been 1 hour since the last load
		// This is because a status check downloads the adblock-lean script to see if an update is avaialble,
		// and I don't think we need to download that every few seconds when the user is at the main Status -> Overview screen!
		var currentSeconds = Math.floor(Date.now() / 1000);
		if (currentSeconds - lastLoad < 3600) {
			return Promise.resolve();
		}
		lastLoad = currentSeconds;

		return Promise.all([
			L.resolveDefault(fs.read_direct('/etc/adblock-lean/config'), '')
		]);
	},

	render: function (loadData) {
		var configFile = loadData[0];

		// Bail out if we don't have a config file (means our interval between status updates was not met)
		if (!configFile) {
			return;
		}

		// Return a message saying config doesn't exist yet, if it doesn't exist yet
		if (configFile == '') {
			return E('p', { 'style': 'color: red;' },
				_('Your adblock-lean configuration file does not exist.  Click \
					<strong>Services -> adblock-lean</strong> to configure adblock-lean now.'));
		}

		// Return our custom status object (false arg hides buttons)
		return partials.renderDisplayStatus(false);
	},
});
