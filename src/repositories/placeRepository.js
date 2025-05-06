// src/repositories/placeRepository.js
const db = require('../config/database');

class PlaceRepository {
  async savePlacePreferences(userId, preferenceData) {
    try {
      // 기존 TravelSchedule 확인 (도시 기반)
      const [schedules] = await db.execute(
        `SELECT id FROM TravelSchedule WHERE user_id = ? AND city = ? ORDER BY created_at DESC LIMIT 1`,
        [userId, preferenceData.city]
      );
      
      let scheduleId;
      
      if (schedules.length > 0) {
        scheduleId = schedules[0].id;
      } else {
        // 새로운 TravelSchedule 생성 (임시)
        const [scheduleResult] = await db.execute(
          `INSERT INTO TravelSchedule 
          (user_id, schedule_name, city, departure_date, end_date, travel_status) 
          VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'planned')`,
          [userId, `${preferenceData.city} 여행`, preferenceData.city]
        );
        
        scheduleId = scheduleResult.insertId;
      }
      
      // 선호도 정보 저장
      const [preferenceResult] = await db.execute(
        `INSERT INTO TravelPreference 
        (schedule_id, indoor_outdoor, preferred_transportation, companion_count) 
        VALUES (?, ?, ?, ?)`,
        [
          scheduleId, 
          preferenceData.activityType, 
          preferenceData.preferredTransport, 
          preferenceData.companionsCount
        ]
      );
      
      const preferenceId = preferenceResult.insertId;
      
      // 활동 정보 저장
      if (preferenceData.activityIds && preferenceData.activityIds.length > 0) {
        const activityValues = preferenceData.activityIds.map(activityId => [preferenceId, activityId]);
        await db.query(
          'INSERT INTO PreferenceActivity (preference_id, activity_id) VALUES ?',
          [activityValues]
        );
      }
      
      // 감정 정보 저장 (이전 설문에서 선택한)
      if (preferenceData.emotionIds && preferenceData.emotionIds.length > 0) {
        const moodValues = preferenceData.emotionIds.map(moodId => [preferenceId, moodId]);
        await db.query(
          'INSERT INTO PreferenceMood (preference_id, mood_id) VALUES ?',
          [moodValues]
        );
      }
      
      return {
        scheduleId,
        preferenceId
      };
    } catch (error) {
      console.error('여행지 선호도 저장 중 오류:', error);
      throw error;
    }
  }

  async savePlaceRecommendations(scheduleId, recommendations) {
    try {
      const savedDestinations = [];
      let visitOrder = 1;
      
      for (const place of recommendations) {
        // TravelDestination 테이블에 여행지 정보 저장
        const [destResult] = await db.execute(
          `INSERT INTO TravelDestination 
          (destination_name, destination_description, latitude, longitude, category) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            place.여행지명,
            place.여행지설명,
            0, // 임시 좌표, 실제 구현 시 API에서 좌표 받아오기
            0, // 임시 좌표
            place.분류
          ]
        );
        
        const destinationId = destResult.insertId;
        
        // ScheduleDestination 테이블에 일정-여행지 연결 정보 저장
        await db.execute(
          `INSERT INTO ScheduleDestination 
          (destination_id, schedule_id, visit_order) 
          VALUES (?, ?, ?)`,
          [destinationId, scheduleId, visitOrder++]
        );
        
        savedDestinations.push({
          id: destinationId,
          ...place
        });
      }
      
      return savedDestinations;
    } catch (error) {
      console.error('여행지 추천 저장 중 오류:', error);
      throw error;
    }
  }
}

module.exports = new PlaceRepository();