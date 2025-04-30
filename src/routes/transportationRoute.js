const express = require('express');
const router = express.Router();
const controller = require('../controllers/transportationController');

/**
 * @swagger
 * /transportations:
 *   get:
 *     summary: 이동수단 목록 조회
 *     responses:
 *       200:
 *         description: 등록된 모든 이동수단 목록을 반환합니다.
 */
router.get('/', controller.getTransportations);

module.exports = router;