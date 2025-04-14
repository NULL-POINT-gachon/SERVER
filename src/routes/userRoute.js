const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

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

module.exports = router;