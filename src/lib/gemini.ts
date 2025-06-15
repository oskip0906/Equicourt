
import { createClient } from '@supabase/supabase-js';

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

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function analyzeDebateTranscripts(
  transcripts: TranscriptEntry[],
  debateContext: string
): Promise<DebateAnalysis> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-debate-gemini', {
      body: { transcripts, debateContext }
    });

    if (error) {
      console.error('Error analyzing debate:', error);
      throw new Error('Failed to analyze debate transcripts');
    }

    return data as DebateAnalysis;
  } catch (error) {
    console.error('Error analyzing debate:', error);
    throw new Error('Failed to analyze debate transcripts');
  }
}
