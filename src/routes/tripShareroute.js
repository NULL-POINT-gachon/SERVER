const express = require('express');
const router = express.Router();
const controller = require('../controllers/tripSharecontroller');

/**
 * @swagger
 * /trip/share:
 *   post:
 *     summary: 여행 일정 공유 요청
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sharing_user_id:
 *                 type: integer
 *                 description: 공유하는 사용자 ID
 *               receiver_user_id:
 *                 type: integer
 *                 description: 공유받는 사용자 ID
 *               schedule_id:
 *                 type: integer
 *                 description: 공유할 여행 일정 ID
 *               permission_level:
 *                 type: string
 *                 description: 권한 수준 (edit/read)
 *     responses:
 *       201:
 *         description: 공유 요청이 생성되었습니다.
 */

/**
 * @swagger
 * /trip/share/{shareId}:
 *   put:
 *     summary: 공유 요청 수락 또는 거절
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 공유 요청 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: 수락(accepted) 또는 거절(rejected)
 *     responses:
 *       200:
 *         description: 공유 요청 상태가 변경되었습니다.
 */

/**
 * @swagger
 * /trip/share/received/{userId}:
 *   get:
 *     summary: 공유받은 일정 목록 조회
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 일정을 공유받은 사용자 ID
 *     responses:
 *       200:
 *         description: 공유받은 일정 목록 반환
 */

/**
 * @swagger
 * /trip/share/{shareId}/cancel:
 *   patch:
 *     summary: 공유 요청 취소
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 취소할 공유 요청 ID
 *     responses:
 *       200:
 *         description: 공유 요청이 취소되었습니다.
 */

// ✅ API 라우터
router.post('/', controller.requestShare);
router.put('/:shareId', controller.respondToShare);
router.get('/received/:userId', controller.getReceivedShares);
router.patch('/:shareId/cancel', controller.cancelShareRequest);

module.exports = router;