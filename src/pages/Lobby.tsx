import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Brain, ArrowLeft, Upload, FileText, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  Role, ExperienceLevel, InterviewType, Difficulty, CompanyMode,
  InterviewConfig,
  ROLE_LABELS, EXPERIENCE_LABELS, INTERVIEW_TYPE_LABELS,
  DIFFICULTY_LABELS, COMPANY_MODE_LABELS,
} from "@/types/interview";
import { useToast } from "@/hooks/use-toast";

const Lobby = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<Role | "">("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [interviewType, setInterviewType] = useState<InterviewType | "">("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [companyMode, setCompanyMode] = useState<CompanyMode>("generic");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
      return;
    }
    setResumeFile(file);
  };

  const handleStart = async () => {
    if (!role || !experience || !interviewType || !difficulty) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const config: InterviewConfig = {
      role: role as Role,
      experienceLevel: experience as ExperienceLevel,
      interviewType: interviewType as InterviewType,
      difficulty: difficulty as Difficulty,
      companyMode,
    };

    // Store config in sessionStorage for the interview page
    sessionStorage.setItem("interviewConfig", JSON.stringify(config));
    if (resumeFile) {
      const text = await resumeFile.text();
      sessionStorage.setItem("resumeText", text);
    }

    navigate("/interview");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-5">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight font-[Space_Grotesk]">InterviewIQ</span>
        </div>
      </nav>

      <motion.div
        className="mx-auto max-w-2xl px-6 pb-16"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Set Up Your Interview</h1>
        <p className="mb-8 text-muted-foreground">Configure your practice session and start when ready.</p>

        <div className="space-y-6">
          {/* Role */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role & Experience</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select value={experience} onValueChange={(v) => setExperience(v as ExperienceLevel)}>
                  <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(EXPERIENCE_LABELS) as [ExperienceLevel, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interview Config */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Interview Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Interview Type *</Label>
                <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INTERVIEW_TYPE_LABELS) as [InterviewType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                  <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company Style</Label>
                <Select value={companyMode} onValueChange={(v) => setCompanyMode(v as CompanyMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(COMPANY_MODE_LABELS) as [CompanyMode, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resume (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {!resumeFile ? (
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/40 hover:bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium text-sm">Upload your resume (PDF)</p>
                    <p className="text-xs text-muted-foreground">AI will generate personalized questions based on your skills</p>
                  </div>
                  <Input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm font-medium truncate">{resumeFile.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => setResumeFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Start */}
          <Button
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
            onClick={handleStart}
            disabled={isLoading}
          >
            {isLoading ? "Preparing Interview..." : "Start Interview"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Lobby;
