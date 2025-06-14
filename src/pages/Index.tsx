
import React, { useState } from 'react';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import Header from '../components/Header';
import CaseSubmission from '../components/CaseSubmission';
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      
      {/* Hero Section with Courtroom Image */}
      <div className="relative bg-gradient-to-r from-amber-100 to-orange-100 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold text-amber-900 mb-6 leading-tight">
                Digital Justice<br />
                <span className="text-orange-700">Reimagined</span>
              </h1>
              <p className="text-xl text-amber-800 mb-8 leading-relaxed">
                Experience the future of dispute resolution with our AI-powered arbitration panel. 
                Fair, transparent, and efficient justice at your fingertips.
              </p>
              <div className="inline-flex items-center space-x-4 text-amber-700">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                <span className="font-medium">Powered by Advanced AI Technology</span>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-300 to-orange-300 rounded-3xl blur-2xl opacity-30 transform rotate-6"></div>
                <img 
                  src="/lovable-uploads/fe857d25-ee4c-4f00-8ca5-24e658955a71.png" 
                  alt="Digital Courtroom"
                  className="relative w-96 h-64 object-cover rounded-3xl shadow-2xl border-4 border-amber-200 transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12">
        {currentCase && currentCase.status === 'processing' && (
          <div className="mb-16">
            <ProcessingView 
              caseData={currentCase} 
              onComplete={handleProcessingComplete}
            />
          </div>
        )}
        
        {currentCase && currentCase.status === 'completed' && currentCase.results && (
          <div className="mb-16">
            <ResultsView 
              caseData={currentCase} 
              onNewCase={handleNewCase}
            />
          </div>
        )}

        {!currentCase && (
          <div className="mb-16">
            <CaseSubmission onSubmit={handleCaseSubmission} />
          </div>
        )}

        <div className="border-t border-amber-200 pt-12">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8 mb-8">
            <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg mr-3"></div>
              Document Upload
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx,.html,.image,.asciidoc,.md"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-amber-700
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gradient-to-r file:from-amber-500 file:to-orange-500
                    file:text-white file:shadow-lg
                    hover:file:from-amber-600 hover:file:to-orange-600
                    file:transition-all file:duration-200"
                />
                <button
                  onClick={handleConvertFile}
                  disabled={!uploadedFile || isConverting}
                  className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full 
                    hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed
                    font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {isConverting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Converting...
                    </div>
                  ) : 'Convert'}
                </button>
              </div>
              {convertedContent && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsContentExpanded(!isContentExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
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
                    <div className="mt-4 p-6 bg-white rounded-xl shadow-inner border border-amber-200">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700">{convertedContent}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
            <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg mr-3"></div>
              Live Debate Recording
            </h2>
            
            <div className="mb-6">
              <label htmlFor="debateContext" className="block text-sm font-semibold text-amber-800 mb-3">
                Debate Context
              </label>
              <textarea
                id="debateContext"
                rows={4}
                className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
                  bg-gradient-to-r from-amber-50 to-orange-50 text-slate-700
                  placeholder-amber-400"
                placeholder="Enter the context or topic of the debate..."
                value={debateContext}
                onChange={(e) => setDebateContext(e.target.value)}
              />
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
              <Debate debateContext={debateContext} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
