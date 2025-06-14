
import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AIService } from '../services/aiService';
import type { CaseData } from '../pages/Index';

interface ProcessingViewProps {
  caseData: CaseData;
  aiConfig: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
  };
  onComplete: (results: CaseData['results']) => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ caseData, aiConfig, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { name: 'Processing Statements', description: 'Transcribing audio or processing text', duration: 0 },
    { name: 'Analyzing Facts', description: 'Factual Judge creating timeline of events', duration: 0 },
    { name: 'Consulting Legal Precedent', description: 'Legal Precedent Judge reviewing applicable laws', duration: 0 },
    { name: 'Reviewing Procedures', description: 'Procedural Judge assessing fairness', duration: 0 },
    { name: 'Drafting Verdict', description: 'Verdict Drafting Judge synthesizing final decision', duration: 0 }
  ];

  useEffect(() => {
    const processCase = async () => {
      try {
        const aiService = new AIService(aiConfig);
        
        // Step 1: Get transcripts (transcribe audio or use text directly)
        setCurrentStep(0);
        setProgress(10);
        
        let partyATranscript = '';
        let partyBTranscript = '';
        
        if (caseData.partyAFile) {
          const transcriptionA = await aiService.transcribeAudio(caseData.partyAFile);
          partyATranscript = transcriptionA.text;
        } else if (caseData.partyAText) {
          partyATranscript = caseData.partyAText;
        }
        
        if (caseData.partyBFile) {
          const transcriptionB = await aiService.transcribeAudio(caseData.partyBFile);
          partyBTranscript = transcriptionB.text;
        } else if (caseData.partyBText) {
          partyBTranscript = caseData.partyBText;
        }
        
        // Step 2: Factual analysis
        setCurrentStep(1);
        setProgress(30);
        const factualAnalysis = await aiService.analyzeFactually(partyATranscript, partyBTranscript);
        
        // Step 3: Legal analysis
        setCurrentStep(2);
        setProgress(50);
        const legalAnalysis = await aiService.analyzeLegalPrecedents(factualAnalysis.timeline);
        
        // Step 4: Procedural review
        setCurrentStep(3);
        setProgress(70);
        const proceduralReview = await aiService.reviewProcedures(
          partyATranscript.length,
          partyBTranscript.length
        );
        
        // Step 5: Draft verdict
        setCurrentStep(4);
        setProgress(90);
        const finalVerdict = await aiService.draftVerdict(
          factualAnalysis.timeline,
          legalAnalysis,
          proceduralReview,
          caseData.title,
          caseData.disputeAmount
        );
        
        setProgress(100);
        
        // Complete processing
        const results = {
          transcripts: {
            partyA: partyATranscript,
            partyB: partyBTranscript,
          },
          timeline: factualAnalysis.timeline,
          legalAnalysis,
          proceduralReview,
          finalVerdict,
        };
        
        setTimeout(() => {
          onComplete(results);
        }, 1000);
        
      } catch (err) {
        console.error('Processing error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during processing');
      }
    };

    processCase();
  }, [caseData, aiConfig, onComplete]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Processing Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Please check your API keys and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Processing Your Case</h2>
        <p className="text-slate-600">Our AI arbitration panel is analyzing the submitted evidence</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Case: {caseData.title}</CardTitle>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Dispute Amount: ${caseData.disputeAmount}</span>
            <span>Progress: {Math.round(progress)}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="mb-4" />
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : index === currentStep ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : (
                  <Clock className="h-5 w-5 text-slate-300" />
                )}
                <div className={index <= currentStep ? 'text-slate-900' : 'text-slate-400'}>
                  <p className="font-medium">{step.name}</p>
                  <p className="text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingView;
