# Namvas

## 프로젝트 구조

- `fe/` - React 프론트엔드 (Vite + TanStack Router)
- `be/` - 백엔드 API (Bun)
- `db/` - 데이터베이스 모듈
- `shared/` - 공유 타입 및 API 스펙

## 개발 환경 실행

### 백엔드 개발 서버
```bash
cd be
bun run dev
```

### 프론트엔드 개발 서버  
```bash
cd fe
npm run dev
```

## 테스트

```bash
# 백엔드 테스트
cd be && bun test

# 프론트엔드 테스트
cd fe && npm test
```

## 개발 참고사항

- **프론트엔드**: `fe/CLAUDE.md` 파일에 개발 가이드라인 있음
- **API 스펙**: `shared/apiSpec.ts`에 정의
- **라우팅**: TanStack Router 사용 (파일 기반 라우팅)