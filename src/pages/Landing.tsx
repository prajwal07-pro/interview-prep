import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Brain, FileText, BarChart3, Zap, Target, Sparkles } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description: "Adaptive questions tailored to your role, experience, and company style.",
  },
  {
    icon: FileText,
    title: "Resume-Aware",
    description: "Upload your resume and get personalized questions based on your skills and projects.",
  },
  {
    icon: Target,
    title: "Multi-Mode Interviews",
    description: "Practice HR, Technical, Mixed, or Coding rounds with company-specific simulations.",
  },
  {
    icon: BarChart3,
    title: "Detailed Scoring",
    description: "Get scored on Technical Accuracy, Communication, Confidence, and Problem Solving.",
  },
  {
    icon: Zap,
    title: "Adaptive Difficulty",
    description: "Questions adjust in real-time based on your performance for optimal practice.",
  },
  {
    icon: Sparkles,
    title: "Structured Feedback",
    description: "Actionable strengths, improvement areas, and ideal answers for every question.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(199_89%_48%_/_0.07),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(168_55%_42%_/_0.05),transparent_50%)]" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight font-[Space_Grotesk]">InterviewIQ</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
            Analytics
          </Button>
        </nav>

        <motion.section
          className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-20 text-center"
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} custom={0} className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Mock Interviews
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1} className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Ace Your Next Interview{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              with Confidence
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
            Practice with AI-generated questions that adapt to your skill level. Get instant, structured feedback to improve faster.
          </motion.p>

          <motion.div variants={fadeUp} custom={3}>
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30"
              onClick={() => navigate("/lobby")}
            >
              Start Interview
              <Zap className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.section>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight">Everything You Need to Prepare</h2>
          <p className="text-muted-foreground">A complete interview preparation platform powered by AI.</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold tracking-tight">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>InterviewIQ — Practice smarter, interview better.</p>
      </footer>
    </div>
  );
};

export default Landing;
