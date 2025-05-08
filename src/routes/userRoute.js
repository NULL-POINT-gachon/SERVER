const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: 새 사용자 등록
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: 사용자 이름
 *               email:
 *                 type: string
 *                 format: email
 *                 description: 사용자 이메일
 *               password:
 *                 type: string
 *                 format: password
 *                 description: 사용자 비밀번호 (8자 이상)
 *               age:
 *                 type: integer
 *                 description: 사용자 나이
 *               gender:
 *                 type: string
 *                 description: 사용자 성별
 *               residence:
 *                 type: string
 *                 description: 사용자 거주지
 *     responses:
 *       201:
 *         description: 회원가입 성공
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
 *                   example: 회원가입이 완료되었습니다
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: 유효성 검사 실패
 *       409:
 *         description: 이미 등록된 이메일
 *       500:
 *         description: 서버 오류
 */
router.post('/signup', userController.signup);

/**
 * @swagger
 * /user/google:
 *   get:
 *     summary: Google OAuth 로그인 시작
 *     tags: [Users]
 *     responses:
 *       302:
 *         description: Google 인증 페이지로 리다이렉트
 */
router.get('/google', userController.googleLogin);

/**
 * @swagger
 * /user/google/callback:
 *   get:
 *     summary: Google OAuth 콜백 처리
 *     tags: [Users]
 *     parameters:
 *       - name: code
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: 홈 또는 프로필 완성 페이지로 리다이렉트
 */
router.get('/google/callback', userController.googleCallback);

/**
 * @swagger
 * /user/complete-profile:
 *   post:
 *     summary: 소셜 회원가입 후 추가 정보 입력
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               residence:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 완성 성공
 *       400:
 *         description: 유효하지 않은 요청
 */
router.post('/complete-profile', userController.completeProfile);


/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: 사용자 로그인
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       401:
 *         description: 인증 실패
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: 사용자 프로필 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
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
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     age:
 *                       type: integer
 *                     gender:
 *                       type: string
 *                     residence:
 *                       type: string
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 사용자 찾을 수 없음
 */
// 사용자 조회
router.get('/profile', authMiddleware.authenticateToken, userController.getUserProfile);


/**
 * @swagger
 * /user/profile:
 *   patch:
 *     summary: 사용자 프로필 수정
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               residence:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
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
 *                 data:
 *                   type: object
 *       401:
 *         description: 인증 실패
 */
//사용자 정보 수정
router.patch('/profile', authMiddleware.authenticateToken, userController.updateUserProfile);


/**
 * @swagger
 * /user/deactivate:
 *   patch:
 *     summary: 사용자 계정 비활성화
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 계정 비활성화 성공
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
 *       401:
 *         description: 인증 실패
 */
//사용자 회원탈퇴 
router.patch('/deactivate', authMiddleware.authenticateToken, userController.deactivateUser);



module.exports = router;