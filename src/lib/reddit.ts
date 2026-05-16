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
const DELAY_MS = 1500;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRedditJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
    },
  });

  if (response.status === 429) {
    await delay(5000);
    const retry = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!retry.ok) throw new Error(`Reddit API error: ${retry.status}`);
    return retry.json();
  }

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  return response.json();
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

export async function searchSubreddit(
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
  } catch {
    console.error(`Failed to search r/${subreddit} for "${phrase}"`);
    return [];
  }
}

export async function searchRedditComments(
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
  } catch {
    console.error(`Failed to search comments for "${phrase}"`);
    return [];
  }
}

export async function fetchPostComments(
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
  } catch {
    console.error(`Failed to fetch comments for post ${postId}`);
    return [];
  }
}

export async function executeSearch(
  subreddits: string[],
  searchPhrases: string[],
  maxSubreddits: number = 10,
  maxPhrases: number = 10,
  maxItemsPerPhrase: number = 25,
): Promise<RedditSearchResult[]> {
  const activeSubreddits = subreddits.slice(0, maxSubreddits);
  const activePhrases = searchPhrases.slice(0, maxPhrases);
  const allResults: RedditSearchResult[] = [];
  const seenIds = new Set<string>();

  for (const phrase of activePhrases) {
    // Search across subreddits for this phrase
    for (const subreddit of activeSubreddits) {
      if (allResults.length >= 500) break;

      const results = await searchSubreddit(subreddit, phrase, maxItemsPerPhrase);

      for (const result of results) {
        if (!seenIds.has(result.reddit_id)) {
          seenIds.add(result.reddit_id);
          allResults.push(result);
        }
      }

      await delay(DELAY_MS);
    }

    // Also search comments globally for this phrase
    if (allResults.length < 500) {
      const commentResults = await searchRedditComments(phrase, maxItemsPerPhrase);
      for (const result of commentResults) {
        if (!seenIds.has(result.reddit_id)) {
          seenIds.add(result.reddit_id);
          allResults.push(result);
        }
      }
      await delay(DELAY_MS);
    }

    if (allResults.length >= 500) break;
  }

  // For top posts, also fetch their comments to find expert commenters
  const topPosts = allResults
    .filter(r => r.item_type === 'post' && r.num_comments > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  for (const post of topPosts) {
    if (allResults.length >= 500) break;

    const comments = await fetchPostComments(post.subreddit, post.reddit_id);
    for (const comment of comments) {
      if (!seenIds.has(comment.reddit_id)) {
        seenIds.add(comment.reddit_id);
        allResults.push(comment);
      }
    }
    await delay(DELAY_MS);
  }

  return allResults;
}
