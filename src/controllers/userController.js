const userService = require('../services/userService');
const userDto = require('../dtos/userDto');
const jwt = require('jsonwebtoken');
const { googleClient } = require('../middlewares/auth');  // 구조 분해 할당 사용
const { google } = require('googleapis');  // googleapis 패키지 추가

console.log('Controller: Google Client Type:', typeof googleClient);
console.log('Controller: Google Client Methods:', Object.keys(googleClient).join(', '));
console.log('Controller: generateAuthUrl exists:', typeof googleClient.generateAuthUrl === 'function');

const signup = async (req, res, next) => {
  try {
    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      age: req.body.age || null,
      gender: req.body.gender || null,
      residence: req.body.residence || null
    };
    
    const result = await userService.registerUser(userData);
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: result
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        errors: error.errors
      });
    }
    next(error);
  }
};
// Google 로그인 페이지로 리다이렉트
const googleLogin = (req, res) => {
  try {
    console.log('Google 로그인 시작');
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

      // generateAuthUrl 호출 전 추가 디버깅
      console.log('GoogleClient 함수 확인:', {
        generateAuthUrl: typeof googleClient.generateAuthUrl
      });
  
      // 인증 URL 생성
      const authUrl = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        include_granted_scopes: true
      });
      
      console.log('생성된 authUrl:', authUrl);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Google 로그인 오류:', error);
      res.redirect('/login?error=google_login_failed');
    }
  };
  
// Google 콜백 처리
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    console.log('Google 콜백 코드 수신:', code ? '있음' : '없음');
    
    // 코드로 토큰 교환
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    
    // userinfo API를 사용하여 사용자 정보 가져오기
    const oauth2 = google.oauth2('v2');
    const userInfo = await oauth2.userinfo.get({ auth: googleClient });
    
    const { email, name, picture } = userInfo.data;
    console.log('Google 사용자 정보:', { email, name: name || 'Not provided' });
    
    // 이메일로 사용자 확인
    let user = await userService.findUserByEmail(email);
    
    if (!user) {
      // 임시 사용자 생성
      user = await userService.createGoogleUser({ email, name, picture });
      
      // 프로필 완성을 위한 임시 토큰 생성
      const tempToken = jwt.sign(
        { userId: user.id, needsCompletion: true },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      // 프론트엔드의 프로필 완성 페이지로 리다이렉트
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3001';
      return res.redirect(`${clientUrl}/complete-profile?token=${tempToken}`);
    }
    
    // 정상 토큰 발급
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // 프론트엔드 메인 페이지로 리다이렉트
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}?token=${token}`);
  } catch (error) {
    console.error('Google 인증 오류:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
};

// 프로필 완성
const completeProfile = async (req, res) => {
  try {
    const { token, age, gender, residence } = req.body;
    
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.needsCompletion) {
      return res.status(400).json({ success: false, message: '유효하지 않은 요청입니다' });
    }
    
    // 사용자 정보 업데이트
    await userService.updateUserProfile(decoded.userId, { age, gender, residence });
    
    // 정상 토큰 발급
    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: '프로필이 완성되었습니다',
      token: newToken
    });
  } catch (error) {
    console.error('프로필 완성 오류:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다' });
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요'
      });
    }
    
    const { user, token } = await userService.loginUser(email, password);
    
    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        user: userDto.toResponse(user),
        token,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

// 사용자 정보 조회
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await userService.getUserById(userId);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

//사용자 정보 수정 
const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, age, gender, residence } = req.body;
    
    const updatedUser = await userService.updateUserProfile(userId, {
      name, age, gender, residence
    });
    
    res.status(200).json({
      success: true,
      message: '프로필이 업데이트되었습니다',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// 사용자 계정 비활성화 (소프트 삭제)
const deactivateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await userService.deactivateUser(userId);
    
    res.status(200).json({
      success: true,
      message: '계정이 비활성화되었습니다'
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  signup ,
  googleLogin,
  googleCallback,
  completeProfile ,  
  login ,
  getUserProfile ,
  updateUserProfile ,
  deactivateUser
};