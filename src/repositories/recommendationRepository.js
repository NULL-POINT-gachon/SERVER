const db = require('../config/database');

class RecommendationRepository {
  async saveRecommendation(userId, startDate, endDate,
                           companionsCount, emotionIds, recommendations) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. TravelSchedule 생성
      const [scheduleRes] = await conn.execute(
        `INSERT INTO TravelSchedule
         (user_id, schedule_name, city, departure_date, end_date, travel_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, `${startDate} 여행`, '', startDate, endDate, 'planned']
      );
      const scheduleId = scheduleRes.insertId;

      // 2. TravelPreference 생성
      const [prefRes] = await conn.execute(
        `INSERT INTO TravelPreference (schedule_id, companion_count)
         VALUES (?, ?)`,
        [scheduleId, companionsCount]
      );
      const preferenceId = prefRes.insertId;

      // 3. PreferenceMood 추가
      if (emotionIds?.length) {
        await conn.query(
          `INSERT INTO PreferenceMood (preference_id, mood_id) VALUES ?`,
          [emotionIds.map(m => [preferenceId, m])]
        );
      }

      // 4. 추천된 여행지들 등록
      let order = 1;
      for (const rec of recommendations) {
        const [destRes] = await conn.execute(
          `INSERT INTO TravelDestination
           (name, description, latitude, longitude, category, image)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            rec.item_name,
            rec.description || `AI 추천 도시: ${rec.item_name}`,
            rec.latitude || 0,
            rec.longitude || 0,
            rec.city_id,
            rec.image || '/images/default.jpg'
          ]
        );

        await conn.execute(
          `INSERT INTO ScheduleDestination
           (destination_id, schedule_id, visit_order)
           VALUES (?, ?, ?)`,
          [destRes.insertId, scheduleId, order++]
        );
      }

      await conn.commit();
      return { scheduleId, preferenceId };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async getMoodById(moodId) {
    const [rows] = await db.execute(
      'SELECT * FROM Mood WHERE id = ?',
      [moodId]
    );
    return rows[0];
  }
}

module.exports = new RecommendationRepository();