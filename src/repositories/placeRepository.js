// src/repositories/placeRepository.js
const db = require('../config/database');

class PlaceRepository {
  async saveRecommendations(userId, tripId, places) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const place of places) {
        // 1) TravelDestination 저장
        const [destRes] = await conn.execute(
          `INSERT INTO TravelDestination
           (destination_name, destination_description, latitude, longitude, category, image)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            place.title ?? null,
            place.description ?? null,
            place.latitude ?? 0,
            place.longitude ?? 0,
            place.category ?? null,
            place.image ?? null
          ]
        );
        const destinationId = destRes.insertId;

        // 2) ScheduleDestination 저장
        await conn.execute(
          `INSERT INTO ScheduleDestination
           (destination_id, schedule_id, visit_order, visit_date)
           VALUES (?, ?, ?, ?)`,
          [
            destinationId,
            tripId,
            place.order ?? 1,
            place.visit_date ?? null
          ]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async savePlacePreferences(userId, preferenceData) {
    try {
      const [schedules] = await db.execute(
        `SELECT id FROM TravelSchedule WHERE user_id = ? AND city = ? ORDER BY created_at DESC LIMIT 1`,
        [userId, preferenceData.city]
      );

      let scheduleId;

      if (schedules.length > 0) {
        scheduleId = schedules[0].id;
      } else {
        const [scheduleResult] = await db.execute(
          `INSERT INTO TravelSchedule 
           (user_id, schedule_name, city, departure_date, end_date, travel_status) 
           VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'planned')`,
          [userId, `${preferenceData.city} 여행`, preferenceData.city]
        );
        scheduleId = scheduleResult.insertId;
      }

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

      if (preferenceData.activityIds?.length > 0) {
        const activityValues = preferenceData.activityIds.map(aid => [preferenceId, aid]);
        await db.query(
          'INSERT INTO PreferenceActivity (preference_id, activity_id) VALUES ?',
          [activityValues]
        );
      }

      if (preferenceData.emotionIds?.length > 0) {
        const moodValues = preferenceData.emotionIds.map(mid => [preferenceId, mid]);
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
        const [destResult] = await db.execute(
          `INSERT INTO TravelDestination 
           (name, description, latitude, longitude, category) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            place.여행지명,
            place.여행지설명,
            0,
            0,
            place.분류
          ]
        );

        const destinationId = destResult.insertId;

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