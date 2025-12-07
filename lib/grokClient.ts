import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export async function callGrok(
    prompt: string,
    model: 'grok-4-1-fast-reasoning',
    jsonMode = true,
    temperature = 0
) {
    const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt}],
        temperature,
        repsonse_format: jsonMode ? { type: 'json_object' } : undefined,
    });

    const content = response.choices[0].message.content;
    if (!content) {
        throw new Error('No content returned from Grok');
    }

    return jsonMode ? JSON.parse(content) : content;
}