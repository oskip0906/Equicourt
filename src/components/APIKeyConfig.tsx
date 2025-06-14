
import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface APIKeyConfigProps {
  onConfigSave: (config: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }) => void;
}

const APIKeyConfig: React.FC<APIKeyConfigProps> = ({ onConfigSave }) => {
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  const handleSave = () => {
    const config = {
      openaiApiKey: openaiKey.trim() || undefined,
      anthropicApiKey: anthropicKey.trim() || undefined,
    };
    onConfigSave(config);
  };

  const isValid = openaiKey.trim() && anthropicKey.trim();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Configure AI Models</h2>
        <p className="text-slate-600">Enter your API keys to enable AI arbitration processing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>API Configuration</span>
          </CardTitle>
          <CardDescription>
            Your API keys are stored locally in your browser and never sent to our servers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <div className="relative mt-1">
              <Input
                id="openai-key"
                type={showOpenAI ? 'text' : 'password'}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Used for audio transcription (Whisper)</p>
          </div>

          <div>
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <div className="relative mt-1">
              <Input
                id="anthropic-key"
                type={showAnthropic ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showAnthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Used for legal analysis and verdict drafting (Claude)</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full bg-slate-800 hover:bg-slate-700"
          >
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> You'll need active API keys from OpenAI and Anthropic. 
          Your keys are stored in browser localStorage and are not transmitted to any external servers 
          except the respective AI providers during processing.
        </p>
      </div>
    </div>
  );
};

export default APIKeyConfig;
