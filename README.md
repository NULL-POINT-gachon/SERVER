
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


## 이슈 및 브랜치 관리 가이드

### 이슈 라벨 종류
우리 프로젝트는 다음과 같은 이슈 라벨을 사용합니다:

| 라벨 | 색상 코드 | 설명 |
|------|---------|------|
| ✨ Feature | `#0075ca` | 새로운 기능 개발 관련 이슈 |
| 🐛 Bug | `#d73a4a` | 버그 수정 관련 이슈 |
| 🔨 Refactor | `#a2eeef` | 코드 리팩토링, 성능 개선 관련 이슈 |
| 📚 Documentation | `#0075ca` | 문서 작업, 주석 추가 관련 이슈 |
| 🔥 Hotfix | `#b60205` | 긴급 수정이 필요한 이슈 |

### 이슈 생성 및 브랜치 관리 워크플로우

1. **이슈 생성**
   - 이슈 제목은 `[라벨 이모지] 작업 내용` 형식으로 작성합니다.
   - 예: `[✨ Feature] 사용자 인증 기능 구현`
   - 이슈 본문에는 다음 내용을 포함합니다:
     - 설명: 이슈의 목적과 배경
     - 작업 내용: 체크리스트 형식으로 상세 작업 항목
     - 기술 스택: 사용할 주요 기술
     - 참고 자료: 관련 문서나 링크

2. **브랜치 생성**
   - 브랜치명은 `[label]/#이슈번호-간략한_설명` 형식으로 작성합니다.
   - 라벨은 feature, fix, refactor 등 이슈 라벨에서 이모지를 제외한 영문으로 사용합니다.
   - 예시:
     - `feature/#12-user-authentication`
     - `fix/#23-login-error`
     - `refactor/#45-optimize-query`
   - 브랜치는 항상 `dev` 브랜치에서 생성합니다:
     ```
     git checkout dev
     git pull origin dev
     git checkout -b feature/#12-user-authentication
     ```

3. **Pull Request 생성**
   - 작업이 완료되면 `dev` 브랜치로 PR을 생성합니다.
   - PR 제목은 `[라벨]: 작업 내용 (#이슈번호)` 형식으로 작성합니다.
   - PR 설명에는 구현 내용, 테스트 방법, 스크린샷(필요시)을 포함합니다.
   - 관련 이슈를 PR 설명에 연결합니다: `Closes #이슈번호`

4. **코드 리뷰 및 병합**
   - 최소 1명 이상의 팀원 리뷰를 받아야 합니다.
   - 모든 CI 검사를 통과해야 합니다.
   - 승인된 PR은 Squash and Merge 방식으로 병합합니다.

6. **브랜치 정리**
   - 병합 완료 후 해당 브랜치는 삭제합니다.
   - 로컬에서도 브랜치를 정리합니다:
     ```
     git checkout dev
     git pull origin dev
     git branch -d feature/#12-user-authentication
     ```

### 릴리스 프로세스

1. 개발 사이클이 완료되면 `dev`에서 `main`으로 PR을 생성합니다.
2. 팀 전체 리뷰 후 승인되면 `main`으로 병합합니다.
3. 병합 후 태그를 생성합니다: `v1.0.0` (Semantic Versioning 준수)
4. 릴리스 노트를 작성하여 해당 버전의 주요 변경사항을 기록합니다.
