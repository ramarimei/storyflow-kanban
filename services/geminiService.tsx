import { GoogleGenAI, Type } from "@google/genai";
import { GeminiStoryResponse, UserStory } from "../types";

// Lazy initialization to avoid crashing if API key is missing
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not configured. AI features will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const parseStoriesFromText = async (text: string): Promise<GeminiStoryResponse> => {
  const client = getAI();
  if (!client) {
    alert("AI features are not configured. Please set up your Gemini API key.");
    return { stories: [] };
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are an expert Technical Product Manager. Analyze the following document and extract implementation-ready User Stories or Action Items.

    IMPORTANT: If you see bullet points or numbered lists that describe requirements for a story, extract them as 'acceptanceCriteria'.

    Text: ${text}

    Return JSON strictly following the schema.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                status: {
                  type: Type.STRING,
                  enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'TESTING', 'DONE']
                },
                priority: {
                  type: Type.STRING,
                  enum: ['LOW', 'MEDIUM', 'HIGH']
                },
                type: {
                  type: Type.STRING,
                  enum: ['STORY', 'BUG']
                },
                points: { type: Type.NUMBER },
                acceptanceCriteria: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      completed: { type: Type.BOOLEAN }
                    },
                    required: ['text', 'completed']
                  }
                }
              },
              required: ['title', 'description', 'status', 'priority', 'type']
            }
          }
        },
        required: ['stories']
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || '{"stories":[]}';
    const data = JSON.parse(jsonStr) as GeminiStoryResponse;

    data.stories.forEach(s => {
      if (s.acceptanceCriteria) {
        s.acceptanceCriteria = s.acceptanceCriteria.map(ac => ({
          ...ac,
          id: ac.id || Math.random().toString(36).substr(2, 9)
        }));
      }
    });

    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return { stories: [] };
  }
};

export const generateStandupSummary = async (stories: UserStory[], projectName: string): Promise<string> => {
  const client = getAI();
  if (!client) {
    return "AI features are not configured.";
  }

  const context = stories.map(s => `- [${s.status}] ${s.title}: ${s.description.substring(0, 100)}...`).join('\n');

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `As a Project Manager, provide a concise and professional meeting summary for "${projectName}" based on these current stories:

    ${context}

    Focus on:
    1. Key Accomplishments (DONE)
    2. Current Focus (IN_PROGRESS)
    3. Critical Blockers (BLOCKED)
    4. Next Steps.

    Use Markdown.`,
  });

  return response.text || "Could not generate summary.";
};

export const generateMeetingScript = async (stories: UserStory[], projectName: string): Promise<string> => {
  const client = getAI();
  if (!client) {
    return "AI features are not configured.";
  }

  const context = stories.map(s => `[${s.status}] ${s.title} (${s.priority} Priority)`).join('\n');

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are a world-class Agile Coach. Create a "Meeting Script" or "Speaker Notes" for a project lead to present the current state of "${projectName}" to stakeholders.

    Board State:
    ${context}

    The script should:
    1. Start with an energetic opening.
    2. Narrate the "Wins" (DONE stories).
    3. Discuss current engineering velocity (IN_PROGRESS).
    4. Flag the "Ghosts" or Blockers (BLOCKED) with recommended mitigation strategies.
    5. Briefly mention what's in the hopper (TODO/BACKLOG).
    6. End with a call to action.

    FORMATTING: Use bolding for things the presenter should emphasize. Use [Action] brackets for when the presenter should point at specific board items.`,
  });

  return response.text || "Script generation failed.";
};
