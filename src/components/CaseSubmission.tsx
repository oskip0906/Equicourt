import React, { useState } from 'react';
import { Upload, FileAudio, DollarSign, FileText, Sparkles, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaseData } from '../pages/Index';

interface CaseSubmissionProps {
  onSubmit: (caseData: Omit<CaseData, 'id' | 'status'>) => void;
}

const CaseSubmission: React.FC<CaseSubmissionProps> = ({ onSubmit }) => {
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
    if (partyAFile && partyBFile) {
      onSubmit({
        title: 'Untitled Case',
        disputeAmount: 0,
        partyAFile,
        partyBFile
      });
    }
  };

  const isValid = partyAFile && partyBFile;

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
