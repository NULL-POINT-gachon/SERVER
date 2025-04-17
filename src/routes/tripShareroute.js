const express = require('express');
const router = express.Router();
const controller = require('../controllers/tripSharecontroller');

router.post('/', controller.requestShare);     
router.put('/:shareId', controller.respondToShare); 
router.get('/received/:userId', controller.getReceivedShares); 

router.patch('/:shareId/cancel', controller.cancelShareRequest);
module.exports = router;