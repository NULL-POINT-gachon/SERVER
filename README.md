
# Exclamation - 감정 기반 여행 추천 서비스

## 폴더 구조
backend/
├── src/
│   ├── config/         # 환경설정, DB연결정보
│   ├── controllers/    # 요청 처리, 응답 반환
│   ├── dtos/           # 데이터 전송 객체
│   ├── middlewares/    # 인증, 로깅, 오류 처리
│   ├── repositories/   # 데이터 접근 로직
│   ├── routes/         # API 엔드포인트 정의
│   ├── services/       # 비즈니스 로직
│   └── index.js        # 앱 진입점
├── .env                # 환경 변수 (git에 포함하지 않음)
├── .gitignore          # git 제외 파일 목록
└── package.json        # 프로젝트 메타데이터, 의존성

## 브랜치 관리 전략
저희 프로젝트는 Git-Flow 기반의 브랜치 전략을 사용합니다.

### 브랜치 구조
- `main`: 배포 가능한 상태의 코드
- `dev`: 개발 중인 코드의 통합 브랜치
- 기능별 브랜치: 개별 기능 개발

### 브랜치 명명 규칙
기능별 브랜치는 다음 형식을 따릅니다:
[label]/#이슈번호-기능명
Copy
예시:
- `feature/#12-user-authentication`
- `fix/#23-login-error`
- `refactor/#45-optimize-query`

### 작업 흐름
1. 이슈 생성 및 할당
2. 기능 브랜치 생성 (`dev`에서 분기)
3. 작업 완료 후 `dev`로 Pull Request 생성
4. 코드 리뷰 및 승인
5. `dev`에 병합
6. 정기적으로 `dev`에서 `main`으로 병합 (배포 시점)

## 커밋 메시지 규칙
커밋 메시지는 다음 형식을 따릅니다:
[Type]: 간결한 제목 (이슈 번호)

상세 내용 1
상세 내용 2


Type 종류:
- `Feat`: 새로운 기능 추가
- `Fix`: 버그 수정
- `Refactor`: 코드 리팩토링
- `Docs`: 문서 작업

- `Chore`: 빌드 작업, 패키지 매니저 설정 등

예시:
[Feat]: 사용자 로그인 기능 구현 (#12)

JWT 기반 인증 로직 추가
로그인 API 엔드포인트 구현
