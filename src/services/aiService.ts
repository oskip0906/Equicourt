
// AI Service for handling various AI model integrations
export interface AIConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
}

export interface TranscriptionResult {
  text: string;
}

export interface FactualAnalysis {
  timeline: Array<{
    event_description: string;
    timestamp: string;
    agreement_status: 'Agreed' | 'Disputed' | 'Unilateral';
  }>;
}

export interface LegalAnalysis {
  [eventDescription: string]: string[];
}

export interface ProceduralReview {
  speaking_time_ratio: number;
  fairness_assessment: 'Balanced' | 'Unbalanced';
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key is required for transcription');
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return { text: result.text };
  }

  async analyzeFactually(transcriptA: string, transcriptB: string): Promise<FactualAnalysis> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key is required for factual analysis');
    }

    const prompt = `You are the Factual Judge. Your sole task is to analyze the following two transcripts from an arbitration case. Extract the key events and facts presented by both parties. Create a single, unified, and chronologically ordered timeline of events. For each event, note whether the parties agree or disagree.

Party A Statement: ${transcriptA}

Party B Statement: ${transcriptB}

Output ONLY a JSON array of objects, where each object has event_description (string), timestamp (string, if available), and agreement_status ('Agreed', 'Disputed', or 'Unilateral').`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Factual analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.content[0].text;
    
    try {
      const timeline = JSON.parse(content);
      return { timeline };
    } catch (error) {
      console.error('Failed to parse factual analysis JSON:', content);
      throw new Error('Failed to parse factual analysis response');
    }
  }

  async analyzeLegalPrecedents(timeline: FactualAnalysis['timeline']): Promise<LegalAnalysis> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key is required for legal analysis');
    }

    const legalStatutes = `
    Contract Law § 101: Formation of Valid Contracts
    Contract Law § 205: Time of Performance
    Contract Law § 261: Impossibility of Performance
    Contract Law § 310: Material Breach
    Contract Law § 365: Substantial Performance
    Tort Law § 402: Property Damage Liability
    Tort Law § 501: Negligence Standards
    Consumer Protection § 601: Unfair Business Practices
    `;

    const prompt = `You are the Legal Precedent Judge, an expert in small-claims contract law. Given the following JSON timeline of facts, analyze each event against the provided legal statutes. Annotate each fact with the relevant statute(s).

Legal Statutes:
${legalStatutes}

Timeline: ${JSON.stringify(timeline)}

Output ONLY a JSON object that maps each event_description from the input to an array of applicable legal_citations.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Legal analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.content[0].text;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse legal analysis JSON:', content);
      throw new Error('Failed to parse legal analysis response');
    }
  }

  async reviewProcedures(partyALength: number, partyBLength: number): Promise<ProceduralReview> {
    const ratio = Math.min(partyALength, partyBLength) / Math.max(partyALength, partyBLength);
    const fairness = ratio >= 0.6 ? 'Balanced' : 'Unbalanced';
    
    return {
      speaking_time_ratio: ratio,
      fairness_assessment: fairness as 'Balanced' | 'Unbalanced',
    };
  }

  async draftVerdict(
    timeline: FactualAnalysis['timeline'],
    legalAnalysis: LegalAnalysis,
    proceduralReview: ProceduralReview,
    caseTitle: string,
    disputeAmount: number
  ): Promise<string> {
    if (!this.config.anthropicApiKey) {
      throw new Error('Anthropic API key is required for verdict drafting');
    }

    const prompt = `You are the Verdict Drafting Judge. Synthesize the provided information into a formal verdict document. The document must be in Markdown format and contain three sections:

1. Findings of Fact: Summarize the unified timeline
2. Conclusions of Law: Explain how the legal rules apply to the facts  
3. Remedies & Next Steps: Suggest a resolution based on your findings

Case Title: ${caseTitle}
Dispute Amount: $${disputeAmount}

Timeline: ${JSON.stringify(timeline)}
Legal Analysis: ${JSON.stringify(legalAnalysis)}
Procedural Review: ${JSON.stringify(proceduralReview)}

Be clear, impartial, and base your entire decision only on the data provided.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Verdict drafting failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.content[0].text;
  }
}
