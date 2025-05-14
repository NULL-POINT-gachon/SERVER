const notificationService = require('../services/notificationService');

/**
 * 사용자의 알림 목록 조회
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어
 */
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit, offset } = req.query;
    
    const options = {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0
    };
    
    const notifications = await notificationService.getUserNotifications(userId, options);
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      message: '알림 목록 조회 성공',
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 알림 읽음 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어
 */
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    
    await notificationService.markAsRead(notificationId, userId);
    
    res.status(200).json({
      success: true,
      message: '알림이 읽음 처리되었습니다.'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * 모든 알림 읽음 처리
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const updatedCount = await notificationService.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다.',
      data: {
        updatedCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};