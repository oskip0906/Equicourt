import Cohere from "cohere-ai";

// Initialize the Cohere API client
Cohere.init(import.meta.env.COHERE_API_KEY);

interface TranscriptEntry {
  speaker: "partyA" | "partyB";
  text: string;
  timestamp: string;
  isFinal: boolean;
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
    const response = await Cohere.generate({
      model: "command",
      prompt: prompt,
      max_tokens: 1024, // Adjust as needed
      temperature: 0.5, // Adjust as needed
    });

    if (
      response.statusCode !== 200 ||
      !response.body.generations ||
      response.body.generations.length === 0
    ) {
      console.error("Error analyzing debate with Cohere:", response);
      throw new Error("Failed to analyze debate transcripts with Cohere");
    }

    const text = response.body.generations[0].text;

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
