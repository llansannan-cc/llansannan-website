// Shared news-list logic: drop posts whose optional expiry date has passed
// (mirrors how community events already expire automatically), and always
// show the newest posts first regardless of the order they were added in
// the CMS.

export type NewsItem = {
  title_cy: string;
  title_en: string;
  date: string;
  body_cy: string;
  body_en: string;
  featured?: boolean;
  expires?: string | null;
};

export function getActiveNews(items: NewsItem[]): NewsItem[] {
  const todayIso = new Date().toISOString().slice(0, 10);
  return items
    .filter(n => !n.expires || n.expires >= todayIso)
    .sort((a, b) => b.date.localeCompare(a.date));
}
