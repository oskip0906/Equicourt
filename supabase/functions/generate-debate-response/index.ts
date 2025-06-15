

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const { transcripts, debateContext } = await req.json()

    const apiKey = Deno.env.get('VITE_COHERE_API_KEY')
    if (!apiKey) {
      throw new Error('VITE_COHERE_API_KEY is not set')
    }

    const cohere = new CohereClientV2({ token: apiKey })

    // Filter out incomplete transcripts and organize by speaker
    const finalTranscripts = transcripts.filter((t: TranscriptEntry) => t.isFinal && t.speaker !== 'ai');
    const partyATranscript = finalTranscripts
      .filter((t: TranscriptEntry) => t.speaker === 'partyA')
      .map((t: TranscriptEntry) => t.text)
      .join('\n');
    const partyBTranscript = finalTranscripts
      .filter((t: TranscriptEntry) => t.speaker === 'partyB')
      .map((t: TranscriptEntry) => t.text)
      .join('\n');

    const prompt = `You're in a debate about ${debateContext}. Here's what was said:

${partyATranscript}

${partyBTranscript}

Respond like a normal person having a conversation and friendly also ask follow up questions based on the previous response.`;

    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    if (response.message && response.message.content) {
      const aiResponse = response.message.content[0].text || '';
      return new Response(
        JSON.stringify({ response: aiResponse }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }
    
    throw new Error('No response received from Cohere');
  } catch (error) {
    console.error('Error generating response:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate debate response' }),
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

