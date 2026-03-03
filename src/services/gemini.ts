import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Song {
  title: string;
  artist: string;
  reason: string;
  spotifyQuery: string;
  spotifyTrackId: string;
}

export interface MoodAnalysis {
  mood: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  playlist: Song[];
}

export async function analyzeMood(input: string, preference: 'english' | 'hindi' | 'bollywood' | 'mainstream'): Promise<MoodAnalysis> {
  const genreContext = {
    english: "Focus on Global English hits and indie tracks from 2024-2026.",
    hindi: "Focus on Hindi non-film pop and independent music from 2024-2026.",
    bollywood: "Focus exclusively on Bollywood film songs released in 2025 and 2026.",
    mainstream: "Focus on the biggest global mainstream hits of 2025 and 2026."
  }[preference];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The current date is March 2026. Analyze the following mood or journal entry and generate a music playlist recommendation.
    Input: "${input}"
    Music Preference: ${genreContext}
    
    CRITICAL: You MUST include at least 4 songs that were released in 2025 or 2026. Use Google Search to find ACTUAL trending songs from these years.
    For EACH song, you MUST find its actual Spotify Track ID (the alphanumeric string in the Spotify URL).
    
    Provide:
    1. A single word mood label.
    2. A brief empathetic description of the vibe.
    3. A color palette (Hex codes) that matches this mood. Use VIBRANT and BOLD colors.
    4. A list of 7 songs (Title and Artist) that perfectly fit this mood, with a brief reason why for each.
    5. For each song, include a 'spotifyQuery' (Title Artist) and the 'spotifyTrackId'.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mood: { type: Type.STRING },
          description: { type: Type.STRING },
          colors: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING },
              secondary: { type: Type.STRING },
              accent: { type: Type.STRING },
            },
            required: ["primary", "secondary", "accent"],
          },
          playlist: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                reason: { type: Type.STRING },
                spotifyQuery: { type: Type.STRING },
                spotifyTrackId: { 
                  type: Type.STRING, 
                  description: "The Spotify Track ID (e.g., 4cOdK2wGvWyR9m7R3yaIUR) found via search. If not found, provide a best guess or empty string." 
                },
              },
              required: ["title", "artist", "reason", "spotifyQuery", "spotifyTrackId"],
            },
          },
        },
        required: ["mood", "description", "colors", "playlist"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as MoodAnalysis;
}
