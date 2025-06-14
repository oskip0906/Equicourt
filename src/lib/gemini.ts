import { GoogleGenAI } from "@google/genai";

interface TranscriptEntry {
  speaker: 'partyA' | 'partyB' | 'ai';
  text: string;
  timestamp: string;
  isFinal: boolean;
  confidence?: number;
  duration?: number;
}

interface DebateAnalysis {
  summary: string;
  keyPoints: {
    partyA: string[];
    partyB: string[];
  };
  agreementPoints: string[];
  disagreementPoints: string[];
  conclusion: string;
  finalDecision: string;
}

// Initialize the Gemini API client only when needed
function getGeminiClient(): GoogleGenAI {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeDebateTranscripts(
  transcripts: TranscriptEntry[],
  debateContext: string
): Promise<DebateAnalysis> {
  // Filter out incomplete transcripts and organize by speaker
  const finalTranscripts = transcripts.filter(t => t.isFinal);
  const partyATranscript = finalTranscripts
    .filter(t => t.speaker === 'partyA')
    .map(t => t.text)
    .join('\n');
  const partyBTranscript = finalTranscripts
    .filter(t => t.speaker === 'partyB')
    .map(t => t.text)
    .join('\n');

  const prompt = `
    Context of the debate: ${debateContext}

    Analyze the following debate between Party A and Party B. You MUST respond with a valid JSON object containing:
    1. A brief summary of the debate (focus on the overall flow and main topics discussed)
    2. Key points made by each party (extract 2-3 main arguments or positions from each speaker)
    3. Points of agreement (list specific areas where both parties aligned)
    4. Points of disagreement (list specific areas where parties had different views)
    5. A conclusion (provide a final assessment of the debate outcome and remaining open questions)
    6. A final decision (clearly state who won the debate and provide a detailed explanation for the decision)

    Party A's statements:
    ${partyATranscript}

    Party B's statements:
    ${partyBTranscript}

    IMPORTANT: Your response MUST be a valid JSON object with the following exact structure:
    {
      "summary": "Brief summary of the debate flow and main topics",
      "keyPoints": {
        "partyA": ["specific point 1", "specific point 2", "specific point 3"],
        "partyB": ["specific point 1", "specific point 2", "specific point 3"]
      },
      "agreementPoints": ["specific agreement 1", "specific agreement 2"],
      "disagreementPoints": ["specific disagreement 1", "specific disagreement 2"],
      "conclusion": "Final assessment of debate outcome and remaining questions",
      "finalDecision": "Clear statement of who won and detailed explanation for the decision"
    }

    Do not include any text before or after the JSON object. The response must be parseable JSON.
  `;

  try {
    const ai = getGeminiClient();
    const result = await ai.models.generateContent({ 
      model: "gemini-2.0-flash", 
      contents: prompt
    });

    const text = result.text;

    // Clean up the response text by removing any markdown code block formatting
    const cleanedText = text.replace(/```json\n|\n```/g, '').trim();
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(cleanedText) as DebateAnalysis;

      // Validate the response structure
      if (!analysis.keyPoints?.partyA?.length || !analysis.keyPoints?.partyB?.length) {
        console.warn('Empty key points detected, regenerating response...');
        return analyzeDebateTranscripts(transcripts, debateContext);
      }

      // Ensure summary and conclusion are distinct
      if (analysis.summary === analysis.conclusion) {
        analysis.conclusion = `Based on the debate, ${analysis.conclusion}`;
      }

      // Ensure finalDecision is present and properly formatted
      if (!analysis.finalDecision) {
        analysis.finalDecision = "Unable to determine a clear winner based on the debate.";
      }

      return analysis;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', cleanedText);
      throw new Error('Invalid JSON response from AI');
    }
  } catch (error) {
    console.error('Error analyzing debate:', error);
    throw new Error('Failed to analyze debate transcripts');
  }
}



