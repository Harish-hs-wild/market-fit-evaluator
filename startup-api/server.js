import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json());

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 2. Define the Database Schema
const evaluationSchema = new mongoose.Schema({
  originalIdea: { type: String, required: true },
  systemComplexity: Number,
  scalabilityRisk: Number,
  securityRequirements: Number,
  mvpSpeed: Number,
  overallFeasibility: Number,
  techStackRecommendation: String,
  complianceChecklist: [String],
  brutalVerdict: String,
  createdAt: { type: Date, default: Date.now }
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

// 3. Initialize AI
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
  "complianceChecklist": ["string", "string", "string"],
  "techStackRecommendation": "A 2-sentence recommendation of the ideal frontend, backend, and database technologies.",
  "brutalVerdict": "Direct, sharp feedback on the technical and legal difficulty of building this. Max 3 sentences."
}
`;

// 4. The Core API Route
app.post('/api/validate', async (req, res) => {
  const { idea } = req.body;

  if (!idea) return res.status(400).json({ error: 'Please provide a startup idea.' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: idea,
      config: {
        systemInstruction: architectSystemPrompt,
        responseMimeType: "application/json", 
      }
    });

    const data = JSON.parse(response.text);

    // SAVE TO MONGODB
    const newEvaluation = new Evaluation({
      originalIdea: idea,
      systemComplexity: data.scores.systemComplexity,
      scalabilityRisk: data.scores.scalabilityRisk,
      securityRequirements: data.scores.securityRequirements,
      mvpSpeed: data.scores.mvpSpeed,
      overallFeasibility: data.scores.overallFeasibility,
      techStackRecommendation: data.techStackRecommendation,
      complianceChecklist: data.complianceChecklist,
      brutalVerdict: data.brutalVerdict
    });
    
    await newEvaluation.save();
    console.log("Evaluation saved to database!");

    res.json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to evaluate blueprint. The Technical Architect system crashed.' });
  }
});

// 5. Fetch History Route
app.get('/api/history', async (req, res) => {
  try {
    // Get the 5 most recent evaluations
    const history = await Evaluation.find().sort({ createdAt: -1 }).limit(5);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Technical Architect Backend running on http://localhost:${PORT}`);
});