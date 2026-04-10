const { GoogleGenerativeAI } = require("@google/generative-ai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema")

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
    })).describe("The preparation plan is a structured schedule that outlines the daily focus and tasks for the candidate to prepare for the interview effectively"),
    title: z.string().describe("The title of the job which the interview report is generated")
})

async function generateInterviewReport({ resume, selfdescription, jobdescription }) {
    try {
        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt =  `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfdescription}
                        Job Description: ${jobdescription}`;

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

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash"
});

const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }