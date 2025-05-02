// src/routes/placeRoutes.js
const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /trip/recommendation/preferences:
 *   post:
 *     summary: 여행 취향 기반 상세 여행지 추천
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
 *               - city
 *               - activity_type
 *               - activity_ids
 *               - emotion_ids
 *               - preffer_transport
 *               - companion
 *             properties:
 *               city:
 *                 type: string
 *                 example: "서울"
 *               activity_type:
 *                 type: string
 *                 example: "실내"
 *               activity_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 3, 5]
 *               emotion_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2]
 *               preffer_transport:
 *                 type: string
 *                 example: "대중교통"
 *               companion:
 *                 type: integer
 *                 example: 2
 *               activity_level:
 *                 type: integer
 *                 example: 10
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
 *                     places:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           여행지명:
 *                             type: string
 *                           여행지설명:
 *                             type: string
 *                           분류:
 *                             type: string
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
router.post('/recommendation/preferences', authMiddleware.authenticateToken, placeController.getPlaceRecommendations);

module.exports = router;