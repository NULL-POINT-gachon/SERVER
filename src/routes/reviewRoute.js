const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/auth');
/**
 * @swagger
 * /review:
 *   post:
 *     summary: 리뷰 작성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
 */
/**
 * @swagger
 * /review/place/{destinationId}:
 *   get:
 *     summary: 특정 여행지에 대한 리뷰 목록 조회
 *     parameters:
 *       - in: path
 *         name: destinationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 여행지 ID
 *     responses:
 *       200:
 *         description: 해당 여행지에 작성된 리뷰 목록 반환
 */
/**
 * @swagger
 * /review/all:
 *   get:
 *     summary: 모든 리뷰 목록 조회
 *     responses:
 *       200:
 *         description: 등록된 모든 리뷰를 반환합니다.
 */
router.post('/', authMiddleware.authenticateToken, controller.createReview);
router.get('/place/:destinationId', authMiddleware.authenticateToken, controller.getReviewsByPlace);
router.get('/all', authMiddleware.authenticateToken, controller.getAllReviews);

module.exports = router;