'use strict';
'require baseclass';
'require ui';
'require adblock-lean.rpc as rpc';

var installAblClass = baseclass.extend({
	handleInstallClick: function () {
		// Display the spinning cursor dialog
		ui.showModal(null, [
			E('p', { class: 'spinning' }, _('Installing adblock-lean')),
		]);
		
		// Determine which preset the user wants to use
		var preset = document.querySelector('input[name=preset]:checked').value;
	
		// Determine which utils the user wants to install
		var utils = Array.from(document.querySelectorAll('input[name=utils]:checked'), e => e.value).join(' ');
	
		// Call the install RPC method and reload the page when it completes
		L.resolveDefault(rpc.installAbl(preset, utils)).then(function (result) { location.reload() });
	},

	render: function () {
		// Build the title element
		var titleElement = E('h1', {}, _('adblock-lean is not installed'));

		// Build the instruction element
		var instructionElements = E([
			E('p', {}, _('To install it now review and submit the form below, or <a %s>to install it manually follow the instructions here</a>.')
						.format('href="https://github.com/lynxthecat/adblock-lean" target="_blank" rel="noreferrer"')),
			E('hr'),
		]);

		// Build the preset radiobuttons
		var presetElements = E([
			E('p', {}, _('Select one of the pre-defined blocklist presets, each one intended for devices with a certain total memory capacity.')),
			E('p', { 'id': 'auto-preset-note', 'display': 'none' }, ''),
			E('div', {}, [
				E('input', { 'type': 'radio', 'name': 'preset', 'value': 'mini', }),
				' ',
				E('strong', {}, _('Mini')),
				': ',
				_('for devices with 64MB of RAM. Aim for <100k entries. This preset includes circa 85k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'name': 'preset', 'value': 'small', 'checked': 'checked', }),
				' ',
				E('strong', {}, _('Small')),
				': ',
				_('for devices with 128MB of RAM. Aim for <300k entries. This preset includes circa 250k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'name': 'preset', 'value': 'medium', }),
				' ',
				E('strong', {}, _('Medium')),
				': ',
				_('for devices with 256MB of RAM. Aim for <600k entries. This preset includes circa 450k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'name': 'preset', 'value': 'large', }),
				' ',
				E('strong', {}, _('Large')),
				': ',
				_('for devices with 512MB of RAM. This preset includes circa 1M entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'name': 'preset', 'value': 'large_relaxed', }),
				' ',
				E('strong', {}, _('Large-Relaxed')),
				': ',
				E('span', {}, _('for devices with 1024MB of RAM or more. This preset includes circa 1M entries and same default blocklist URLs as %s but the max\
				                 values are more relaxed and allow for larger fluctuations in downloaded blocklist sizes').format('<strong>' + _('Large') + '</strong>')),
			]),
			E('br'),
		]);

		// Build the utils checkboxes
		var utilsElements = E([
			E('p', {}, _('Select the package(s) you would also like to install to make list processing significantly faster (doesn\'t affect DNS resolution speed).  \
				          gawk (including dependencies) may consume around 1MB, so consider unselecting gawk if flash space is an issue.')),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'name': 'utils', 'value': 'sort', 'checked': 'checked', }),
				' coreutils-sort',
			]),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'name': 'utils', 'value': 'awk', 'checked': 'checked', }),
				' gawk',
			]),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'name': 'utils', 'value': 'sed', 'checked': 'checked', }),
				' sed',
			]),
			E('br'),
		]);
		
		// Build the Install button element
		var buttonElement = E('button', {
			'class': 'btn cbi-button cbi-button-positive',
			'click': ui.createHandlerFn(this, this.handleInstallClick),
		}, _('Install adblock-lean'));

		// Get mem usage to select the recommended preset
		L.resolveDefault(rpc.systemInfo()).then(function (result) { 
			var mem = L.isObject(result.memory) ? result.memory : {};
			if (mem.total) {
				var preset;
				
				if (mem.total >= 1024 * 1024 * 1024) {
					preset = _('Large-Relaxed');
					document.querySelector('input[name=preset][value=large_relaxed]').checked = true;
				} else if (mem.total >= 512 * 1024 * 1024) {
					preset = _('Large');
					document.querySelector('input[name=preset][value=large]').checked = true;
				} else if (mem.total >= 256 * 1024 * 1024) {
					preset = _('Medium');
					document.querySelector('input[name=preset][value=medium]').checked = true;
				} else if (mem.total >= 128 * 1024 * 1024) {
					preset = _('Small');
					document.querySelector('input[name=preset][value=small]').checked = true;
				} else {
					preset = _('Mini');
					document.querySelector('input[name=preset][value=mini]').checked = true;
				}

				document.getElementById('auto-preset-note').innerText = _('Based on your total memory size of %sMB, the recommended preset of %s has been selected.').format(Math.trunc(mem.total / 1024 / 1024), preset);
				document.getElementById('auto-preset-note').style.display = 'block';
			}
		});

		// Return the combined elements
		return E([
			titleElement,
			instructionElements,
			presetElements,
			utilsElements,
			buttonElement
		]);
	},
});

return L.Class.extend({
	partial: installAblClass,
});