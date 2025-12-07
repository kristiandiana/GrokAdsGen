import { callGrok } from "./grokClient";
import type { TopicSummary, BrandVoiceTweet, Suggestion } from "./types/tweet";

type ActionableStepsInput = {
  topicSummaries: TopicSummary[];
  suggestions: Suggestion[];
  generalSentiment: { score: number; label: string };
  voice_samples: BrandVoiceTweet[];
  brand_handle: string;
};

export async function generateActionableSteps(
  input: ActionableStepsInput
): Promise<Record<string, string>> {
  const { topicSummaries, suggestions, generalSentiment, voice_samples, brand_handle } = input;

  if (!topicSummaries.length) return {};

  const topTopics = [...topicSummaries]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const voiceContext = voice_samples
    .slice(0, 8)
    .map((tweet) => `- ${tweet.text}`)
    .join("\n");

  const suggestionContext = suggestions
    .slice(0, 6)
    .map((s) => `- ${s.topic}: ${s.title} (${s.priority})`)
    .join("\n");

  const topicsContext = topTopics
    .map(
      (t) =>
        `- ${t.topic} | mentions:${t.total} | positive:${t.positive_pct}% | intensity-high:${t.intensity_breakdown.high}`
    )
    .join("\n");

  const prompt = `You are a lifecycle and social strategist for ${brand_handle}.
We have clustered public tweets into topics and want a short playbook for each topic to improve favorability.

Overall sentiment: ${generalSentiment.score}/100 (${generalSentiment.label})

Brand tone reference (recent tweets):
${voiceContext || "- (no samples provided)"}

Existing suggestions:
${suggestionContext || "- none yet"}

Topics (prioritize those at the top):
${topicsContext}

For EACH topic above, write a focused 3-4 sentence action plan with:
- The opening move (acknowledge pain or amplify win)
- Creative angle + proof to show
- Targeting/retargeting hint (who to show this to)
- CTA wording that fits the tone

Return ONLY JSON with this shape:
{
  "actionable_steps": [
    { "topic": "topic name", "playbook": "3-4 sentences" }
  ]
}`;

  try {
    const result = await callGrok(prompt, "grok-4-1-fast-reasoning", true, 0);

    const list =
      (result as any)?.actionable_steps && Array.isArray((result as any).actionable_steps)
        ? (result as any).actionable_steps
        : Array.isArray(result)
        ? result
        : [];

    const map: Record<string, string> = {};
    list.forEach((item: any) => {
      if (item?.topic && typeof item.playbook === "string") {
        map[item.topic] = item.playbook;
      }
    });

    return map;
  } catch (err) {
    console.error("[actionableSteps] Failed to generate playbooks:", err);
    return {};
  }
}
