// src/repositories/recommendationRepository.js
const db = require('../config/database');

class RecommendationRepository {
  async saveRecommendation(userId, startDate, endDate, companionsCount, emotionIds, recommendations) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // TravelSchedule 테이블에 일정 기본 정보 저장
      const [scheduleResult] = await connection.execute(
        `INSERT INTO TravelSchedule 
        (user_id, schedule_name, city, departure_date, end_date, travel_status) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, `${startDate} 여행`, '', startDate, endDate, 'planned']
      );
      
      const scheduleId = scheduleResult.insertId;
      
      // TravelPreference 테이블에 선호도 정보 저장
      const [preferenceResult] = await connection.execute(
        `INSERT INTO TravelPreference 
        (schedule_id, companion_count) 
        VALUES (?, ?)`,
        [scheduleId, companionsCount]
      );
      
      const preferenceId = preferenceResult.insertId;
      
      // 감정 정보 저장
      if (emotionIds && emotionIds.length > 0) {
        const moodValues = emotionIds.map(moodId => [preferenceId, moodId]);
        await connection.query(
          'INSERT INTO PreferenceMood (preference_id, mood_id) VALUES ?',
          [moodValues]
        );
      }
      
      // 추천 도시 및 활동 정보 저장 (모킹데이터에서 활용)
      for (const recommendation of recommendations) {
        // 추천 도시 정보를 TravelDestination 테이블에 저장
        const [destResult] = await connection.execute(
          `INSERT INTO TravelDestination 
          (destination_name, destination_description, latitude, longitude, category) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            recommendation.item_name,
            `AI 추천 도시: ${recommendation.item_name}`,
            0, // 임시 좌표, 실제 구현 시 도시별 좌표 사용
            0, // 임시 좌표
            recommendation.city_id
          ]
        );
        
        const destinationId = destResult.insertId;
        
        // 일정에 추천 도시 연결
        await connection.execute(
          `INSERT INTO ScheduleDestination 
          (destination_id, schedule_id, visit_order) 
          VALUES (?, ?, ?)`,
          [destinationId, scheduleId, 1]
        );
      }
      
      await connection.commit();
      
      return {
        scheduleId,
        preferenceId
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getMoodById(moodId) {
    const [rows] = await db.execute('SELECT * FROM Mood WHERE id = ?', [moodId]);
    return rows[0];
  }
}

module.exports = new RecommendationRepository();