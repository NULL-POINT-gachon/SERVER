const userService = require('../services/userService');
const googleClient = require('../middlewares/auth');
const userDto = require('../dtos/userDto');
const jwt = require('jsonwebtoken');

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
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(authUrl);
};

// Google 콜백 처리
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;
    
    // 이메일로 사용자 확인
    let user = await userService.findUserByEmail(email);
    
    if (!user) {
      // 임시 사용자 생성
      user = await userService.createGoogleUser({ email, name });
      
      // 프로필 완성을 위한 임시 토큰 생성
      const tempToken = userService.generateToken(user.id, { needsCompletion: true });
      
      return res.redirect(`/complete-profile?token=${tempToken}`);
    }
    
    // 정상 토큰 발급
    const token = userService.generateToken(user.id);

    
    res.redirect(`/?token=${token}`);
  } catch (error) {
    console.error('Google 인증 오류:', error);
    res.redirect('/login?error=google_auth_failed');
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
        token
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

module.exports = {
  signup ,
  googleLogin,
  googleCallback,
  completeProfile ,  
  login ,
  getUserProfile ,
  updateUserProfile
};