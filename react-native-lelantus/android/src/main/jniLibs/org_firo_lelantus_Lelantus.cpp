
#include "Utils.h"
#include "org_firo_lelantus_Lelantus.h"
#include <android/log.h>

extern "C" {
JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jCreateMintScript
		(JNIEnv *env, jobject thisClass, jlong value,
		 jstring jPrivateKey, jint index, jstring jSeed) {
	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	auto *seed = env->GetStringUTFChars(jSeed, nullptr);
	const char *script = CreateMintScript(value, privateKey, index, seed);
	return env->NewStringUTF(script);
}

JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jGetPublicCoin
		(JNIEnv *env, jobject thisClass, jlong value,
		 jstring jPrivateKey, jint index) {
	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	const char *publicCoin = GetPublicCoin(value, privateKey, index);
	return env->NewStringUTF(publicCoin);
}

JNIEXPORT jobject JNICALL Java_org_firo_lelantus_Lelantus_jEstimateJoinSplitFee
		(JNIEnv *env, jobject thisClass, jlong spendAmount,
		 jboolean subtractFeeFromAmount, jstring jPrivateKey,
		 jobject jLelantusEntryList) {
	jclass alCls = env->FindClass("java/util/List");
	jclass leCls = env->FindClass("org/firo/lelantus/LelantusEntry");
	jclass jsdCls = env->FindClass("org/firo/lelantus/JoinSplitData");

	if (alCls == nullptr || leCls == nullptr || jsdCls == nullptr) {
		return nullptr;
	}

	jmethodID alGetId = env->GetMethodID(alCls, "get", "(I)Ljava/lang/Object;");
	jmethodID alSizeId = env->GetMethodID(alCls, "size", "()I");
	jmethodID leGetAmountId = env->GetMethodID(leCls, "getAmount", "()J");
	jmethodID leGetIndexId = env->GetMethodID(leCls, "getIndex", "()I");
	jmethodID leIsUsedId = env->GetMethodID(leCls, "isUsed", "()Z");
	jmethodID leGetHeightId = env->GetMethodID(leCls, "getHeight", "()I");
	jmethodID leGetAnonymitySetIdId = env->GetMethodID(leCls, "getAnonymitySetId", "()I");
	jmethodID jsdConstructor = env->GetMethodID(jsdCls, "<init>", "(JJ)V");

	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);

	int coinCount = static_cast<int>(env->CallIntMethod(jLelantusEntryList, alSizeId));

	std::list<LelantusEntry> coins;
	int index, height, anonymitySetId;
	long amount;
	bool isUsed;

	for (int i = 0; i < coinCount; ++i) {
		jobject mintCoin = env->CallObjectMethod(jLelantusEntryList, alGetId, i);
		amount = static_cast<long>(env->CallLongMethod(mintCoin, leGetAmountId));
		index = static_cast<int>(env->CallIntMethod(mintCoin, leGetIndexId));
		isUsed = static_cast<bool>(env->CallBooleanMethod(mintCoin, leIsUsedId));
		height = static_cast<bool>(env->CallIntMethod(mintCoin, leGetHeightId));
		anonymitySetId = static_cast<bool>(env->CallIntMethod(mintCoin, leGetAnonymitySetIdId));
		LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount,
									static_cast<uint32_t>(index)};
		__android_log_print(ANDROID_LOG_INFO, "Tag", "isUsed = %d", isUsed);
		coins.push_back(lelantusEntry);
	}

	uint64_t changeToMint;
	uint64_t fee = EstimateFee(
			spendAmount,
			subtractFeeFromAmount,
			privateKey,
			coins,
			changeToMint
	);

	jobject result = env->NewObject(jsdCls, jsdConstructor, (jlong) fee, (jlong) changeToMint);

	return result;
}

JNIEXPORT jint JNICALL Java_org_firo_lelantus_Lelantus_jGetMintKeyPath
		(JNIEnv *env, jobject thisClass, jlong value, jstring jPrivateKey, jint index) {
	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	uint32_t keyPath = GetMintKeyPath(value, privateKey, index);
	return keyPath;
}

JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jCreateJMintScript
		(JNIEnv *env, jobject thisClass, jlong value, jstring jPrivateKey,
		 jint index, jstring jSeed, jstring jPrivateKeyAES) {
	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	auto *privateKeyAES = env->GetStringUTFChars(jPrivateKeyAES, nullptr);
	auto *seed = env->GetStringUTFChars(jSeed, nullptr);
	const char *script = CreateJMintScript(value, privateKey, index, seed, privateKeyAES);
	return env->NewStringUTF(script);
}

JNIEXPORT jstring JNICALL Java_org_firo_lelantus_Lelantus_jCreateSpendScript
		(JNIEnv *env, jobject thisClass, jlong spendAmount, jboolean subtractFeeFromAmount,
		 jstring jPrivateKey, jint index, jobject jLelantusEntryList,
		 jstring jTxHash, jobject jAnonymitySet,
		 jobject jAnonymitySetHashes, jobject jBlockGroupHashes) {
	jclass alCls = env->FindClass("java/util/List");
	jclass leCls = env->FindClass("org/firo/lelantus/LelantusEntry");
	jclass jsdCls = env->FindClass("org/firo/lelantus/JoinSplitData");

	if (alCls == nullptr || leCls == nullptr || jsdCls == nullptr) {
		return nullptr;
	}

	jmethodID alGetId = env->GetMethodID(alCls, "get", "(I)Ljava/lang/Object;");
	jmethodID alSizeId = env->GetMethodID(alCls, "size", "()I");
	jmethodID leGetAmountId = env->GetMethodID(leCls, "getAmount", "()J");
	jmethodID leGetIndexId = env->GetMethodID(leCls, "getIndex", "()I");
	jmethodID leIsUsedId = env->GetMethodID(leCls, "isUsed", "()Z");
	jmethodID leGetHeightId = env->GetMethodID(leCls, "getHeight", "()I");
	jmethodID leGetAnonymitySetIdId = env->GetMethodID(leCls, "getAnonymitySetId", "()I");

	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	auto *txHash = env->GetStringUTFChars(jTxHash, nullptr);

	int coinCount = static_cast<int>(env->CallIntMethod(jLelantusEntryList, alSizeId));

	std::list<LelantusEntry> coins;
	int coinIndex, height, anonymitySetId;
	long amount;
	bool isUsed;

	for (int i = 0; i < coinCount; ++i) {
		jobject mintCoin = env->CallObjectMethod(jLelantusEntryList, alGetId, i);
		amount = static_cast<long>(env->CallLongMethod(mintCoin, leGetAmountId));
		coinIndex = static_cast<int>(env->CallIntMethod(mintCoin, leGetIndexId));
		isUsed = static_cast<bool>(env->CallBooleanMethod(mintCoin, leIsUsedId));
		height = static_cast<bool>(env->CallIntMethod(mintCoin, leGetHeightId));
		anonymitySetId = static_cast<bool>(env->CallIntMethod(mintCoin, leGetAnonymitySetIdId));
		LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount,
									static_cast<uint32_t>(coinIndex)};
		coins.push_back(lelantusEntry);
	}

	const char *script = CreateJoinSplitScript(
			txHash,
			spendAmount,
			subtractFeeFromAmount,
			privateKey,
			index,
			coins
	);
	return env->NewStringUTF(script);
}

}