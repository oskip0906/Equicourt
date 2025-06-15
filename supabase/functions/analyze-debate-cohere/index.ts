
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { CohereClientV2 } from "https://esm.sh/cohere-ai@7.17.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcripts, debateContext } = await req.json()

    const apiKey = Deno.env.get('VITE_COHERE_API_KEY')
    if (!apiKey) {
      throw new Error('VITE_COHERE_API_KEY is not set')
    }

    const cohere = new CohereClientV2({ token: apiKey })

    // Filter out incomplete transcripts and organize by speaker
    const finalTranscripts = transcripts.filter((t: TranscriptEntry) => t.isFinal);
    const partyATranscript = finalTranscripts
      .filter((t: TranscriptEntry) => t.speaker === "partyA")
      .map((t: TranscriptEntry) => t.text)
      .join("\n");
    const partyBTranscript = finalTranscripts
      .filter((t: TranscriptEntry) => t.speaker === "partyB")
      .map((t: TranscriptEntry) => t.text)
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
      throw new Error("Failed to analyze debate transcripts with Cohere");
    }

    const text = response.message.content[0].text;
    const cleanedText = text.replace(/```json\n|\n```/g, "");
    const analysis = JSON.parse(cleanedText) as DebateAnalysis;

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error analyzing debate with Cohere:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze debate transcripts with Cohere' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
