import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// 1. Security & Middleware
// This allows your Vite frontend (running on port 5173) to talk to this backend
app.use(cors()); 
app.use(express.json());

// 2. Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const architectSystemPrompt = `
You are an elite Staff Software Engineer and Technical Compliance Expert. 
Analyze the user's software/startup idea. You must evaluate it across four technical metrics (0 to 100): System Complexity, Scalability Risk, Security Requirements, and MVP Speed.

You MUST return your response STRICTLY as a valid JSON object matching this structure EXACTLY:
{
  "scores": {
    "systemComplexity": number,
    "scalabilityRisk": number,
    "securityRequirements": number,
    "mvpSpeed": number,
    "overallFeasibility": number
  },
  "databaseSchema": "Provide a brief, high-level JSON-like structure of the core database collections needed (e.g., for MongoDB).",
  "complianceChecklist": ["string", "string", "string"],
  "techStackRecommendation": "A 2-sentence recommendation of the ideal frontend, backend, and database technologies.",
  "brutalVerdict": "Direct, sharp feedback on the technical and legal difficulty of building this. Max 3 sentences."
}
`;

// 3. The Core API Route
app.post('/api/validate', async (req, res) => {
  const { idea } = req.body;

  if (!idea) {
    return res.status(400).json({ error: 'Please provide a startup idea.' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: idea,
      config: {
        systemInstruction: vcSystemPrompt,
        responseMimeType: "application/json", // Crucial: Forces clean JSON output
      }
    });

    // Parse the text into a real JavaScript object and send it to the frontend
    const data = JSON.parse(response.text);
    res.json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to evaluate pitch. The AI VC walked out of the room.' });
  }
});

// 4. Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AI VC Backend running on http://localhost:${PORT}`);
});