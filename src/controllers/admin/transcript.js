const { StatusCodes } = require("http-status-codes");
const TranscriptService = require("../../services/admin/transcript");

const getTranscriptData = async (req, res) => {
  const data = await TranscriptService.getTranscriptData(req.params.studentId);

  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

const downloadTranscript = async (req, res) => {
  const doc = await TranscriptService.generateTranscriptPDF(
    req.params.studentId
  );

  // Set response headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=transcript_${req.params.studentId}.pdf`
  );

  // Pipe the PDF to response
  doc.pipe(res);
  doc.end();
};

module.exports = {
  getTranscriptData,
  downloadTranscript,
};
