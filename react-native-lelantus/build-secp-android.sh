#!/bin/bash

echo Build secp for android started

# names
: ${LIBRARY:=libsecp256k1.so}

# build architectures
BUILD_ARCHS="armeabi-v7a arm64-v8a x86 x86_64"

ANDROID_NDK_PATH=~/Library/Android/sdk/ndk-bundle
ANDROID_MIN_SDK=21

source shared.sh

showConfig() {
  echo "Bundle Configuration..."
  echo
  echo "Build Directories..."
  echo "SRC_DIR: $SRC_DIR"
  echo "BUILD_DIR: $BUILD_DIR"
  echo
  echo "LIBRARY: $LIBRARY"
  echo
  echo "Andorid Directories..."
  echo "ANDROID_NDK_PATH: $ANDROID_NDK_PATH"
  doneSection
}

exportConfig() {
  echo "Export configuration..."
  ANDORID_ARCH=$1
  TOOLCHAIN=$ANDROID_NDK_PATH/toolchains/llvm/prebuilt/darwin-x86_64

  if [ "$ANDORID_ARCH" == "armeabi-v7a" ]; then
    TARGET=armv7a-linux-androideabi
    TARGET_BIN=$TOOLCHAIN/arm-linux-androideabi/bin
  elif [ "$ANDORID_ARCH" == "arm64-v8a" ]; then
    TARGET=aarch64-linux-android
    TARGET_BIN=$TOOLCHAIN/aarch64-linux-android/bin
  elif [ "$ANDORID_ARCH" == "x86" ]; then
    TARGET=i686-linux-android
    TARGET_BIN=$TOOLCHAIN/i686-linux-android/bin
  elif [ "$ANDORID_ARCH" == "x86_64" ]; then
    TARGET=x86_64-linux-android
    TARGET_BIN=$TOOLCHAIN/x86_64-linux-android/bin
  fi

  export ANDROID_NDK_ROOT
  export TOOLCHAIN
  export API=$ANDROID_MIN_SDK
  export TARGET
  export AR=$TARGET_BIN/ar
  export AS=$TARGET_BIN/as
  export CC="$TOOLCHAIN/bin/$TARGET$API-clang"
  export CXX=$TOOLCHAIN/bin/$TARGET$API-clang++
  export LD=$TARGET_BIN/ld.bfd
  export RANLIB=$TARGET_BIN/ranlib
  export STRIP=$TARGET_BIN/strip
  export LIBS=" -lc++_shared -lm"

  echo "ANDROID_NDK_ROOT: $ANDROID_NDK_ROOT"
  echo "TOOLCHAIN: $TOOLCHAIN"
  echo "API: $API"
  echo "AR: $AR"
  echo "AS: $AS"
  echo "CC: $CC"
  echo "CXX: $CXX"
  echo "LD: $LD"
  echo "RANLIB: $RANLIB"
  echo "STRIP: $STRIP"
  doneSection
}

# compileSrcForAllArchs() {
#   for buildArch in $BUILD_ARCHS
#   do
#     if [ ! -f "android/src/main/jniLibs/$buildArch/$LIBRARY" ]; then
#       exportConfig $buildArch
#       compileSrcForArch $buildArch
#     fi
#   done
# }

copylibs() {
  echo "Copy libs..."
  for buildArch in $BUILD_ARCHS
  do
    mv $BUILD_DIR/$buildArch/$LIBRARY "android/src/main/jniLibs/$buildArch/$LIBRARY"
  done
  doneSection
}

echo "================================================================="
echo "Start"
echo "================================================================="
showConfig
cleanUp
compileSrcForAllArchs
copylibs
cleanUp