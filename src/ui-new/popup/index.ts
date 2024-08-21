// Why just `import type`? Because importing appears to have side-effects...
import type { CommandMessages, SettingsConfig, SmartProfileTypeBuiltinIds } from '../../core/definitions';
import { ExtraStorageValues, trialNumVideosAllowed } from '../../core/extraDefinitions';

document.addEventListener('DOMContentLoaded', () => {
	const toggleCheckbox = document.getElementById('toggleCheckbox') as HTMLInputElement;
	const toggledStateText = document.getElementById('toggledStateText');
	const trialNumVideosAllowedEl = document.getElementById('trialNumVideosAllowed');
	const videosWatchedCountEl = document.getElementById('videosWatchedCount');

	trialNumVideosAllowedEl.innerText = trialNumVideosAllowed.toString();

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

	// Read the state from storage and watch for changes.
	// TODO perf: do not wait for `DOMContentLoaded`.
	let storageCache: Pick<SettingsConfig, 'activeProfileId'> & Pick<ExtraStorageValues, 'trialEnded' | 'openedYoutubeVideoIds'>;
	const storageDefaultValues: typeof storageCache = {
		activeProfileId: null,
		trialEnded: false,
		openedYoutubeVideoIds: [],
	};
	chrome.storage.local.get(storageDefaultValues).then((storage: typeof storageCache) => {
		storageCache = storage;
		reactToNewState(storage);
	});
	chrome.storage.onChanged.addListener((changes, areanName) => {
		if (areanName !== 'local') {
			return;
		}
		for (const [key, change] of Object.entries(changes)) {
			storageCache[key] = change.newValue;
		}
		reactToNewState(storageCache);
	});

	function reactToNewState(newState: typeof storageCache) {
		setUiToggledState(newState.activeProfileId === ('InternalProfile_SmartRules' as SmartProfileTypeBuiltinIds.SmartRules));

		// TODO check payment state as well.
		toggleCheckbox.disabled = newState.trialEnded === true;
		// TODO show the "pay" button.

		videosWatchedCountEl.innerText = newState.trialEnded
			// A bit stupid
			? trialNumVideosAllowed.toString()
			: newState.openedYoutubeVideoIds.length.toString();
	}

	function setUiToggledState(isExtensionOn: boolean): void {
		toggleCheckbox.checked = isExtensionOn;
		// TODO i18n.
		toggledStateText.innerText = isExtensionOn ? 'Включено' : 'Выключено';
	}
});

