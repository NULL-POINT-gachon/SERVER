const userService = require('../services/userService');

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

module.exports = {
  signup
};