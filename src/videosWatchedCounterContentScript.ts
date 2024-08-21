import type { CommandMessages, SettingsConfig, SmartProfileTypeBuiltinIds } from './core/definitions';
import { ExtraStorageValues, trialNumVideosAllowed } from './core/extraDefinitions';

const defaultStorageValues: ExtraStorageValues & Pick<SettingsConfig, 'activeProfileId'> = {
	activeProfileId: null,
	openedYoutubeVideoIds: [],
	trialEnded: false,
};
async function maybeCountVideo() {
	const storage = (await chrome.storage.local.get(defaultStorageValues)) as typeof defaultStorageValues;
	const isExtensionDisabled =
		storage.activeProfileId !== ('InternalProfile_SmartRules' as SmartProfileTypeBuiltinIds.SmartRules);
	if (isExtensionDisabled) {
		// Yes, technically this can be circumvented if
		// the user disabled the extension prior to opening a new video
		// and enabling it afterwards.
		return;
	}

	const videoId = new URLSearchParams(location.search).get('v');
	if (!videoId) {
		console.warn('Could not parse video ID');
		return;
	}
	if (storage.openedYoutubeVideoIds.includes(videoId)) {
		// Probably just reloaded the page, or watching the same video again.
		return;
	}
	// Now it's a video that is not in `openedYoutubeVideoIds`.
	if (storage.openedYoutubeVideoIds.length < trialNumVideosAllowed) {
		const newValues: Partial<ExtraStorageValues> = {
			openedYoutubeVideoIds: [...storage.openedYoutubeVideoIds, videoId],
		};
		chrome.storage.local.set(newValues);
		return;
	}
	// Now we know that it's the 11th ((trialNumVideos + 1)th) video opened.

	const newValues: Partial<ExtraStorageValues> = {
		trialEnded: true,
	};
	chrome.storage.local.set(newValues);
	const key: keyof Pick<ExtraStorageValues, 'openedYoutubeVideoIds'> = 'openedYoutubeVideoIds';
	chrome.storage.local.remove(key);

	const message: {
		command: typeof CommandMessages.PopupChangeActiveProfile;
		profileId: SmartProfileTypeBuiltinIds.SmartRules | SmartProfileTypeBuiltinIds.Direct;
	} = {
		command: 'Popup_ChangeActiveProfile' as typeof CommandMessages.PopupChangeActiveProfile,
		profileId: 'InternalProfile_Direct' as SmartProfileTypeBuiltinIds.Direct,
	};
	chrome.runtime.sendMessage(message);
}

maybeCountVideo();
// @ts-expect-error
if (typeof navigation !== 'undefined') {
	// @ts-expect-error
	navigation.addEventListener('navigate', maybeCountVideo);
} else {
	setInterval(maybeCountVideo, 20 * 1000);
}

