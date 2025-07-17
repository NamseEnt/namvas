# ImageMagick 최소 빌드 Dockerfile (PSD + JPG 전용)
FROM ubuntu:22.04

# 환경변수 설정
ENV DEBIAN_FRONTEND=noninteractive
ENV IMAGEMAGICK_VERSION=7.1.1-40

# 최소 의존성 패키지 설치 (PSD + JPG 전용)
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    git \
    wget \
    libjpeg-dev \
    liblcms2-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ImageMagick 소스코드 다운로드
WORKDIR /tmp
RUN git clone --depth 1 --branch ${IMAGEMAGICK_VERSION} https://github.com/ImageMagick/ImageMagick.git

# ImageMagick 최적화 빌드 및 설치 (PSD + JPG 전용)
WORKDIR /tmp/ImageMagick
RUN ./configure \
    --with-quantum-depth=8 \
    --disable-hdri \
    --with-magick-plus-plus=no \
    --with-perl=no \
    --disable-static \
    --with-jpeg \
    --with-lcms \
    --without-png \
    --without-tiff \
    --without-webp \
    --without-gif \
    --without-raw \
    --without-freetype \
    --without-fontconfig \
    --without-x11 \
    --without-xml \
    --without-bzlib \
    --without-lzma \
    --without-zstd \
    --without-zip \
    --prefix=/usr/local

RUN make -j$(nproc)
RUN make install

# 라이브러리 캐시 업데이트
RUN ldconfig /usr/local/lib

# 임시 파일 정리
WORKDIR /
RUN rm -rf /tmp/ImageMagick

# 빌드 도구 제거 (이미지 크기 최적화)
RUN apt-get remove -y \
    build-essential \
    git \
    wget \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ImageMagick 설치 확인
RUN magick -version

# 작업 디렉토리 설정
WORKDIR /workspace

# 기본 명령어
CMD ["magick", "--help"]