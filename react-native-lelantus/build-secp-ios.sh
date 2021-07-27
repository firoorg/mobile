#!/bin/bash

echo Build secp for ios started

# names
: ${LIBRARY:=libsecp256k1.a}

# build architectures
BUILD_ARCHS="armv7s armv7 arm64 i386 x86_64"

# commands
: ${LIPO="xcrun -sdk iphoneos lipo"}

# iphone SDK version
: ${IPHONE_SDKVERSION:=$(echo $(xcodebuild -showsdks) | grep -o  'iphonesimulator[0-9]\+.[0-9]\+' | grep -o  '[0-9]\+.[0-9]\+')}

# XCode directories
: ${XCODE_ROOT:=`xcode-select -print-path`}
XCODE_SIMULATOR=$XCODE_ROOT/Platforms/iPhoneSimulator.platform/Developer
XCODE_DEVICE=$XCODE_ROOT/Platforms/iPhoneOS.platform/Developer

XCODE_SIMULATOR_SDK=$XCODE_SIMULATOR/SDKs/iPhoneSimulator$IPHONE_SDKVERSION.sdk
XCODE_DEVICE_SDK=$XCODE_DEVICE/SDKs/iPhoneOS$IPHONE_SDKVERSION.sdk

XCODE_TOOLCHAIN_USR_BIN=$XCODE_ROOT/Toolchains/XcodeDefault.xctoolchain/usr/bin/
XCODE_USR_BIN=$XCODE_ROOT/usr/bin/

# save path
ORIGINAL_PATH=$PATH

source shared.sh

showConfig() {
  echo "Bundle Configuration..."
  echo
  echo "Build Directories..."
  echo "BUILD_DIR: $BUILD_DIR"
  echo
  echo "LIBRARY: $LIBRARY"
  echo
  echo "XCode Directories..."
  echo "XCODE_SIMULATOR: $XCODE_SIMULATOR"
  echo "XCODE_DEVICE: $XCODE_DEVICE"
  echo "XCODE_SIMULATOR_SDK: $XCODE_SIMULATOR_SDK"
  echo "XCODE_DEVICE_SDK: $XCODE_DEVICE_SDK"
  echo "XCODE_TOOLCHAIN_USR_BIN: $XCODE_TOOLCHAIN_USR_BIN"
  echo "XCODE_USR_BIN: $XCODE_USR_BIN"
  doneSection
}

developerToolsPresent () {
  echo "Check that developer tools present..."
  ENV_ERROR=0

  # check for root directories
  if [ ! -d "$XCODE_SIMULATOR" ]; then
    echo "ERROR: unable to find Xcode Simulator directory: $XCODE_SIMULATOR"
    ENV_ERROR=1
  fi

  # check for device directory
  if [ ! -d "$XCODE_DEVICE" ]; then
    echo "ERROR: unable to find Xcode Device directory: $XCODE_DEVICE"
    ENV_ERROR=1
  fi

  #check for SDKs
  if [ ! -d "$XCODE_SIMULATOR_SDK" ]; then
    echo "ERROR: Simulator SDK not found"
    ENV_ERROR=1
  fi

  if [ ! -d "$XCODE_DEVICE_SDK" ]; then
    echo "ERROR: Device SDK not found"
    ENV_ERROR=1
  fi

  # check for presence oc cross compiler tools
  if [ ! -d "$XCODE_TOOLCHAIN_USR_BIN" ]; then
    echo "ERROR: unable to find Xcode toolchain usr/bin directory: $XCODE_TOOLCHAIN_USR_BIN"
    ENV_ERROR=1
  fi

  if [ ! -d "$XCODE_USR_BIN" ]; then
    echo "ERROR: unable to find Xcode usr/bin directory: $XCODE_USR_BIN"
    ENV_ERROR=1
  fi

  local targetTools="clang++ clang ar ranlib libtool ld lipo"
  for tool in $targetTools
  do
    if [ ! -e "$XCODE_TOOLCHAIN_USR_BIN/$tool" ] && [ ! -e "$XCODE_USR_BIN/$tool" ]; then
      echo "ERROR: unable to find $tool at device or simulator IOS_TOOLCHAIN or XCODE_TOOLCHAIN"
      ENV_ERROR=1
    fi
  done

  doneSection
}

exportConfig() {
  echo "Export configuration..."
  IOS_ARCH=$1
  TARGET="none-apple-darwin"
  if [ "$IOS_ARCH" == "i386" ] || [ "$IOS_ARCH" == "x86_64" ]; then
    IOS_SYSROOT=$XCODE_SIMULATOR_SDK
  else
    IOS_SYSROOT=$XCODE_DEVICE_SDK
  fi
  CFLAGS="-arch $IOS_ARCH -fPIC -g -Os -pipe --sysroot=$IOS_SYSROOT -stdlib=libc++"
  if [ "$IOS_ARCH" == "armv7s" ] || [ "$IOS_ARCH" == "armv7" ]; then
    CFLAGS="$CFLAGS -mios-version-min=6.0"
  else
    CFLAGS="$CFLAGS -mios-version-min=7.0"
  fi
  CXXFLAGS=$CFLAGS
  CPPFLAGS=$CFLAGS
  CC_FOR_BUILD=/usr/bin/clang

  export CC=clang
  export CXX=clang++
  export CFLAGS
  export CXXFLAGS
  export IOS_SYSROOT
  export CC_FOR_BUILD
  export PATH="$XCODE_TOOLCHAIN_USR_BIN":"$XCODE_USR_BIN":"$ORIGINAL_PATH"
  
  echo "IOS_ARC: $IOS_ARCH"
  echo "CC: $CC"
  echo "CXX: $CXX"
  echo "LDFLAGS: $LDFLAGS"
  echo "CC_FOR_BUILD: $CC_FOR_BUILD"
  echo "CFLAGS: $CFLAGS"
  echo "CXXFLAGS: $CXXFLAGS"
  echo "IOS_SYSROOT: $IOS_SYSROOT"
  echo "PATH: $PATH"
  doneSection
}

# compileSrcForAllArchs() {
#   if [ ! -f "ios/libsecp.a" ]; then
#     for buildArch in $BUILD_ARCHS
#     do
#       exportConfig $buildArch
#       compileSrcForArch $buildArch
#     done
#   fi
# }

buildUniversalLib() {
  echo "Lipoing library to ios/libsecp.a..."
  $LIPO \
      -create \
      -arch armv7  "$BUILD_DIR/armv7/$LIBRARY" \
      -arch armv7s "$BUILD_DIR/armv7s/$LIBRARY" \
      -arch i386   "$BUILD_DIR/i386/$LIBRARY" \
      -arch x86_64 "$BUILD_DIR/x86_64/$LIBRARY" \
      -arch arm64  "$BUILD_DIR/arm64/$LIBRARY" \
      -o           "ios/libsecp.a" \
  || abort "lipo failed"
  doneSection
}

echo "================================================================="
echo "Start"
echo "================================================================="
showConfig
developerToolsPresent

if [ "$ENV_ERROR" == "0" ]; then
  cleanUp
  createDirs
  compileSrcForAllArchs
  buildUniversalLib
  cleanUp
  echo "Completed successfully.."
else
  echo "Build failed..."
fi
