const express = require('express');
const router = express.Router();
const adminDestinationController = require('../controllers/adminDestinationController');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

/**
 * @swagger
 * /admin/destinations:
 *   get:
 *     summary: 모든 여행지 목록 조회
 *     tags: [AdminDestinations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 여행지 목록 조회 성공
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
 *                   example: 여행지 목록 조회 성공
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       destination_name:
 *                         type: string
 *                       category:
 *                         type: string
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
router.get('/destinations', authenticateToken, requireAdmin, adminDestinationController.getAllDestinations);

/**
 * @swagger
 * /admin/destinations/{destinationId}:
 *   get:
 *     summary: 특정 여행지 상세 조회
 *     tags: [AdminDestinations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: destinationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 여행지 상세 조회 성공
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 여행지를 찾을 수 없음
 */
router.get('/destinations/:destinationId', authenticateToken, requireAdmin, adminDestinationController.getDestinationById);

module.exports = router;