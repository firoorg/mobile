#!/bin/bash

# build directories
: ${SRC_DIR:=`pwd`/src}
: ${BUILD_DIR:=`pwd`/build}
: ${SIGMA_DIR:=`pwd`/native-libs/libsigma}
: ${NAME:=secp256k1}

doneSection() {
    echo
    echo "================================================================="
    echo "Done"
    echo
}

copyBundle() {
  echo "Copy bundle..."
  cp -a $SIGMA_DIR/$NAME/. $SRC_DIR
  doneSection
}

createDirs () {
  echo "Create directories..."
  [ -d $SRC_DIR ] || mkdir -p $SRC_DIR
  [ -d $BUILD_DIR ] || mkdir -p $BUILD_DIR
  doneSection
}

cleanUp() {
    echo "Cleaning up..."
    rm -rf $SRC_DIR
    rm -rf $BUILD_DIR
    doneSection
}

cleanUpSrc() {
    echo "Cleaning up src..."
    rm -rf $SRC_DIR
    doneSection
}

compileSrcForAllArchs() {
  for buildArch in $BUILD_ARCHS
  do
    exportConfig $buildArch
    compileSrcForArch $buildArch
  done
}

compileSrcForArch() {
  local buildArch=$1
  configureForArch $buildArch
  echo "Building source for architecture $buildArch..."
  ( cd $SRC_DIR; \
    echo "Calling make clean..."
    make clean; \
    echo "Calling make check..."
    make check; \
    echo "Calling make..."
    make;
    echo "Calling make install..." 
    make install; \ )
  echo $BUILD_DIR/$buildArch/lib/$LIBRARY
  mv $BUILD_DIR/$buildArch/lib/$LIBRARY $BUILD_DIR/$buildArch/$LIBRARY
  doneSection
}

configureForArch() {
  local buildArch=$1
  cleanUpSrc
  createDirs
  copyBundle
  mkdir -p $BUILD_DIR/$buildArch
  echo "Configure for architecture $buildArch..."
  ( cd $SRC_DIR; \ 
    ./autogen.sh; \
    ./configure --prefix=$BUILD_DIR/$buildArch --host=$TARGET --enable-tests=no --enable-experimental --enable-module-ecdh --with-bignum=no --enable-endomorphism)
  doneSection
}