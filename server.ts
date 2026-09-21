import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini SDK
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

// Structured prompt builder for teacher remarks
function buildRemarkPrompt(params: {
  studentName: string;
  gender: string;
  classLevel: string;
  classArm: string;
  termName: string;
  sessionYear: string;
  totalScore: number;
  grade: string;
  rankInClass?: number;
  totalInClass?: number;
  attendanceRate: number;
  disciplinaryRecords?: string[];
  tone?: string;
  subjectHighlights?: string;
}): string {
  const {
    studentName,
    gender,
    classLevel,
    classArm,
    termName,
    sessionYear,
    totalScore,
    grade,
    rankInClass,
    totalInClass = 35,
    attendanceRate,
    disciplinaryRecords = [],
    tone = "balanced",
    subjectHighlights = "",
  } = params;

  return `You are an expert Nigerian secondary school principal and veteran form teacher at Apex Horizon Academy.
Write a personalized, concise, professional, and pedagogically sound terminal report card remark for a student.

Student Bio & Performance:
- Full Name: ${studentName}
- Gender: ${gender === "M" ? "Male" : "Female"}
- Class & Arm: ${classLevel} - ${classArm}
- Term / Session: ${termName}, ${sessionYear}
- Overall Score: ${totalScore}% (Nigerian Secondary Scale: ${grade})
- Class Position: ${rankInClass ? `${rankInClass} out of ${totalInClass}` : "N/A"}
- Attendance Record: ${attendanceRate}% attendance across the term
- Conduct & Disciplinary Context: ${disciplinaryRecords.length > 0 ? disciplinaryRecords.join("; ") : "Exemplary conduct with zero infractions recorded"}
${subjectHighlights ? `- Notable Subjects: ${subjectHighlights}` : ""}
- Desired Tone: ${tone} (e.g. encouraging, balanced, rigorous, growth-oriented)

Guidelines:
1. Write in the professional voice of a caring yet rigorous Nigerian secondary school teacher (using respectful British/Nigerian English standard conventions).
2. Keep it between 2 and 4 sentences (approx 45 - 70 words).
3. Do NOT invent fake disciplinary infractions if none exist.
4. Constructively reference academic performance, attendance dedication, and an encouraging recommendation for next session.
5. Return ONLY the drafted remark text with no markdown prefixes, quotes, or conversational filler.`;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      hasGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    });
  });

  // AI-Drafted Teacher Remark Endpoint
  app.post("/api/ai/draft-remarks", async (req, res) => {
    try {
      const {
        studentName = "Student",
        gender = "M",
        classLevel = "JSS 1",
        classArm = "Diamond",
        termName = "Third Term",
        sessionYear = "2024/2025",
        totalScore = 75,
        grade = "A1",
        rankInClass = 1,
        totalInClass = 35,
        attendanceRate = 98,
        disciplinaryRecords = [],
        tone = "balanced",
        subjectHighlights = "",
      } = req.body;

      const client = getGeminiClient();

      if (!client) {
        // High quality offline / local pedagogical engine fallback
        const pronoun = gender === "M" ? "He" : "She";
        const posPronoun = gender === "M" ? "His" : "Her";
        const objPronoun = gender === "M" ? "him" : "her";

        let localRemark = "";
        if (totalScore >= 75) {
          localRemark = `${studentName} has demonstrated remarkable scholastic distinction this term, attaining an enviable ${grade} grade (${totalScore}%). ${posPronoun} attendance of ${attendanceRate}% reflects steadfast diligence in all academic assignments. With sustained concentration, ${pronoun.toLowerCase()} will continue to lead ${posPronoun.toLowerCase()} cohort.`;
        } else if (totalScore >= 60) {
          localRemark = `${studentName} is a focused and respectful student who attained a commendable ${grade} (${totalScore}%). ${posPronoun} punctual attendance of ${attendanceRate}% is appreciated. Consistent revision in weaker subject areas will easily propel ${objPronoun} into top honours next term.`;
        } else if (totalScore >= 50) {
          localRemark = `${studentName} achieved a passing aggregate of ${totalScore}%. While ${posPronoun.toLowerCase()} classroom deportment is cooperative, closer attention to continuous assessments and scheduled prep work will significantly boost ${posPronoun.toLowerCase()} scores.`;
        } else {
          localRemark = `${studentName} scored ${totalScore}% this session, which falls short of ${posPronoun.toLowerCase()} true capability. Greater punctuality (currently ${attendanceRate}%) and targeted remedial study are strongly recommended for the upcoming term.`;
        }

        if (disciplinaryRecords.length > 0) {
          localRemark += ` Notice: ${studentName} responded with maturity to guidance regarding school regulations and shows steady personal growth.`;
        }

        return res.json({
          remark: localRemark,
          source: "local_pedagogical_engine",
          isDraft: true,
          notice: "Drafted using Apex Horizon pedagogical standard rules. Configure GEMINI_API_KEY in settings for live generative AI models.",
        });
      }

      // Call Gemini 3.8 Flash model
      const prompt = buildRemarkPrompt({
        studentName,
        gender,
        classLevel,
        classArm,
        termName,
        sessionYear,
        totalScore,
        grade,
        rankInClass,
        totalInClass,
        attendanceRate,
        disciplinaryRecords,
        tone,
        subjectHighlights,
      });

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      const remark = response.text?.trim() || "";

      return res.json({
        remark,
        source: "gemini_api",
        isDraft: true,
      });
    } catch (error: any) {
      console.error("Error generating remark via Gemini API:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate AI remark",
        fallbackAvailable: true,
      });
    }
  });

  // Batch AI remarks endpoint for whole class
  app.post("/api/ai/batch-draft-remarks", async (req, res) => {
    try {
      const { students = [], tone = "balanced" } = req.body;
      const client = getGeminiClient();

      const results = [];
      for (const item of students.slice(0, 40)) {
        let remark = "";
        if (client) {
          try {
            const prompt = buildRemarkPrompt({
              studentName: item.studentName,
              gender: item.gender,
              classLevel: item.classLevel,
              classArm: item.classArm,
              termName: item.termName || "Third Term",
              sessionYear: item.sessionYear || "2024/2025",
              totalScore: item.totalScore || 70,
              grade: item.grade || "B2",
              rankInClass: item.rankInClass,
              totalInClass: item.totalInClass || 35,
              attendanceRate: item.attendanceRate || 95,
              disciplinaryRecords: item.disciplinaryRecords || [],
              tone,
            });
            const resp = await client.models.generateContent({
              model: "gemini-3.8-flash",
              contents: prompt,
            });
            remark = resp.text?.trim() || "";
          } catch (e) {
            console.warn(`Gemini call failed for student ${item.studentId}, using fallback.`);
          }
        }

        if (!remark) {
          const pronoun = item.gender === "M" ? "He" : "She";
          const posPronoun = item.gender === "M" ? "His" : "Her";
          remark = `${item.studentName} performed commendably with ${item.totalScore}% (${item.grade || "B"}). ${posPronoun} consistent dedication is noted. Recommended to sustain disciplined study habits.`;
        }

        results.push({
          studentId: item.studentId,
          studentName: item.studentName,
          remark,
          isDraft: true,
        });
      }

      return res.json({
        success: true,
        count: results.length,
        remarks: results,
      });
    } catch (error: any) {
      console.error("Error in batch remark drafting:", error);
      return res.status(500).json({ error: error.message || "Batch drafting failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise SMS server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
