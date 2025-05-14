const adminDestinationRepository = require('../repositories/adminDestinationRepository');

// 모든 여행지 목록 조회
exports.getAllDestinations = async () => {
  try {
    return await adminDestinationRepository.findAllDestinations();
  } catch (error) {
    console.error('여행지 목록 조회 서비스 오류:', error);
    throw {
      status: 500,
      message: '여행지 목록을 불러오는 중 오류가 발생했습니다.'
    };
  }
};

// 특정 여행지 상세 조회
exports.getDestinationById = async (destinationId) => {
  try {
    const destination = await adminDestinationRepository.findDestinationById(destinationId);
    
    if (!destination) {
      throw {
        status: 404,
        message: '여행지를 찾을 수 없습니다.'
      };
    }
    
    return destination;
  } catch (error) {
    console.error('여행지 상세 조회 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '여행지 상세 정보를 불러오는 중 오류가 발생했습니다.'
    };
  }
};

// 여행지 등록
exports.createDestination = async (destinationData) => {
  try {
    // 필수 필드 검증
    if (!destinationData.destination_name || !destinationData.address || !destinationData.category) {
      throw {
        status: 400,
        message: '장소명, 주소, 카테고리는 필수 입력 항목입니다.'
      };
    }

    // 위도/경도 숫자 검증
    if (destinationData.latitude && isNaN(destinationData.latitude)) {
      throw {
        status: 400,
        message: '위도는 숫자로 입력해주세요.'
      };
    }

    if (destinationData.longitude && isNaN(destinationData.longitude)) {
      throw {
        status: 400,
        message: '경도는 숫자로 입력해주세요.'
      };
    }

    return await adminDestinationRepository.createDestination(destinationData);
  } catch (error) {
    console.error('여행지 등록 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '여행지 등록 중 오류가 발생했습니다.'
    };
  }
};

// 여행지 수정
exports.updateDestination = async (destinationId, updateData) => {
  try {
    // 여행지 존재 여부 확인
    const destination = await adminDestinationRepository.findDestinationById(destinationId);
    if (!destination) {
      throw {
        status: 404,
        message: '여행지를 찾을 수 없습니다.'
      };
    }

    // 필수 필드 검증
    if (!updateData.destination_name || !updateData.address || !updateData.category) {
      throw {
        status: 400,
        message: '장소명, 주소, 카테고리는 필수 입력 항목입니다.'
      };
    }

    // 위도/경도 숫자 검증
    if (updateData.latitude && isNaN(updateData.latitude)) {
      throw {
        status: 400,
        message: '위도는 숫자로 입력해주세요.'
      };
    }

    if (updateData.longitude && isNaN(updateData.longitude)) {
      throw {
        status: 400,
        message: '경도는 숫자로 입력해주세요.'
      };
    }

    return await adminDestinationRepository.updateDestination(destinationId, updateData);
  } catch (error) {
    console.error('여행지 수정 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '여행지 수정 중 오류가 발생했습니다.'
    };
  }
};

// 여행지 삭제
exports.deleteDestination = async (destinationId) => {
  try {
    // 여행지 존재 여부 확인
    const destination = await adminDestinationRepository.findDestinationById(destinationId);
    if (!destination) {
      throw {
        status: 404,
        message: '여행지를 찾을 수 없습니다.'
      };
    }

    await adminDestinationRepository.deleteDestination(destinationId);
  } catch (error) {
    console.error('여행지 삭제 서비스 오류:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: '여행지 삭제 중 오류가 발생했습니다.'
    };
  }
};