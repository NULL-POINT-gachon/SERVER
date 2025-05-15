const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/adminSummaryController");
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

/**
 * @route   GET /admin/summary
 * @desc    관리자 대시보드 요약 · 최근목록
 * @access  admin
 */
router.get(
  "/summary",
  authenticateToken,
  requireAdmin,
  ctrl.getSummary
);

module.exports = router;