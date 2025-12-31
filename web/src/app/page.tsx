"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import clsx from "clsx";

type WorkflowSettings = {
  subreddit: string;
  timeframe: "day" | "week" | "month" | "year" | "all";
  storyCount: number;
  duration: number;
  voiceProfile: "narrator" | "friendly" | "dramatic";
  includeBroll: boolean;
};

type StoryBeat = {
  timestamp: number;
  duration: number;
  headline: string;
  voiceover: string;
  motionPrompt: string;
  brollPrompt?: string;
  captions: string[];
};

type Story = {
  id: string;
  title: string;
  sourceUrl: string;
  hook: string;
  beats: StoryBeat[];
  callToAction: string;
  soundtrackPrompt: string;
  thumbnailPrompt: string;
  keywords: string[];
};

type WorkflowPayload = {
  generatedAt: string;
  settings: WorkflowSettings;
  stories: Story[];
  notes: {
    postingChecklist: string[];
    uploadCopy: string;
    hashtags: string[];
  };
};

const timeframes = [
  { value: "day", label: "Past 24h" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "year", label: "Past Year" },
  { value: "all", label: "All Time" },
] as const;

const voices = [
  { value: "narrator", label: "Narrator" },
  { value: "friendly", label: "Friendly" },
  { value: "dramatic", label: "Dramatic" },
] as const;

const initialSettings: WorkflowSettings = {
  subreddit: "AskReddit",
  timeframe: "week",
  storyCount: 2,
  duration: 45,
  voiceProfile: "narrator",
  includeBroll: true,
};

export default function Home() {
  const [settings, setSettings] = useState<WorkflowSettings>(initialSettings);
  const [response, setResponse] = useState<WorkflowPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasResults = !!response;

  useEffect(() => {
    setError(null);
  }, [settings]);

  const handleSubmit = () => {
    setError(null);
    setResponse(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!res.ok) {
          const problem = await res.json().catch(() => null);
          throw new Error(problem?.error ?? res.statusText);
        }
        const payload = (await res.json()) as WorkflowPayload;
        setResponse(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    });
  };

  const formattedStories = useMemo(() => {
    if (!response) return [];
    return response.stories.map((story) => ({
      ...story,
      duration: story.beats.reduce((acc, beat) => acc + beat.duration, 0),
    }));
  }, [response]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-blue-500/5 backdrop-blur">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.4rem] text-blue-300">
              Agentic Workflow
            </p>
            <h1 className="text-3xl font-semibold">
              Reddit ➜ YouTube Shorts Automation
            </h1>
            <p className="text-sm text-slate-300">
              Scrape trending Reddit threads, generate cinematic short-form
              scripts, and prep the upload package with one click.
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <Field label="Target Subreddit">
              <input
                value={settings.subreddit}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    subreddit: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                placeholder="AskReddit"
                autoComplete="off"
              />
            </Field>

            <Field label="Timeframe">
              <div className="grid grid-cols-3 gap-2">
                {timeframes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        timeframe: option.value,
                      }))
                    }
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition hover:border-blue-400/80 hover:text-blue-200",
                      settings.timeframe === option.value
                        ? "border-blue-500 bg-blue-500/20 text-blue-100 shadow"
                        : "border-slate-800 bg-slate-950/40 text-slate-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Stories to Produce">
              <Slider
                min={1}
                max={5}
                value={settings.storyCount}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, storyCount: value }))
                }
              />
            </Field>

            <Field label="Target Duration (seconds)">
              <Slider
                min={30}
                max={60}
                step={5}
                value={settings.duration}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, duration: value }))
                }
              />
            </Field>

            <Field label="Narration Voice">
              <div className="flex flex-wrap gap-2">
                {voices.map((voice) => (
                  <button
                    key={voice.value}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        voiceProfile: voice.value,
                      }))
                    }
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      settings.voiceProfile === voice.value
                        ? "border-violet-500 bg-violet-500/20 text-violet-100"
                        : "border-slate-800 bg-slate-950/40 text-slate-200 hover:border-violet-400/80 hover:text-violet-200",
                    )}
                  >
                    {voice.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Production Options">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.includeBroll}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      includeBroll: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500/40"
                />
                <span>Include AI b-roll prompts for each beat</span>
              </label>
            </Field>

            <button
              type="button"
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Running workflow…
                </>
              ) : (
                "Generate Shorts Package"
              )}
            </button>

            {error && (
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="flex-1 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Output Console</h2>
                <p className="text-sm text-slate-300">
                  Story scripts, cinematic beats, and upload collateral ready for YouTube Shorts.
                </p>
              </div>
              {hasResults && response && (
                <div className="flex gap-2">
                  <ClipboardButton
                    label="Copy JSON"
                    payload={JSON.stringify(response, null, 2)}
                  />
                  <ClipboardButton
                    label="Copy Upload Copy"
                    payload={response.notes.uploadCopy}
                  />
                </div>
              )}
            </header>
            <div className="mt-6 min-h-[280px] space-y-5">
              {isPending && (
                <div className="space-y-4">
                  <SkeletonLine width="75%" />
                  <SkeletonLine width="90%" />
                  <SkeletonLine width="60%" />
                  <SkeletonLine width="80%" />
                </div>
              )}
              {!isPending && !hasResults && (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center text-sm text-slate-400">
                  Configure your workflow and hit generate to produce a full short-form package.
                </div>
              )}

              {hasResults && response && (
                <div className="space-y-8">
                  <div className="space-y-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                    <h3 className="text-lg font-medium text-blue-100">
                      Upload Blueprint
                    </h3>
                    <p className="text-sm text-blue-50/80 whitespace-pre-line">
                      {response.notes.uploadCopy}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-blue-100/80">
                      {response.notes.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-blue-400/50 bg-blue-500/10 px-3 py-1"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Stories</h3>
                    <div className="space-y-5">
                      {formattedStories.map((story, storyIndex) => (
                        <article
                          key={story.id}
                          className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                        >
                          <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.3rem] text-slate-400">
                                Story {storyIndex + 1}
                              </p>
                              <h4 className="text-xl font-semibold text-slate-100">
                                {story.hook}
                              </h4>
                            </div>
                            <a
                              href={story.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-medium text-blue-300 hover:text-blue-200"
                            >
                              View Source →
                            </a>
                          </header>

                          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
                              <p>
                                <span className="font-semibold text-slate-100">
                                  Target runtime:
                                </span>{" "}
                                {story.duration}s
                              </p>
                              <p>
                                <span className="font-semibold text-slate-100">
                                  Call to action:
                                </span>{" "}
                                {story.callToAction}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-100">
                                  Soundtrack prompt:
                                </span>{" "}
                                {story.soundtrackPrompt}
                              </p>
                              <p>
                                <span className="font-semibold text-slate-100">
                                  Thumbnail prompt:
                                </span>{" "}
                                {story.thumbnailPrompt}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {story.keywords.map((keyword) => (
                                  <span
                                    key={keyword}
                                    className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-300"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              {story.beats.map((beat, beatIndex) => (
                                <div
                                  key={`${story.id}-beat-${beatIndex}`}
                                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                                >
                                  <header className="flex items-center justify-between text-xs text-slate-400">
                                    <span>
                                      {beat.timestamp.toFixed(0)}s →{" "}
                                      {(beat.timestamp + beat.duration).toFixed(0)}s
                                    </span>
                                    <span>{beat.headline}</span>
                                  </header>
                                  <p className="mt-3 text-sm text-slate-100">
                                    {beat.voiceover}
                                  </p>
                                  <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-2">
                                    <div>
                                      <p className="font-semibold text-slate-200">
                                        Motion Direction
                                      </p>
                                      <p>{beat.motionPrompt}</p>
                                    </div>
                                    {beat.brollPrompt && (
                                      <div>
                                        <p className="font-semibold text-slate-200">
                                          B-roll Prompt
                                        </p>
                                        <p>{beat.brollPrompt}</p>
                                      </div>
                                    )}
                                  </div>
                                  <p className="mt-3 text-[11px] uppercase tracking-widest text-slate-500">
                                    Captions: {beat.captions.join(" • ")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                    <h3 className="text-lg font-semibold text-slate-100">
                      Posting Checklist
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {response.notes.postingChecklist.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex gap-3">
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium text-slate-200">{label}</span>
      {children}
    </label>
  );
}

type SliderProps = {
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange(value: number): void;
};

function Slider({ min, max, value, step = 1, onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-[5px] w-full appearance-none rounded-full bg-slate-800 accent-blue-500"
      />
      <div className="text-xs text-slate-300">
        {value} (min {min} – max {max})
      </div>
    </div>
  );
}

type ClipboardButtonProps = {
  label: string;
  payload: string;
};

function ClipboardButton({ label, payload }: ClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(payload);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error("Failed to copy", err);
        }
      }}
      className={clsx(
        "rounded-full border px-3 py-2 text-xs font-semibold transition",
        copied
          ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
          : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-blue-400 hover:text-blue-200",
      )}
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

type SkeletonLineProps = { width: string };

function SkeletonLine({ width }: SkeletonLineProps) {
  return (
    <div
      className="h-4 rounded-full bg-slate-800/70"
      style={{ width }}
    />
  );
}
