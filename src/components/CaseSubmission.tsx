
import React, { useState } from 'react';
import { Upload, FileAudio, DollarSign, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CaseData } from '../pages/Index';

interface CaseSubmissionProps {
  onSubmit: (caseData: Omit<CaseData, 'id' | 'status'>) => void;
}

const CaseSubmission: React.FC<CaseSubmissionProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [disputeAmount, setDisputeAmount] = useState<number>(0);
  const [partyAFile, setPartyAFile] = useState<File | null>(null);
  const [partyBFile, setPartyBFile] = useState<File | null>(null);
  const [partyAText, setPartyAText] = useState('');
  const [partyBText, setPartyBText] = useState('');
  const [partyAInputType, setPartyAInputType] = useState<'file' | 'text'>('file');
  const [partyBInputType, setPartyBInputType] = useState<'file' | 'text'>('file');

  const handleFileUpload = (file: File, party: 'A' | 'B') => {
    if (party === 'A') {
      setPartyAFile(file);
    } else {
      setPartyBFile(file);
    }
  };

  const handleSubmit = () => {
    const hasPartyAInput = partyAInputType === 'file' ? partyAFile : partyAText.trim();
    const hasPartyBInput = partyBInputType === 'file' ? partyBFile : partyBText.trim();
    
    if (title && disputeAmount > 0 && hasPartyAInput && hasPartyBInput) {
      onSubmit({
        title,
        disputeAmount,
        partyAFile: partyAInputType === 'file' ? partyAFile : null,
        partyBFile: partyBInputType === 'file' ? partyBFile : null,
        partyAText: partyAInputType === 'text' ? partyAText : '',
        partyBText: partyBInputType === 'text' ? partyBText : ''
      });
    }
  };

  const hasPartyAInput = partyAInputType === 'file' ? partyAFile : partyAText.trim();
  const hasPartyBInput = partyBInputType === 'file' ? partyBFile : partyBText.trim();
  const isValid = title && disputeAmount > 0 && hasPartyAInput && hasPartyBInput;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Submit Your Dispute for AI Arbitration</h2>
        <p className="text-slate-600 text-lg">Provide statements from both parties to begin the resolution process</p>
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
        <StatementInputCard
          title="Party A Statement"
          description="Provide statement from the first party"
          file={partyAFile}
          text={partyAText}
          inputType={partyAInputType}
          onFileSelect={(file) => handleFileUpload(file, 'A')}
          onTextChange={setPartyAText}
          onInputTypeChange={setPartyAInputType}
          partyColor="bg-blue-50 border-blue-200"
        />
        <StatementInputCard
          title="Party B Statement"
          description="Provide statement from the second party"
          file={partyBFile}
          text={partyBText}
          inputType={partyBInputType}
          onFileSelect={(file) => handleFileUpload(file, 'B')}
          onTextChange={setPartyBText}
          onInputTypeChange={setPartyBInputType}
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

interface StatementInputCardProps {
  title: string;
  description: string;
  file: File | null;
  text: string;
  inputType: 'file' | 'text';
  onFileSelect: (file: File) => void;
  onTextChange: (text: string) => void;
  onInputTypeChange: (type: 'file' | 'text') => void;
  partyColor: string;
}

const StatementInputCard: React.FC<StatementInputCardProps> = ({
  title,
  description,
  file,
  text,
  inputType,
  onFileSelect,
  onTextChange,
  onInputTypeChange,
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
          {inputType === 'file' ? <FileAudio className="h-5 w-5" /> : <Type className="h-5 w-5" />}
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={inputType} onValueChange={(value) => onInputTypeChange(value as 'file' | 'text')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" className="flex items-center space-x-2">
              <FileAudio className="h-4 w-4" />
              <span>Audio File</span>
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center space-x-2">
              <Type className="h-4 w-4" />
              <span>Text Input</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
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
          </TabsContent>
          
          <TabsContent value="text" className="mt-4">
            <Textarea
              placeholder="Enter the party's statement here..."
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              className="min-h-[120px]"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CaseSubmission;
