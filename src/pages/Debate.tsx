import { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";
import { generateDebateResponse } from '../lib/cohere';
import { analyzeDebateTranscripts } from '../lib/gemini';
import { Mic, MicOff, Pause, Play, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Loader2 } from "lucide-react";

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TranscriptEntry {
  speaker: 'partyA' | 'partyB' | 'ai';
  text: string;
  timestamp: string;
  isFinal: boolean;
  confidence: number;
  duration: number;
}

interface SpeakingStats {
  time: number;
  words: number;
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
  finalDecision: string;
}

interface DebateProps {
  debateContext: string;
}

export default function Debate({ debateContext }: DebateProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'partyA' | 'partyB'>('partyA');
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [isDebateComplete, setIsDebateComplete] = useState(false);
  const [analysis, setAnalysis] = useState<DebateAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interimAnalysis, setInterimAnalysis] = useState<DebateAnalysis | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [speakingStats, setSpeakingStats] = useState<Record<'partyA' | 'partyB', SpeakingStats>>({
    partyA: { time: 0, words: 0 },
    partyB: { time: 0, words: 0 }
  });
  const [lastSpeaker, setLastSpeaker] = useState<'partyA' | 'partyB' | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
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

        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript;
        const confidence = (lastResult[0] as any).confidence || 1.0;
        
        // Only update if confidence is above threshold or it's a final result
        if (confidence > 0.6 || lastResult.isFinal) {
          const currentTime = Date.now();
          const duration = recordingStartTimeRef.current ? currentTime - recordingStartTimeRef.current : 0;
          
          setTranscripts(prev => {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry && lastEntry.speaker === currentSpeaker && !lastEntry.isFinal) {
              return [...prev.slice(0, -1), { 
                speaker: currentSpeaker, 
                text: transcript,
                timestamp: new Date().toLocaleTimeString(),
                isFinal: lastResult.isFinal,
                confidence,
                duration
              }];
            }
            return [...prev, { 
              speaker: currentSpeaker, 
              text: transcript,
              timestamp: new Date().toLocaleTimeString(),
              isFinal: lastResult.isFinal,
              confidence,
              duration
            }];
          });

          // Update speaking stats
          setSpeakingStats(prev => ({
            ...prev,
            [currentSpeaker]: {
              time: prev[currentSpeaker].time + (duration / 1000), // Convert to seconds
              words: prev[currentSpeaker].words + transcript.split(/\s+/).length
            }
          }));
        }

        // Reset silence timeout when speech is detected
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isRecordingRef.current && !isPaused) {
            stopRecording();
            toast({
              title: "Recording Stopped",
              description: "No speech detected for 3 seconds.",
            });
          }
        }, 3000);
      };

      recognition.onspeechend = () => {
        if (silenceTimeoutRef.current) {
          window.clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (isRecordingRef.current) {
            stopRecording();
            toast({
              title: "Recording Stopped",
              description: "No speech detected for 3 seconds.",
            });
          }
        }, 3000);
      };

      recognition.onerror = (event: SpeechRecognitionEvent) => {
        console.error('Speech recognition error:', (event as any).error);
        const error = (event as any).error;
        
        if (error === 'no-speech') {
          // Ignore no-speech errors as they're handled by the silence timeout
          return;
        }
        
        isRecordingRef.current = false;
        setIsRecording(false);
        setIsPaused(false);
        
        toast({
          title: "Error",
          description: `Speech recognition error: ${error}. Please try again.`,
          variant: "destructive",
        });

        // Attempt to restart recognition after a short delay
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
              isRecordingRef.current = true;
              setIsRecording(true);
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 1000);
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !isPaused) {
          // Only restart if we're still supposed to be recording
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }
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
    if (isRecording) {
      stopRecording();
    }
    setCurrentSpeaker(prev => {
      const newSpeaker = prev === 'partyA' ? 'partyB' : 'partyA';
      setLastSpeaker(newSpeaker);
      return newSpeaker;
    });
  };

  // Add effect to check for automatic response generation
  useEffect(() => {
    const generateAutomaticResponse = async () => {
      // Only generate if we have transcripts and both parties have spoken
      if (transcripts.length > 0 && lastSpeaker && !isWaitingForResponse) {
        const lastTwoTranscripts = transcripts.slice(-2);
        if (lastTwoTranscripts.length === 2) {
          const [first, second] = lastTwoTranscripts;
          // Check if we have one from each party
          if (first.speaker !== second.speaker && 
              (first.speaker === 'partyA' || first.speaker === 'partyB') && 
              (second.speaker === 'partyA' || second.speaker === 'partyB')) {
            setIsWaitingForResponse(true);
            try {
              const response = await generateDebateResponse(transcripts, debateContext);
              const newTranscript: TranscriptEntry = {
                speaker: 'ai',
                text: response,
                timestamp: new Date().toISOString(),
                isFinal: true,
                confidence: 1,
                duration: 0
              };
              setTranscripts(prev => [...prev, newTranscript]);
            } catch (error) {
              console.error('Error generating automatic response:', error);
              toast({
                title: "Response Failed",
                description: "Failed to generate AI response. Please try again.",
                variant: "destructive"
              });
            } finally {
              setIsWaitingForResponse(false);
            }
          }
        }
      }
    };

    generateAutomaticResponse();
  }, [transcripts, lastSpeaker, debateContext]);

  const finishDebate = async () => {
    if (transcripts.length === 0) {
      toast({
        title: "No Transcripts",
        description: "Cannot finish debate without any transcripts.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDebateTranscripts(transcripts, debateContext);
      setAnalysis(analysis);
      setIsDebateComplete(true);
      toast({
        title: "Debate Complete",
        description: "The debate has been analyzed and completed."
      });
    } catch (error) {
      console.error('Error analyzing debate:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the debate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pauseRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || !isRecordingRef.current) return;

    try {
      recognition.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsPaused(true);

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
        title: "Recording Paused",
        description: "Click Resume to continue recording.",
      });
    } catch (error) {
      console.error('Failed to pause recording:', error);
      toast({
        title: "Error",
        description: "Failed to pause recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resumeRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition || isRecordingRef.current) return;

    try {
      recognition.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setIsPaused(false);
      recordingStartTimeRef.current = Date.now();
      
      toast({
        title: "Recording Resumed",
        description: `Recording ${currentSpeaker === 'partyA' ? 'Party A' : 'Party B'}'s statement.`,
      });
    } catch (error) {
      console.error('Failed to resume recording:', error);
      toast({
        title: "Error",
        description: "Failed to resume recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetDebate = () => {
    stopRecording();
    setTranscripts([]);
    setCurrentSpeaker('partyA');
    setIsDebateComplete(false);
    setAnalysis(null);
    setSpeakingStats({
      partyA: { time: 0, words: 0 },
      partyB: { time: 0, words: 0 }
    });
    toast({
      title: "Debate Reset",
      description: "All recordings have been cleared.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateResponse = async () => {
    if (transcripts.length === 0) {
      toast({
        title: "No Transcripts",
        description: "No transcripts available to generate response",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingResponse(true);
    try {
      const response = await generateDebateResponse(transcripts, debateContext);
      
      // Add AI response to transcripts
      const newTranscript: TranscriptEntry = {
        speaker: 'ai',
        text: response,
        timestamp: new Date().toISOString(),
        isFinal: true,
        confidence: 1,
        duration: 0
      };
      
      setTranscripts(prev => [...prev, newTranscript]);
      toast({
        title: "Response Generated",
        description: "AI has added its response to the debate."
      });
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Response Failed",
        description: "Failed to generate AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Loading Modal */}
      <Dialog open={isAnalyzing}>
        <DialogContent className="flex flex-col items-center justify-center gap-6 py-12">
          {/* Hide the close button for this modal */}
          <style>{`.fixed .absolute.right-4.top-4 { display: none !important; }`}</style>
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-center">Reading federal documents</h2>
          <p className="text-slate-600 text-center">Please wait while we analyze the debate and consult the law...</p>
        </DialogContent>
      </Dialog>
      
      <h1 className="text-3xl font-bold mb-6">Debate Recording</h1>
      
      {!isDebateComplete ? (
        <>
          <div className="mb-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Current Speaker: {currentSpeaker === 'partyA' ? 'Party A' : 'Party B'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600">
                    {isRecording ? 'Recording' : isPaused ? 'Paused' : 'Stopped'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700">Party A</h3>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h3 className="text-sm font-medium text-green-700">Party B</h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isRecording && !isPaused ? (
                  <Button
                    onClick={startRecording}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </Button>
                ) : isPaused ? (
                  <Button
                    onClick={resumeRecording}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume Recording
                  </Button>
                ) : (
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause Recording
                  </Button>
                )}
                <Button
                  onClick={stopRecording}
                  variant="outline"
                  disabled={!isRecording && !isPaused}
                  className="flex items-center gap-2"
                >
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </Button>
                <Button
                  onClick={switchSpeaker}
                  variant="secondary"
                  disabled={isRecording}
                  className="flex items-center gap-2"
                >
                  Switch Speaker
                </Button>
                <Button
                  onClick={resetDebate}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button
                  onClick={finishDebate}
                  variant="outline"
                  disabled={transcripts.length === 0}
                  className="flex items-center gap-2"
                >
                  Finish Debate
                </Button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Transcript</h2>
            {transcripts.map((entry, index) => (
              <Card key={index} className={`p-4 ${
                entry.speaker === 'partyA' ? 'bg-blue-50' : 
                entry.speaker === 'partyB' ? 'bg-green-50' : 
                'bg-purple-50'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {entry.speaker === 'partyA' ? 'Party A' : 
                       entry.speaker === 'partyB' ? 'Party B' : 
                       'AI Assistant'}
                    </h3>
                    {!entry.isFinal && (
                      <span className="text-sm text-gray-500">(In progress...)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{entry.timestamp}</span>
                    <span className="text-xs text-gray-400">
                      {formatTime(entry.duration / 1000)}
                    </span>
                  </div>
                </div>
                <p className="whitespace-pre-wrap">{entry.text}</p>
                {entry.confidence < 0.8 && entry.speaker !== 'ai' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Low confidence transcription
                  </p>
                )}
              </Card>
            ))}
          </div>

          {interimAnalysis && (
            <div className="mt-8">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Current Analysis</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Summary</h3>
                    <p>{interimAnalysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Party A's Key Points</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {interimAnalysis.keyPoints.partyA.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Party B's Key Points</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {interimAnalysis.keyPoints.partyB.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Points of Agreement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {interimAnalysis.agreementPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Points of Disagreement</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {interimAnalysis.disagreementPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Current Conclusion</h3>
                    <p>{interimAnalysis.conclusion}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
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

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Final Decision</h3>
                    <p className="font-medium">{analysis.finalDecision}</p>
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