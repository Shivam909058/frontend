export type Item = {
  title?: string;
  description: string;
  imageUrl?: string;
  permalink?: string;
  location?: [number, number];
};

export type FeedProps = {
  fetchFeedData: () => Promise<Item[]>;
  className?: string;
};
