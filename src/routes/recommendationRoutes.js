// src/routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /trip/recommendation/city:
 *   post:
 *     summary: 감정 기반 여행지 추천
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - 여행_시작_시간
 *               - 여행_종료_시간
 *               - 여행동반자수
 *               - 감정_ids
 *             properties:
 *               여행_시작_시간:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-06"
 *               여행_종료_시간:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-15"
 *               여행동반자수:
 *                 type: integer
 *                 example: 2
 *               감정_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 4]
 *     responses:
 *       200:
 *         description: 추천 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           city_id:
 *                             type: string
 *                           item_name:
 *                             type: string
 *                           related_activities:
 *                             type: array
 *                             items:
 *                               type: string
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/recommendation/city', authMiddleware.authenticateToken, recommendationController.getRecommendations);

module.exports = router;