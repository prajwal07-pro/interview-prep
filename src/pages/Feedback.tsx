import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MessageSquareWarning } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function Feedback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transcriptRaw = sessionStorage.getItem("interviewTranscript");
    const warningsRaw = sessionStorage.getItem("interviewWarnings");
    if (!transcriptRaw) { navigate("/"); return; }
    generateRealEvaluation(JSON.parse(transcriptRaw), JSON.parse(warningsRaw || "[]"));
  }, [navigate]);

  const generateRealEvaluation = async (transcript: any[], warnings: string[]) => {
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY; 
      const transcriptText = transcript.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
      
      const evaluationPrompt = `
        Evaluate this interview transcript carefully.
        Transcript: ${transcriptText}
        Proctoring Warnings: ${warnings.length > 0 ? warnings.join(", ") : "None."}

        You MUST respond ONLY with a valid JSON object exactly like this:
        {
          "Overall_Score": 85,
          "Breakdown": { "Technical": 8, "Communication": 9, "Confidence": 8, "Problem_Solving": 8 },
          "Strengths": "Summary of strengths.",
          "Areas_To_Improve": "Summary of weaknesses.",
          "Behavioral_Observations": "Proctoring analysis.",
          "Filler_Words": {
             "count": 5,
             "words_used": ["um", "like", "you know"]
          }
        }
        Hunt specifically for filler words in the user's answers and count them.
      `;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: evaluationPrompt }], temperature: 0.2, response_format: { type: "json_object" } })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Groq API rejected request.");
      setReport(JSON.parse(data.choices[0].message.content));

    } catch (error: any) {
      toast({ title: "Evaluation Error", description: error.message, variant: "destructive" });
      setReport({ Overall_Score: 0, Breakdown: { Technical: 0, Communication: 0, Confidence: 0, Problem_Solving: 0 }, Strengths: "Failed to load real AI evaluation.", Areas_To_Improve: error.message, Behavioral_Observations: "Error parsing API format.", Filler_Words: { count: 0, words_used: [] }});
    } finally {
      setLoading(false);
    }
  };

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span className="text-sm font-bold text-cyan-400">{score}/10</span>
      </div>
      <div className="[&>div]:bg-cyan-500">
         <Progress value={score * 10} className="h-2 bg-zinc-800" />
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100 gap-4">
      <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      <h2 className="text-xl font-semibold">Groq AI is analyzing your performance...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 text-zinc-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Setup
            </Button>
            <h1 className="text-3xl font-bold">Interview Performance Report</h1>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {report?.Overall_Score}<span className="text-2xl text-zinc-500">/100</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-zinc-900 border-zinc-800 col-span-1 shadow-xl">
            <h3 className="text-xl font-semibold mb-6 border-b border-zinc-800 pb-2">Score Breakdown</h3>
            <ScoreBar label="Technical Accuracy" score={report?.Breakdown?.Technical || 0} />
            <ScoreBar label="Communication Skills" score={report?.Breakdown?.Communication || 0} />
            <ScoreBar label="Confidence Metric" score={report?.Breakdown?.Confidence || 0} />
            <ScoreBar label="Problem Solving" score={report?.Breakdown?.Problem_Solving || 0} />
            
            {/* NEW FILLER WORD TRACKER UI */}
            <div className="mt-8 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
               <div className="flex items-center gap-2 mb-2 text-red-400">
                  <MessageSquareWarning className="w-5 h-5" />
                  <h4 className="font-semibold">Filler Word Tracker</h4>
               </div>
               <p className="text-3xl font-black text-white">{report?.Filler_Words?.count || 0}</p>
               <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">Unprofessional Words Used</p>
               <p className="text-sm text-red-300 mt-2 font-mono">
                 {report?.Filler_Words?.words_used?.length > 0 ? report.Filler_Words.words_used.join(", ") : "Perfect articulation!"}
               </p>
            </div>
          </Card>

          <div className="col-span-2 space-y-6">
            <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-xl">
              <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Strengths</h3>
              <p className="text-zinc-300 text-sm">{report?.Strengths}</p>
            </Card>

            <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-xl">
              <h3 className="text-lg font-semibold text-red-400 mb-2">📈 Areas to Improve</h3>
              <p className="text-zinc-300 text-sm">{report?.Areas_To_Improve}</p>
            </Card>

            <Card className="p-6 bg-zinc-900 border-zinc-800 shadow-xl">
              <h3 className="text-lg font-semibold text-purple-400 mb-2">👁️ Behavioral & Proctoring</h3>
              <p className="text-zinc-300 text-sm">{report?.Behavioral_Observations}</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}