# Backend Development Guide

## 테스트 실행 방법

### ✅ 올바른 방법
```bash
npm run test
```

### ❌ 사용 금지
```bash
bun test  # LLRT 환경이 필요하므로 사용 불가
```

## 이유
이 프로젝트는 AWS Lambda에서 LLRT(Low Latency Runtime) 환경을 사용합니다. 
테스트도 LLRT 환경에서 실행되어야 하므로 `npm run test`를 사용해야 합니다.

## 주요 명령어
- `npm run test` - LLRT 환경에서 테스트 실행
- `npm run build:lambda` - Lambda 함수 빌드
- `npm run schema-gen` - 데이터베이스 스키마 생성
- `npx tsc --noEmit` - TypeScript 컴파일 체크