const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripSharecontroller = require('../controllers/tripSharecontroller');

/**
 * @swagger
 * /trip/{tripId}/route:
 *   get:
 *     summary: 일정별 최적경로 조회
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 조회할 여행 일정 ID
 *     responses:
 *       200:
 *         description: 최적 경로를 반환합니다.
 */

/**
 * @swagger
 * /trip/{tripId}/route/save:
 *   post:
 *     summary: 최적경로 저장
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 저장할 여행 일정 ID
 *     responses:
 *       201:
 *         description: 최적 경로 저장 완료
 */

/**
 * @swagger
 * /trip/share/{shareId}:
 *   put:
 *     summary: 공유 요청 수락/거절
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 일정 공유 요청 ID
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
 *         description: 공유 요청 상태 변경 완료
 */

/**
 * @swagger
 * /trip/{tripId}/distance:
 *   get:
 *     summary: 전체 거리 및 시간 계산
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 계산할 여행 일정 ID
 *     responses:
 *       200:
 *         description: 전체 이동 거리 및 시간 반환
 */
/**
 * @swagger
 * /trip/{tripId}/map:
 *   get:
 *     summary: 일정별 지도 마커 및 경로 데이터 반환
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 지도 표시할 여행 일정 ID
 *     responses:
 *       200:
 *         description: 날짜별 여행지 좌표 및 순서를 반환합니다.
 */
// ✅ API 라우터들
router.get('/:tripId/route', tripController.getOptimizedRoute);
router.post('/:tripId/route/save', tripController.saveOptimizedRoute);
router.put('/:shareId', tripSharecontroller.respondToShare);
router.get('/:tripId/distance', tripController.getTotalDistanceAndTime);
router.get('/:tripId/map', tripController.getMapMarkers);
module.exports = router;