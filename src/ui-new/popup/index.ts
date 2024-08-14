// Why just `import type`? Because importing appears to have side-effects...
import type { CommandMessages, SettingsConfig, SmartProfileTypeBuiltinIds } from '../../core/definitions';

document.addEventListener('DOMContentLoaded', () => {
	const toggleCheckbox = document.getElementById('toggleCheckbox') as HTMLInputElement;
	const toggledStateText = document.getElementById('toggledStateText');

	toggleCheckbox.addEventListener('change', () => {
		const newIsExtensionOn = toggleCheckbox.checked;

		const message: {
			command: typeof CommandMessages.PopupChangeActiveProfile;
			profileId: SmartProfileTypeBuiltinIds.SmartRules | SmartProfileTypeBuiltinIds.Direct;
		} = {
			command: 'Popup_ChangeActiveProfile' as typeof CommandMessages.PopupChangeActiveProfile,
			profileId: newIsExtensionOn
				? ('InternalProfile_SmartRules' as SmartProfileTypeBuiltinIds.SmartRules)
				: ('InternalProfile_Direct' as SmartProfileTypeBuiltinIds.Direct),
		};
		chrome.runtime.sendMessage(message);

		setUiToggledState(newIsExtensionOn);
	});

	// Read the toggled state from storage and watch for changes.
	// TODO perf: do not wait for `DOMContentLoaded`.
	const activeProfileIdKey: keyof Pick<SettingsConfig, 'activeProfileId'> = 'activeProfileId';
	chrome.storage.local.get(activeProfileIdKey).then(({ activeProfileId }) => {
		setUiToggledState(activeProfileId === ('InternalProfile_SmartRules' as SmartProfileTypeBuiltinIds.SmartRules));
	});
	chrome.storage.onChanged.addListener((changes) => {
		if (changes[activeProfileIdKey]) {
			setUiToggledState(
				changes[activeProfileIdKey].newValue === ('InternalProfile_SmartRules' as SmartProfileTypeBuiltinIds.SmartRules),
			);
		}
	});

	function setUiToggledState(isExtensionOn: boolean): void {
		toggleCheckbox.checked = isExtensionOn;
		// TODO i18n.
		toggledStateText.innerText = isExtensionOn ? 'Включено' : 'Выключено';
	}
});
