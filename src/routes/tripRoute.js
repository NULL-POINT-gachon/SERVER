const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const tripSharecontroller = require('../controllers/tripSharecontroller');

// 최적 경로 추천 API (거리 기준)
router.get('/:tripId/route', tripController.getOptimizedRoute);
router.post('/:tripId/route/save', tripController.saveOptimizedRoute);
router.put('/:shareId', tripSharecontroller.respondToShare); 
module.exports = router;