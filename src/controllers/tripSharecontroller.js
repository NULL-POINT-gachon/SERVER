const service = require('../services/tripShareservice');

exports.requestShare = async (req, res, next) => {
  try {
    const shareData = req.body;
    const result = await service.createShare(shareData);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.respondToShare = async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const { action } = req.body;
  
      const result = await service.updateShareStatus(shareId, action);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
  exports.getReceivedShares = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const result = await service.getAcceptedShares(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  exports.cancelShareRequest = async (req, res, next) => {
    try {
      const { shareId } = req.params;
      const result = await service.cancelShare(shareId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };