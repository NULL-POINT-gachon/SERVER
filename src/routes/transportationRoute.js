const express = require('express');
const router = express.Router();
const controller = require('../controllers/transportationController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /transportations:
 *   get:
 *     summary: 이동수단 목록 조회
 *     responses:
 *       200:
 *         description: 등록된 모든 이동수단 목록을 반환합니다.
 */
router.get('/', authMiddleware.authenticateToken, controller.getTransportations);

module.exports = router;