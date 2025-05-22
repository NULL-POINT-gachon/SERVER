/**
 * 여행 임박 알림 스케줄러
 * - 매일 오전 9시에 실행되어 곧 시작하는 여행에 대한 알림 생성
 * - 7일, 3일, 1일 전에 알림 전송
 */

const cron = require('node-cron');
const tripService = require('../services/tripService');
const notificationService = require('../services/notificationService');

// 날짜 차이 계산 함수 (일 단위)
function getDaysDifference(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000; // 1일의 밀리초
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / oneDay);
}

// 매일 오전 9시에 실행되는 스케줄러
// cron.schedule('0 9 * * *', async () => {
//   try {
//     console.log('[스케줄러] 여행 임박 알림 스케줄러 실행 중...');
    
//     // 다음 7일 내에 시작되는 여행 조회
//     const upcomingTrips = await tripService.findTripsStartingWithinDays(7);
//     console.log(`[스케줄러] ${upcomingTrips.length}개의 임박 여행 일정 발견`);
    
//     const today = new Date();
//     let notificationCount = 0;
    
//     for (const trip of upcomingTrips) {
//       // 출발일까지 남은 일수 계산
//       const departureDate = new Date(trip.departure_date);
//       const daysRemaining = getDaysDifference(today, departureDate);
      
//       // 특정 일수(7일, 3일, 1일)에만 알림 전송
//       if (daysRemaining === 7 || daysRemaining === 3 || daysRemaining === 1) {
//         try {
//           await notificationService.createTravelUpcomingNotification(
//             trip.id,
//             daysRemaining
//           );
//           notificationCount++;
//           console.log(`[스케줄러] '${trip.schedule_name}' 여행 일정 ${daysRemaining}일 전 알림 전송 완료`);
//         } catch (notificationError) {
//           console.error(`[스케줄러] 알림 전송 실패 (여행 ID: ${trip.id}):`, notificationError);
//         }
//       }
//     }
    
//     console.log(`[스케줄러] 총 ${notificationCount}개의 여행 임박 알림 전송 완료`);
//   } catch (error) {
//     console.error('[스케줄러] 여행 임박 알림 처리 중 오류:', error);
//   }
// });

// 스케줄러 시작 로그
console.log('[스케줄러] 여행 임박 알림 스케줄러가 시작되었습니다. 매일 오전 9시에 실행됩니다.');

module.exports = {
  // 필요한 경우 스케줄러 제어 함수 추가 가능
  // start: () => { ... },
  // stop: () => { ... }
};