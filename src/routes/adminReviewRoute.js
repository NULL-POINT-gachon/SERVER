const express = require('express');
const router = express.Router();
const adminReviewController = require('../controllers/adminReviewController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: 모든 리뷰 목록 조회
 *     tags: [AdminReviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 리뷰 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 리뷰 목록 조회 성공
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       destination_name:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                       status:
 *                         type: integer
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
router.get('/reviews', authenticateToken, requireAdmin, adminReviewController.getAllReviews);

/**
 * @swagger
 * /admin/reviews/{reviewId}:
 *   get:
 *     summary: 특정 리뷰 상세 조회
 *     tags: [AdminReviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 리뷰 상세 조회 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 리뷰를 찾을 수 없음
 */
router.get('/reviews/:reviewId', authenticateToken, requireAdmin, adminReviewController.getReviewById);

/**
 * @swagger
 * /admin/reviews/{reviewId}/status:
 *   patch:
 *     summary: 리뷰 상태 변경 (활성화/비활성화)
 *     tags: [AdminReviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: integer
 *                 description: "변경할 상태 (0: 비활성화, 1: 활성화)"
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: 리뷰 상태 변경 성공
 *       400:
 *         description: 유효하지 않은 상태값
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 리뷰를 찾을 수 없음
 */
router.patch('/reviews/:reviewId/status', authenticateToken, requireAdmin, adminReviewController.updateReviewStatus);

module.exports = router;