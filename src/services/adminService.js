const adminRepository = require('../repositories/adminRepository');

// 전체 사용자 목록 조회
exports.getAllUsers = async () => {
  // 실제 DB 연결
  return await adminRepository.findAllUsers();

  // // 🔁 테스트용 Mock 데이터
  // console.log('[Mock] 전체 사용자 조회');
  // return [
  //   { id: 1, name: "김철수", email: "chulsoo@example.com", age: 29, gender: "남성", status: 1 },
  //   { id: 2, name: "이영희", email: "younghee@example.com", age: 25, gender: "여성", status: 0 },
  // ];
};

// 특정 사용자 상세 조회
exports.getUserById = async (userId) => {
  return await adminRepository.findUserById(userId);

  // // Mock
  // console.log('[Mock] 사용자 상세 조회:', userId);
  // return { id: 1, name: "김철수", email: "chulsoo@example.com", age: 29, gender: "남성", status: 1 };
};

// 사용자 상태 변경
exports.updateUserStatus = async (userId, status) => {
  const success = await adminRepository.updateUserStatus(userId, status);
  return { userId, updatedStatus: status, success };

  // // Mock
  // console.log('[Mock] 사용자 상태 변경:', userId, status);
  // return { userId, updatedStatus: status };
};