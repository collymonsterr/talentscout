"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLE_PROMPT =
  "Find me practical AI automation builders who understand n8n, OpenAI, Claude, Supabase, Zapier, Make and CRM integrations.";

interface RecentSearch {
  id: string;
  user_brief: string;
  status: string;
  created_at: string;
  candidate_count: number;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function HomePage() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    fetch("/api/searches")
      .then((res) => res.json())
      .then((data) => {
        if (data.searches) setRecentSearches(data.searches);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (brief.trim().length < 10) {
      setError("Please describe the expert you're looking for in at least a sentence.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/search/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userBrief: brief.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.push(`/search/${data.searchId}`);
    } catch {
      setError("Failed to connect. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          Find hidden experts by what they actually know.
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
          Describe the expert you need. ExpertScout searches public Reddit
          discussions to find people who repeatedly demonstrate practical
          expertise.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Describe the expert you're looking for..."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={5}
          className="resize-none text-base"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-shrink-0"
          >
            {loading ? "Searching..." : "Find Experts"}
          </Button>

          <button
            type="button"
            onClick={() => setBrief(EXAMPLE_PROMPT)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Try an example
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {recentSearches.length > 0 && (
        <div className="mt-16 border-t border-border pt-10">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">
            Recent searches
          </h2>
          <div className="space-y-3">
            {recentSearches.map((search) => (
              <Link
                key={search.id}
                href={`/search/${search.id}`}
                className="block group"
              >
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border hover:border-foreground/20 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-2 group-hover:underline">
                      {search.user_brief}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {search.candidate_count} expert{search.candidate_count !== 1 ? "s" : ""} found
                      </span>
                      <span className="text-xs text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(search.created_at)}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground/60 mt-0.5 flex-shrink-0 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 border-t border-border pt-10">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              step: "1",
              title: "Describe the expert",
              desc: "Tell us what skills, tools, and experience matter most.",
            },
            {
              step: "2",
              title: "Search Reddit discussions",
              desc: "We find high-signal posts and comments across relevant subreddits.",
            },
            {
              step: "3",
              title: "Analyse contributors",
              desc: "Evidence is grouped by user and scored on multiple dimensions.",
            },
            {
              step: "4",
              title: "Review ranked candidates",
              desc: "See who matches, why, and save promising finds to your bench.",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <span className="text-sm font-mono text-muted-foreground mt-0.5">
                {item.step}
              </span>
              <div>
                <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
