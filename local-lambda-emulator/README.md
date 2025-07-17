# Local Lambda Emulator

AWS Lambda 함수를 로컬에서 실행하는 에뮬레이터입니다.

## 기능

- LLRT(Low Latency Runtime)를 사용한 Lambda 함수 실행
- Docker 컨테이너 또는 로컬 환경에서 실행 가능
- 자동 코드 빌드 (watch 모드)
- 요청 큐잉 시스템
- 스케줄러 지원

## 사용 방법

### Docker 모드 (권장)

```bash
bun run dev
```

에뮬레이터가 자동으로 Docker 이미지를 빌드하고, 요청마다 Docker 컨테이너를 spawn하여 Lambda 함수를 실행합니다.

### 로컬 모드

1. LLRT 설치 필요
2. 환경변수 설정:
```bash
USE_DOCKER_LAMBDA=false bun run dev
```

## 환경 변수

- `PORT`: 에뮬레이터 서버 포트 (기본: 3003)
- `USE_DOCKER_LAMBDA`: Docker 사용 여부 (기본: true)
- `BE_PATH`: 백엔드 코드 경로 (기본: ../be)

## Docker 컨테이너

- Amazon Linux 2023 기반
- LLRT 내장
- 요청마다 새 컨테이너 생성 (실제 Lambda와 유사한 격리)
- 볼륨 마운트로 코드 변경 즉시 반영
- --network host로 localhost 접근 가능