const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const tripShareRepository = require('../repositories/tripSharerepository');



// 알림 타입 정의
const NOTIFICATION_TYPES = {
  INVITE: 'invite',            // 일정 초대
  UPDATE: 'update',            // 일정 수정
  COMMENT: 'comment',          // 댓글 알림
  PLACE_ADDED: 'place_added',  // 장소 추가
  PLACE_REMOVED: 'place_removed', // 장소 삭제
  TRAVEL_UPCOMING: 'travel_upcoming' // 여행 임박 알림
};

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
    const trip = await tripShareRepository.findTripById(tripId);
    
    if (!sender || !trip) {
      throw new Error('사용자 또는 여행 일정 정보를 찾을 수 없습니다.');
    }
    
    const message = `${sender.name}님이 ${trip.schedule_name} 여행 일정을 공유했습니다.`;
    
    return await notificationRepository.create({
      user_id: receiverId,
      type: NOTIFICATION_TYPES.INVITE,
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
    const trip = await tripShareRepository.findTripById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 일정 소유자 조회
    const owner = await tripShareRepository.findScheduleOwner(tripId);
    
    // 공동 편집자 목록 조회
    const collaborators = await tripShareRepository.findCollaboratorsByScheduleId(tripId);
    
    // 모든 참여자 목록 생성 (소유자 + 공동 편집자, 변경한 사람 제외)
    const participants = [owner, ...collaborators].filter(p => p && p.id !== updaterId);
    
    // 업데이트한 사용자 정보
    const updater = await userRepository.findUserById(updaterId);
    const updaterName = updater ? updater.name : '다른 사용자';
    
    const message = `${trip.schedule_name} 여행 일정이 ${updaterName}님에 의해 수정되었습니다.`;
    
 // 참여자들에게 알림 생성 - 트랜잭션 활용
    const notificationsData = participants.map(participant => ({
      user_id: participant.id,
      type: NOTIFICATION_TYPES.UPDATE,
      message,
      trip_id: tripId,
      sender_id: updaterId
    }));
    
   // 여러 알림을 트랜잭션으로 한번에 생성
    return await notificationRepository.createMultiple(notificationsData);
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
    const trip = await tripShareRepository.findTripById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 댓글 작성자 정보 조회
    const commenter = await userRepository.findUserById(commenterId);
    if (!commenter) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 일정 소유자 조회
    const owner = await tripShareRepository.findScheduleOwner(tripId);
    
    // 공동 편집자 목록 조회
    const collaborators = await tripShareRepository.findCollaboratorsByScheduleId(tripId);
    
    // 모든 참여자 목록 생성 (소유자 + 공동 편집자, 댓글 작성자 제외)
    const participants = [owner, ...collaborators].filter(p => p && p.id !== commenterId);
    // 참여자가 없으면 빈 배열 반환
    if (participants.length === 0) {
      return [];
    }
    const message = `${trip.schedule_name} 일정에 ${commenter.name}님이 새로운 댓글을 남겼습니다.`;
    
     // 참여자들에게 알림 생성 데이터 준비
    const notificationsData = participants.map(participant => ({
      user_id: participant.id,
      type: NOTIFICATION_TYPES.COMMENT,
      message,
      trip_id: tripId,
      sender_id: commenterId
    }));
    
    // 트랜잭션으로 한 번에 모든 알림 생성
    return await notificationRepository.createMultiple(notificationsData);
  } catch (error) {
    console.error('댓글 알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 장소 추가 알림 생성
 * @param {number} userId - 장소를 추가한 사용자 ID
 * @param {number} tripId - 여행 일정 ID
 * @param {string} placeName - 추가된 장소 이름
 * @returns {Promise<Array>} - 생성된 알림 ID 배열
 */
const createPlaceAddedNotification = async (userId, tripId, placeName) => {
  try {
    // 여행 일정 정보 조회
    const trip = await tripShareRepository.findTripById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 사용자 정보 조회
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 일정 소유자 조회
    const owner = await tripShareRepository.findScheduleOwner(tripId);
    
    // 공동 편집자 목록 조회
    const collaborators = await tripShareRepository.findCollaboratorsByScheduleId(tripId);
    
    // 모든 참여자 목록 생성 (소유자 + 공동 편집자, 장소 추가한 사람 제외)
    const participants = [owner, ...collaborators].filter(p => p && p.id !== userId);
      // 참여자가 없으면 빈 배열 반환
    if (participants.length === 0) {
      return [];
    }
    const message = `${trip.schedule_name} 일정에 ${user.name}님이 ${placeName} 장소를 추가했습니다.`;
    
     // 참여자들에게 알림 생성 데이터 준비
    const notificationsData = participants.map(participant => ({
      user_id: participant.id,
      type: NOTIFICATION_TYPES.PLACE_ADDED,
      message,
      trip_id: tripId,
      sender_id: userId
    }));
    
    // 트랜잭션으로 한 번에 모든 알림 생성
    return await notificationRepository.createMultiple(notificationsData);
  } catch (error) {
    console.error('장소 추가 알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 장소 삭제 알림 생성
 * @param {number} userId - 장소를 삭제한 사용자 ID
 * @param {number} tripId - 여행 일정 ID
 * @param {string} placeName - 삭제된 장소 이름
 * @returns {Promise<Array>} - 생성된 알림 ID 배열
 */
const createPlaceRemovedNotification = async (userId, tripId, placeName) => {
  try {
    // 여행 일정 정보 조회
    const trip = await tripShareRepository.findTripById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 사용자 정보 조회
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    // 일정 소유자 조회
    const owner = await tripShareRepository.findScheduleOwner(tripId);
    
    // 공동 편집자 목록 조회
    const collaborators = await tripShareRepository.findCollaboratorsByScheduleId(tripId);
    
    // 모든 참여자 목록 생성 (소유자 + 공동 편집자, 장소 삭제한 사람 제외)
    const participants = [owner, ...collaborators].filter(p => p && p.id !== userId);
      // 참여자가 없으면 빈 배열 반환
    if (participants.length === 0) {
      return [];
    }
    const message = `${trip.schedule_name} 일정에서 ${user.name}님이 ${placeName} 장소를 삭제했습니다.`;
    
    // 참여자들에게 알림 생성 데이터 준비
    const notificationsData = participants.map(participant => ({
      user_id: participant.id,
      type: NOTIFICATION_TYPES.PLACE_REMOVED,
      message,
      trip_id: tripId,
      sender_id: userId
    }));
    
    // 트랜잭션으로 한 번에 모든 알림 생성
    return await notificationRepository.createMultiple(notificationsData);
  } catch (error) {
    console.error('장소 삭제 알림 생성 중 오류:', error);
    throw error;
  }
};

/**
 * 여행 임박 알림 생성
 * @param {number} tripId - 여행 일정 ID
 * @param {number} daysRemaining - 남은 일수
 * @returns {Promise<Array>} - 생성된 알림 ID 배열
 */
const createTravelUpcomingNotification = async (tripId, daysRemaining) => {
  try {
    // 여행 일정 정보 조회
    const trip = await tripShareRepository.findTripById(tripId);
    if (!trip) {
      throw new Error('여행 일정 정보를 찾을 수 없습니다.');
    }
    
    // 일정 소유자 조회
    const owner = await tripShareRepository.findScheduleOwner(tripId);
    
    // 공동 편집자 목록 조회
    const collaborators = await tripShareRepository.findCollaboratorsByScheduleId(tripId);
    
    // 모든 참여자 목록 생성 (소유자 + 공동 편집자)
    const participants = [owner, ...collaborators].filter(p => p);
        // 참여자가 없으면 빈 배열 반환
    if (participants.length === 0) {
      return [];
    }
    const message = `${trip.schedule_name} 여행이 ${daysRemaining}일 후에 시작됩니다.`;
    
      // 참여자들에게 알림 생성 데이터 준비
    const notificationsData = participants.map(participant => ({
      user_id: participant.id,
      type: NOTIFICATION_TYPES.TRAVEL_UPCOMING,
      message,
      trip_id: tripId,
      sender_id: null
    }));
    
    // 트랜잭션으로 한 번에 모든 알림 생성
    return await notificationRepository.createMultiple(notificationsData);
  } catch (error) {
    console.error('여행 임박 알림 생성 중 오류:', error);
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
  createCommentNotification,
  createPlaceAddedNotification,
  createPlaceRemovedNotification,
  createTravelUpcomingNotification,
  NOTIFICATION_TYPES
};