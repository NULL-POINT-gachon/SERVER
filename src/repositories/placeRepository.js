// src/repositories/placeRepository.js
const db = require('../config/database');

class PlaceRepository {

  async getHotplace(id) {
    const [rows] = await db.execute(
      `SELECT * FROM TravelDestination WHERE id = ?`,
      [id]
    );
    return rows[0];
  }
  
  async saveRecommendations(userId, tripId, places) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const place of places) {
        // 1) TravelDestination UPSERT (중복 방지)
        const [destRes] = await conn.execute(
          `INSERT INTO TravelDestination
           (destination_name, destination_description, latitude, longitude, category, image, road_address)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             destination_description = COALESCE(VALUES(destination_description), destination_description),
             latitude = COALESCE(VALUES(latitude), latitude),
             longitude = COALESCE(VALUES(longitude), longitude),
             category = COALESCE(VALUES(category), category),
             image = COALESCE(VALUES(image), image),
             road_address = COALESCE(VALUES(road_address), road_address)`,
          [
            place.title,
            place.description ?? null,
            place.latitude ?? null,
            place.longitude ?? null,
            place.category ?? null,
            place.image ?? null,
            place.road_address ?? null
          ]
        );

        // 실제 destination_id 확보
        let destinationId = destRes.insertId;
        if (destinationId === 0) {
          const [existing] = await conn.execute(
            `SELECT id FROM TravelDestination WHERE destination_name = ?`,
            [place.title]
          );
          destinationId = existing[0].id;
        }

        // 2) ScheduleDestination UPSERT
        await conn.execute(
          `INSERT INTO ScheduleDestination
           (destination_id, schedule_id, visit_order, visit_date, is_hidden)
           VALUES (?, ?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE
             visit_order = VALUES(visit_order),
             visit_date = VALUES(visit_date),
             is_hidden = 0,
             updated_at = CURRENT_TIMESTAMP`,
          [
            destinationId,
            tripId,
            place.order ?? 1,
            place.visit_date ?? null
          ]
        );
      }

      await conn.commit();
      console.log(`✅ ${places.length}개 장소 저장 완료`);
    } catch (err) {
      await conn.rollback();
      console.error('❌ 장소 저장 실패:', err);
      throw err;
    } finally {
      conn.release();
    }
  }

  // 여행지 숨김 처리 (is_hidden = 1)
  async hideDestinationFromSchedule(scheduleId, destinationName) {
    try {
      const [result] = await db.execute(
        `UPDATE ScheduleDestination sd
         INNER JOIN TravelDestination td ON sd.destination_id = td.id
         SET sd.is_hidden = 1, sd.updated_at = CURRENT_TIMESTAMP
         WHERE sd.schedule_id = ? AND td.destination_name = ?`,
        [scheduleId, destinationName]
      );
      
      console.log(`🙈 여행지 숨김: ${destinationName} (${result.affectedRows}개 행 업데이트)`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('여행지 숨김 실패:', error);
      throw error;
    }
  }

  // 숨겨진 여행지 복원 (is_hidden = 0)
  async restoreDestinationToSchedule(scheduleId, destinationName) {
    try {
      const [result] = await db.execute(
        `UPDATE ScheduleDestination sd
         INNER JOIN TravelDestination td ON sd.destination_id = td.id
         SET sd.is_hidden = 0, sd.updated_at = CURRENT_TIMESTAMP
         WHERE sd.schedule_id = ? AND td.destination_name = ?`,
        [scheduleId, destinationName]
      );
      
      console.log(`👁️  여행지 복원: ${destinationName} (${result.affectedRows}개 행 업데이트)`);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('여행지 복원 실패:', error);
      throw error;
    }
  }

  // 일정의 모든 여행지 조회 (숨겨진 것 포함)
  async getScheduleDestinations(scheduleId, includeHidden = false) {
    try {
      const hiddenCondition = includeHidden ? '' : 'AND sd.is_hidden = 0';
      
      const [rows] = await db.execute(
        `SELECT 
           td.id as destination_id,
           td.destination_name,
           td.destination_description,
           td.latitude,
           td.longitude,
           td.category,
           td.image,
           td.road_address,
           sd.visit_order,
           sd.visit_date,
           sd.visit_time,
           sd.is_hidden
         FROM ScheduleDestination sd
         INNER JOIN TravelDestination td ON sd.destination_id = td.id
         WHERE sd.schedule_id = ? ${hiddenCondition}
         ORDER BY sd.visit_order, sd.id`,
        [scheduleId]
      );
      
      return rows;
    } catch (error) {
      console.error('일정 여행지 조회 실패:', error);
      throw error;
    }
  }

  async countPlaces() {
    try {
      const [rows] = await db.execute(`SELECT COUNT(*) AS placeCnt FROM TravelDestination`);
      return rows[0].placeCnt;
    } catch (error) {
      console.error('여행지 수 조회 실패:', error);
      throw error;
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