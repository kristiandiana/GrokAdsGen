import { callGrokVision } from "./grokClient"; // We need to add this to grokClient
import { MediaObject } from "./types/tweet";

export interface VisualStyleAnalysis {
    descriptions: string[];
    consolidatedStyle: string; // "Minimalist, high-contrast, blue tones..."
}

export async function analyzeBrandVisuals(mediaItems: MediaObject[]): Promise<VisualStyleAnalysis> {
    if (mediaItems.length === 0) {
        return { descriptions: [], consolidatedStyle: '' };
    }

    // 1. Filter for photos (Grok Vision currently best for static images)
    const photos = mediaItems
        .filter(m => m.type === 'photo' && m.url)
        .slice(0, 10); // Analyze max 10 images to save tokens/time

    if (photos.length === 0) {
        return { descriptions: [], consolidatedStyle: '' };
    }

    console.log(`👁️ Analyzing ${photos.length} brand images with Grok Vision...`);

    // 2. Analyze each image in parallel
    const descriptionPromises = photos.map(async (photo) => {
        try {
            const prompt = "Describe the artistic style, lighting, color palette, and mood of this brand image in one concise sentence. Focus on the aesthetic.";
            const description = await callGrokVision(prompt, photo.url);
            return description;
        } catch (err) {
            console.error(`Failed to analyze image ${photo.url}:`, err);
            return null;
        }
    });

    const results = await Promise.all(descriptionPromises);
    const validDescriptions = results.filter(Boolean) as string[];

    if (validDescriptions.length === 0) {
        return { descriptions: [], consolidatedStyle: '' };
    }

    // 3. Consolidate into a single style guide using text-only Grok
    // We don't need a separate API call here if we just join them, 
    // but a quick summary helps the image generator.
    const styleSummary = validDescriptions.join(' | ');

    return {
        descriptions: validDescriptions,
        consolidatedStyle: `Visual Style Pattern: ${styleSummary.substring(0, 500)}...` // Truncate to avoid context limit bloat
    };
}

