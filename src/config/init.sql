-- 여행지 테이블 생성
CREATE TABLE IF NOT EXISTS TravelDestination (
  id INT PRIMARY KEY AUTO_INCREMENT,
  destination_name VARCHAR(100) NOT NULL,
  address VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone_number VARCHAR(20),
  operating_hours VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 