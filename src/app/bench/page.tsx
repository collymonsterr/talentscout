"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SavedCandidate, SavedCandidateStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: SavedCandidateStatus; label: string }[] = [
  { value: "not_contacted", label: "Not contacted" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "interested", label: "Interested" },
  { value: "not_relevant", label: "Not relevant" },
];

const STATUS_COLORS: Record<string, string> = {
  not_contacted: "bg-zinc-100 text-zinc-700",
  contacted: "bg-blue-50 text-blue-700",
  replied: "bg-amber-50 text-amber-700",
  interested: "bg-emerald-50 text-emerald-700",
  not_relevant: "bg-zinc-50 text-zinc-400",
};

function BenchCard({
  item,
  onUpdate,
}: {
  item: SavedCandidate;
  onUpdate: (id: string, updates: Partial<SavedCandidate>) => void;
}) {
  const [notes, setNotes] = useState(item.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);

  const candidate = item.candidate;

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <Link
              href={`/candidates/${item.candidate_id}`}
              className="text-base font-medium hover:underline"
            >
              u/{item.username}
            </Link>
            {candidate?.likely_expertise && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {candidate.likely_expertise}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {candidate && (
              <span className="text-lg font-semibold">{Math.round(candidate.overall_score)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Select
            value={item.status}
            onValueChange={(value) => onUpdate(item.id, { status: value as SavedCandidateStatus })}
          >
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {item.tags?.length > 0 && (
            <div className="flex gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {editingNotes ? (
          <div className="space-y-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm resize-none"
              placeholder="Add notes about this candidate..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  onUpdate(item.id, { notes });
                  setEditingNotes(false);
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNotes(item.notes || "");
                  setEditingNotes(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingNotes(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left w-full"
          >
            {item.notes || "Add notes..."}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default function BenchPage() {
  const [items, setItems] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBench() {
      try {
        const res = await fetch("/api/bench");
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.saved || []);
      } finally {
        setLoading(false);
      }
    }
    fetchBench();
  }, []);

  async function handleUpdate(id: string, updates: Partial<SavedCandidate>) {
    try {
      const res = await fetch(`/api/bench/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data.saved } : item))
      );
    } catch {
      console.error("Failed to update");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Bench</h1>
        <span className="text-sm text-muted-foreground">
          {items.length} saved candidate{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No saved candidates yet.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Run a search and save promising candidates to build your bench.
          </p>
          <Link href="/">
            <Button variant="outline">Start a search</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <BenchCard key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
