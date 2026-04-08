const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

async function generateInterviewReportController(req, res) {

    if (!req.file) {
    return res.status(400).json({
        message: "No file uploaded"
    });
}

console.log("file:", req.file);
    

   const resumeContent = await pdfParse(req.file.buffer);
   console.log("PDF TEXT:", resumeContent.text);
    const { selfdescription, jobdescription } = req.body

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfdescription,
        jobdescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume:resumeContent.text,
        selfdescription,
        jobdescription,
        ...interviewReportByAi
    })

    res.status(201).json({
        message: "Tnterview report generated successfully",
        interviewReport
    })
}


module.exports = { generateInterviewReportController }