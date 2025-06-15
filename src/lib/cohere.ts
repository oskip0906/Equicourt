
import { supabase } from "@/integrations/supabase/client";

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
  try {
    const { data, error } = await supabase.functions.invoke('analyze-debate-cohere', {
      body: { transcripts, debateContext }
    });

    if (error) {
      console.error('Error analyzing debate with Cohere:', error);
      throw new Error('Failed to analyze debate transcripts with Cohere');
    }

    return data as DebateAnalysis;
  } catch (error) {
    console.error('Error analyzing debate with Cohere:', error);
    throw new Error('Failed to analyze debate transcripts with Cohere');
  }
}

export async function generateDebateResponse(
  transcripts: TranscriptEntry[],
  debateContext: string
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-debate-response', {
      body: { transcripts, debateContext }
    });

    if (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate debate response');
    }

    return data.response || '';
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate debate response');
  }
}
