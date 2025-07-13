# Namvas

## 개발 환경 설정

이 프로젝트는 **Bun**을 패키지 매니저로 사용합니다. npm 대신 Bun을 사용해 주세요.

### Bun 설치

```bash
curl -fsSL https://bun.sh/install | bash
```

### 의존성 설치

프로젝트 루트에서 다음 명령어를 실행하여 모든 워크스페이스의 의존성을 설치합니다:

```bash
bun install
```

### 개발 서버 실행

```bash
bun run dev
```

## 주의사항

- **npm** 대신 **bun**을 사용하세요
- **npx** 대신 **bunx**를 사용하세요
- 새로운 패키지 설치 시: `bun add <package-name>`
- 개발 의존성 설치 시: `bun add -d <package-name>`

## 워크스페이스 구조

- `be/` - 백엔드
- `fe/` - 프론트엔드
- `e2e/` - E2E 테스트
- `infra/` - 인프라 코드
- `local-lambda-emulator/` - 로컬 Lambda 에뮬레이터
- `shared/` - 공유 코드