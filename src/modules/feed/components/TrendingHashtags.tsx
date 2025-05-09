import type { ReactElement } from 'react';

export const TrendingHashtags = ({ trendingHashtags }: { trendingHashtags: string[] }): ReactElement => {
  return (
    <section className="overflow-x-scroll flex flex-row gap-3">
      {trendingHashtags.slice(0, 5).map(hashtag => (
        <button className="rounded-xl border-x border-y py-2 px-3 border-ui-40">{hashtag}</button>
      ))}
    </section>
  );
};
