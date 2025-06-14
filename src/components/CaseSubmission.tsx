
import React, { useState } from 'react';
import { Upload, FileAudio, DollarSign, FileText } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Submit Your Dispute for AI Arbitration</h2>
        <p className="text-slate-600 text-lg">Upload audio statements from both parties to begin the resolution process</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Case Information</span>
          </CardTitle>
          <CardDescription>Provide basic details about the dispute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="case-title">Case Title</Label>
            <Input
              id="case-title"
              placeholder="Brief description of the dispute"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="dispute-amount">Dispute Amount (USD)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="dispute-amount"
                type="number"
                placeholder="0.00"
                value={disputeAmount || ''}
                onChange={(e) => setDisputeAmount(parseFloat(e.target.value) || 0)}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <FileUploadCard
          title="Party A Statement"
          description="Upload audio recording from the first party"
          file={partyAFile}
          onFileSelect={(file) => handleFileUpload(file, 'A')}
          partyColor="bg-blue-50 border-blue-200"
        />
        <FileUploadCard
          title="Party B Statement"
          description="Upload audio recording from the second party"
          file={partyBFile}
          onFileSelect={(file) => handleFileUpload(file, 'B')}
          partyColor="bg-green-50 border-green-200"
        />
      </div>

      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          size="lg"
          className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 text-lg"
        >
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
}

const FileUploadCard: React.FC<FileUploadCardProps> = ({
  title,
  description,
  file,
  onFileSelect,
  partyColor
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <Card className={partyColor}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileAudio className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
          <input
            type="file"
            accept=".mp3,.wav,.m4a,.aac"
            onChange={handleFileChange}
            className="hidden"
            id={`file-${title}`}
          />
          <label htmlFor={`file-${title}`} className="cursor-pointer">
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
            {file ? (
              <div>
                <p className="text-sm font-medium text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-500">Click to replace</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700">Click to upload audio</p>
                <p className="text-xs text-slate-500">MP3, WAV, M4A up to 50MB</p>
              </div>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaseSubmission;
