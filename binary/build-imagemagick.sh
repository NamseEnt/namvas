#!/bin/bash

# ImageMagick 정적 빌드 스크립트 (PSD + JPG 전용)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 지원하는 플랫폼 목록
PLATFORMS=("arm64" "x64")

echo "🔧 ImageMagick 정적 빌드 시작 (PSD + JPG 전용)..."
echo "📍 Amazon Linux 2023 기반 완전 정적 바이너리 생성"

# 각 플랫폼별로 빌드
for TARGET_ARCH in "${PLATFORMS[@]}"; do
    echo ""
    echo "🎯 플랫폼 빌드 시작: $TARGET_ARCH"
    
    # Docker 플랫폼 매핑
    case $TARGET_ARCH in
        "arm64")
            DOCKER_PLATFORM="linux/arm64"
            ;;
        "x64")
            DOCKER_PLATFORM="linux/amd64"
            ;;
    esac

    echo "🔍 빌드 대상 플랫폼: $TARGET_ARCH ($DOCKER_PLATFORM)"

    IMAGE_NAME="imagemagick-static-$TARGET_ARCH"
    CONTAINER_NAME="imagemagick-build-$TARGET_ARCH"

    # 이전 컨테이너 정리
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "🧹 이전 컨테이너 제거 중..."
        docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1
    fi

    # Docker 이미지 빌드 (플랫폼 지정)
    echo "🐳 Docker 이미지 빌드 중 (시간이 걸릴 수 있습니다)..."
    docker build --platform "${DOCKER_PLATFORM}" -f Dockerfile -t "${IMAGE_NAME}" "${SCRIPT_DIR}"

    # 컨테이너 생성 및 바이너리 추출
    echo "📦 정적 바이너리 추출 중..."
    docker create --name "${CONTAINER_NAME}" "${IMAGE_NAME}"
    
    # 바이너리 복사
    docker cp "${CONTAINER_NAME}:/output/magick" "${SCRIPT_DIR}/magick-$TARGET_ARCH"
    
    # 실행 권한 부여
    chmod +x "${SCRIPT_DIR}/magick-$TARGET_ARCH"
    
    # 컨테이너 정리
    docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1

    # 바이너리 정보 출력
    echo "📋 바이너리 정보:"
    file "${SCRIPT_DIR}/magick-$TARGET_ARCH"
    
    # 크기 확인
    SIZE=$(ls -lh "${SCRIPT_DIR}/magick-$TARGET_ARCH" | awk '{print $5}')
    echo "📏 바이너리 크기: $SIZE"
    
    echo ""
    echo "✅ $TARGET_ARCH 플랫폼 빌드 완료!"
    echo "📍 바이너리: ${SCRIPT_DIR}/magick-$TARGET_ARCH"
done

echo ""
echo "🎉 모든 플랫폼 빌드가 완료되었습니다!"
echo ""
echo "🚀 사용법:"
echo "  ARM64: ${SCRIPT_DIR}/magick-arm64 -version"
echo "  X64:   ${SCRIPT_DIR}/magick-x64 -version"
echo ""
echo "💡 특징:"
echo "  - 완전 정적 바이너리 (의존성 없음)"
echo "  - Amazon Linux 2023 기반 (Lambda 런타임과 동일)"
echo "  - PSD, JPG 형식 지원"
echo "  - Lambda 환경에 최적화"