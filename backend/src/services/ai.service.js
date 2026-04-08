const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");

const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);
console.log("API KEY:", process.env.GOOGLE_GENAI_API_KEY);

// ✅ Zod schema (validation ke liye use hoga)
const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 that indicates how well the candidate's resume and self-describe match the job describe. A higher score means a better match."),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to ansswer this question, what points to cover, what approach to take, etc.")
    })).describe("Technical questions are asked to assess the candidate's technical knowledge"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to ansswer this question, what points to cover, what approach to take, etc.")
    })).describe("Behavioral questions are asked to understand the candidate's soft skills, cultural fit, and how they handle various situations in the workplace."),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill that the candidate is lacking or needs improvement in"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of the skill gap, indicating how critical it is for the candidate to address this gap"),
    })).describe("Skill gaps are areas where the candidate lacks the necessary skills or knowledge for the role"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus or topic for that day in the preparation plan, such as a specific technical skill, a type of interview question, or a soft skill to work on"),
        tasks: z.array(z.string()).describe("The specific tasks or activities the candidate should do on that day to prepare, such as practicing coding problems, reviewing certain concepts, or doing mock interviews")
    })).describe("The preparation plan is a structured schedule that outlines the daily focus and tasks for the candidate to prepare for the interview effectively")
})

async function generateInterviewReport({ resume, selfdescription, jobdescription }) {
    try {
        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
Generate a detailed interview report in STRICT JSON format.

IMPORTANT RULES:
- Only return valid JSON
- No explanation text
- No extra words
- Follow structure exactly

{
  "matchScore": number,
  "technicalQuestions": [
    {
      "question": string,
      "intention": string,
      "answer": string
    }
  ],
  "behavioralQuestions": [
    {
      "question": string,
      "intention": string,
      "answer": string
    }
  ],
  "skillGaps": [
    {
      "skill": string,
      "severity": "low" | "medium" | "high"
    }
  ],
  "preparationPlan": [
    {
      "day": number,
      "focus": string,
      "tasks": string[]
    }
  ]
}

Candidate Data:
Resume: ${resume}
Self-description: ${selfdescription}
Job-description: ${jobdescription}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();



        // ✅ Safe JSON parse
        let parsed;
        try {
            const cleanText = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("No JSON found");
            }

            parsed = JSON.parse(jsonMatch[0]);

        } catch (err) {
            console.error("RAW AI RESPONSE:", text);
            throw new Error("Invalid JSON response from AI");
        }

        // ✅ Zod validation
        const validated = interviewReportSchema.parse(parsed);

        return validated;

    } catch (error) {
        console.error("AI Error:", error);
        throw error;
    }
}

module.exports = generateInterviewReport;