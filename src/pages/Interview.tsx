import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InterviewConfig } from "@/types/interview";

const Interview = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<InterviewConfig | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("interviewConfig");
    if (!raw) {
      navigate("/lobby");
      return;
    }
    setConfig(JSON.parse(raw));
  }, [navigate]);

  if (!config) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Interview screen — coming next phase.</p>
    </div>
  );
};

export default Interview;
