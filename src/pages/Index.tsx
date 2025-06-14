
import React, { useState, useEffect } from 'react';
import CaseSubmission from '../components/CaseSubmission';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import APIKeyConfig from '../components/APIKeyConfig';
import Header from '../components/Header';

export type CaseData = {
  id: string;
  title: string;
  disputeAmount: number;
  partyAFile: File | null;
  partyBFile: File | null;
  partyAText: string;
  partyBText: string;
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
  const [apiConfig, setApiConfig] = useState<{
    openaiApiKey?: string;
    anthropicApiKey?: string;
  } | null>(null);

  // Load API config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiArbitrationConfig');
    if (savedConfig) {
      try {
        setApiConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Failed to parse saved config:', error);
      }
    }
  }, []);

  const handleConfigSave = (config: { openaiApiKey?: string; anthropicApiKey?: string }) => {
    setApiConfig(config);
    localStorage.setItem('aiArbitrationConfig', JSON.stringify(config));
  };

  const handleCaseSubmission = (caseData: Omit<CaseData, 'id' | 'status'>) => {
    const newCase: CaseData = {
      ...caseData,
      id: Date.now().toString(),
      status: 'processing',
      partyAText: caseData.partyAText || '',
      partyBText: caseData.partyBText || ''
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

  const isConfigured = apiConfig?.openaiApiKey && apiConfig?.anthropicApiKey;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!isConfigured && (
          <APIKeyConfig onConfigSave={handleConfigSave} />
        )}
        
        {isConfigured && !currentCase && (
          <CaseSubmission onSubmit={handleCaseSubmission} />
        )}
        
        {isConfigured && currentCase && currentCase.status === 'processing' && (
          <ProcessingView 
            caseData={currentCase} 
            aiConfig={apiConfig}
            onComplete={handleProcessingComplete}
          />
        )}
        
        {isConfigured && currentCase && currentCase.status === 'completed' && currentCase.results && (
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
