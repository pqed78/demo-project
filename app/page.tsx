"use client";

import { useState } from "react";
import type { Analysis, AnalyzeResponse } from "@/lib/schema";

const PRIORITY_STYLE = {
  high: { label: "높음", className: "bg-red-100 text-red-700" },
  medium: { label: "보통", className: "bg-amber-100 text-amber-700" },
  low: { label: "낮음", className: "bg-zinc-100 text-zinc-600" },
} as const;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [model, setModel] = useState("");
  const [done, setDone] = useState<Set<number>>(new Set());

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDone(new Set());

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.headers.get("content-type")?.includes("application/json")) {
        setError(`서버에서 예상하지 못한 응답이 왔습니다 (HTTP ${res.status}). 개발 서버 로그를 확인해 주세요.`);
        return;
      }
      const json = (await res.json()) as AnalyzeResponse;
      if (json.ok) {
        setResult(json.data);
        setModel(json.model);
      } else {
        setError(json.error);
      }
    } catch {
      setError("서버에 요청하지 못했습니다. 개발 서버가 실행 중인지 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 text-zinc-900">
      <h1 className="text-2xl font-bold">채팅방 액션 아이템 도우미</h1>
      <p className="mt-2 text-sm text-zinc-600">
        채팅 내보내기 CSV(<code>Date,User,Message</code>)를 올리면 대화를 요약하고 방장이 할 일을 정리해 드립니다.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm"
        />
        <button
          onClick={analyze}
          disabled={!file || loading}
          className="ml-auto rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "분석 중…" : "분석하기"}
        </button>
      </div>

      {loading && (
        <p className="mt-4 text-sm text-zinc-500">로컬 LLM이 대화를 읽고 있어요. 모델에 따라 수십 초 걸릴 수 있습니다.</p>
      )}

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold">요약</h2>
            <p className="mt-2 rounded-lg bg-zinc-50 p-4 leading-7">{result.summary}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">주요 토픽</h2>
            <ul className="mt-2 space-y-2">
              {result.key_topics.map((t, i) => (
                <li key={i} className="rounded-lg border border-zinc-200 p-3">
                  <p className="font-medium">{t.topic}</p>
                  <p className="mt-1 text-sm text-zinc-600">{t.summary}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">
              액션 아이템{" "}
              <span className="text-sm font-normal text-zinc-500">
                ({done.size}/{result.action_items.length} 완료)
              </span>
            </h2>
            <ul className="mt-2 space-y-2">
              {result.action_items.map((a, i) => {
                const p = PRIORITY_STYLE[a.priority];
                const checked = done.has(i);
                return (
                  <li key={i} className="flex gap-3 rounded-lg border border-zinc-200 p-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(i)}
                      className="mt-1 h-4 w-4"
                    />
                    <div className={checked ? "opacity-50" : ""}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${p.className}`}>{p.label}</span>
                        <p className={`font-medium ${checked ? "line-through" : ""}`}>{a.title}</p>
                      </div>
                      <p className="mt-1 text-sm text-zinc-700">{a.description}</p>
                      {a.related_users.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">관련: {a.related_users.join(", ")}</p>
                      )}
                      <blockquote className="mt-2 border-l-2 border-zinc-300 pl-2 text-xs text-zinc-500">
                        {a.evidence}
                      </blockquote>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-zinc-400">모델: {model}</p>
        </div>
      )}
    </main>
  );
}
