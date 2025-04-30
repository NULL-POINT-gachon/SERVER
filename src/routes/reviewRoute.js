const express = require('express');
const router = express.Router();
const controller = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/auth');
/**
 * @swagger
 * /review:
 *   post:
 *     summary: 리뷰 작성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 리뷰 작성 성공
 */
router.post('/', authMiddleware.authenticateToken, controller.createReview);

module.exports = router;