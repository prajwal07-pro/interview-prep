import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Brain, Upload, FileText, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  Role, ExperienceLevel, InterviewType, Difficulty, CompanyMode,
  InterviewConfig, ROLE_LABELS, EXPERIENCE_LABELS, INTERVIEW_TYPE_LABELS, COMPANY_MODE_LABELS,
} from "@/types/interview";
import { useToast } from "@/hooks/use-toast";

// Setup PDF worker to run in browser securely
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Lobby() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<Role | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");
  const [companyMode, setCompanyMode] = useState<CompanyMode | "">(""); 
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    setResumeFile(file);
  };

  const handleStart = async () => {
    if (!role || !experience || !interviewType || !companyMode) {
      toast({ title: "Missing fields", description: "Please fill in all required dropdowns.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const config: InterviewConfig = {
      role: role as Role,
      experienceLevel: experience as ExperienceLevel,
      interviewType: interviewType as InterviewType,
      difficulty: "medium" as Difficulty, 
      companyMode: companyMode as CompanyMode,
    };

    sessionStorage.setItem("interviewConfig", JSON.stringify(config));

    // PDF TEXT EXTRACTION
    if (resumeFile) {
      try {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
           const page = await pdf.getPage(i);
           const content = await page.getTextContent();
           fullText += content.items.map((item: any) => item.str).join(" ") + " ";
        }
        sessionStorage.setItem("resumeText", fullText);
      } catch (err) {
        console.error("PDF Parsing Error:", err);
        toast({ title: "PDF Error", description: "Could not read resume. Proceeding without it." });
      }
    } else {
      sessionStorage.removeItem("resumeText");
    }

    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <nav className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl">InterviewPro</span>
        </div>
      </nav>

      <motion.div className="mx-auto max-w-2xl px-6 pb-16" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Customize your AI mock interview</h1>
        <p className="mb-8 text-zinc-400">Configure your session. Uploading a resume allows AI to ask personalized questions.</p>

        <div className="space-y-6">
          {/* Form Cards (Role, Experience, Type, Company) */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-base">Role & Experience</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{(Object.entries(ROLE_LABELS) as [Role, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>{(Object.entries(EXPERIENCE_LABELS) as [ExperienceLevel, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-base">Interview Configuration</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Interview Type *</Label>
                <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{(Object.entries(INTERVIEW_TYPE_LABELS) as [InterviewType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company Simulation *</Label>
                <Select value={companyMode} onValueChange={(v) => setCompanyMode(v as CompanyMode)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue placeholder="Select company style" /></SelectTrigger>
                  <SelectContent>{(Object.entries(COMPANY_MODE_LABELS) as [CompanyMode, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3"><CardTitle className="text-base">Resume Profile (Optional)</CardTitle></CardHeader>
            <CardContent>
              {!resumeFile ? (
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-zinc-700 p-8 transition-colors hover:border-cyan-500 hover:bg-zinc-950">
                  <Upload className="h-8 w-8 text-zinc-500" />
                  <div className="text-center"><p className="font-medium text-sm text-zinc-300">Upload your resume (PDF)</p></div>
                  <Input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
                  <FileText className="h-5 w-5 text-cyan-500" />
                  <span className="flex-1 text-sm font-medium truncate">{resumeFile.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setResumeFile(null)}><X className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Button className="w-full h-12 text-base font-semibold bg-cyan-600 hover:bg-cyan-700" onClick={handleStart} disabled={isLoading}>
            {isLoading ? "Reading Data & Preparing..." : "Initialize Interview Session"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}