# E2E 테스트

이 디렉토리에는 Namvas 애플리케이션의 End-to-End 테스트가 포함되어 있습니다.

## 설치

```bash
cd e2e
npm install
npx playwright install
```

## 실행

### 헤드리스 모드로 테스트 실행
```bash
npm run test
```

### 브라우저를 보면서 테스트 실행
```bash
npm run test:headless
```

## 구조

- `src/runner.ts`: 메인 테스트 실행 스크립트
- `tests/`: Playwright 테스트 파일들
- `docker-compose.e2e.yml`: E2E 테스트용 Docker Compose 설정
- `playwright.config.ts`: Playwright 설정

## 작동 방식

1. Docker Compose로 백엔드, 프론트엔드, LocalStack 서비스 시작
2. 모든 서비스가 준비될 때까지 대기
3. Playwright 테스트 실행
4. 테스트 완료 후 Docker 환경 정리