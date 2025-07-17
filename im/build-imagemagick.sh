#!/bin/bash

# ImageMagick 최소 빌드 스크립트 (PSD + JPG 전용) - 모든 플랫폼

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 지원하는 플랫폼 목록
PLATFORMS=("arm64" "x64")

echo "🔧 ImageMagick 최소 빌드 시작 (PSD + JPG 전용) - 모든 플랫폼..."

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

    IMAGE_NAME="imagemagick-$TARGET_ARCH"
    CONTAINER_NAME="imagemagick-container-$TARGET_ARCH"
    OUTPUT_DIR="${SCRIPT_DIR}/imagemagick-$TARGET_ARCH"

    # 이전 컨테이너 정리
    if docker ps -a --format 'table {{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "🧹 이전 컨테이너 제거 중..."
        docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1
    fi

    # Docker 이미지 빌드 (플랫폼 지정)
    echo "🐳 Docker 이미지 빌드 중..."
    docker build --platform "${DOCKER_PLATFORM}" -f Dockerfile -t "${IMAGE_NAME}" "${SCRIPT_DIR}"

    # 컨테이너 실행 (백그라운드)
    echo "📦 컨테이너 실행 중..."
    docker run -d --name "${CONTAINER_NAME}" "${IMAGE_NAME}" sleep 3600

    # 출력 디렉토리 생성
    mkdir -p "${OUTPUT_DIR}/bin"
    mkdir -p "${OUTPUT_DIR}/lib"

    # ImageMagick 실행파일 복사
    echo "📋 ImageMagick 실행파일 추출 중..."
    docker cp "${CONTAINER_NAME}:/usr/local/bin/magick" "${OUTPUT_DIR}/bin/"
    docker cp "${CONTAINER_NAME}:/usr/local/bin/identify" "${OUTPUT_DIR}/bin/" 2>/dev/null || true
    docker cp "${CONTAINER_NAME}:/usr/local/bin/convert" "${OUTPUT_DIR}/bin/" 2>/dev/null || true
    docker cp "${CONTAINER_NAME}:/usr/local/bin/mogrify" "${OUTPUT_DIR}/bin/" 2>/dev/null || true

    # ImageMagick 라이브러리 복사
    echo "📚 ImageMagick 라이브러리 추출 중..."
    docker cp "${CONTAINER_NAME}:/usr/local/lib/." "${OUTPUT_DIR}/lib/"

    # 실행 권한 부여
    chmod +x "${OUTPUT_DIR}"/bin/*

    # 컨테이너 정리
    echo "🧹 컨테이너 정리 중..."
    docker rm -f "${CONTAINER_NAME}" > /dev/null 2>&1

    # 실행 래퍼 스크립트 생성
    cat > "${OUTPUT_DIR}/magick.sh" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export LD_LIBRARY_PATH="${SCRIPT_DIR}/lib:${LD_LIBRARY_PATH}"
exec "${SCRIPT_DIR}/bin/magick" "$@"
EOF

    chmod +x "${OUTPUT_DIR}/magick.sh"

    # 압축 파일 생성
    echo "📦 압축 파일 생성 중..."
    ARCHIVE_NAME="imagemagick-$TARGET_ARCH.tar.zst"
    rm -f "${SCRIPT_DIR}/${ARCHIVE_NAME}"
    tar -cf - -C "${OUTPUT_DIR}" . | zstd -o "${SCRIPT_DIR}/${ARCHIVE_NAME}"

    # 버전 정보 출력
    echo "📋 설치된 ImageMagick 버전:"
    docker run --rm --platform "${DOCKER_PLATFORM}" -v "${OUTPUT_DIR}:/workspace" "${IMAGE_NAME}" /workspace/bin/magick -version | head -3

    echo ""
    echo "✅ $TARGET_ARCH 플랫폼 빌드 완료!"
    echo "📍 ImageMagick 위치: ${OUTPUT_DIR}"
    echo "📦 압축 파일: ${SCRIPT_DIR}/${ARCHIVE_NAME}"
done

echo ""
echo "🎉 모든 플랫폼 빌드가 완료되었습니다!"
echo ""
echo "🚀 사용법:"
echo "  ARM64: ${SCRIPT_DIR}/imagemagick-arm64/magick.sh -version"
echo "  X64:   ${SCRIPT_DIR}/imagemagick-x64/magick.sh -version"
echo "  지원 포맷: PSD, JPG"