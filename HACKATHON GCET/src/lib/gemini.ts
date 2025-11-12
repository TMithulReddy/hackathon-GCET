import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let client: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!client) {
    if (!apiKey) throw new Error("GEMINI_API_KEY_MISSING");
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export async function generateAdvisory(prompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const res = await model.generateContent(prompt);
  return res.response.text();
}


