import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";
import { InterviewConfig } from "@/types/interview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, User, Bot, ShieldCheck, ShieldAlert, Mic, MicOff, Play, Timer, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = { role: "system" | "user" | "assistant"; content: string; };

export default function Interview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  
  // Database Session ID Tracker
  const [sessionId, setSessionId] = useState<string>("1"); 

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputValueRef = useRef(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [isHrSpeaking, setIsHrSpeaking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(120);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [proctorWarning, setProctorWarning] = useState<string | null>(null);
  const lastWarningTime = useRef<number>(0);
  const faceDetectionRef = useRef<FaceDetection | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [micVolume, setMicVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputValueRef.current = inputValue; }, [inputValue]);

  useEffect(() => {
    if (!hasStarted || isHrSpeaking || proctorWarning || isLoading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswer(true); 
          return 120; 
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, isHrSpeaking, proctorWarning, isLoading]);

  useEffect(() => {
    const raw = sessionStorage.getItem("interviewConfig");
    if (!raw) { navigate("/"); return; }
    setConfig(JSON.parse(raw));
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputValue(currentTranscript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }

    const setupAudioAnalyzer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          setMicVolume(sum / bufferLength);
          requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (e) {}
    };
    setupAudioAnalyzer();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e){} }
    };
  }, [navigate]);

  const handleUserMedia = useCallback((stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorder.start(1000); 
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!webcamRef.current?.video) return;
    faceDetectionRef.current = new FaceDetection({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}` });
    faceDetectionRef.current.setOptions({ model: 'short', minDetectionConfidence: 0.5 });
    faceDetectionRef.current.onResults((results) => {
      const now = Date.now();
      if (now - lastWarningTime.current < 5000) return; 
      let warningMsg = null;
      if (!results.detections || results.detections.length === 0) warningMsg = "No face detected. Please stay in front of the camera.";
      else if (results.detections.length > 1) warningMsg = "Multiple people detected. Ensure you are alone.";

      if (!warningMsg && webcamRef.current?.video && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(webcamRef.current.video, 0, 0, 100, 100); 
          const imageData = ctx.getImageData(0, 0, 100, 100);
          let colorSum = 0;
          for (let i = 0; i < imageData.data.length; i += 4) colorSum += (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
          if ((colorSum / 10000) < 30) warningMsg = "The room is too dark. Please adjust your lighting.";
        }
      }

      if (warningMsg && hasStarted) triggerProctoringInterruption(warningMsg);
      else if (!warningMsg) setProctorWarning(null);
    });

    cameraRef.current = new Camera(webcamRef.current.video, {
      onFrame: async () => { if (webcamRef.current?.video && faceDetectionRef.current) try { await faceDetectionRef.current.send({ image: webcamRef.current.video }); } catch (e) {} },
      width: 640, height: 480
    });
    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
      try { faceDetectionRef.current?.close(); } catch (e) {} 
    };
  }, [hasStarted]);

  const startMic = () => {
    if (!recognitionRef.current || proctorWarning) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      if (e.name === "InvalidStateError") setIsListening(true); 
    }
  };

  const stopMic = () => {
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e){}
      setIsListening(false);
    }
  };

  const triggerProctoringInterruption = (msg: string) => {
    lastWarningTime.current = Date.now();
    setProctorWarning(msg);
    stopMic(); 
    window.speechSynthesis.cancel();
    setIsHrSpeaking(false);
    const existingWarnings = JSON.parse(sessionStorage.getItem("interviewWarnings") || "[]");
    sessionStorage.setItem("interviewWarnings", JSON.stringify([...existingWarnings, msg]));
    const utterance = new SpeechSynthesisUtterance("Warning. " + msg);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text: string, autoStartMic: boolean = false) => {
    if (!window.speechSynthesis || proctorWarning) return; 
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en-') && v.name.includes('Female')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = 0.95; 
    utterance.onstart = () => setIsHrSpeaking(true);
    
    utterance.onend = () => {
      setIsHrSpeaking(false);
      if (autoStartMic && !proctorWarning) setTimeout(() => startMic(), 800);
    };
    window.speechSynthesis.speak(utterance);
  };

  const generateQuestions = async () => {
    setHasStarted(true);
    setIsLoading(true);

    try {
      // 1. Create a Session in the Database First
      const sessionFormData = new FormData();
      sessionFormData.append("role", config?.role || "unknown");
      sessionFormData.append("experience", config?.experienceLevel || "unknown");
      
      try {
        const sessionResponse = await fetch("http://127.0.0.1:8000/api/sessions/", {
          method: "POST",
          body: sessionFormData,
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setSessionId(sessionData.session_id.toString());
        }
      } catch (dbError) {
        console.warn("Could not create database session, using fallback ID.", dbError);
      }

      // 2. Generate AI Questions
      const apiKey = import.meta.env.VITE_GROQ_API_KEY; 
      const resumeText = sessionStorage.getItem("resumeText");

      const prompt = `Generate exactly 3 interview questions for a ${config?.experienceLevel} ${config?.role} at ${config?.companyMode}. Focus on ${config?.interviewType}. 
      ${resumeText ? `Here is the candidate's resume: ${resumeText}. Personalize.` : ""}
      Return ONLY a valid JSON array of strings. Example: ["Q1?", "Q2?"]`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.7 })
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      const generatedQuestions = JSON.parse(aiResponse.substring(aiResponse.indexOf('['), aiResponse.lastIndexOf(']') + 1));
      
      setQuestions(generatedQuestions);
      const intro = `Hello! I have reviewed your profile and I am ready. Let's begin. ${generatedQuestions[0]}`;
      setMessages([{ role: "assistant", content: intro }]);
      speakText(intro, true);
    } catch (error: any) {
      toast({ title: "Setup Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (isTimeout: boolean | React.MouseEvent | React.KeyboardEvent = false) => {
    const isTimeOutTrigger = isTimeout === true;
    if (!inputValueRef.current.trim() && !isTimeOutTrigger) return;
    
    stopMic(); 
    setTimeLeft(120); 
    
    const userAns = isTimeOutTrigger 
       ? (inputValueRef.current.trim() || "[Candidate ran out of time and provided no answer]") 
       : inputValueRef.current.trim();
       
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userAns }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY; 
      const isLastQuestion = currentQuestionIndex >= questions.length - 1;
      const currentQ = questions[currentQuestionIndex];
      const nextQ = isLastQuestion ? "That concludes our interview. Thank you for your time." : questions[currentQuestionIndex + 1];

      const prompt = `You are an expert HR Interviewer. 
      Question asked: "${currentQ}"
      Next Question in queue: "${nextQ}"

      Candidate's spoken input:
      <candidate_answer>
      ${userAns}
      </candidate_answer>

      Analyze the input thoroughly. Choose ONE path:
      1. CLARIFICATION: If they asked for help or didn't understand, explain the question simply. Set "moved_to_next" to false.
      2. TIMEOUT: If input says "[Candidate ran out of time...]", say "Let's move on due to time constraints." Set "moved_to_next" to true.
      3. FOLLOW-UP: If answer was too short/vague, ask a follow-up to dig deeper. Set "moved_to_next" to false.
      4. PROCEED: If they answered well, briefly say what was good, then ask the "Next Question in queue". Set "moved_to_next" to true.

      MUST respond ONLY with JSON: { "spoken_response": "What you say out loud", "moved_to_next": boolean }`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }], temperature: 0.5, response_format: { type: "json_object" } })
      });

      const parsedResponse = JSON.parse((await response.json()).choices[0].message.content);
      setMessages(prev => [...prev, { role: "assistant", content: parsedResponse.spoken_response }]);
      
      if (parsedResponse.moved_to_next) setCurrentQuestionIndex(prev => prev + 1);
      speakText(parsedResponse.spoken_response, !(parsedResponse.moved_to_next && isLastQuestion));

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndInterview = async () => {
    window.speechSynthesis.cancel();
    stopMic();
    setIsSavingRecord(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordedChunksRef.current.length > 0) {
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const fileName = `session-${Date.now()}.webm`;
      
      try {
        const formData = new FormData();
        // Dynamically inject the verified Session ID created at the start of the interview
        formData.append('session_id', sessionId); 
        formData.append('file', videoBlob, fileName);

        // Fetch endpoint from .env variables
        const backendUploadUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000/api/upload-video/";

        const uploadResponse = await fetch(backendUploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Server returned ${uploadResponse.status}`);
        }
        
        console.log("Video saved to PostgreSQL Database:", fileName);
        toast({ title: "Success", description: "Video securely saved to database." });
      } catch (e: any) {
        console.error("Video upload failed:", e.message);
        toast({ title: "Upload Failed", description: "Failed to connect to the backend server.", variant: "destructive" });
      }
    }

    sessionStorage.setItem("interviewTranscript", JSON.stringify(messages));
    setIsSavingRecord(false);
    navigate("/feedback");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSubmitAnswer();
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  let orbScale = 1;
  if (isHrSpeaking) orbScale = 1.2 + Math.sin(Date.now() / 150) * 0.1; 
  else if (isListening) orbScale = 1 + (micVolume / 100); 

  if (!config) return null;

  return (
    <div className="flex h-screen w-full bg-black text-white p-4 gap-6 font-sans">
      <canvas ref={canvasRef} width="100" height="100" className="hidden" />

      {/* LEFT PANEL */}
      <div className="w-1/2 flex flex-col gap-4 relative">
        <Card className={`flex-1 bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col items-center justify-center transition-colors ${proctorWarning ? 'border-red-500 bg-red-950/20' : ''}`}>
          {proctorWarning ? (
            <div className="text-center z-20 text-red-500 animate-pulse p-6">
              <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Interview Paused</h2>
              <p className="text-lg">{proctorWarning}</p>
            </div>
          ) : !hasStarted ? (
            <div className="text-center z-20">
              <h2 className="text-3xl font-bold mb-6">Ready to start?</h2>
              <Button onClick={generateQuestions} size="lg" className="bg-cyan-600 hover:bg-cyan-700 h-14 text-lg px-8 rounded-full" disabled={isLoading}>
                {isLoading ? "Analyzing Data..." : <><Play className="mr-2 h-5 w-5" /> Begin Interview</>}
              </Button>
            </div>
          ) : (
            <>
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full z-20 backdrop-blur-sm">
                <Timer className={`w-5 h-5 ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
                <span className={`font-mono text-xl font-bold tracking-wider ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-zinc-100'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute rounded-full blur-[80px] transition-all duration-75 w-64 h-64 bg-cyan-500/20" style={{ transform: `scale(${orbScale})` }}></div>
                <div className="relative rounded-full transition-transform duration-75 flex items-center justify-center w-32 h-32 bg-gradient-to-tr from-cyan-400 to-blue-700 shadow-[0_0_50px_rgba(34,211,238,0.4)]" style={{ transform: `scale(${orbScale})` }}>
                  <div className={`w-1/2 h-1/2 rounded-full bg-white/20 blur-sm ${isHrSpeaking ? 'animate-ping' : ''}`}></div>
                </div>
              </div>
              <div className="absolute bottom-10 text-center w-full">
                <p className="text-lg font-medium text-cyan-400 tracking-wide">
                  {isHrSpeaking ? "AI is speaking..." : (isListening ? "Listening to you..." : "Processing...")}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* User Camera */}
        <div className={`absolute top-6 right-6 w-48 h-36 bg-black rounded-xl overflow-hidden border-2 z-10 shadow-xl ${proctorWarning ? 'border-red-500' : 'border-zinc-700'}`}>
          <Webcam ref={webcamRef} audio={true} mirrored={true} onUserMedia={handleUserMedia} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 bg-red-500 animate-pulse w-2.5 h-2.5 rounded-full shadow-lg"></div>
        </div>

        <div className="h-16 flex items-center justify-between px-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg">
           <div className="flex items-center gap-3">
             {proctorWarning ? <ShieldAlert className="text-red-500 w-5 h-5 animate-pulse" /> : <ShieldCheck className="text-emerald-500 w-5 h-5" />}
             <span className={`text-sm font-semibold tracking-wide ${proctorWarning ? 'text-red-500' : 'text-zinc-300'}`}>
               {proctorWarning ? 'Warning Recorded' : `Secure Recording Active`}
             </span>
           </div>
           <Button variant="destructive" className="font-semibold rounded-full px-6" onClick={handleEndInterview} disabled={isSavingRecord}>
             {isSavingRecord ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Video...</> : "End Interview"}
           </Button>
        </div>
      </div>

      {/* RIGHT PANEL: Chat */}
      <div className="w-1/2 flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Messages Display Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ${msg.role === "user" ? "bg-cyan-600" : "bg-zinc-800 border border-zinc-700"}`}>
                  {msg.role === "user" ? <User size={18} /> : <Bot size={18} className="text-cyan-400" />}
                </div>
                <div className={`px-5 py-4 rounded-2xl shadow-sm ${msg.role === "user" ? "bg-cyan-700 text-white rounded-tr-sm" : "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-sm"}`}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Box Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3 items-end bg-zinc-900 p-2 rounded-2xl border border-zinc-800 focus-within:border-cyan-500/50 transition-colors">
            <Button 
              onClick={() => isListening ? stopMic() : startMic()} 
              className={`h-12 w-12 rounded-xl shrink-0 transition-all ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'}`} 
              disabled={isLoading || isHrSpeaking || !hasStarted || !!proctorWarning}
            >
              {isListening ? <Mic size={22} /> : <MicOff size={22} />}
            </Button>
            
            <textarea 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={handleKeyDown}
              placeholder="Type your response or speak into the microphone..." 
              className="flex-1 bg-transparent text-zinc-100 min-h-[48px] max-h-[150px] py-3 px-2 resize-none focus:outline-none text-[15px] placeholder:text-zinc-500 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" 
              disabled={isLoading || isHrSpeaking || !hasStarted || !!proctorWarning} 
            />
            
            <Button 
              onClick={handleSubmitAnswer} 
              className="h-12 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shrink-0 transition-colors shadow-lg shadow-cyan-900/20" 
              disabled={isLoading || !inputValue.trim() || isHrSpeaking || !hasStarted || !!proctorWarning}
            >
              Send <Send className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}