'use strict';
'require baseclass';
'require rpc';
'require ui';

var rpcInstall = rpc.declare({
	object: 'luci.adblock-lean',
	method: 'install',
	params: ['preset', 'utils'],
});

function handleInstallClick() {
	// Display the spinning cursor dialog
	ui.showModal(null, [
		E('p', { class: 'spinning' }, _('Installing adblock-lean')),
	]);
	
	// Determine which preset the user wants to use
	var preset = document.querySelector('input[name=presetRadio]:checked').value;

	// Determine which utils the user wants to install
	var utils = Array.from(document.querySelectorAll("input[name=utilCheckbox]:checked"), e => e.value).join(' ');

	// Call the install RPC method and reload the page when it completes
	L.resolveDefault(rpcInstall(preset, utils)).then(function (result) { location.reload() });
}

var installClass = baseclass.extend({
	render: function () {
		// Build the title element
		var titleElement = E('h1', {}, _('Install adblock-lean'));

		// Build the instruction element
		var instructionElements = E([
			E('p', {}, _('adblock-lean is not currently installed on your system.')),
			E('p', {}, _('To install it now review and submit the form below, or to install it manually <a %s>follow the instructions here</a>.')
						.format('href="https://github.com/lynxthecat/adblock-lean" target="_blank" rel="noreferrer"')),
			E('hr'),
		]);

		// Build the preset radiobuttons
		var presetElements = E([
			E('p', {}, _('Select one of the four pre-defined blocklist presets, each one intended for devices with a certain total memory capacity.')),
			E('div', {}, [
				E('input', { 'type': 'radio', 'value': 'mini', 'name': 'presetRadio', }),
				' ',
				E('strong', {}, _('Mini')),
				': ',
				_('for devices with 64MB of RAM. Aim for <100k entries. This preset includes circa 85k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'value': 'small', 'name': 'presetRadio', 'checked': 'checked', }),
				' ',
				E('strong', {}, _('Small')),
				': ',
				_('for devices with 128MB of RAM. Aim for <300k entries. This preset includes circa 250k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'value': 'medium', 'name': 'presetRadio', }),
				' ',
				E('strong', {}, _('Medium')),
				': ',
				_('for devices with 256MB of RAM. Aim for <600k entries. This preset includes circa 450k entries'),
			]),
			E('div', {}, [
				E('input', { 'type': 'radio', 'value': 'large', 'name': 'presetRadio', }),
				' ',
				E('strong', {}, _('Large')),
				': ',
				_('for devices with 512MB of RAM or more. This preset includes circa 800k entries'),
			]),
			E('br'),
		]);

		// Build the utils checkboxes
		var utilElements = E([
			E('p', {}, _('Select the package(s) you would also like to install to make list processing significantly faster (doesn\'t affect DNS resolution speed).  \
				          gawk (including dependencies) may consume around 1MB, so consider unselecting gawk if flash space is an issue.')),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'value': 'sort', 'name': 'utilCheckbox', 'checked': 'checked', }),
				' coreutils-sort',
			]),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'value': 'awk', 'name': 'utilCheckbox', 'checked': 'checked', }),
				' gawk',
			]),
			E('div', {}, [
				E('input', { 'type': 'checkbox', 'value': 'sed', 'name': 'utilCheckbox', 'checked': 'checked', }),
				' sed',
			]),
			E('br'),
		]);
		
		// Build the Install button element
		var buttonElement = E('button', {
			'class': 'btn cbi-button cbi-button-positive',
			'click': ui.createHandlerFn(this, handleInstallClick),
		}, _('Install adblock-lean'));

		// Return the combined elements
		return E([
			titleElement,
			instructionElements,
			presetElements,
			utilElements,
			buttonElement
		]);
	},
});

return L.Class.extend({
	view: installClass,
});