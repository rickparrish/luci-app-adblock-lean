'use strict';
'require view';
'require form';
'require fs';
'require ui';

let notMsg, errMsg;
let m, data;

return view.extend({
	load: function () {
		// TODOX Read and parse /root/adblock-lean/config
		data = {
			'config': {
				'blocklist_urls': [
					'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/dnsmasq/light.txt'
				],
				'allowlist_urls': [
				],
				'min_blocklist_file_part_line_count': 1,
				'max_blocklist_file_part_size_KB': 20000,
				'max_blocklist_file_size_KB': 30000,
				'min_good_line_count': 100000,
				'compress_blocklist': 1,
				'initial_dnsmasq_restart': 0,
				'max_download_retries': 3,
				'download_failed_action': 'SKIP_PARTIAL',
				'rogue_element_action': 'SKIP_PARTIAL',
				'dnsmasq_test_failed_action': 'SKIP_PARTIAL',
				'report_failure': '',
				'report_success': '',
				'boot_start_delay_s': 120
			}
		};
		
		return Promise.all([
			L.resolveDefault(fs.exec_direct('/etc/init.d/adblock-lean', ['status']), '')
		]);
	},
	handleSave: function (ev) {
		m.save()
			.then((result) => {
				console.log(data);
				alert('I don\'t do anything yet');
				// TODO Update config file
			})
			.catch((error) => {
				console.log(error);
			});
	},
	render: function (arr) {
		let s, o;

		// TODO Less hacky way to output the status
		var status = new form.JSONMap(data, 'AdBlock Lean - Status');
		s = status.section(form.NamedSection, 'global');
		s.render = L.bind(async function (view, section_id) {
			var output_filename = '/tmp/adblock-lean-output.luci';
			var lines = await fs.lines(output_filename);
			var rows = lines.length < 5 ? 5 : lines.length + 1;
			await fs.remove(output_filename);

			return E([
				E('p', {},
					E('textarea', {
						'style': 'width: 100% !important; padding: 5px; font-family: monospace',
						'spellcheck': 'false',
						'wrap': 'off',
						'rows': rows
					}, [lines.join('\r\n')])
				)
			]);
		}, o, this);

		m = new form.JSONMap(data, 'AdBlock Lean - Configuration', _('Configuration of the AdBlock Lean package. \
			For further information please check the <a style="color:#37c;font-weight:bold;" href="https://github.com/lynxthecat/adblock-lean" target="_blank" rel="noreferrer noopener" >online documentation</a>'));

		s = m.section(
			form.NamedSection,
			'config',
			'adblock-lean-section'
		);

		o = s.option(
			form.DynamicList,
			'blocklist_urls',
			_('Blocklist Urls'),
			_('One or more dnsmasq blocklist urls')
		);
		o.optional = false;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.DynamicList,
			'allowlist_urls',
			_('Allowlist Urls'),
			_('Zero or more dnsmasq allowlist urls')
		);
		o.optional = true;
		o.retain = true;
		o.rmempty = false;

		o = s.option(
			form.Value,
			'min_blocklist_file_part_line_count',
			_('Min line count'),
			_('Mininum number of lines of any individual downloaded blocklist part (1-100)') // TODO range
		);
		o.datatype = 'range(1,100)'; // TODO range

		o = s.option(
			form.Value,
			'max_blocklist_file_part_size_KB',
			_('Max file size (KB)'),
			_('Maximum size of any individual downloaded blocklist part (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range

		o = s.option(
			form.Value,
			'max_blocklist_file_size_KB',
			_('Max total size (KB)'),
			_('Maximum total size of combined, processed blocklist (1000-100000)') // TODO range
		);
		o.datatype = 'range(1000,100000)'; // TODO range

		o = s.option(
			form.Value,
			'min_good_line_count',
			_('Min good lines'),
			_('Minimum number of good lines in final postprocessed blocklist (1-1000000)') // TODO range
		);
		o.datatype = 'range(1,1000000)'; // TODO range

		o = s.option(
			form.Flag,
			'compress_blocklist',
			_('Compress blocklist'),
			_('Compress blocklist to save memory once blocklist has been loaded')
		);

		o = s.option(
			form.Flag,
			'initial_dnsmasq_restart',
			_('Restart dnsmasq'),
			_('Restart dnsmasq if previous blocklist was extracted and before generation of new blocklist thereby to free up memory during generaiton of new blocklist')
		);

		o = s.option(
			form.Value,
			'max_download_retries',
			_('Max download retries'),
			_('Maximum number of download retries (1-5)') // TODO range
		);
		o.datatype = 'range(1,5)'; // TODO range

		o = s.option(
			form.ListValue,
			'download_failed_action',
			_('Download failed action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');

		o = s.option(
			form.ListValue,
			'rogue_element_action',
			_('Rogue element action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)<br /> \
			   IGNORE - ignore any rogue elements (warning: use with caution)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');
		o.value('IGNORE');

		o = s.option(
			form.ListValue,
			'dnsmasq_test_failed_action',
			_('"dnsmasq --test" failed action'),
			_('SKIP_PARTIAL - skip failed blocklist file part and continue blocklist generation<br /> \
			   STOP - stop blocklist generation (and fallback to previous blocklist if available)'),
		);
		o.value('SKIP_PARTIAL');
		o.value('STOP');

		o = s.option(
			form.TextValue,
			'report_failure',
			_('Report failure'),
		);
		o.datatype = 'string';

		o = s.option(
			form.TextValue,
			'report_success',
			_('Report success'),
			_("The following shell variables are invoked using: \
			   'eval \${report_failure}' and 'eval \${report_success}' \
			   thereby to facilitate sending e.g. mailsend/sms notifications. \
			   The variables '\${failure_msg}' and '\${success_msg}' can be employed")
		);
		o.datatype = 'string';

		o = s.option(
			form.Value,
			'boot_start_delay_s',
			_('Boot start delay (s)'),
			_('Start delay in seconds when service is started from system boot (0-300)') // TODO range
		);
		o.datatype = 'range(0,300)'; // TODO range		

		return Promise.all([status.render(), m.render()]);
	},
	handleSaveApply: null,
	handleReset: null
});
