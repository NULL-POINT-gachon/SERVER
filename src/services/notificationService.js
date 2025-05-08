const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const tripShareRepository = require('../repositories/tripShareRepository');

/**
 * 사용자의 알림 목록 조회
 * @param {number} userId - 사용자 ID
 * @param {Object} options - 조회 옵션 (limit, offset)
 * @returns {Promise<Array>} - 알림 목록
 */
const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, offset = 0 } = options;
  return await notificationRepository.findByUserId(userId, limit, offset);
};

/**
 * 읽지 않은 알림 개수 조회
 * @param {number} userId - 사용자 ID
 * @returns {Promise<number>} - 읽지 않은 알림 개수
 */
const getUnreadCount = async (userId) => {
  return await notificationRepository.countUnreadByUserId(userId);
};

/**
 * 알림 읽음 처리
 * @param {number} notificationId - 알림 ID
 * @param {number} userId - 사용자 ID (권한 검증용)
 * @returns {Promise<boolean>} - 성공 여부
 */
const markAsRead = async (notificationId, userId) => {
  // 알림 소유자 확인
  const notification = await notificationRepository.findById(notificationId);
  
  if (!notification) {
    throw { status: 404, message: '알림을 찾을 수 없습니다.' };
  }
  
  if (notification.user_id !== userId) {
    throw { status: 403, message: '이 알림에 대한 권한이 없습니다.' };
  }
  
  return await notificationRepository.updateReadStatus(notificationId, true);
};

/**
 * 모든 알림 읽음 처리
 * @param {number} userId - 사용자 ID
 * @returns {Promise<number>} - 변경된 알림 개수
 */
const markAllAsRead = async (userId) => {
  return await notificationRepository.markAllAsRead(userId);
};

/**
 * 여행 일정 초대 알림 생성
 * @param {number} senderId - 초대한 사용자 ID
 * @param {number} receiverId - 초대받은 사용자 ID
 * @param {number} tripId - 여행 일정 ID
 * @returns {Promise<number>} - 생성된 알림 ID
 */
const createInviteNotification = async (senderId, receiverId, tripId) => {
  try {
    // 발신자 정보 조회
    const sender = await userRepository.findUserById(senderId);
    // 여행 일정 정보 조회
    const trip = await tripShareRepository.findById(tripId);
    
    if (!sender || !trip) {
      throw new Error('사용자 또는 여행 일정 정보를 찾을 수 없습니다.');
    }
    
    const message = `${sender.name}님이 ${trip.title} 여행 일정을 공유했습니다.`;
    
    return await notificationRepository.create({
      user_id: receiverId,
      type: 'invite',
      message,
      trip_id: tripId,
      sender_id: senderId
    });
  } catch (error) {
    console.error('초대 알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 여행 일정 업데이트 알림 생성
 * @param {number} updaterId - 업데이트한 사용자 ID
 * @param {number} tripId - 여행 일정 ID
 * @returns {Promise<Array>} - 생성된 알림 ID 배열
 */
const createUpdateNotification = async (updaterId, tripId) => {
  try {
    // 여행 일정 정보 조회
    const trip = await travelScheduleRepository.findById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 해당 일정의 참여자 목록 조회 (본인 제외)
    const participants = await travelScheduleRepository.getParticipants(tripId);
    const otherParticipants = participants.filter(p => p.id !== updaterId);
    
    const message = `${trip.title} 여행 일정이 수정되었습니다.`;
    
    // 참여자들에게 알림 생성
    const notificationIds = [];
    for (const participant of otherParticipants) {
      const notificationId = await notificationRepository.create({
        user_id: participant.id,
        type: 'update',
        message,
        trip_id: tripId,
        sender_id: updaterId
      });
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  } catch (error) {
    console.error('업데이트 알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 댓글 알림 생성
 * @param {number} commenterId - 댓글 작성자 ID
 * @param {number} tripId - 여행 일정 ID
 * @returns {Promise<Array>} - 생성된 알림 ID 배열
 */
const createCommentNotification = async (commenterId, tripId) => {
  try {
    // 여행 일정 정보 조회
    const trip = await travelScheduleRepository.findById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 댓글 작성자 정보 조회
    const commenter = await userRepository.findUserById(commenterId);
    if (!commenter) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 해당 일정의 참여자 목록 조회 (본인 제외)
    const participants = await travelScheduleRepository.getParticipants(tripId);
    const otherParticipants = participants.filter(p => p.id !== commenterId);
    
    const message = `${trip.title} 일정에 ${commenter.name}님이 새로운 댓글을 남겼습니다.`;
    
    // 참여자들에게 알림 생성
    const notificationIds = [];
    for (const participant of otherParticipants) {
      const notificationId = await notificationRepository.create({
        user_id: participant.id,
        type: 'comment',
        message,
        trip_id: tripId,
        sender_id: commenterId
      });
      notificationIds.push(notificationId);
    }
    
    return notificationIds;
  } catch (error) {
    console.error('댓글 알림 생성 중 오류:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createInviteNotification,
  createUpdateNotification,
  createCommentNotification
};