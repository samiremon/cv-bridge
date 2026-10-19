import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  ArrowLeft, 
  Volume2, 
  Radio,
  CheckCircle2,
  Award,
  TrendingUp,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';

interface VoiceInterviewProps {
  onBackToOverview?: () => void;
}

interface TranscriptItem {
  sender: 'AI Interviewer (Alex)' | 'You';
  text: string;
  time: string;
}

interface CategoryScore {
  category: string;
  score: number;
  feedback: string;
}

interface ScorecardData {
  overall_score: number;
  rating: string;
  summary: string;
  category_scores: CategoryScore[];
  strengths: string[];
  improvements: string[];
}

type MicMode = 'hands-free' | 'push-to-talk';

export const VoiceInterview: React.FC<VoiceInterviewProps> = ({ onBackToOverview }) => {
  const [topic, setTopic] = useState('Primary School Teacher');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConcluded, setIsConcluded] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start interview');
  
  // Realtime conversation states
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [liveRms, setLiveRms] = useState<number>(0);

  // Scorecard modal & evaluation states
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [isGeneratingScorecard, setIsGeneratingScorecard] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);

  // Noise immunity & Conversational Pause configuration
  const [micMode] = useState<MicMode>('hands-free');
  const [sensitivityThreshold] = useState<number>(0.065);
  const [pauseDurationMs] = useState<number>(1800);
  const [isPttPressed, setIsPttPressed] = useState<boolean>(false);

  // Audio, VAD, and WebSocket References
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const filteredStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Speech & Noise Detection Refs
  const isConcludedRef = useRef<boolean>(false);
  const micModeRef = useRef<MicMode>('hands-free');
  const sensitivityThresholdRef = useRef<number>(0.065);
  const pauseDurationMsRef = useRef<number>(1800);
  const isAiSpeakingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const speechStartTimestampRef = useRef<number>(0);
  const silenceTimerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const consecutiveSpeechFramesRef = useRef<number>(0);
  const consecutiveSilenceFramesRef = useRef<number>(0);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Sync refs with state
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    isConcludedRef.current = isConcluded;
  }, [isConcluded]);

  useEffect(() => {
    micModeRef.current = micMode;
  }, [micMode]);

  useEffect(() => {
    sensitivityThresholdRef.current = sensitivityThreshold;
  }, [sensitivityThreshold]);

  useEffect(() => {
    pauseDurationMsRef.current = pauseDurationMs;
  }, [pauseDurationMs]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Spacebar hotkey listener for Push-to-Talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && micModeRef.current === 'push-to-talk' && isSessionActive && !isAiSpeakingRef.current && !isConcludedRef.current) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        if (!isSpeakingRef.current) {
          startPushToTalk();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && micModeRef.current === 'push-to-talk' && isSessionActive && !isConcludedRef.current) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        e.preventDefault();
        if (isSpeakingRef.current) {
          stopPushToTalk();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSessionActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioSession();
    };
  }, []);

  const cleanupAudioSession = () => {
    stopAiAudio();
    stopVAD();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const stopAiAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      audioPlayerRef.current = null;
    }
    setIsAiSpeaking(false);
    isAiSpeakingRef.current = false;
  };

  // Playback Alex voice immediately with full volume
  const playAiVoice = (base64Audio: string) => {
    stopAiAudio();
    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioPlayerRef.current = audio;
      setIsAiSpeaking(true);
      isAiSpeakingRef.current = true;
      
      // Reset candidate speaking state while Alex is speaking to eliminate speaker loopback
      isSpeakingRef.current = false;
      consecutiveSpeechFramesRef.current = 0;
      consecutiveSilenceFramesRef.current = 0;
      setIsUserSpeaking(false);
      setLiveRms(0);
      setStatusMessage('Alex is speaking...');

      audio.onended = () => {
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        audioPlayerRef.current = null;

        // If the interview is concluded, DO NOT listen anymore and show popup!
        if (isConcludedRef.current) {
          stopVAD();
          setStatusMessage('Interview concluded.');
          setShowReportModal(true); // Open the requested popup!
        } else {
          setStatusMessage(
            micModeRef.current === 'push-to-talk'
              ? 'Hold button or Spacebar to speak your answer'
              : 'Waiting for your answer (Speak when ready)'
          );
        }
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsAiSpeaking(false);
        isAiSpeakingRef.current = false;
        audioPlayerRef.current = null;
        if (isConcludedRef.current) {
          setShowReportModal(true);
        } else {
          setStatusMessage('Waiting for your answer (Speak when ready)');
        }
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn('Audio play notice:', e);
          setIsAiSpeaking(false);
          isAiSpeakingRef.current = false;
          if (isConcludedRef.current) {
            setShowReportModal(true);
          }
        });
      }
    } catch (err) {
      console.error('Audio initialization error:', err);
      setIsAiSpeaking(false);
      isAiSpeakingRef.current = false;
      if (isConcludedRef.current) {
        setShowReportModal(true);
      }
    }
  };

  // -------------------------------------------------------------
  // Bandpass-Filtered Audio Graph with Hysteresis VAD
  // -------------------------------------------------------------
  const startVAD = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        } 
      });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // 1. High-Pass Filter at 300Hz: Strips fan rumble, desk resonance, AC drone
      const highpass = audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(300, audioContext.currentTime);
      highpass.Q.setValueAtTime(1.5, audioContext.currentTime);

      // 2. Low-Pass Filter at 3400Hz: Strips electrical hiss, high static
      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3400, audioContext.currentTime);
      lowpass.Q.setValueAtTime(1.2, audioContext.currentTime);

      // 3. Analyser Node for time-domain RMS calculation
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.15;
      analyserRef.current = analyser;

      // 4. MediaStreamDestination for sending CLEAN filtered audio to Whisper
      const dest = audioContext.createMediaStreamDestination();
      filteredStreamRef.current = dest.stream;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(analyser);
      lowpass.connect(dest);

      const timeBuffer = new Float32Array(analyser.fftSize);

      const processAudioFrame = () => {
        if (!analyserRef.current) return;

        // If interview concluded or Alex is speaking, mute microphone VAD entirely.
        if (isConcludedRef.current || isAiSpeakingRef.current) {
          setLiveRms(0);
          animFrameRef.current = requestAnimationFrame(processAudioFrame);
          return;
        }

        analyserRef.current.getFloatTimeDomainData(timeBuffer);

        // Calculate true Root Mean Square (RMS) audio energy
        let sumSquares = 0;
        for (let i = 0; i < timeBuffer.length; i++) {
          sumSquares += timeBuffer[i] * timeBuffer[i];
        }
        const rms = Math.sqrt(sumSquares / timeBuffer.length);
        const now = Date.now();

        setLiveRms(rms);

        // In Hands-Free Mode: Use Hysteresis (Start Threshold vs Hold Threshold)
        if (micModeRef.current === 'hands-free' && !isConcludedRef.current) {
          const startThreshold = sensitivityThresholdRef.current;
          const holdThreshold = startThreshold * 0.45;

          if (!isSpeakingRef.current) {
            // WAITING TO START: Require sound > startThreshold for 5 frames
            if (rms > startThreshold) {
              consecutiveSpeechFramesRef.current += 1;
              if (consecutiveSpeechFramesRef.current >= 5) {
                isSpeakingRef.current = true;
                speechStartTimestampRef.current = now;
                consecutiveSilenceFramesRef.current = 0;
                setIsUserSpeaking(true);
                setStatusMessage('Recording your answer... (Speak naturally)');
                startTurnRecording();
              }
            } else {
              consecutiveSpeechFramesRef.current = 0;
            }
          } else {
            // ACTIVELY RECORDING: Hold threshold keeps soft words from triggering pause
            if (rms > holdThreshold) {
              consecutiveSilenceFramesRef.current = 0;
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
                setStatusMessage('Recording your answer... (Speak naturally)');
              }
            } else {
              consecutiveSilenceFramesRef.current += 1;
              if (consecutiveSilenceFramesRef.current >= 4 && !silenceTimerRef.current) {
                setStatusMessage('Paused... (Continue speaking or wait to finish)');
                silenceTimerRef.current = setTimeout(() => {
                  finishTurnRecording();
                }, pauseDurationMsRef.current);
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(processAudioFrame);
      };

      processAudioFrame();
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Microphone access is required: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Push-to-Talk Handlers
  // -------------------------------------------------------------
  const startPushToTalk = () => {
    if (isAiSpeakingRef.current || isConcludedRef.current) return;
    setIsPttPressed(true);
    isSpeakingRef.current = true;
    speechStartTimestampRef.current = Date.now();
    setIsUserSpeaking(true);
    setStatusMessage('Recording your answer... (Release when done)');
    startTurnRecording();
  };

  const stopPushToTalk = () => {
    setIsPttPressed(false);
    finishTurnRecording();
  };

  const handleDoneSpeakingNow = () => {
    if (isSpeakingRef.current) {
      finishTurnRecording();
    }
  };

  const startTurnRecording = () => {
    if (isConcludedRef.current) return;
    const streamToRecord = filteredStreamRef.current || micStreamRef.current;
    if (!streamToRecord) return;

    try {
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(streamToRecord, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const duration = Date.now() - speechStartTimestampRef.current;
        if (duration >= 500 && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (audioBlob.size > 3000) {
            setStatusMessage('Alex is listening and responding...');

            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
              const base64Audio = (reader.result as string).split(',')[1];
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  type: 'candidate_audio',
                  audio_base64: base64Audio,
                  filename: 'candidate_turn.webm'
                }));
              }
            };
          } else {
            setStatusMessage(
              micModeRef.current === 'push-to-talk'
                ? 'Hold button or Spacebar to speak'
                : 'Waiting for your answer (Speak when ready)'
            );
          }
        } else {
          setStatusMessage(
            micModeRef.current === 'push-to-talk'
              ? 'Hold button or Spacebar to speak'
              : 'Waiting for your answer (Speak when ready)'
          );
        }
      };

      recorder.start(100);
    } catch (e) {
      console.error('Recorder start error:', e);
    }
  };

  const finishTurnRecording = () => {
    isSpeakingRef.current = false;
    consecutiveSpeechFramesRef.current = 0;
    consecutiveSilenceFramesRef.current = 0;
    setIsUserSpeaking(false);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const stopVAD = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    filteredStreamRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    isSpeakingRef.current = false;
    consecutiveSpeechFramesRef.current = 0;
    consecutiveSilenceFramesRef.current = 0;
    setIsUserSpeaking(false);
    setLiveRms(0);
  };

  // -------------------------------------------------------------
  // Session Start / End / Scorecard
  // -------------------------------------------------------------
  const startSession = () => {
    const selectedTopic = topic.trim() || 'General Professional Experience';
    setIsSessionActive(true);
    setIsConcluded(false);
    isConcludedRef.current = false;
    setShowReportModal(false);
    setScorecard(null);
    setQuestionCount(0);
    setStatusMessage('Connecting...');
    setTranscript([]);

    // Prime audio context synchronously on user interaction so browsers never block playback
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    const sessionId = 'session-' + Math.random().toString(36).substring(2, 9);
    const wsUrl = `ws://localhost:8000/api/interview/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      await startVAD();
      ws.send(JSON.stringify({
        type: 'init_session',
        topic: selectedTopic
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Alex speaks a question
        if (data.type === 'ai_speech') {
          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTranscript(prev => [
            ...prev,
            {
              sender: 'AI Interviewer (Alex)',
              text: data.text,
              time: currentTime
            }
          ]);
          setQuestionCount(data.question_number || 1);

          // If interview has concluded, mark finished and stop listening!
          if (data.is_concluded) {
            setIsConcluded(true);
            isConcludedRef.current = true;
            setIsSessionActive(false);
            stopVAD();
            setStatusMessage('Interview concluded.');
          }

          if (data.audio_base64) {
            playAiVoice(data.audio_base64);
          } else if (data.is_concluded) {
            setShowReportModal(true);
          }
        }

        // Candidate speech transcribed
        else if (data.type === 'transcription_ready') {
          if (data.transcript && data.transcript.trim()) {
            const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTranscript(prev => [
              ...prev,
              {
                sender: 'You',
                text: data.transcript,
                time: currentTime
              }
            ]);
            setStatusMessage('Alex is thinking and responding...');
          }
        }

        // Background noise or silence filtered out cleanly
        else if (data.type === 'transcription_empty') {
          if (!isConcludedRef.current) {
            setStatusMessage(
              micModeRef.current === 'push-to-talk'
                ? 'Hold button or Spacebar to speak'
                : 'Waiting for your answer (Speak when ready)'
            );
          }
        }

        else if (data.type === 'scorecard_ready') {
          setScorecard(data.scorecard);
          setIsGeneratingScorecard(false);
        }

        else if (data.type === 'session_ended') {
          endSession(false);
        }

      } catch (err) {
        console.error('Frame parse error:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setStatusMessage('Connection error. Check backend server.');
    };

    ws.onclose = () => {
      setIsSessionActive(false);
      cleanupAudioSession();
    };
  };

  const endSession = (notifyBackend = true) => {
    if (notifyBackend && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }));
    }
    cleanupAudioSession();
    setIsSessionActive(false);
    setIsConcluded(true);
    isConcludedRef.current = true;
    setStatusMessage('Interview finished.');
    setShowReportModal(true); // POPUP APPEARS!

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTranscript(prev => [
      ...prev,
      {
        sender: 'AI Interviewer (Alex)',
        text: "Thank you so much for participating in the mock interview today! We will be in touch soon with next steps.",
        time: currentTime
      }
    ]);
  };

  // Generate Scorecard Report using Gemini
  const handleGenerateScorecard = async () => {
    setIsGeneratingScorecard(true);

    const historyPayload = transcript.map(t => ({
      role: t.sender.startsWith('AI') ? 'interviewer' : 'candidate',
      text: t.text
    }));

    try {
      const response = await fetch('http://localhost:8000/api/interview/scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'General Professional Experience',
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate scorecard via REST');
      }

      const data: ScorecardData = await response.json();
      setScorecard(data);
    } catch (err) {
      console.error('REST scorecard failed, trying WebSocket:', err);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'get_scorecard',
          topic: topic.trim() || 'General Professional Experience',
          history: historyPayload
        }));
      }
    } finally {
      setIsGeneratingScorecard(false);
    }
  };

  // Handle "Start Next Interview" button from inside the popup
  const handleStartNextInterview = () => {
    setShowReportModal(false);
    setScorecard(null);
    setIsConcluded(false);
    isConcludedRef.current = false;
    setTranscript([]);
    startSession();
  };

  // Convert RMS to display percentage (0 to 100 based on a 0.20 max scale)
  const rmsPercentage = Math.min(100, Math.round((liveRms / 0.20) * 100));
  const thresholdPercentage = Math.min(100, Math.round((sensitivityThreshold / 0.20) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Header & Role Input Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Target Role / Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isSessionActive}
              placeholder="Enter role (e.g. Primary School Teacher, Software Engineer...)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={isSessionActive ? () => endSession(true) : startSession}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                isSessionActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSessionActive ? (
                <>
                  <Square className="w-4 h-4 fill-white" /> End Interview
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" /> Start Interview
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Audio Activity Graph (Visual threshold meter to see someone is talking - with no writing) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <div className="w-36 sm:w-48 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative shadow-inner">
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              style={{ left: `${thresholdPercentage}%` }}
            />
            <div 
              className={`h-full transition-all duration-75 rounded-full ${
                liveRms > sensitivityThreshold ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              style={{ width: `${rmsPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Conversation Stage */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        {/* Real-time Status Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isConcluded
                ? 'bg-emerald-100 text-emerald-700'
                : isUserSpeaking
                  ? 'bg-emerald-600 text-white animate-pulse'
                  : isAiSpeaking 
                    ? 'bg-blue-600 text-white animate-bounce' 
                    : isSessionActive 
                      ? 'bg-slate-100 text-slate-600' 
                      : 'bg-slate-100 text-slate-400'
            }`}>
              {isConcluded ? (
                <Award className="w-5 h-5 text-emerald-600" />
              ) : isUserSpeaking ? (
                <Mic className="w-4 h-4" />
              ) : isAiSpeaking ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <MicOff className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {isConcluded
                    ? 'Interview Concluded'
                    : isUserSpeaking 
                      ? 'Recording Your Answer...' 
                      : isAiSpeaking 
                        ? 'Alex is Speaking...' 
                        : isSessionActive 
                          ? (micMode === 'push-to-talk' ? 'Push to Talk Ready' : 'Ready / Waiting for Voice')
                          : 'Session Inactive'}
                </span>
                {questionCount > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {isConcluded ? `Completed (${questionCount} Turns)` : `Question #${questionCount}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">{statusMessage}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Live Voice Room</span>
          </div>
        </div>

        {/* Dynamic Action Bar: Active during speaking in Hands-Free mode */}
        {isSessionActive && !isConcluded && micMode === 'hands-free' && isUserSpeaking && !isAiSpeaking && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Speaking... (Take your time, pauses won't cut you off)</span>
            </div>
            <button
              type="button"
              onClick={handleDoneSpeakingNow}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Done Speaking (Send Now)
            </button>
          </div>
        )}

        {/* Push-to-Talk Big Button (visible when in Push-to-Talk mode and active) */}
        {isSessionActive && !isConcluded && micMode === 'push-to-talk' && !isAiSpeaking && (
          <div className="py-2 flex justify-center">
            <button
              type="button"
              onMouseDown={startPushToTalk}
              onMouseUp={stopPushToTalk}
              onTouchStart={startPushToTalk}
              onTouchEnd={stopPushToTalk}
              className={`w-full max-w-sm py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all select-none cursor-pointer shadow-sm ${
                isPttPressed
                  ? 'bg-emerald-600 text-white scale-98 ring-4 ring-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              <Mic className={`w-5 h-5 ${isPttPressed ? 'animate-bounce' : 'text-slate-600'}`} />
              <span>{isPttPressed ? 'Recording (Release to Send)' : 'Hold to Speak (or hold Spacebar)'}</span>
            </button>
          </div>
        )}

        {/* Interview Finished Re-Open Banner (shown if modal is closed but interview concluded) */}
        {isConcluded && !showReportModal && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 text-xs text-emerald-950 font-semibold">
              <Award className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Thank you for participating! Your performance report is ready to view.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{scorecard ? 'View Performance Report' : 'Generate Report'}</span>
            </button>
          </div>
        )}

        {/* Live Conversation Transcript */}
        <div className="space-y-3.5 min-h-[200px] max-h-[420px] overflow-y-auto pr-1">
          {transcript.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <Mic className="w-6 h-6 opacity-40 text-emerald-500" />
              <span>Click "Start Interview" to begin your voice conversation with Alex.</span>
            </div>
          ) : (
            transcript.map((item, idx) => {
              const isAi = item.sender.startsWith('AI');
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-slate-400 font-medium mb-1">
                    {item.sender} • {item.time}
                  </span>
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isAi
                        ? 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200/50'
                        : 'bg-emerald-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* POPUP MODAL: Appears automatically when interview finishes */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 flex flex-col relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer z-10"
              title="Close and View Transcript"
            >
              <X className="w-5 h-5" />
            </button>

            {/* STATE 1: Before Report is Generated */}
            {!scorecard ? (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                  <Award className="w-8 h-8" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 max-w-lg">
                  Thank you for participating in the mock interview
                </h3>

                <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                  You have successfully completed your mock interview for the role of{' '}
                  <span className="font-semibold text-slate-800">{topic}</span>. Click below to have our AI analyze your spoken answers, calculate your performance score, and highlight your strengths and areas for growth.
                </p>

                <div className="pt-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleGenerateScorecard}
                    disabled={isGeneratingScorecard}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    {isGeneratingScorecard ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>AI is Evaluating Your Spoken Answers...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Report About This Interview</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="pt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Review interview conversation transcript first
                </button>
              </div>
            ) : (
              /* STATE 2: After Report is Generated (INSIDE THE SAME POPUP) */
              <div className="space-y-6">
                {/* Popup Report Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl">
                      <Award className="w-6 h-6 text-emerald-600" />
                      <span>Interview Performance Report</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Target Role: <span className="font-semibold text-slate-700">{topic}</span> • Evaluated by Gemini AI
                    </p>
                  </div>

                  {/* Overall Score Badge */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3 px-4.5">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Overall Score
                      </span>
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                        scorecard.overall_score >= 80 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : scorecard.overall_score >= 65 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {scorecard.rating}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {scorecard.overall_score}
                      <span className="text-xs sm:text-sm font-semibold text-slate-400">/100</span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">Executive Summary:</span>
                  {scorecard.summary}
                </div>

                {/* Core Competencies Breakdown */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Core Competency Breakdown
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {scorecard.category_scores.map((cat, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-800">{cat.category}</span>
                          <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {cat.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">{cat.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Improvement Areas (2 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What you did well */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>What You Did Well (Key Strengths)</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scorecard.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-emerald-950 leading-relaxed">
                          <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Spaces for Improvement */}
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <span>Spaces for Improvement (Actionable Advice)</span>
                    </div>
                    <ul className="space-y-1.5">
                      {scorecard.improvements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-amber-950 leading-relaxed">
                          <span className="text-amber-500 font-bold shrink-0 mt-0.5">→</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer with "Start Next Interview" button */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Close & Review Transcript
                  </button>
                  <button
                    type="button"
                    onClick={handleStartNextInterview}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Start Next Interview</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};