
#include "Utils.h"
#include "CoreJni.h"
#include "org_firo_lelantus_Lelantus.h"
#include <android/log.h>

extern "C" {
JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jCreateMintCommitment
        (JNIEnv *env, jobject thisClass, jlong value,
         jstring jPrivateKey, jint index, jstring jSeed) {
	auto* privateKey = hex2bin(env->GetStringUTFChars(jPrivateKey, nullptr));

	auto* seed = hex2bin(env->GetStringUTFChars(jSeed, nullptr));
	std::vector<unsigned char> seedVector(seed, seed + 20);

	__android_log_print(ANDROID_LOG_INFO, "Tag", "value = %i", (int) value);
	__android_log_print(ANDROID_LOG_INFO, "Tag", "index = %d", index);
	for (int i = 0; i < 32; i++) {
		__android_log_print(ANDROID_LOG_INFO, "Tag", "privateKey = %i", (int) privateKey[i]);
	}
	for (int i = 0; i < 20; i++) {
		__android_log_print(ANDROID_LOG_INFO, "Tag", "seedVector = %i", (int) seedVector[i]);
	}

    const char* commitment = CreateMintCommitment(value, privateKey, index, uint160(seedVector));

    return env->NewStringUTF(commitment);
}

JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jCreateSpendProof
        (JNIEnv *env, jclass thisClass, jlong denominationValue, jstring jPrivateKey, jint index,
                jobjectArray jAnonymitySet, jint groupId, jstring jBlockHash, jstring jTxHash) {
//    sigma::CoinDenomination coinDenomination;
//    sigma::IntegerToDenomination((int64_t) denominationValue, coinDenomination);
//
//    const char *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
//
//    std::vector<const char *> anonymitySet;
//    int anonymitySetSize = env->GetArrayLength(jAnonymitySet);
//    for (int i = 0; i < anonymitySetSize; i++) {
//        auto string = (jstring) (env->GetObjectArrayElement(jAnonymitySet, i));
//        const char *rawString = env->GetStringUTFChars(string, nullptr);
//        anonymitySet.push_back(rawString);
//    }
//
//    const char *blockHash = env->GetStringUTFChars(jBlockHash, nullptr);
//    const char *txHash = env->GetStringUTFChars(jTxHash, nullptr);
//
//    const char *spendProof = CreateSpendProof(coinDenomination, privateKey, index,
//                                                anonymitySet, groupId, blockHash, txHash);
//
//    return env->NewStringUTF(spendProof);
}

JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jGetSerialNumber
        (JNIEnv *env, jclass thisClass, jlong denominationValue,
         jstring jPrivateKey, jint index) {
//    sigma::CoinDenomination coinDenomination;
//    sigma::IntegerToDenomination((int64_t) denominationValue, coinDenomination);
//
//    const char *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
//
//    const char *serialNumber = GetSerialNumber(coinDenomination, privateKey, index);
//
//    return env->NewStringUTF(serialNumber);
}

}