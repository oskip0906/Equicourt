import { CohereClientV2 } from 'cohere-ai';

const cohere = new CohereClientV2({ token: import.meta.env.VITE_COHERE_API_KEY });

interface TranscriptEntry {
  speaker: 'partyA' | 'partyB' | 'ai';
  text: string;
  timestamp: string;
  isFinal: boolean;
  confidence: number;
  duration: number;
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
}

export async function analyzeDebateTranscriptsWithCohere(
  transcripts: TranscriptEntry[],
  debateContext: string
): Promise<DebateAnalysis> {
  // Filter out incomplete transcripts and organize by speaker
  const finalTranscripts = transcripts.filter((t) => t.isFinal);
  const partyATranscript = finalTranscripts
    .filter((t) => t.speaker === "partyA")
    .map((t) => t.text)
    .join("\n");
  const partyBTranscript = finalTranscripts
    .filter((t) => t.speaker === "partyB")
    .map((t) => t.text)
    .join("\n");

  const prompt = `
    Context of the debate: ${debateContext}

    Analyze the following debate between Party A and Party B. Provide a structured analysis including:
    1. A brief summary of the debate
    2. Key points made by each party
    3. Points of agreement
    4. Points of disagreement
    5. A conclusion

    Party A's statements:
    ${partyATranscript}

    Party B's statements:
    ${partyBTranscript}

    Please format your response as a JSON object with the following structure:
    {
      "summary": "Brief summary of the debate",
      "keyPoints": {
        "partyA": ["point 1", "point 2", ...],
        "partyB": ["point 1", "point 2", ...]
      },
      "agreementPoints": ["point 1", "point 2", ...],
      "disagreementPoints": ["point 1", "point 2", ...],
      "conclusion": "Overall conclusion of the debate"
    }
  `;

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    if (
      !response.message ||
      !response.message.content ||
      response.message.content.length === 0
    ) {
      console.error("Error analyzing debate with Cohere:", response);
      throw new Error("Failed to analyze debate transcripts with Cohere");
    }

    const text = response.message.content[0].text;

    // Clean up the response text by removing markdown code block formatting if present
    const cleanedText = text.replace(/```json\n|\n```/g, "");

    // Parse the JSON response
    const analysis = JSON.parse(cleanedText) as DebateAnalysis;
    return analysis;
  } catch (error) {
    console.error("Error analyzing debate with Cohere:", error);
    throw new Error("Failed to analyze debate transcripts with Cohere");
  }
}

export async function generateDebateResponse(
  transcripts: TranscriptEntry[],
  debateContext: string
): Promise<string> {
  // Filter out incomplete transcripts and organize by speaker
  const finalTranscripts = transcripts.filter(t => t.isFinal && t.speaker !== 'ai');
  const partyATranscript = finalTranscripts
    .filter(t => t.speaker === 'partyA')
    .map(t => t.text)
    .join('\n');
  const partyBTranscript = finalTranscripts
    .filter(t => t.speaker === 'partyB')
    .map(t => t.text)
    .join('\n');

  const prompt = `Context of the debate: ${debateContext}

You are an AI assistant participating in a debate. Based on the following statements from Party A and Party B, provide a thoughtful response that:
1. Acknowledges the key points made by both parties
2. Identifies areas of agreement and disagreement
3. Offers insights or perspectives that might help move the discussion forward
4. Maintains a neutral and constructive tone

Party A's statements:
${partyATranscript}

Party B's statements:
${partyBTranscript}

Please provide your response in a conversational manner, as if you are actively participating in the debate. Your response should be thoughtful and help facilitate constructive dialogue between the parties.`;

  try {
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // The response should contain the AI's message
    if (response.message && response.message.content) {
      return response.message.content[0].text || '';
    }
    
    throw new Error('No response received from Cohere');
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate debate response');
  }
}
