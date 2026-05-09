const { GoogleGenAI } = require('@google/genai');

class AIController {
  static async generateText(req, res) {
    try {
      const { prompt, model } = req.body || {};

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          message: 'Gemini API key not configured. Please set GEMINI_API_KEY in backend .env and restart the server.'
        });
      }

      if (typeof prompt !== 'string' || prompt.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: 'Prompt is required'
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: typeof model === 'string' && model.trim() ? model.trim() : 'gemini-2.0-flash',
        contents: prompt
      });

      res.json({
        success: true,
        text: response.text
      });
    } catch (error) {
      console.error('Gemini generateText error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate text',
        error: error.message
      });
    }
  }
}

module.exports = AIController;

