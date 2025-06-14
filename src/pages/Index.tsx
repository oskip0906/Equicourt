import React, { useState } from 'react';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import Header from '../components/Header';
import Debate from './Debate';

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
  const [debateContext, setDebateContext] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedContent, setConvertedContent] = useState<string>('');
  const [isContentExpanded, setIsContentExpanded] = useState(false);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleConvertFile = async () => {
    if (!uploadedFile) return;

    setIsConverting(true);
    try {
      const formData = new FormData();
      formData.append('files', uploadedFile);
      formData.append('from_formats', uploadedFile.name.split('.').pop() || '');
      formData.append('to_formats', 'md');
      formData.append('do_ocr', 'true');
      formData.append('image_export_mode', 'placeholder');
      formData.append('ocr_engine', 'easyocr');
      formData.append('ocr_lang', 'en');
      formData.append('pdf_backend', 'dlparse_v4');
      formData.append('table_mode', 'fast');
      formData.append('abort_on_error', 'false');
      formData.append('return_as_file', 'false');

      const response = await fetch('http://localhost:5001/v1alpha/convert/file', {
        method: 'POST',
        body: formData,
      });

      console.log(response) 

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const data = await response.json();
      setConvertedContent(data.document.md_content);
      setDebateContext(data.document.md_content);
    } catch (error) {
      console.error('Error converting file:', error);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
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

        <div className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold mb-6">Document Upload</h2>
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.html,.image,.asciidoc,.md"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              <button
                onClick={handleConvertFile}
                disabled={!uploadedFile || isConverting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConverting ? 'Converting...' : 'Convert'}
              </button>
            </div>
            {convertedContent && (
              <div className="mt-4">
                <button
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <svg
                    className={`w-4 h-4 transform transition-transform ${isContentExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {isContentExpanded ? 'Hide Converted Content' : 'Show Converted Content'}
                </button>
                {isContentExpanded && (
                  <div className="mt-2 p-4 bg-white rounded-md shadow">
                    <pre className="whitespace-pre-wrap text-sm">{convertedContent}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold mb-6">Live Debate Recording</h2>
          
          <div className="mb-8">
            <label htmlFor="debateContext" className="block text-sm font-medium text-gray-700 mb-2">
              Debate Context
            </label>
            <textarea
              id="debateContext"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter the context or topic of the debate..."
              value={debateContext}
              onChange={(e) => setDebateContext(e.target.value)}
            />
          </div>

          <Debate debateContext={debateContext} />
        </div>
      </main>
    </div>
  );
};

export default Index;
