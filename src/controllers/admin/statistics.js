const { StatusCodes } = require("http-status-codes");
const { StatsService } = require("../../services/admin");

const getDashboardStats = async (req, res) => {
  const stats = await StatsService.getDashboardStats();
  res.status(StatusCodes.OK).json({
    success: true,
    stats,
  });
};

module.exports = {
  getDashboardStats,
};
