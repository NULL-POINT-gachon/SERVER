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

module.exports = router;