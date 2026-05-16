"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate, CandidateEvidence, SavedCandidate } from "@/lib/types";

function ScoreBar({ label, score, weight }: { label: string; score: number; weight?: string }) {
  const color =
    score >= 70
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-zinc-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 flex-shrink-0">
        {label}
        {weight && <span className="text-xs text-muted-foreground ml-1">({weight})</span>}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-mono w-8 text-right">{Math.round(score)}</span>
    </div>
  );
}

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [evidence, setEvidence] = useState<CandidateEvidence[]>([]);
  const [saved, setSaved] = useState<SavedCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const res = await fetch(`/api/candidates/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setCandidate(data.candidate);
        setEvidence(data.evidence || []);
        setSaved(data.saved || null);
      } finally {
        setLoading(false);
      }
    }
    fetchCandidate();
  }, [id]);

  async function handleSave() {
    if (!candidate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/candidates/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const data = await res.json();
      if (data.saved) setSaved(data.saved);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-destructive">Candidate not found</p>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mt-4 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">u/{candidate.username}</h1>
          {candidate.likely_expertise && (
            <p className="text-sm text-muted-foreground mt-1">{candidate.likely_expertise}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-semibold">{Math.round(candidate.overall_score)}</span>
          {saved ? (
            <Badge variant="secondary">Saved</Badge>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save to bench"}
            </Button>
          )}
        </div>
      </div>

      {candidate.summary && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed">{candidate.summary}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <ScoreBar label="Practicality" score={candidate.practicality_score} weight="30%" />
          <ScoreBar label="Relevance" score={candidate.relevance_score} weight="25%" />
          <ScoreBar label="Specificity" score={candidate.specificity_score} weight="20%" />
          <ScoreBar label="Consistency" score={candidate.consistency_score} weight="15%" />
          <ScoreBar label="Helpfulness" score={candidate.helpfulness_score} weight="10%" />
          <Separator />
          <ScoreBar label="Recency" score={candidate.recency_score} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {candidate.strengths?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Strengths</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {candidate.risks?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uncertainties</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {candidate.risks.map((r, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">?</span>
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {candidate.outreach_angle && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suggested Outreach</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">{candidate.outreach_angle}</p>
            {candidate.outreach_message && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{candidate.outreach_message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {evidence.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-4">
            Evidence ({evidence.length} items)
          </h2>
          <div className="space-y-3">
            {evidence.map((e) => {
              const item = e.reddit_item;
              if (!item) return null;
              return (
                <Card key={e.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-normal">
                            r/{item.subreddit}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`text-xs font-normal ${
                              e.evidence_strength === "strong"
                                ? "bg-emerald-50 text-emerald-700"
                                : e.evidence_strength === "weak"
                                  ? "bg-zinc-50 text-zinc-500"
                                  : ""
                            }`}
                          >
                            {e.evidence_strength}
                          </Badge>
                          {item.score > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {item.score} upvotes
                            </span>
                          )}
                        </div>
                        {item.title && (
                          <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                        )}
                      </div>
                    </div>
                    {item.body && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                        {item.body}
                      </p>
                    )}
                    {e.relevance_reason && (
                      <p className="text-xs text-muted-foreground italic mb-2">
                        {e.relevance_reason}
                      </p>
                    )}
                    {item.permalink && (
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View on Reddit
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link href={`/search/${candidate.search_id}`}>
          <Button variant="outline" size="sm">Back to results</Button>
        </Link>
        {!saved && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save to bench"}
          </Button>
        )}
      </div>
    </div>
  );
}
