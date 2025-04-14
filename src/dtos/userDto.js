const toResponse = (user) => {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      residence: user.residence,
      created_at: user.created_at
    };
  };
  
  const validate = (userData) => {
    const errors = {};
    
    if (!userData.name || userData.name.trim().length < 2) {
      errors.name = '이름은 2자 이상이어야 합니다';
    }
    
    if (!userData.email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(userData.email)) {
      errors.email = '유효한 이메일을 입력해주세요';
    }
    
    if (!userData.password || userData.password.length < 8) {
      errors.password = '비밀번호는 8자 이상이어야 합니다';
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
  
  module.exports = {
    toResponse,
    validate
  };