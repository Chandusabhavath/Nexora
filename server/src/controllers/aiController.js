import { AIMatchingService } from '../services/aiMatcher.js';

export const smartMatch = async (req, res) => {
  try {
    const { query, location } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a natural-language description of your task (e.g., "Need an electrician tomorrow morning in Bandra").',
      });
    }

    // Step 1: Extract intent & constraints
    const parsedIntent = AIMatchingService.parseIntent(query, location || 'Bandra');

    // Step 2: Score & rank eligible providers with match explanations
    const matchResults = AIMatchingService.matchProviders(parsedIntent);

    res.json({
      success: true,
      message: `Parsed intent: ${parsedIntent.detectedCategory} in ${parsedIntent.locality}`,
      data: matchResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process task query.',
      error: error.message,
    });
  }
};
