const AcademicSession = require("../../models/AcademicSession");
const { NotFoundError, BadRequestError } = require("../../errors");

class SessionService {
  async createAcademicSession(data) {
    const { session, startDate, endDate } = data;
    if (!session || !startDate || !endDate) {
      throw new BadRequestError("Provide session, startDate, endDate");
    }

    const exists = await AcademicSession.findOne({ session });
    if (exists) throw new BadRequestError("Academic session already exists");

    return await AcademicSession.create(data);
  }

  async getAllAcademicSessions() {
    return await AcademicSession.find().sort({ startDate: -1 });
  }

  async getCurrentAcademicSession() {
    const session = await AcademicSession.findOne({ isCurrent: true });
    if (!session) throw new NotFoundError("No current academic session");

    return session;
  }

  async updateAcademicSession(id, data) {
    const session = await AcademicSession.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!session) throw new NotFoundError("Academic session not found");
    return session;
  }

  async deleteAcademicSession(id) {
    const session = await AcademicSession.findById(id);
    if (!session) throw new NotFoundError("Academic session not found");

    if (session.isCurrent) {
      throw new BadRequestError("Cannot delete current academic session");
    }

    await session.deleteOne();
    return session;
  }
}

module.exports = new SessionService();
