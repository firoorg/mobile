# Sets the minimum version of CMake required to build your native library.
cmake_minimum_required(VERSION 3.10.2)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c99 -DANDROID_STL=gnustl_static -DANDROID_TOOLCHAIN=clang")

set(LIBLELANTUS_SRC_PATH src/main/jniLibs/liblelantus/src)
set(BITCOIN_PATH src/main/jniLibs/liblelantus/bitcoin)

file(GLOB_RECURSE SOURCE_FILES_C src/*.cpp src/*.hpp src/*.h)
file(GLOB_RECURSE LIBLELANTUS_SOURCE_FILES_C FOLLOW_SYMLINKS
        ${LIBLELANTUS_SRC_PATH}/*.cpp ${BITCOIN_PATH}/*.cpp *.hpp *.h)

add_library( # The name of the library.
        lelantus

        # Shared library.
        SHARED

        ${SOURCE_FILES_C}
        ${LIBLELANTUS_SOURCE_FILES_C})

include_directories(src/main/jniLibs/)
include_directories(src/main/jniLibs/liblelantus/secp256k1/include/)
include_directories(src/main/jniLibs/liblelantus/secp256k1/)
include_directories(src/main/jniLibs/liblelantus/)

add_library(ssl SHARED IMPORTED)
set_target_properties(ssl PROPERTIES IMPORTED_LOCATION ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libssl.so)

add_library(crypto SHARED IMPORTED)
set_target_properties(crypto PROPERTIES IMPORTED_LOCATION ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libcrypto.so)

add_library(secp256k1 SHARED IMPORTED)
set_target_properties(secp256k1 PROPERTIES IMPORTED_LOCATION ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libsecp256k1.so)

# add lib dependencies
target_link_libraries(
        lelantus
        android
        log
        ssl
        crypto
        secp256k1)
