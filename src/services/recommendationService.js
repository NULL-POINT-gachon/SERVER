// src/services/recommendationService.js
const recommendationRepository = require('../repositories/recommendationRepository');
const { RecommendationResponseDto } = require('../dtos/recommendationDto');
const axios = require('axios');

class RecommendationService {
  async getRecommendations(userId, requestDto) {
    try {
      // AI 서비스에 요청하기 위한 데이터 형식으로 변환
      const aiRequestData = requestDto.toAIRequestFormat();
      
      // 실제 API 호출 대신 모킹 데이터 사용 (AI 서비스 연동 시 주석 해제)
      // const aiResponse = await this.callAIService(aiRequestData);
      
      // 모킹 데이터
      const mockRecommendations = [
        {
          city_id: "CTY_SEOUL",
          item_name: "서울",
          related_activities: ["한강 자전거 타기", "남산 타워 방문", "인사동 구경"]
        },
        {
          city_id: "CTY_BUSAN",
          item_name: "부산",
          related_activities: ["해운대 해수욕장", "자갈치 시장", "광안대교 야경"]
        },
        {
          city_id: "CTY_JEJU",
          item_name: "제주",
          related_activities: ["성산일출봉 등반", "올레길 걷기", "한라산 등산"]
        }
      ];
      
      // 추천 결과 저장
      await recommendationRepository.saveRecommendation(
        userId,
        requestDto.startDate,
        requestDto.endDate,
        requestDto.companionsCount,
        requestDto.emotionIds,
        mockRecommendations
      );
      
      // 응답 DTO 생성
      const responseDto = new RecommendationResponseDto(userId, mockRecommendations);
      return responseDto;
      
    } catch (error) {
      console.error('추천 서비스 오류:', error);
      throw new Error('여행지 추천을 가져오는 중 오류가 발생했습니다.');
    }
  }

  async callAIService(requestData) {
    try {
      // AI 서비스 URL (실제 API 연동 시 .env에서 관리)
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service/api';
      
      const response = await axios.post(`${aiServiceUrl}/ai/recommendation/city`, requestData);
      return response.data;
    } catch (error) {
      console.error('AI 서비스 호출 오류:', error);
      throw new Error('AI 서비스 호출 중 오류가 발생했습니다.');
    }
  }

  async getMoodNames(moodIds) {
    const moodNames = [];
    for (const moodId of moodIds) {
      const mood = await recommendationRepository.getMoodById(moodId);
      if (mood) {
        moodNames.push(mood.mood_name);
      }
    }
    return moodNames;
  }
}

module.exports = new RecommendationService();