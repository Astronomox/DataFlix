// This is a Vercel Serverless Function that runs in a Node.js environment.
// It is NOT part of the Angular application and does not have access to Angular's context.
import { GoogleGenAI } from '@google/genai';

export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userName } = request.body;
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) {
    console.error('Missing environment variable: API_KEY');
    return response.status(500).json({ error: 'Server configuration error: AI API key is missing.' });
  }

  if (!userName) {
    return response.status(400).json({ error: 'Bad Request: userName is required.' });
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const prompt = `
      You are Flixy, a friendly, warm, and very encouraging AI companion for university students using the DataFlix student portal.
      Your goal is to make the student feel welcomed, positive, and ready for their day.
      Generate a short, unique, and cheerful greeting for a student named ${userName}.

      - The current time of day is ${getTimeOfDay()}.
      - Keep the greeting to about 1-2 friendly sentences.
      - Do NOT sound like a generic chatbot. Be creative and vary your greetings each day.
      - Do NOT use emojis.
      - Do NOT ask any questions.
      - Start directly with the greeting. Do not use any preamble like "Here is a greeting:".

      Example tones: "Good morning, ${userName}! Hope you have a fantastic and productive day ahead.", "Hello ${userName}! Ready to make this afternoon a great one?", "Good evening, ${userName}! Hope you had a wonderful day of learning."
    `;

  try {
    const genAIResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const greeting = genAIResponse.text.trim();
    return response.status(200).json({ greeting });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return response.status(500).json({ error: 'Failed to generate AI greeting.' });
  }
}