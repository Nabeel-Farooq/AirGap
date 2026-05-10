FROM beevelop/ionic:v2021.06.1

# -----------------------------
# Environment
# -----------------------------
ENV DEBIAN_FRONTEND=noninteractive
ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV APP_DIR=/app

# -----------------------------
# Install system dependencies
# -----------------------------
RUN apt-get update && apt-get install -y \
    bzip2 \
    build-essential \
    pkg-config \
    libjpeg-dev \
    libcairo2-dev \
    openjdk-21-jdk-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Create app directory
# -----------------------------
WORKDIR ${APP_DIR}

# -----------------------------
# Upgrade Node.js
# -----------------------------
RUN yarn cache clean --force \
    && yarn global add n \
    && n 20 \
    && node --version \
    && npm --version

# -----------------------------
# Copy dependency manifests first
# (better Docker layer caching)
# -----------------------------
COPY \
    package.json \
    yarn.lock \
    apply-diagnostic-modules.js \
    patch-dependency-versions.js \
    fix-qrscanner-gradle.js \
    capacitor.config.ts \
    ionic.config.json \
    copy-builtin-modules.js \
    ./

# -----------------------------
# Install dependencies
# -----------------------------
RUN yarn install --frozen-lockfile \
    && mkdir -p www \
    && ionic info

# -----------------------------
# Copy project files
# -----------------------------
COPY . .

# -----------------------------
# Build arguments
# -----------------------------
ARG BUILD_NR=1

# Update Android versionCode
RUN sed -i \
    "s/versionCode 1/versionCode ${BUILD_NR}/g" \
    /app/android/app/build.gradle

# -----------------------------
# Production build
# -----------------------------
RUN yarn prepare-prod-build \
    && yarn apply-diagnostic-modules \
    && yarn jetifier \
    && yarn ionic build --prod \
    && yarn cap sync android \
    && yes | sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses \
    && yes | sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --update \
    && ./android/gradlew --project-dir ./android clean \
    && ./android/gradlew --project-dir ./android build

# -----------------------------
# Copy generated APKs
# -----------------------------
RUN cp android/app/build/outputs/apk/release/app-release-unsigned.apk \
      android-release-unsigned.apk \
    && cp android-release-unsigned.apk android-debug.apk \
    && cp android/app/build/outputs/apk/appium/app-appium-unsigned.apk \
      android-appium-unsigned.apk \
    && cp android-appium-unsigned.apk android-appium.apk

# -----------------------------
# Align & sign APKs
# -----------------------------
RUN zipalign -p -f -v 4 \
      android-debug.apk \
      android-debug-aligned.apk \
    && apksigner sign \
      --ks ./build/android/debug.keystore \
      --ks-key-alias androiddebugkey \
      --ks-pass pass:android \
      --key-pass pass:android \
      android-debug-aligned.apk

RUN zipalign -p -f -v 4 \
      android-appium.apk \
      android-appium-aligned.apk \
    && apksigner sign \
      --ks ./build/android/debug.keystore \
      --ks-key-alias androiddebugkey \
      --ks-pass pass:android \
      --key-pass pass:android \
      android-appium-aligned.apk

# -----------------------------
# Final output info
# -----------------------------
RUN ls -lah *.apk
