export const extraStorageKeys = [
	'trialEnded',
	'openedYoutubeVideoIds',
] as const;
export type ExtraStorageValues = {
	[P in (typeof extraStorageKeys)[number]]: {
    trialEnded: boolean;
    openedYoutubeVideoIds: string[];
  }[P]
};

export const trialNumVideosAllowed = 10;
// export const trialNumVideosAllowed = 2;
