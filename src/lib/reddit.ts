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

const USER_AGENT = 'Mozilla/5.0 (compatible; ExpertScout/1.0; +https://expert-scout.vercel.app)';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRedditJson(url: string): Promise<unknown> {
  // Use AbortController with a generous but bounded timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    console.log(`[Reddit] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    console.log(`[Reddit] Response: ${response.status} for ${url.slice(0, 80)}...`);

    if (response.status === 429) {
      console.log('[Reddit] Rate limited, waiting 5s and retrying...');
      await delay(5000);
      const retry = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (!retry.ok) {
        console.error(`[Reddit] Retry failed: ${retry.status}`);
        return null;
      }
      return retry.json();
    }

    if (!response.ok) {
      console.error(`[Reddit] Error: ${response.status} ${response.statusText}`);
      return null;
    }

    return response.json();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[Reddit] Timeout for ${url.slice(0, 80)}`);
    } else {
      console.error(`[Reddit] Fetch error:`, err instanceof Error ? err.message : err);
    }
    return null;
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

// Search a single subreddit for posts matching a phrase
async function searchSubreddit(
  subreddit: string,
  phrase: string,
): Promise<RedditSearchResult[]> {
  const encodedPhrase = encodeURIComponent(phrase);
  // Use old.reddit.com — more reliable for JSON from servers
  const url = `https://old.reddit.com/r/${subreddit}/search.json?q=${encodedPhrase}&sort=relevance&t=year&limit=25&restrict_sr=on`;

  const data = await fetchRedditJson(url) as { data?: { children?: Record<string, unknown>[] } } | null;
  if (!data) return [];

  const children = data?.data?.children || [];
  return children
    .map(child => parsePost(child))
    .filter((item): item is RedditSearchResult => item !== null);
}

// Global comment search
async function searchComments(
  phrase: string,
): Promise<RedditSearchResult[]> {
  const encodedPhrase = encodeURIComponent(phrase);
  const url = `https://old.reddit.com/search.json?q=${encodedPhrase}&sort=relevance&t=year&limit=25&type=comment`;

  const data = await fetchRedditJson(url) as { data?: { children?: Record<string, unknown>[] } } | null;
  if (!data) return [];

  const children = data?.data?.children || [];
  return children
    .map(child => parseComment(child))
    .filter((item): item is RedditSearchResult => item !== null);
}

// Fetch top comments from a specific post
async function fetchPostComments(
  subreddit: string,
  postId: string,
): Promise<RedditSearchResult[]> {
  const cleanId = postId.replace('t3_', '');
  const url = `https://old.reddit.com/r/${subreddit}/comments/${cleanId}.json?limit=30&sort=top`;

  const data = await fetchRedditJson(url) as unknown[] | null;
  if (!data || !Array.isArray(data) || data.length < 2) return [];

  const commentListing = data[1] as { data?: { children?: Record<string, unknown>[] } };
  const children = commentListing?.data?.children || [];

  return children
    .filter((c: Record<string, unknown>) => c.kind === 't1')
    .map(child => parseComment(child))
    .filter((item): item is RedditSearchResult => item !== null);
}

export async function executeSearch(
  subreddits: string[],
  searchPhrases: string[],
): Promise<RedditSearchResult[]> {
  const allResults: RedditSearchResult[] = [];
  const seenIds = new Set<string>();

  function addResults(results: RedditSearchResult[]): void {
    for (const r of results) {
      if (!seenIds.has(r.reddit_id)) {
        seenIds.add(r.reddit_id);
        allResults.push(r);
      }
    }
  }

  // PHASE 1: Start with just the top 2 subreddits and top 3 phrases
  // That's 6 requests — should take ~15-20 seconds max
  const topSubreddits = subreddits.slice(0, 2);
  const topPhrases = searchPhrases.slice(0, 3);

  console.log(`[Reddit] Phase 1: Searching ${topSubreddits.length} subreddits × ${topPhrases.length} phrases`);
  console.log(`[Reddit] Subreddits: ${topSubreddits.join(', ')}`);
  console.log(`[Reddit] Phrases: ${topPhrases.join(', ')}`);

  for (const sub of topSubreddits) {
    for (const phrase of topPhrases) {
      const results = await searchSubreddit(sub, phrase);
      addResults(results);
      console.log(`[Reddit] r/${sub} "${phrase}" → ${results.length} posts (total: ${allResults.length})`);
      await delay(1000);
    }
  }

  // PHASE 2: Global comment search for top 2 phrases
  console.log(`[Reddit] Phase 2: Comment search for ${topPhrases.slice(0, 2).length} phrases`);

  for (const phrase of topPhrases.slice(0, 2)) {
    const results = await searchComments(phrase);
    addResults(results);
    console.log(`[Reddit] Comments "${phrase}" → ${results.length} comments (total: ${allResults.length})`);
    await delay(1000);
  }

  // PHASE 3: Get comments from the top 3 highest-scored posts we found
  const topPosts = allResults
    .filter(r => r.item_type === 'post' && r.num_comments > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (topPosts.length > 0) {
    console.log(`[Reddit] Phase 3: Fetching comments from ${topPosts.length} top posts`);

    for (const post of topPosts) {
      const comments = await fetchPostComments(post.subreddit, post.reddit_id);
      addResults(comments);
      console.log(`[Reddit] Post comments (${post.subreddit}) → ${comments.length} comments (total: ${allResults.length})`);
      await delay(1000);
    }
  }

  console.log(`[Reddit] Done: ${allResults.length} total items from ${seenIds.size} unique results`);
  return allResults;
}
