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
/**
 * @swagger
 * /review/user/{userId}:
 *   get:
 *     summary: 특정 사용자의 리뷰 목록 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 리뷰 목록 반환
 */
/**
 * @swagger
 * /review/{reviewId}:
 *   put:
 *     summary: 리뷰 수정
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수정할 리뷰 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 리뷰가 수정되었습니다.
 */
/**
 * @swagger
 * /review/{reviewId}:
 *   delete:
 *     summary: 리뷰 삭제
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 삭제할 리뷰 ID
 *     responses:
 *       200:
 *         description: 리뷰가 삭제되었습니다.
 */
router.post('/', authMiddleware.authenticateToken, controller.createReview);
router.get('/place/:destinationId', authMiddleware.authenticateToken, controller.getReviewsByPlace);
router.get('/all', authMiddleware.authenticateToken, controller.getAllReviews);
router.get('/user/:userId', authMiddleware.authenticateToken, controller.getReviewsByUser);
router.put('/:reviewId', authMiddleware.authenticateToken, controller.updateReview);
router.delete('/:reviewId', authMiddleware.authenticateToken, controller.deleteReview);

module.exports = router;