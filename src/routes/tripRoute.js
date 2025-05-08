const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripSharecontroller = require('../controllers/tripSharecontroller');
const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * /trip/{tripId}/route:
 *   post:
 *     summary: AI 추천 장소 기반 최적경로 계산
 *     description: AI 서버에서 받은 장소 리스트를 기반으로 최적 경로를 계산합니다.
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 계산할 여행 일정 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: array
 *                 description: 날짜별 장소 리스트
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           time:
 *                             type: string
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                           image:
 *                             type: string
 *               transportMode:
 *                 type: string
 *                 example: "DRIVING"
 *     responses:
 *       200:
 *         description: 최적화된 경로 데이터 반환
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
 * /trip/schedule/{scheduleId}/optimize:
 *   post:
 *     summary: 일정 기반 최적 경로 재계산
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 일정 ID
 *     responses:
 *       200:
 *         description: 최적 경로 계산 결과 반환
 */

/**
 * @swagger
 * /trip/{tripId}/transport:
 *   put:
 *     summary: 여행 일정의 이동수단 변경
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 여행 일정 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transportation_id:
 *                 type: integer
 *                 description: 변경할 이동수단 ID
 *     responses:
 *       200:
 *         description: 이동수단 변경 완료
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

/**
 * @swagger
 * /trip/{tripId}/optimize:
 *   post:
 *     summary: 일정 재최적화
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 최적화할 여행 일정 ID
 *     responses:
 *       200:
 *         description: 최적화된 경로 반환
 */

// ✅ API 라우터들
router.post('/:tripId/route', authMiddleware.authenticateToken, tripController.optimizeRouteFromClientData);
router.post('/:tripId/route/save', authMiddleware.authenticateToken, tripController.saveOptimizedRoute);
router.get('/:tripId/distance', authMiddleware.authenticateToken, tripController.getTotalDistanceAndTime);
router.post('/schedule/:scheduleId/optimize', authMiddleware.authenticateToken, tripController.optimizeSchedule);
router.put('/:tripId/transport', authMiddleware.authenticateToken, tripController.updateTransportation);
router.get('/:tripId/map', authMiddleware.authenticateToken, tripController.getMapMarkers);
router.post('/:tripId/optimize', authMiddleware.authenticateToken, tripController.optimizeTrip);
// router.put('/:shareId', authMiddleware.authenticateToken, tripSharecontroller.respondToShare);

/**
 * @swagger
 * /trip:
 *   post:
 *     summary: 여행 일정 생성
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - 여행일정명
 *               - 출발일자
 *               - 마무리일자
 *             properties:
 *               여행일정명:
 *                 type: string
 *                 example: "부산 여름 휴가"
 *               출발일자:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-01"
 *               마무리일자:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-04"
 *               선택한_여행지_id:
 *                 type: integer
 *                 example: 10
 *                 description: "사용자가 선택한 여행지 ID (옵션)"
 *     responses:
 *       200:
 *         description: 여행 일정 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "여행 일정이 생성되었습니다."
 *                 식별자:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
// POST /trip 라우트 정의: 인증이 필요한 엔드포인트
router.post('/', authMiddleware.authenticateToken, tripController.createTrip);


/**
 * @swagger
 * /trip/all:
 *   get:
 *     summary: 전체 여행 일정 조회
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호 (기본값 1)
 *       - in: query
 *         name: limit  
 *         schema:
 *           type: integer
 *         description: 페이지당 아이템 수 (기본값 10)
 *       - in: query
 *         name: 여행상태ex) (계획, 진행중, 완료 , 취소)
 *         schema:
 *           type: string
 *           enum: [계획, 진행중, 완료, 취소]
 *         description: 여행 일정 상태 필터
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result_code:
 *                   type: integer
 *                   example: 200
 *                 total_count:
 *                   type: integer
 *                   example: 25
 *                 trips:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       식별자:
 *                         type: integer
 *                       여행일정명:
 *                         type: string
 *                       출발일자:
 *                         type: string
 *                         format: date
 *                       마무리일자:
 *                         type: string
 *                         format: date
 *                       여행상태ex) (계획, 진행중, 완료 , 취소):
 *                         type: string
 *                       생성일자:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       500:
 *         description: 서버 오류
 */
// 기존에 POST / 라우트 이후에 추가하는 부분
router.get('/all', authMiddleware.authenticateToken, tripController.getAllTrips);


/**
 * @swagger
 * /trip/{tripId}:
 *   get:
 *     summary: 여행 일정 상세 조회
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 여행 일정 ID
 *     responses:
 *       200:
 *         description: 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result_code:
 *                   type: integer
 *                 trip:
 *                   type: object
 *                   properties:
 *                     식별자:
 *                       type: integer
 *                     여행일정명:
 *                       type: string
 *                     도시:
 *                       type: string
 *                     출발일자:
 *                       type: string
 *                       format: date
 *                     마무리일자:
 *                       type: string
 *                       format: date
 *                     여행상태:
 *                       type: string
 *                     생성일자:
 *                       type: string
 *                       format: date-time
 *                     수정일자:
 *                       type: string
 *                       format: date-time
 *                 core_destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *                 destinations:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: 여행 일정을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 기존 라우터 설정 아래에 추가
router.get('/:tripId', authMiddleware.authenticateToken, tripController.getTripDetail);

module.exports = router;

/**
 * @swagger
 * /trip/{tripId}:
 *   patch:
 *     summary: 여행 일정 기본 정보 수정 (일정명, 여행상태)
 *     tags: [Trip]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 여행 일정 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               일정명:
 *                 type: string
 *                 example: "수정된 부산 여행"
 *               여행상태:
 *                 type: string
 *                 enum: [계획, 진행중, 완료, 취소]
 *                 example: "진행중"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result_code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "여행 일정이 성공적으로 수정되었습니다"
 *                 updated_trip_id:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 여행 일정을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.patch('/:tripId', authMiddleware.authenticateToken, tripController.updateTripBasicInfo);