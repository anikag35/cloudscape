"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import { ArrowLeft, Zap, Copy, Check, Loader2, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function PostMortemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchPostMortem() {
      try {
        const res = await fetch(`/api/incidents/${id}/postmortem`);
        if (!res.ok) throw new Error("Post-mortem not found");
        const data = await res.json();
        setContent(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchPostMortem();
  }, [id]);

  const copyMarkdown = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{error || "No post-mortem yet"}</p>
          <Link href={`/incident/${id}`} className="text-sm text-[var(--color-accent)]">← Back to incident</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto border-b border-[var(--color-border)]">
        <div className="flex items-center gap-4">
          <Link href={`/incident/${id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>Post-Mortem</span>
          </div>
        </div>
        <button
          onClick={copyMarkdown}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] text-sm px-4 py-2 rounded-lg hover:border-[var(--color-border-bright)] transition inline-flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy Markdown"}
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-8 py-12">
        <article
          className="
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:tracking-tight
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-[var(--color-accent)]
            [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[var(--color-text-muted)] [&_p]:mb-4
            [&_strong]:text-[var(--color-text)]
            [&_code]:text-[var(--color-accent)] [&_code]:text-xs [&_code]:bg-[var(--color-surface)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
            [&_table]:w-full [&_table]:text-sm [&_table]:mt-4 [&_table]:mb-6
            [&_th]:text-left [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-[var(--color-text-dim)] [&_th]:border-b [&_th]:border-[var(--color-border)] [&_th]:pb-2 [&_th]:pr-4
            [&_td]:py-2 [&_td]:pr-4 [&_td]:text-[var(--color-text-muted)] [&_td]:border-b [&_td]:border-[var(--color-border)]/50
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:text-[var(--color-text-muted)] [&_ul]:space-y-1 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-sm [&_ol]:text-[var(--color-text-muted)] [&_ol]:space-y-1 [&_ol]:mb-4
            [&_li]:leading-relaxed
            [&_hr]:border-[var(--color-border)] [&_hr]:my-8
            [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-accent)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--color-text-dim)]
            [&_a]:text-[var(--color-accent)] [&_a]:underline
          "
          style={{ fontFamily: "var(--font-body)" }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </article>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-text-dim)] italic">
            Auto-generated by Cloudscape. Review and assign action item owners before publishing.
          </p>
        </div>
      </main>
    </div>
  );
}
