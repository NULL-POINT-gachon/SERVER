const userRepo     = require("../repositories/userRepository");
const placeRepo    = require("../repositories/placeRepository");
const reviewRepo   = require("../repositories/reviewRepository");
const tripRepo     = require("../repositories/tripRepository");
// const scheduleRepo = require("../repositories/scheduleRepository");

exports.getSummary = async (req, res, next) => {
  try {
    /* ── 카드 숫자 ─────────────────────── */
    const [userCnt, placeCnt, reviewCnt, schedCnt] = await Promise.all([
      userRepo.countUsers(),
      placeRepo.countPlaces(),
      reviewRepo.countReviews(),
      tripRepo.countSchedules()
    ]);
    console.log("> userCnt", userCnt);
    console.log("> placeCnt", placeCnt);
    console.log("> reviewCnt", reviewCnt);
    console.log("> schedCnt", schedCnt);

    /* ── 최근 5개 목록 ────────────────── */
    const [latestUsers, latestReviews] = await Promise.all([
      userRepo.getLatestUsers(),            // id, email, created_at …
      reviewRepo.getLatestReviews()         // id, destination_name, rating, user_email, created_at
    ]);
    console.log("> latestUsers", latestUsers);
    console.log("> latestReviews", latestReviews);

    res.json({
      result_code: 200,
      data: {
        cards: { users:userCnt, places:placeCnt, reviews:reviewCnt, schedules:schedCnt },
        latestUsers,
        latestReviews
      }
    });
  } catch (err) { next(err); }
};