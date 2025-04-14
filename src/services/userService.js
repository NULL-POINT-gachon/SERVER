const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const userDto = require('../dtos/userDto');

const registerUser = async (userData) => {
  // 유효성 검사
  const errors = userDto.validate(userData);
  if (errors) {
    throw { status: 400, message: 'Validation failed', errors };
  }
  
  // 이메일 중복 확인
  const existingUser = await userRepository.findUserByEmail(userData.email);
  if (existingUser) {
    throw { status: 409, message: '이미 등록된 이메일입니다' };
  }
  
  // 비밀번호 해싱
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  
  // 사용자 생성
  const userId = await userRepository.createUser({
    ...userData,
    password: hashedPassword
  });
  
  // 생성된 사용자 조회
  const newUser = await userRepository.findUserById(userId);
  if (!newUser) {
    throw { status: 500, message: '사용자 생성 후 조회 실패' };
  }
  
  return userDto.toResponse(newUser);
};

module.exports = {
  registerUser
};