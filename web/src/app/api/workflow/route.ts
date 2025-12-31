import { NextResponse } from "next/server";
import { workflowRequestSchema } from "@/lib/schema";
import { fetchTopRedditPosts } from "@/lib/reddit";
import { buildStoriesFromPosts } from "@/lib/ai";
import { assembleWorkflowResponse } from "@/lib/workflow";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = workflowRequestSchema.safeParse({
      ...json,
      storyCount: Number(json.storyCount),
      duration: Number(json.duration),
      includeBroll: Boolean(json.includeBroll),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const settings = parsed.data;

    const posts = await fetchTopRedditPosts(settings.subreddit, settings.timeframe, settings.storyCount * 2);
    if (posts.length === 0) {
      return NextResponse.json(
        { error: "No posts found for the requested subreddit/timeframe." },
        { status: 404 },
      );
    }

    const selectedPosts = posts.slice(0, settings.storyCount);

    const stories = await buildStoriesFromPosts(selectedPosts, settings);

    const workflow = assembleWorkflowResponse(stories, settings, selectedPosts);

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Workflow generation failed", error);
    return NextResponse.json(
      {
        error: "Workflow generation failed.",
        details:
          error instanceof Error
            ? { message: error.message }
            : { message: "Unknown error" },
      },
      { status: 500 },
    );
  }
}
