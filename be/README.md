# Backend API

AWS Lambda와 Bun을 지원하는 백엔드 API 서버입니다.

## 구조

```
be/
├── src/
│   ├── handlers/        # API 핸들러들
│   ├── lambda/         # AWS Lambda 엔트리포인트
│   ├── dev-server.ts   # 개발 서버
│   ├── router.ts       # API 라우터
│   └── types.ts        # 타입 정의
├── tests/              # 유닛 테스트
└── lambda/             # 빌드된 Lambda 파일들
```

## 개발 환경

```bash
# 의존성 설치
bun install

# 개발 서버 실행 (포트 3002)
bun run dev

# 테스트 실행
bun test

# 테스트 watch 모드
bun run test:watch
```

## 프로덕션 (AWS Lambda)

```bash
# Lambda용 빌드
bun run build
```

빌드된 파일들은 `lambda/` 디렉토리에 생성됩니다.

### Lambda 설정

1. Runtime: Custom runtime (Amazon Linux 2)
2. Handler: `.fetch`
3. Bun Lambda Layer 연결 필요
4. Environment Variables:
   - `NODE_ENV=production`

## API 엔드포인트

- `GET /health` - 헬스체크
- `POST /getMe` - 사용자 정보 조회

모든 API는 `shared/apiSpec.ts`의 타입 스펙을 따릅니다.

## 테스트

핸들러 함수를 직접 호출하는 유닛 테스트로 구현되어 있습니다.

```bash
# 테스트 실행
bun test
```
