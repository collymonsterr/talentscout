"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SearchWithDetails, Candidate } from "@/lib/types";

const PIPELINE_STEPS = [
  { key: "criteria", label: "Generating search criteria", time: "~10s" },
  { key: "reddit", label: "Searching Reddit", time: "~1-2 min" },
  { key: "scoring", label: "Analysing and scoring candidates", time: "~30s" },
  { key: "done", label: "Complete", time: "" },
];

function getPipelineStep(status: string, hasRedditItems: boolean): number {
  switch (status) {
    case "generating_criteria":
      return 0;
    case "criteria_ready":
      return hasRedditItems ? 2 : 1;
    case "searching_reddit":
      return 1;
    case "scoring_candidates":
      return 2;
    case "complete":
      return 3;
    default:
      return -1;
  }
}

function ProgressPipeline({ currentStep }: { currentStep: number }) {
  if (currentStep < 0 || currentStep >= 3) return null;

  return (
    <Card className="mb-8">
      <CardContent className="pt-6 pb-6">
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isActive = i === currentStep;
            const isPending = i > currentStep;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-foreground flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <span className={`text-sm ${isActive ? "font-medium" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                  {step.label}
                  {isActive && step.time && (
                    <span className="text-muted-foreground font-normal ml-2">{step.time}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {currentStep === 0 && "AI is analysing your brief and generating structured search criteria..."}
            {currentStep === 1 && "Searching across relevant subreddits for high-signal posts and comments. This takes a minute or two."}
            {currentStep === 2 && "Grouping evidence by user, scoring candidates, and generating summaries..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

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
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                u/{candidate.username}
              </CardTitle>
              <a
                href={`https://www.reddit.com/user/${candidate.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Reddit profile &rarr;
              </a>
            </div>
            {candidate.likely_expertise && (
              <p className="text-sm text-muted-foreground mt-1">
                {candidate.likely_expertise}
              </p>
            )}
          </div>
          <ScoreBadge score={candidate.overall_score} />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {candidate.summary && (
          <p className="text-sm text-muted-foreground">
            {candidate.summary}
          </p>
        )}

        {candidate.strengths?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.strengths.slice(0, 3).map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                <span className="text-emerald-500">+</span> {s}
              </span>
            ))}
          </div>
        )}

        {candidate.outreach_angle && (
          <p className="text-xs text-muted-foreground italic">
            Outreach angle: {candidate.outreach_angle}
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
            <span>+{candidate.relevant_subreddits!.length - 3} more</span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Link href={`/candidates/${candidate.id}`}>
            <Button variant="outline" size="sm">
              View full profile
            </Button>
          </Link>
          <a
            href={`https://www.reddit.com/message/compose/?to=${candidate.username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              Message on Reddit
            </Button>
          </a>
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
  const [redditItemCount, setRedditItemCount] = useState<number | null>(null);
  const pipelineRef = useRef<{ triggered: Set<string>; running: boolean }>({
    triggered: new Set(),
    running: false,
  });

  const fetchSearch = useCallback(async () => {
    try {
      const res = await fetch(`/api/search/${id}`);
      if (!res.ok) throw new Error("Failed to fetch search");
      const result = await res.json();
      setData(result);
      return result as SearchWithDetails;
    } catch {
      setError("Failed to load search results");
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Run the full pipeline automatically
  const runPipeline = useCallback(async () => {
    if (pipelineRef.current.running) return;
    pipelineRef.current.running = true;

    try {
      // Step 1: Check current state
      const current = await fetchSearch();
      if (!current) return;

      const status = current.search.status;

      // Step 2: If criteria ready and no candidates, run Reddit search
      if (status === "criteria_ready" && current.candidates.length === 0 && !pipelineRef.current.triggered.has("reddit")) {
        pipelineRef.current.triggered.add("reddit");

        let redditOk = false;
        try {
          const res = await fetch("/api/search/reddit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchId: id }),
          });
          const result = await res.json();
          if (result.itemCount && result.itemCount > 0) {
            setRedditItemCount(result.itemCount);
            redditOk = true;
          } else if (res.ok && result.itemCount === 0) {
            setError("No Reddit results found for your search. Try a broader description.");
            await fetchSearch();
            return;
          }
          if (!res.ok) {
            setError("Reddit search failed. This can happen if Reddit is slow — try again in a minute.");
            await fetchSearch();
            return;
          }
        } catch {
          setError("Reddit search timed out. Try again — Reddit can be slow sometimes.");
          await fetchSearch();
          return;
        }

        // Refresh state after reddit search
        const afterReddit = await fetchSearch();
        if (!afterReddit) return;

        // Step 3: Only trigger scoring if Reddit actually returned results
        if (redditOk && !pipelineRef.current.triggered.has("scoring")) {
          pipelineRef.current.triggered.add("scoring");

          try {
            const scoreRes = await fetch("/api/candidates/score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ searchId: id }),
            });
            if (!scoreRes.ok) {
              const scoreData = await scoreRes.json();
              setError(scoreData.error || "Scoring failed. Please try a new search.");
            }
          } catch {
            setError("Scoring timed out. Try again.");
          }

          // Final refresh
          await fetchSearch();
        }
      }

      // If somehow we're at criteria_ready with no reddit triggered but there might be items
      // (e.g. page refresh after reddit completed), trigger scoring
      if (status === "criteria_ready" && current.candidates.length === 0 && pipelineRef.current.triggered.has("reddit") && !pipelineRef.current.triggered.has("scoring")) {
        pipelineRef.current.triggered.add("scoring");
        try {
          await fetch("/api/candidates/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ searchId: id }),
          });
        } catch {
          console.error("Scoring failed");
        }
        await fetchSearch();
      }
    } finally {
      pipelineRef.current.running = false;
    }
  }, [id, fetchSearch]);

  // Initial load and pipeline trigger
  useEffect(() => {
    fetchSearch().then((result) => {
      if (result && result.search.status === "criteria_ready" && result.candidates.length === 0) {
        runPipeline();
      }
    });
  }, [fetchSearch, runPipeline]);

  // Poll while processing
  useEffect(() => {
    if (!data?.search) return;
    const status = data.search.status;
    const isProcessing = ["generating_criteria", "searching_reddit", "scoring_candidates"].includes(status);

    if (isProcessing) {
      const interval = setInterval(fetchSearch, 3000);
      return () => clearInterval(interval);
    }
  }, [data?.search?.status, fetchSearch]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <Skeleton className="h-48 w-full rounded-lg" />
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
  const hasRedditItems = redditItemCount !== null && redditItemCount > 0;
  const currentStep = getPipelineStep(search.status, hasRedditItems);
  const isProcessing = currentStep >= 0 && currentStep < 3;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-2">Search Results</h1>
        <p className="text-sm text-muted-foreground">{search.user_brief}</p>
      </div>

      {search.status === "error" && (
        <Card className="mb-8 border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{search.error_message || "Something went wrong."}</p>
            <Link href="/">
              <Button variant="outline" size="sm" className="mt-3">
                Try a new search
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {isProcessing && <ProgressPipeline currentStep={currentStep} />}

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
