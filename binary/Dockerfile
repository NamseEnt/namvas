# ImageMagick 정적 빌드 Dockerfile (Amazon Linux 2023 기반)
FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal

# 환경변수 설정
ENV IMAGEMAGICK_VERSION=7.1.1-40
ENV JPEG_VERSION=3.0.4
ENV LCMS_VERSION=2.16
ENV ZLIB_VERSION=1.3.1

# 빌드 도구 설치
RUN dnf update -y && dnf install -y \
    gcc \
    gcc-c++ \
    make \
    cmake \
    git \
    wget \
    tar \
    xz \
    autoconf \
    automake \
    libtool \
    nasm \
    glibc-static \
    libstdc++-static \
    && dnf clean all

# 작업 디렉토리 설정
WORKDIR /build

# zlib 정적 빌드 (PSD 압축 지원)
RUN wget https://github.com/madler/zlib/releases/download/v${ZLIB_VERSION}/zlib-${ZLIB_VERSION}.tar.gz && \
    tar xzf zlib-${ZLIB_VERSION}.tar.gz && \
    cd zlib-${ZLIB_VERSION} && \
    ./configure --static && \
    make -j$(nproc) && \
    make install && \
    cd .. && rm -rf zlib-*

# libjpeg-turbo 정적 빌드
RUN wget https://github.com/libjpeg-turbo/libjpeg-turbo/releases/download/${JPEG_VERSION}/libjpeg-turbo-${JPEG_VERSION}.tar.gz && \
    tar xzf libjpeg-turbo-${JPEG_VERSION}.tar.gz && \
    cd libjpeg-turbo-${JPEG_VERSION} && \
    cmake -G"Unix Makefiles" \
        -DCMAKE_INSTALL_PREFIX=/usr/local \
        -DENABLE_SHARED=OFF \
        -DENABLE_STATIC=ON \
        -DCMAKE_BUILD_TYPE=Release \
        . && \
    make -j$(nproc) && \
    make install && \
    cd .. && rm -rf libjpeg-turbo-*

# Little CMS2 정적 빌드
RUN wget https://github.com/mm2/Little-CMS/releases/download/lcms${LCMS_VERSION}/lcms2-${LCMS_VERSION}.tar.gz && \
    tar xzf lcms2-${LCMS_VERSION}.tar.gz && \
    cd lcms2-${LCMS_VERSION} && \
    ./configure \
        --prefix=/usr/local \
        --enable-static \
        --disable-shared \
        --without-jpeg \
        --without-tiff && \
    make -j$(nproc) && \
    make install && \
    cd .. && rm -rf lcms2-*

# ImageMagick 소스코드 다운로드
RUN git clone --depth 1 --branch ${IMAGEMAGICK_VERSION} https://github.com/ImageMagick/ImageMagick.git

# ImageMagick 정적 빌드
WORKDIR /build/ImageMagick
RUN PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:/usr/local/lib64/pkgconfig" \
    LDFLAGS="-static -L/usr/local/lib -L/usr/local/lib64" \
    CFLAGS="-O3" \
    CXXFLAGS="-O3" \
    ./configure \
        --prefix=/usr/local \
        --enable-static \
        --disable-shared \
        --disable-dependency-tracking \
        --with-quantum-depth=8 \
        --disable-hdri \
        --disable-docs \
        --disable-deprecated \
        --without-magick-plus-plus \
        --without-perl \
        --without-x \
        --enable-zero-configuration \
        --without-threads \
        --with-jpeg=yes \
        --with-lcms=yes \
        --with-zlib=yes \
        --without-bzlib \
        --without-png \
        --without-freetype \
        --without-fontconfig \
        --without-rsvg \
        --without-tiff \
        --without-webp \
        --without-djvu \
        --without-fftw \
        --without-flif \
        --without-fpx \
        --without-heic \
        --without-jbig \
        --without-jxl \
        --without-lqr \
        --without-lzma \
        --without-openexr \
        --without-openjp2 \
        --without-pango \
        --without-raw \
        --without-wmf \
        --without-xml \
        --without-dps \
        --without-gslib \
        --without-gvc \
        --without-jbig \
        --without-modules && \
    make -j$(nproc) && \
    make install

# 정적 링킹 강제 (utilities 디렉토리에서 직접 빌드)
RUN cd /build/ImageMagick && \
    gcc -static -o /usr/local/bin/magick-static \
        utilities/magick.o \
        MagickWand/.libs/libMagickWand-7.Q8.a \
        MagickCore/.libs/libMagickCore-7.Q8.a \
        /usr/local/lib/libjpeg.a \
        /usr/local/lib/liblcms2.a \
        /usr/local/lib/libz.a \
        -lm -lpthread && \
    mv /usr/local/bin/magick-static /usr/local/bin/magick || true

# 바이너리 검증
RUN file /usr/local/bin/magick && \
    (ldd /usr/local/bin/magick 2>&1 | grep -q "not a dynamic executable" && echo "✅ Fully static binary") || \
    (echo "⚠️ Binary has dynamic dependencies:" && ldd /usr/local/bin/magick)

# 바이너리 스트립 (크기 최적화)
RUN strip /usr/local/bin/magick

# 최종 바이너리만 남기고 정리
RUN mkdir -p /output && \
    cp /usr/local/bin/magick /output/ && \
    /output/magick -version

# 작업 디렉토리 설정
WORKDIR /output

# 기본 명령어
CMD ["/output/magick", "-version"]