import { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";
import { analyzeDebateTranscripts } from '../lib/gemini';

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranscriptEntry {
  speaker: 'partyA' | 'partyB';
  text: string;
  timestamp: string;
  isFinal: boolean;
}

interface DebateAnalysis {
  summary: string;
  keyPoints: {
    partyA: string[];
    partyB: string[];
  };
  agreementPoints: string[];
  disagreementPoints: string[];
  conclusion: string;
}

interface DebateProps {
  debateContext: string;
}

export default function Debate({ debateContext }: DebateProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'partyA' | 'partyB'>('partyA');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isDebateComplete, setIsDebateComplete] = useState(false);
  const [analysis, setAnalysis] = useState<DebateAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!isRecordingRef.current) return;

        const transcript = Array.from(event.results)
          .map(result => (result as SpeechRecognitionResult)[0].transcript)
          .join('');
        
        setTranscripts(prev => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.speaker === currentSpeaker && !lastEntry.isFinal) {
            return [...prev.slice(0, -1), { 
              ...lastEntry, 
              text: transcript,
              isFinal: event.results[event.results.length - 1].isFinal
            }];
          }
          return [...prev, { 
            speaker: currentSpeaker, 
            text: transcript,
            timestamp: new Date().toLocaleTimeString(),
            isFinal: event.results[event.results.length - 1].isFinal
          }];
        });

        // Reset silence timeout when speech is detected
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isRecordingRef.current) {
            toast({
              title: "Recording Paused",
              description: "No speech detected for 5 seconds.",
            });
            stopRecording();
          }
        }, 5000);
      };

      recognition.onspeechend = () => {
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isRecordingRef.current) {
            toast({
              title: "Recording Paused",
              description: "No speech detected for 5 seconds.",
            });
            stopRecording();
          }
        }, 5000);
      };

      recognition.onerror = (event: SpeechRecognitionEvent) => {
        console.error('Speech recognition error:', (event as any).error);
        isRecordingRef.current = false;
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Speech recognition failed. Please try again.",
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
      };

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
      };
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
    }
  }, [currentSpeaker, toast]);

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || isRecordingRef.current) return;

    try {
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: `Recording ${currentSpeaker === 'partyA' ? 'Party A' : 'Party B'}'s statement.`,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
      toast({
        title: "Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRecordingRef.current) return;

    try {
      recognition.stop();
      isRecordingRef.current = false;
      setIsRecording(false);

      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      // Mark the current transcript as final
      setTranscripts(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry && lastEntry.speaker === currentSpeaker && !lastEntry.isFinal) {
          return [...prev.slice(0, -1), { ...lastEntry, isFinal: true }];
        }
        return prev;
      });

      toast({
        title: "Recording Stopped",
        description: "Statement recorded successfully.",
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast({
        title: "Error",
        description: "Failed to stop recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const switchSpeaker = () => {
    stopRecording();
    const nextSpeaker = currentSpeaker === 'partyA' ? 'partyB' : 'partyA';
    setCurrentSpeaker(nextSpeaker);
    toast({
      title: "Speaker Changed",
      description: `Now recording ${nextSpeaker === 'partyA' ? 'Party A' : 'Party B'}'s statement.`,
    });
  };

  const finishDebate = async () => {
    stopRecording();
    setIsDebateComplete(true);
    setIsAnalyzing(true);
    
    try {
      const debateAnalysis = await analyzeDebateTranscripts(transcripts, debateContext);
      setAnalysis(debateAnalysis);
      toast({
        title: "Analysis Complete",
        description: "The debate has been analyzed by Gemini AI.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the debate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debate Recording</h1>
      
      {!isDebateComplete ? (
        <>
          <div className="mb-6">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                Current Speaker: {currentSpeaker === 'partyA' ? 'Party A' : 'Party B'}
              </h2>
              <div className="flex gap-4">
                <Button
                  onClick={startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  disabled={isRecording}
                >
                  Start Recording
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  disabled={!isRecording}
                >
                  Stop Recording
                </Button>
                <Button
                  onClick={switchSpeaker}
                  variant="secondary"
                  disabled={isRecording}
                >
                  Switch Speaker
                </Button>
                <Button
                  onClick={finishDebate}
                  variant="outline"
                  disabled={transcripts.length === 0}
                >
                  Finish Debate
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            {transcripts.map((entry, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {entry.speaker === 'partyA' ? 'Party A' : 'Party B'}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {entry.timestamp}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{entry.text}</p>
                {!entry.isFinal && (
                  <p className="text-sm text-muted-foreground mt-2">(In progress...)</p>
                )}
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {isAnalyzing ? (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Analyzing Debate</h2>
              <p>Please wait while Gemini AI analyzes the debate...</p>
            </Card>
          ) : analysis ? (
            <>
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Debate Analysis</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Summary</h3>
                    <p>{analysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Party A's Key Points</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.keyPoints.partyA.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Party B's Key Points</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.keyPoints.partyB.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Points of Agreement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.agreementPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Points of Disagreement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.disagreementPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Conclusion</h3>
                    <p>{analysis.conclusion}</p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setTranscripts([]);
                    setCurrentSpeaker('partyA');
                    setIsDebateComplete(false);
                    setAnalysis(null);
                  }}
                >
                  Start New Debate
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
} 