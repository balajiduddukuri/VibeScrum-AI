import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, TaskType, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBacklogItems = async (projectDescription: string): Promise<Partial<Task>[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini");
    return [];
  }

  const prompt = `
    You are an expert Agile Product Owner. 
    Based on the following project description, generate a list of 5-8 high-quality User Stories and Tasks for the product backlog.
    
    Project Description: "${projectDescription}"
    
    Return a JSON array where each object has:
    - title: A concise summary.
    - description: A user story format (As a user, I want...) or clear task description.
    - type: "STORY" or "TASK".
    - points: A Fibonacci number (1, 2, 3, 5, 8).
    - priority: "HIGH", "MEDIUM", or "LOW".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["STORY", "TASK"] },
              points: { type: Type.INTEGER },
              priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
            },
            required: ["title", "description", "type", "points", "priority"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.map((item: any) => ({
        ...item,
        status: TaskStatus.BACKLOG,
        type: item.type === 'STORY' ? TaskType.STORY : TaskType.TASK,
        priority: item.priority as Priority
      }));
    }
    return [];
  } catch (error) {
    console.error("Error generating backlog:", error);
    return [];
  }
};

export const refineTaskDescription = async (taskTitle: string): Promise<{description: string, acceptanceCriteria: string}> => {
  if (!process.env.API_KEY) return { description: "API Key missing.", acceptanceCriteria: "" };

  const prompt = `
    You are an expert Product Owner.
    Write a detailed description and acceptance criteria for a Scrum task titled: "${taskTitle}".
    
    Return JSON with:
    - description: Professional, concise summary.
    - acceptanceCriteria: Bulleted list of conditions to be met (as a markdown string).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             description: { type: Type.STRING },
             acceptanceCriteria: { type: Type.STRING }
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
      description: data.description || "",
      acceptanceCriteria: data.acceptanceCriteria || ""
    };
  } catch (error) {
    console.error("Error refining task:", error);
    return { description: "Failed to generate description.", acceptanceCriteria: "" };
  }
};

export const estimateTaskPoints = async (title: string, description: string): Promise<number> => {
   if (!process.env.API_KEY) return 1;
   
   const prompt = `
     You are an expert Scrum Master and Technical Lead.
     Estimate the complexity of this task in Fibonacci story points (1, 2, 3, 5, 8, 13, 21).
     
     Task: ${title}
     Details: ${description}
     
     Return only a JSON object: { "points": number }
   `;
   
   try {
     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash",
       contents: prompt,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.OBJECT,
           properties: { points: { type: Type.INTEGER } }
         }
       }
     });
     const data = JSON.parse(response.text || "{}");
     return data.points || 1;
   } catch (e) {
     console.error(e);
     return 1;
   }
}