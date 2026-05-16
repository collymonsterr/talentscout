"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchWithDetails, Candidate } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  generating_criteria: "Generating search criteria...",
  criteria_ready: "Criteria ready",
  searching_reddit: "Searching Reddit...",
  scoring_candidates: "Analysing candidates...",
  complete: "Complete",
  error: "Error",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-zinc-50 text-zinc-600 border-zinc-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${color}`}>
      {Math.round(score)}
    </span>
  );
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="hover:border-foreground/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">
              <Link
                href={`/candidates/${candidate.id}`}
                className="hover:underline"
              >
                u/{candidate.username}
              </Link>
            </CardTitle>
            {candidate.likely_expertise && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {candidate.likely_expertise}
              </p>
            )}
          </div>
          <ScoreBadge score={candidate.overall_score} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {candidate.summary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {candidate.summary}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{candidate.evidence_count} evidence items</span>
          <span className="text-border">|</span>
          {candidate.relevant_subreddits?.slice(0, 3).map((sub) => (
            <Badge key={sub} variant="secondary" className="text-xs font-normal">
              r/{sub}
            </Badge>
          ))}
          {(candidate.relevant_subreddits?.length || 0) > 3 && (
            <span>+{candidate.relevant_subreddits.length - 3} more</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Link href={`/candidates/${candidate.id}`}>
            <Button variant="outline" size="sm">
              View details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SearchResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SearchWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());

  const fetchSearch = useCallback(async () => {
    try {
      const res = await fetch(`/api/search/${id}`);
      if (!res.ok) throw new Error("Failed to fetch search");
      const result = await res.json();
      setData(result);
      return result;
    } catch {
      setError("Failed to load search results");
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const triggerRedditSearch = useCallback(async () => {
    if (triggeredRef.current.has("reddit")) return;
    triggeredRef.current.add("reddit");
    try {
      await fetch("/api/search/reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: id }),
      });
    } catch {
      console.error("Reddit search trigger failed");
    }
  }, [id]);

  const triggerScoring = useCallback(async () => {
    if (triggeredRef.current.has("scoring")) return;
    triggeredRef.current.add("scoring");
    try {
      await fetch("/api/candidates/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: id }),
      });
    } catch {
      console.error("Scoring trigger failed");
    }
  }, [id]);

  useEffect(() => {
    fetchSearch();
  }, [fetchSearch]);

  useEffect(() => {
    if (!data?.search) return;
    const status = data.search.status;

    if (status === "criteria_ready" && data.candidates.length === 0) {
      triggerRedditSearch().then(() => {
        setTimeout(fetchSearch, 2000);
      });
      return;
    }

    if (status === "searching_reddit" || (status === "criteria_ready" && data.candidates.length === 0)) {
      const interval = setInterval(fetchSearch, 3000);
      return () => clearInterval(interval);
    }

    if (status === "criteria_ready" && !triggeredRef.current.has("scoring")) {
      // Reddit items exist, trigger scoring
      triggerScoring().then(() => {
        setTimeout(fetchSearch, 2000);
      });
      return;
    }

    if (status === "scoring_candidates") {
      const interval = setInterval(fetchSearch, 3000);
      return () => clearInterval(interval);
    }
  }, [data?.search?.status, data?.candidates.length, fetchSearch, triggerRedditSearch, triggerScoring]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-destructive">{error || "Search not found"}</p>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mt-4 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  const { search, criteria, candidates } = data;
  const isProcessing = ["generating_criteria", "searching_reddit", "scoring_candidates"].includes(search.status);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold">Search Results</h1>
          <Badge variant={search.status === "complete" ? "default" : "secondary"}>
            {STATUS_LABELS[search.status] || search.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{search.user_brief}</p>
      </div>

      {search.status === "error" && search.error_message && (
        <Card className="mb-8 border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{search.error_message}</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="mt-3">
                Try a new search
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {criteria && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Generated Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {criteria.core_skills?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Core skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {criteria.core_skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {criteria.tools?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {criteria.tools.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {criteria.subreddits?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Subreddits</p>
                <div className="flex flex-wrap gap-1.5">
                  {criteria.subreddits.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs font-normal">r/{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {criteria.search_phrases?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Search phrases</p>
                <div className="flex flex-wrap gap-1.5">
                  {criteria.search_phrases.map((p) => (
                    <span key={p} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      &quot;{p}&quot;
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <div className="space-y-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
          <p className="text-sm text-muted-foreground text-center">
            {STATUS_LABELS[search.status]}
          </p>
        </div>
      )}

      {candidates.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} found
          </h2>
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        </div>
      )}

      {search.status === "complete" && candidates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No candidates matched your criteria.</p>
          <Link href="/">
            <Button variant="outline">Try a different search</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
