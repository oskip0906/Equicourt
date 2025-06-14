
import React, { useState } from 'react';
import { Upload, FileAudio, DollarSign, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaseData } from '../pages/Index';

interface CaseSubmissionProps {
  onSubmit: (caseData: Omit<CaseData, 'id' | 'status'>) => void;
}

const CaseSubmission: React.FC<CaseSubmissionProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [disputeAmount, setDisputeAmount] = useState<number>(0);
  const [partyAFile, setPartyAFile] = useState<File | null>(null);
  const [partyBFile, setPartyBFile] = useState<File | null>(null);

  const handleFileUpload = (file: File, party: 'A' | 'B') => {
    if (party === 'A') {
      setPartyAFile(file);
    } else {
      setPartyBFile(file);
    }
  };

  const handleSubmit = () => {
    if (title && disputeAmount > 0 && partyAFile && partyBFile) {
      onSubmit({
        title,
        disputeAmount,
        partyAFile,
        partyBFile
      });
    }
  };

  const isValid = title && disputeAmount > 0 && partyAFile && partyBFile;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-amber-900 mb-4">Submit Your Dispute for AI Arbitration</h2>
        <p className="text-amber-700 text-xl max-w-3xl mx-auto leading-relaxed">
          Upload audio statements from both parties to begin the resolution process with our advanced AI panel
        </p>
      </div>

      <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-lg">
          <CardTitle className="flex items-center space-x-3 text-amber-900">
            <div className="p-2 bg-amber-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl">Case Information</span>
          </CardTitle>
          <CardDescription className="text-amber-700 text-lg">
            Provide basic details about the dispute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div>
            <Label htmlFor="case-title" className="text-amber-800 font-semibold text-lg">Case Title</Label>
            <Input
              id="case-title"
              placeholder="Brief description of the dispute"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 border-2 border-amber-200 focus:border-amber-500 bg-white text-lg p-4 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="dispute-amount" className="text-amber-800 font-semibold text-lg">Dispute Amount (USD)</Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-500" />
              <Input
                id="dispute-amount"
                type="number"
                placeholder="0.00"
                value={disputeAmount || ''}
                onChange={(e) => setDisputeAmount(parseFloat(e.target.value) || 0)}
                className="pl-12 border-2 border-amber-200 focus:border-amber-500 bg-white text-lg p-4 rounded-xl"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <FileUploadCard
          title="Party A Statement"
          description="Upload audio recording from the first party"
          file={partyAFile}
          onFileSelect={(file) => handleFileUpload(file, 'A')}
          partyColor="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300"
          accentColor="bg-blue-500"
        />
        <FileUploadCard
          title="Party B Statement"
          description="Upload audio recording from the second party"
          file={partyBFile}
          onFileSelect={(file) => handleFileUpload(file, 'B')}
          partyColor="bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-300"
          accentColor="bg-emerald-500"
        />
      </div>

      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          size="lg"
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 
            text-white px-12 py-4 text-xl font-bold rounded-2xl shadow-xl transform transition-all 
            duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          <Scale className="h-6 w-6 mr-3" />
          Begin Arbitration
        </Button>
      </div>
    </div>
  );
};

interface FileUploadCardProps {
  title: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  partyColor: string;
  accentColor: string;
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  description,
  file,
  onFileSelect,
  partyColor,
  accentColor
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card className={`${partyColor} border-2 shadow-xl hover:shadow-2xl transition-shadow duration-300`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-lg">
          <div className={`p-2 ${accentColor} rounded-lg`}>
            <FileAudio className="h-5 w-5 text-white" />
          </div>
          <span>{title}</span>
        </CardTitle>
        <CardDescription className="text-slate-700 font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-3 border-dashed border-slate-300 rounded-xl p-8 text-center 
          hover:border-slate-400 transition-colors bg-white bg-opacity-50 hover:bg-opacity-70">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.aac"
            onChange={handleFileChange}
            className="hidden"
            id={`file-${title}`}
          />
          <label htmlFor={`file-${title}`} className="cursor-pointer block">
            <Upload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            {file ? (
              <div>
                <p className="text-lg font-semibold text-slate-800">{file.name}</p>
                <p className="text-sm text-slate-600 mt-2">Click to replace file</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-slate-700">Click to upload audio</p>
                <p className="text-sm text-slate-500 mt-2">MP3, WAV, M4A up to 50MB</p>
              </div>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseSubmission;
