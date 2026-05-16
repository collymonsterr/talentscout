interface RedditSearchResult {
  reddit_id: string;
  username: string;
  subreddit: string;
  item_type: 'post' | 'comment';
  title: string | null;
  body: string | null;
  permalink: string;
  score: number;
  num_comments: number;
  created_utc: number;
  raw_json: Record<string, unknown>;
}

const USER_AGENT = process.env.REDDIT_USER_AGENT || 'ExpertScout/1.0 (MVP research tool)';
const DELAY_MS = 800; // Reduced delay — still polite but faster

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRedditJson(url: string, timeoutMs: number = 8000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });

    if (response.status === 429) {
      // Rate limited — wait and retry once
      await delay(3000);
      const retry = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });
      if (!retry.ok) throw new Error(`Reddit API error: ${retry.status}`);
      return retry.json();
    }

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function parsePost(post: Record<string, unknown>): RedditSearchResult | null {
  const data = post.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const author = data.author as string;
  if (!author || author === '[deleted]' || author === 'AutoModerator') return null;

  return {
    reddit_id: data.name as string,
    username: author,
    subreddit: data.subreddit as string,
    item_type: 'post',
    title: (data.title as string) || null,
    body: (data.selftext as string)?.slice(0, 5000) || null,
    permalink: `https://www.reddit.com${data.permalink as string}`,
    score: (data.score as number) || 0,
    num_comments: (data.num_comments as number) || 0,
    created_utc: data.created_utc as number,
    raw_json: data,
  };
}

function parseComment(comment: Record<string, unknown>): RedditSearchResult | null {
  const data = comment.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const author = data.author as string;
  if (!author || author === '[deleted]' || author === 'AutoModerator') return null;

  const body = data.body as string;
  if (!body || body === '[deleted]' || body === '[removed]') return null;

  return {
    reddit_id: data.name as string,
    username: author,
    subreddit: data.subreddit as string,
    item_type: 'comment',
    title: (data.link_title as string) || null,
    body: body.slice(0, 5000),
    permalink: `https://www.reddit.com${data.permalink as string}`,
    score: (data.score as number) || 0,
    num_comments: 0,
    created_utc: data.created_utc as number,
    raw_json: data,
  };
}

async function searchSubreddit(
  subreddit: string,
  phrase: string,
  limit: number = 25
): Promise<RedditSearchResult[]> {
  const encodedPhrase = encodeURIComponent(phrase);
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodedPhrase}&sort=relevance&t=year&limit=${limit}&restrict_sr=on`;

  try {
    const data = await fetchRedditJson(url) as { data?: { children?: Record<string, unknown>[] } };
    const children = data?.data?.children || [];

    return children
      .map(child => parsePost(child))
      .filter((item): item is RedditSearchResult => item !== null);
  } catch (err) {
    console.error(`Failed to search r/${subreddit} for "${phrase}":`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function searchRedditComments(
  phrase: string,
  limit: number = 25
): Promise<RedditSearchResult[]> {
  const encodedPhrase = encodeURIComponent(phrase);
  const url = `https://www.reddit.com/search.json?q=${encodedPhrase}&sort=relevance&t=year&limit=${limit}&type=comment`;

  try {
    const data = await fetchRedditJson(url) as { data?: { children?: Record<string, unknown>[] } };
    const children = data?.data?.children || [];

    return children
      .map(child => parseComment(child))
      .filter((item): item is RedditSearchResult => item !== null);
  } catch (err) {
    console.error(`Failed to search comments for "${phrase}":`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit: number = 50
): Promise<RedditSearchResult[]> {
  const cleanId = postId.replace('t3_', '');
  const url = `https://www.reddit.com/r/${subreddit}/comments/${cleanId}.json?limit=${limit}&sort=top`;

  try {
    const data = await fetchRedditJson(url) as unknown[];
    if (!Array.isArray(data) || data.length < 2) return [];

    const commentListing = data[1] as { data?: { children?: Record<string, unknown>[] } };
    const children = commentListing?.data?.children || [];

    return children
      .filter((c: Record<string, unknown>) => c.kind === 't1')
      .map(child => parseComment(child))
      .filter((item): item is RedditSearchResult => item !== null);
  } catch (err) {
    console.error(`Failed to fetch comments for post ${postId}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

export async function executeSearch(
  subreddits: string[],
  searchPhrases: string[],
): Promise<RedditSearchResult[]> {
  // Constrain scope to fit within 120s timeout:
  // 5 subreddits × 5 phrases = 25 requests + 5 comment searches + 5 post comments = 35 requests
  // At ~1s each (fetch + 800ms delay) ≈ 35-50 seconds — well within limits
  const activeSubreddits = subreddits.slice(0, 5);
  const activePhrases = searchPhrases.slice(0, 5);
  const allResults: RedditSearchResult[] = [];
  const seenIds = new Set<string>();
  const startTime = Date.now();
  const TIME_LIMIT_MS = 90_000; // Stop collecting at 90s to leave time for DB writes

  function addResult(result: RedditSearchResult): void {
    if (!seenIds.has(result.reddit_id)) {
      seenIds.add(result.reddit_id);
      allResults.push(result);
    }
  }

  function isTimeLimitReached(): boolean {
    return Date.now() - startTime > TIME_LIMIT_MS;
  }

  // Phase 1: Search subreddits for posts
  for (const phrase of activePhrases) {
    if (isTimeLimitReached() || allResults.length >= 300) break;

    for (const subreddit of activeSubreddits) {
      if (isTimeLimitReached() || allResults.length >= 300) break;

      const results = await searchSubreddit(subreddit, phrase, 25);
      results.forEach(addResult);
      await delay(DELAY_MS);
    }
  }

  console.log(`Phase 1 (subreddit search): ${allResults.length} items in ${Math.round((Date.now() - startTime) / 1000)}s`);

  // Phase 2: Global comment search for top phrases
  for (const phrase of activePhrases.slice(0, 3)) {
    if (isTimeLimitReached() || allResults.length >= 400) break;

    const commentResults = await searchRedditComments(phrase, 25);
    commentResults.forEach(addResult);
    await delay(DELAY_MS);
  }

  console.log(`Phase 2 (comment search): ${allResults.length} items in ${Math.round((Date.now() - startTime) / 1000)}s`);

  // Phase 3: Fetch comments from top posts (best source of expert commenters)
  const topPosts = allResults
    .filter(r => r.item_type === 'post' && r.num_comments > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const post of topPosts) {
    if (isTimeLimitReached() || allResults.length >= 500) break;

    const comments = await fetchPostComments(post.subreddit, post.reddit_id);
    comments.forEach(addResult);
    await delay(DELAY_MS);
  }

  console.log(`Phase 3 (post comments): ${allResults.length} total items in ${Math.round((Date.now() - startTime) / 1000)}s`);

  return allResults;
}
