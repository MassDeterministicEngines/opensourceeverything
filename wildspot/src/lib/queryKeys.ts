export const qk = {
  me: ['me'] as const,
  profile: (id: string) => ['profile', id] as const,
  spots: ['spots'] as const,
  spot: (id: string) => ['spot', id] as const,
  momentsForSpot: (spotId: string) => ['moments', 'spot', spotId] as const,
  momentsForAuthor: (authorId: string) => ['moments', 'author', authorId] as const,
  capturesForSpot: (spotId: string) => ['captures', 'spot', spotId] as const,
  myCaptures: ['captures', 'me'] as const,
  friendships: ['friendships'] as const,
  leaderboard: ['leaderboard'] as const,
  signedUrl: (path: string) => ['signedUrl', path] as const,
};
