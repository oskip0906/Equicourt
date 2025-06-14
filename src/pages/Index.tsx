
import React, { useState } from 'react';
import CaseSubmission from '../components/CaseSubmission';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import Header from '../components/Header';

export type CaseData = {
  id: string;
  title: string;
  disputeAmount: number;
  partyAFile: File | null;
  partyBFile: File | null;
  status: 'idle' | 'processing' | 'completed';
  results?: {
    transcripts: {
      partyA: string;
      partyB: string;
    };
    timeline: Array<{
      event_description: string;
      timestamp: string;
      agreement_status: 'Agreed' | 'Disputed' | 'Unilateral';
    }>;
    legalAnalysis: Record<string, string[]>;
    proceduralReview: {
      speaking_time_ratio: number;
      fairness_assessment: 'Balanced' | 'Unbalanced';
    };
    finalVerdict: string;
  };
};

const Index = () => {
  const [currentCase, setCurrentCase] = useState<CaseData | null>(null);

  const handleCaseSubmission = (caseData: Omit<CaseData, 'id' | 'status'>) => {
    const newCase: CaseData = {
      ...caseData,
      id: Date.now().toString(),
      status: 'processing'
    };
    setCurrentCase(newCase);
  };

  const handleProcessingComplete = (results: CaseData['results']) => {
    if (currentCase) {
      setCurrentCase({
        ...currentCase,
        status: 'completed',
        results
      });
    }
  };

  const handleNewCase = () => {
    setCurrentCase(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!currentCase && (
          <CaseSubmission onSubmit={handleCaseSubmission} />
        )}
        
        {currentCase && currentCase.status === 'processing' && (
          <ProcessingView 
            caseData={currentCase} 
            onComplete={handleProcessingComplete}
          />
        )}
        
        {currentCase && currentCase.status === 'completed' && currentCase.results && (
          <ResultsView 
            caseData={currentCase} 
            onNewCase={handleNewCase}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
