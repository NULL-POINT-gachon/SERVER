const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: 전체 사용자 목록 조회
 *     responses:
 *       200:
 *         description: 모든 사용자 정보를 반환합니다.
 */
router.get('/users', authMiddleware.authenticateToken, authMiddleware.requireAdmin, controller.getAllUsers);

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     summary: 특정 사용자 상세 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 사용자 정보 반환
 */
router.get('/users/:userId', authMiddleware.authenticateToken, authMiddleware.requireAdmin, controller.getUserById);


/**
 * @swagger
 * /admin/users/{userId}/status:
 *   patch:
 *     summary: 사용자 상태 변경
 *     parameters:
 *       - in: path
 *         name: userId
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
 *                 description: 변경할 상태 (0 또는 1)
 *     responses:
 *       200:
 *         description: 상태 변경 결과
 */
router.patch('/users/:userId/status', authMiddleware.authenticateToken, authMiddleware.requireAdmin, controller.updateUserStatus);

module.exports = router;