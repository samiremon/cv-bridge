import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface VoiceInterviewProps {
  onBackToOverview?: () => void;
}

export const VoiceInterview: React.FC<VoiceInterviewProps> = ({ onBackToOverview }) => {
  const [topics, setTopics] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ sender: 'AI Interviewer' | 'You'; text: string; time: string }>>([
    {
      sender: 'AI Interviewer',
      text: "Hello! Welcome to your mock interview. Click 'Start Interview' whenever you are ready.",
      time: "10:00 AM"
    }
  ]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const suggestedTopics = [
    'React & Frontend Architecture',
    'System Design & Microservices',
    'PostgreSQL & Database Design',
    'Behavioral & STAR Questions'
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        if (transcriptText.trim()) {
          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTranscript(prev => [
            ...prev,
            { sender: 'You', text: transcriptText, time: currentTime }
          ]);

          setTimeout(() => {
            const aiReply = `Thank you. Regarding ${topics.split(',')[0] || 'this area'}, how would you approach performance optimization and fault tolerance in a production deployment?`;
            setTranscript(prev => [
              ...prev,
              { sender: 'AI Interviewer', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            speakText(aiReply);
          }, 1200);
        }
      };

      recognition.onerror = () => {
        // Handle error silently
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [topics]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSession = () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setTranscript(prev => [
        ...prev,
        { 
          sender: 'AI Interviewer', 
          text: "Session finished! Good job practicing your verbal explanations.", 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } else {
      setIsSessionActive(true);
      const currentTopic = topics.trim() || 'your background and engineering experience';
      const greeting = `Welcome! Today we will discuss: ${currentTopic}. Let's begin: Can you describe a challenging technical problem you solved recently?`;
      
      setTranscript([
        { 
          sender: 'AI Interviewer', 
          text: greeting, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      speakText(greeting);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // already running or permission issue
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <Sparkles className="w-3 h-3 text-emerald-600" /> AI Voice Coach
              </span>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Browser Speech API
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Voice Mock Interview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Choose your practice topic and speak directly into your microphone. The AI interviewer will ask questions and listen to your answers.
            </p>
          </div>

          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic Configuration */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              1. Choose Topic
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Select or write your interview topics</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Topic / Syllabus
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Enter interview topic..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTopics.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setTopics(item)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free In-Browser Audio</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              No API keys or microphone subscriptions needed. Runs directly in Chrome or Edge.
            </p>
          </div>

          {!speechSupported && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Speech recognition is not supported in this browser. Please use Chrome or Edge.
              </span>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Simple Voice Stage & Transcript */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSessionActive ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600'
              }`}>
                {isSessionActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isSessionActive ? 'Interview in Progress' : 'Ready to Start'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSessionActive ? 'Speak into your mic — AI is listening' : 'Click the button to begin speaking'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleSession}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
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

          {/* Clean Conversation Transcript */}
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Conversation
              </h3>
              <span className="text-[11px] text-slate-400">Live Dialogue</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {transcript.map((item, idx) => {
                const isAi = item.sender === 'AI Interviewer';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] text-slate-400 font-medium mb-1">
                      {item.sender} • {item.time}
                    </span>
                    <div
                      className={`max-w-xl p-3 rounded-xl text-xs leading-relaxed ${
                        isAi
                          ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                          : 'bg-emerald-600 text-white rounded-tr-sm'
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};