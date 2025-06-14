
import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { CaseData } from '../pages/Index';

interface ProcessingViewProps {
  caseData: CaseData;
  onComplete: (results: CaseData['results']) => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ caseData, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { name: 'Transcribing Audio', description: 'Converting speech to text using AI', duration: 3000 },
    { name: 'Analyzing Facts', description: 'Factual Judge creating timeline of events', duration: 4000 },
    { name: 'Consulting Legal Precedent', description: 'Legal Precedent Judge reviewing applicable laws', duration: 5000 },
    { name: 'Reviewing Procedures', description: 'Procedural Judge assessing fairness', duration: 2000 },
    { name: 'Drafting Verdict', description: 'Verdict Drafting Judge synthesizing final decision', duration: 4000 }
  ];

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setProgress((i / steps.length) * 100);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }
      
      setProgress(100);
      
      // Generate mock results
      const mockResults = {
        transcripts: {
          partyA: "I hired the defendant to renovate my kitchen for $5,000. We agreed on a completion date of March 15th. However, the work was not completed until April 10th, and several items were damaged during the renovation process, including my refrigerator and countertop.",
          partyB: "While I acknowledge the delay, it was due to unforeseen complications with the plumbing that required additional permits. I completed all work to the agreed specifications. The damage mentioned was pre-existing and documented in my initial assessment."
        },
        timeline: [
          {
            event_description: "Kitchen renovation contract signed for $5,000",
            timestamp: "February 1st",
            agreement_status: "Agreed" as const
          },
          {
            event_description: "Agreed completion date: March 15th",
            timestamp: "February 1st",
            agreement_status: "Agreed" as const
          },
          {
            event_description: "Discovery of plumbing complications requiring permits",
            timestamp: "March 10th",
            agreement_status: "Disputed" as const
          },
          {
            event_description: "Damage to refrigerator and countertop",
            timestamp: "March 20th",
            agreement_status: "Disputed" as const
          },
          {
            event_description: "Work completed",
            timestamp: "April 10th",
            agreement_status: "Agreed" as const
          }
        ],
        legalAnalysis: {
          "Kitchen renovation contract signed for $5,000": ["Contract Law § 101: Formation of Valid Contracts"],
          "Agreed completion date: March 15th": ["Contract Law § 205: Time of Performance"],
          "Discovery of plumbing complications requiring permits": ["Contract Law § 261: Impossibility of Performance"],
          "Damage to refrigerator and countertop": ["Tort Law § 402: Property Damage Liability"],
          "Work completed": ["Contract Law § 205: Substantial Performance"]
        },
        proceduralReview: {
          speaking_time_ratio: 0.85,
          fairness_assessment: "Balanced" as const
        },
        finalVerdict: `# ARBITRATION VERDICT

## Case: ${caseData.title}
**Dispute Amount:** $${caseData.disputeAmount}

## 1. Findings of Fact

Based on the evidence presented, the following timeline of events has been established:

- **February 1st**: Valid contract formed for kitchen renovation ($5,000, completion by March 15th)
- **March 10th**: Unforeseen plumbing complications discovered requiring additional permits
- **March 20th**: Damage occurred to refrigerator and countertop (disputed causation)
- **April 10th**: Work substantially completed (26 days late)

## 2. Conclusions of Law

**Contract Performance**: While the defendant failed to meet the agreed completion date, the delay was partially attributable to unforeseen circumstances requiring regulatory compliance. This constitutes substantial performance with delay damages applicable.

**Property Damage**: The evidence regarding pre-existing damage versus contractor-caused damage is disputed. Under the burden of proof standard, insufficient evidence exists to establish contractor liability for property damage.

**Time of Performance**: The 26-day delay beyond the agreed completion date constitutes a material breach, though not sufficient to void the contract given substantial performance.

## 3. Remedies & Next Steps

**Monetary Award**: The plaintiff is entitled to damages for delayed completion. Standard industry practice allows for 1% of contract value per week of delay. 

**Calculation**: $5,000 × 1% × 4 weeks = $200

**Final Order**: Defendant shall pay plaintiff $200 in delay damages. No additional damages are awarded for disputed property damage due to insufficient evidence.

**Case Status**: CLOSED - Damages awarded to plaintiff in the amount of $200.`
      };
      
      setTimeout(() => {
        onComplete(mockResults);
      }, 1000);
    };

    processSteps();
  }, [caseData, onComplete]);

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
