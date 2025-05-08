const express = require('express');
const router = express.Router();
const controller = require('../controllers/tripSharecontroller');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /trip/share/email:
 *   post:
 *     summary: 이메일을 통한 일정 공유 요청
 *     tags: [TripShare]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 공유받을 사용자의 이메일
 *               schedule_id:
 *                 type: integer
 *                 description: 공유할 일정 ID
 *               permission_level:
 *                 type: string
 *                 enum: [edit, read]
 *                 description: 권한 수준
 *     responses:
 *       201:
 *         description: 공유 요청 전송 완료
 *       400:
 *         description: 이메일 미등록 사용자
 */
router.post('/email', authMiddleware.authenticateToken, controller.requestShareByEmail);

/**
 * @swagger
 * /trip/share/respond:
 *   post:
 *     summary: 일정 공유 요청 수락 또는 거절
 *     tags: [TripShare]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: 초대 수락 링크의 토큰
 *               action:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: 수락 or 거절
 *     responses:
 *       200:
 *         description: 요청 처리 완료
 *       400:
 *         description: 잘못된 요청 또는 만료된 토큰
 */
router.post('/respond', authMiddleware.authenticateToken, controller.respondToInvitation);

// /**
//  * @swagger
//  * /trip/share/my:
//  *   get:
//  *     summary: 내가 수락한 공유 일정 목록 조회
//  *     tags: [TripShare]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: 수락된 공유 일정 목록
//  */
// router.get('/my', authMiddleware.authenticateToken, controller.getMySharedTrips);

/**
 * @swagger
 * /trip/share/invite/{shareId}:
 *   get:
 *     summary: 이메일 초대 링크 수락 처리
 *     tags: [TripShare]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 공유 요청 ID
 *     responses:
 *       200:
 *         description: 초대 수락 처리 결과
 */
router.get('/invite/:shareId', authMiddleware.authenticateToken, controller.acceptInviteFromEmail);
module.exports = router;