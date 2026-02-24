

# AI Interview Intelligence System — Implementation Plan

## Overview
A polished AI-powered mock interview platform where users select a role, upload their resume, and go through a realistic interview with AI-generated questions, adaptive difficulty, and detailed structured feedback. No login required — just land and start practicing.

---

## Phase 1: Landing & Interview Setup

### Landing Page
- Clean, modern hero section explaining the product
- "Start Interview" CTA button
- Key feature highlights (AI-powered, resume-aware, multi-mode)

### Interview Lobby
- **Role selector**: Frontend Dev, Backend Dev, ML Engineer, Data Scientist, DevOps, Core Electronics, Product Manager, etc.
- **Experience level**: Fresher, 1-3 years, 3-5 years, 5+ years
- **Interview type**: HR, Technical, Mixed, Coding
- **Difficulty**: Easy, Medium, Hard
- **Company simulation mode**: Google-style (DSA heavy), Amazon-style (Leadership Principles), TCS-style (HR heavy), Generic
- **Resume upload** (PDF) — parsed by AI to extract skills and projects for tailored questions
- Input validation on all fields before proceeding

---

## Phase 2: Live Interview Experience

### Interview Screen
- **Question panel** displaying the current AI-generated question with question number and total
- **Text response area** for typing answers
- **Voice recording** via browser microphone with visual waveform indicator
- **Video preview** via webcam using browser MediaRecorder API (for self-review, stored locally)
- **Timer** showing elapsed time per question and overall session time
- **Progress bar** showing how many questions completed
- **Submit & Next button**

### Coding Round (when interview type = Coding)
- **Monaco code editor** with syntax highlighting and language selection (JavaScript, Python, Java, C++)
- **Problem statement panel** with examples and constraints
- **AI-based code review** on submission (evaluates correctness, approach, complexity analysis)
- **Test case display** showing expected vs. described output

### Adaptive Flow
- After each answer, AI evaluates quality and adjusts the next question's difficulty
- If scoring low → easier follow-up to build confidence
- If scoring high → deeper, more challenging follow-up
- Company-mode logic shapes question style (e.g., Google → algorithmic, Amazon → behavioral STAR format)

---

## Phase 3: Resume Integration

- Upload PDF resume on the lobby screen
- AI extracts: skills, technologies, project descriptions, experience level
- Generates **resume-specific questions** (e.g., "You mentioned building a recommendation engine — walk me through the architecture")
- Flags potential inconsistencies between resume claims and answer quality
- Resume insights shown in the feedback summary

---

## Phase 4: AI Evaluation & Feedback

### Scoring (per question and overall)
- **Technical Accuracy** (0-10): Correctness, depth, concept clarity
- **Communication** (0-10): Clarity, structure, conciseness of written response
- **Confidence** (0-10): Decisiveness, specificity, lack of hedging language
- **Problem Solving** (0-10): Approach, methodology, creativity

### Overall Score Formula
`(Technical × 0.4) + (Communication × 0.2) + (Confidence × 0.2) + (Problem Solving × 0.2)` normalized to 100

### Feedback Summary Screen
- Score breakdown with visual indicators (progress bars/gauges)
- **Strengths**: What the user did well, with specific examples from their answers
- **Areas to Improve**: Concrete, actionable suggestions
- **Ideal Answer**: What a strong answer would look like for each question
- **Behavioral Observations**: Patterns noticed across the session (e.g., "tends to skip edge cases", "strong on theory, light on examples")
- Option to download feedback as PDF

---

## Phase 5: Analytics Dashboard

- **Session history** list (stored in browser localStorage since no auth)
- **Performance trend chart** showing scores across sessions (using Recharts)
- **Weak topics heatmap** highlighting areas that consistently score low
- **Interview readiness index** — a composite metric showing overall preparedness
- **Score breakdown comparisons** across different interview types

---

## Technical Architecture

### Frontend (React + TypeScript)
- Pages: Landing, Lobby, Interview, Feedback, Analytics
- Monaco Editor for coding rounds
- Browser MediaRecorder for voice/video capture
- Recharts for analytics visualizations
- All state managed locally (localStorage for history, React state for session)

### Backend (Supabase Edge Functions + Lovable AI)
- **Question generation edge function**: Takes role, level, company mode, resume data → returns AI-generated questions
- **Answer evaluation edge function**: Takes question + answer → returns structured scores and feedback
- **Resume parsing edge function**: Takes resume text → extracts skills, projects, generates tailored questions
- **Adaptive logic edge function**: Takes session context + scores → determines next question difficulty

### Data Storage
- localStorage for session history and analytics (no-auth mode)
- Supabase Storage for uploaded resumes (temporary, auto-deleted)

---

## Design Direction
- Clean, professional UI with a dark/light mode option
- Calming color palette (blues/greens) to reduce interview anxiety
- Smooth transitions between interview stages
- Mobile-responsive for practice on the go

