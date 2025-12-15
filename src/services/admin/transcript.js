const PDFDocument = require("pdfkit");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Result = require("../../models/Result");
const Department = require("../../models/Department");
const { NotFoundError } = require("../../errors");

class TranscriptService {
  async getTranscriptData(studentId) {
    // Get student with department
    const student = await User.findOne({ _id: studentId, role: "student" })
      .select("-password")
      .populate("department", "name code faculty");

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    // Get all results grouped by session and level
    const results = await Result.find({ student: studentId })
      .populate({
        path: "course",
        select: "title code creditUnit level semester session",
      })
      .sort({ session: 1, level: 1, semester: 1 });

    // Group results by session and level
    const groupedResults = results.reduce((acc, result) => {
      const key = `${result.session}-${result.course.level}`;
      if (!acc[key]) {
        acc[key] = {
          session: result.session,
          level: result.course.level,
          semesters: { First: [], Second: [] },
        };
      }
      acc[key].semesters[result.semester].push({
        moduleCode: result.course.code,
        moduleTitle: result.course.title,
        creditUnit: result.course.creditUnit,
        level: result.course.level,
        mark: result.total,
        grade: result.grade,
        creditRating: result.course.creditUnit,
      });
      return acc;
    }, {});

    // Calculate CGPA
    const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };
    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach((result) => {
      const points = gradePoints[result.grade] || 0;
      const credits = result.course.creditUnit || 0;
      totalPoints += points * credits;
      totalCredits += credits;
    });

    const cgpa =
      totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

    // Determine honours classification
    let honours = "Pass";
    const cgpaNum = parseFloat(cgpa);
    if (cgpaNum >= 4.5) honours = "First Class Honours";
    else if (cgpaNum >= 3.5) honours = "Second Class Honours (Upper Division)";
    else if (cgpaNum >= 2.5) honours = "Second Class Honours (Lower Division)";
    else if (cgpaNum >= 1.5) honours = "Third Class Honours";

    return {
      student,
      groupedResults: Object.values(groupedResults),
      cgpa,
      honours,
      totalCredits,
    };
  }

  async generateTranscriptPDF(studentId) {
    const data = await this.getTranscriptData(studentId);
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Helper function to add centered text
    const centerText = (text, y, fontSize = 12, bold = false) => {
      doc.fontSize(fontSize);
      if (bold) doc.font("Helvetica-Bold");
      else doc.font("Helvetica");
      const width = doc.widthOfString(text);
      const x = (doc.page.width - width) / 2;
      doc.text(text, x, y);
    };

    // Header - University Logo and Name
    // Note: You'll need to add university logo
    // doc.image('path/to/university-logo.png', 50, 50, { width: 80 });

    centerText("LAGOS STATE UNIVERSITY", 60, 18, true);
    centerText("OJO, LAGOS", 80, 12);

    // Student Information Box
    doc.moveDown(2);
    const startY = doc.y;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Name", 50, startY);
    doc.text("Date of Birth", 250, startY);
    doc.text("School", 400, startY);

    doc.font("Helvetica");
    doc.text(data.student.name, 50, startY + 15);
    doc.text(
      data.student.dateOfBirth
        ? new Date(data.student.dateOfBirth).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "N/A",
      250,
      startY + 15
    );
    doc.text(data.student.school || "N/A", 400, startY + 15);

    doc.font("Helvetica-Bold");
    doc.text("Student ID Number", 50, startY + 40);
    doc.text("HESA Number", 250, startY + 40);

    doc.font("Helvetica");
    doc.text(data.student.matricNo || "N/A", 50, startY + 55);
    doc.text(data.student.jambNo || "N/A", 250, startY + 55);

    doc.font("Helvetica-Bold");
    doc.text("Programme of Study", 50, startY + 80);
    doc.text("FHEQ Level", 400, startY + 80);

    doc.font("Helvetica");
    doc.text(data.student.program || "N/A", 50, startY + 95);
    doc.text(data.honours, 400, startY + 95);

    doc.font("Helvetica-Bold");
    doc.text("Awarding Institution", 50, startY + 120);
    doc.text("Teaching Institution", 250, startY + 120);

    doc.font("Helvetica");
    doc.text("Lagos State University", 50, startY + 135);
    doc.text("Lagos State University", 250, startY + 135);

    // Results by Level
    let currentY = startY + 170;

    data.groupedResults.forEach((levelData) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      // Level Header
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(
        `Year ${levelData.level / 100}: ${levelData.session} Academic Year`,
        50,
        currentY
      );
      currentY += 20;

      // Table Headers
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Module", 50, currentY);
      doc.text("Module Title", 110, currentY);
      doc.text("Level", 280, currentY);
      doc.text("Credit", 320, currentY);
      doc.text("Mark", 370, currentY);
      doc.text("Credit", 420, currentY);
      doc.text("Info", 470, currentY);

      currentY += 3;
      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 15;

      // First Semester
      if (levelData.semesters.First.length > 0) {
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text(`Semester 1`, 50, currentY);
        currentY += 15;

        let semesterCredits = 0;
        let semesterTotal = 0;

        levelData.semesters.First.forEach((result) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          doc.fontSize(8).font("Helvetica");
          doc.text(result.moduleCode, 50, currentY);
          doc.text(result.moduleTitle.substring(0, 30), 110, currentY);
          doc.text(result.level.toString(), 290, currentY);
          doc.text(result.creditUnit.toString(), 330, currentY);
          doc.text(result.mark.toString(), 375, currentY);
          doc.text(result.creditRating.toString(), 430, currentY);

          semesterCredits += result.creditUnit;
          semesterTotal += result.mark;
          currentY += 15;
        });

        // Semester totals
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Level:", 280, currentY);
        doc.text(semesterCredits.toString(), 330, currentY);
        doc.text(semesterTotal.toFixed(2), 370, currentY);
        doc.text(semesterCredits.toString(), 430, currentY);
        currentY += 20;
      }

      // Second Semester
      if (levelData.semesters.Second.length > 0) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.fontSize(9).font("Helvetica-Bold");
        doc.text(`Semester 2`, 50, currentY);
        currentY += 15;

        let semesterCredits = 0;
        let semesterTotal = 0;

        levelData.semesters.Second.forEach((result) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          doc.fontSize(8).font("Helvetica");
          doc.text(result.moduleCode, 50, currentY);
          doc.text(result.moduleTitle.substring(0, 30), 110, currentY);
          doc.text(result.level.toString(), 290, currentY);
          doc.text(result.creditUnit.toString(), 330, currentY);
          doc.text(result.mark.toString(), 375, currentY);
          doc.text(result.creditRating.toString(), 430, currentY);

          semesterCredits += result.creditUnit;
          semesterTotal += result.mark;
          currentY += 15;
        });

        // Semester totals
        doc.fontSize(9).font("Helvetica-Bold");
        doc.text("Level:", 280, currentY);
        doc.text(semesterCredits.toString(), 330, currentY);
        doc.text(semesterTotal.toFixed(2), 370, currentY);
        doc.text(semesterCredits.toString(), 430, currentY);
        currentY += 30;
      }
    });

    // Qualification Awarded Section
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Qualification Awarded", 50, currentY);
    currentY += 20;

    doc.fontSize(10).font("Helvetica");
    doc.text(data.student.program || "N/A", 50, currentY);
    currentY += 30;

    // CGPA Display
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Final CGPA", 50, currentY);
    doc.fontSize(14).font("Helvetica-Bold");
    doc.text(data.cgpa, 150, currentY);
    currentY += 30;

    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Credits: ${data.totalCredits}`, 50, currentY);
    currentY += 20;
    doc.text(`Honours: ${data.honours}`, 50, currentY);
    currentY += 40;

    // Footer - Signatures
    doc.fontSize(9).font("Helvetica");
    doc.text("Registrar", 50, currentY);
    doc.text("Contact Number", 200, currentY);
    doc.text("Date of Award", 350, currentY);

    currentY += 15;
    doc.text("__________________", 50, currentY);
    doc.text("__________________", 200, currentY);
    doc.text(new Date().toLocaleDateString("en-GB"), 350, currentY);

    return doc;
  }
}

module.exports = new TranscriptService();
