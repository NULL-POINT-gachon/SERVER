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

const createGoogleUser = async ({ email, name }) => {
  // 소셜 로그인은 'google:사용자ID'와 같은 형식으로 저장
  const googleId = `google:${email}`;
  const hashedId = await bcrypt.hash(googleId, 10);
  
  const userId = await userRepository.createUser({
    name,
    email,
    password: hashedId,  // 비밀번호 필드에 해싱된 소셜ID 저장
    age: null,
    gender: null,
    residence: null
  });
  
  const newUser = await userRepository.findUserById(userId);
  return newUser;
};

const updateUserProfile = async (userId, profileData) => {
  await userRepository.updateUser(userId, profileData);
  const user = await userRepository.findUserById(userId);
  return user;
};

const findUserByEmail = async (email) => {
  const user = await userRepository.findUserByEmail(email);
  return user;
};

// 사용자 ID로 조회
const getUserById = async (userId) => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw { status: 404, message: '사용자를 찾을 수 없습니다' };
  }
  return userDto.toResponse(user);
};

module.exports = {
  registerUser ,
  createGoogleUser,
  updateUserProfile , 
  findUserByEmail ,
  getUserById
};