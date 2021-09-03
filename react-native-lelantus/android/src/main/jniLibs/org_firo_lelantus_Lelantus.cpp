
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
		 jboolean subtractFeeFromAmount, jobjectArray jLelantusEntryList) {
	jclass leCls = env->FindClass("org/firo/lelantus/LelantusEntry");
	jclass jsdCls = env->FindClass("org/firo/lelantus/JoinSplitData");

	if (leCls == nullptr || jsdCls == nullptr) {
		return nullptr;
	}

	jmethodID leGetAmountId = env->GetMethodID(leCls, "getAmount", "()J");
	jmethodID leGetPrivateKeyId = env->GetMethodID(leCls, "getPrivateKey", "()Ljava/lang/String;");
	jmethodID leGetIndexId = env->GetMethodID(leCls, "getIndex", "()I");
	jmethodID leIsUsedId = env->GetMethodID(leCls, "isUsed", "()Z");
	jmethodID leGetHeightId = env->GetMethodID(leCls, "getHeight", "()I");
	jmethodID leGetAnonymitySetIdId = env->GetMethodID(leCls, "getAnonymitySetId", "()I");
	jmethodID jsdConstructor = env->GetMethodID(jsdCls, "<init>", "(JJ)V");

	std::list<LelantusEntry> coins;
	int index, height, anonymitySetId;
	jstring keydata;
	long amount;
	bool isUsed;

	int coinCount = env->GetArrayLength(jLelantusEntryList);
	for (int i = 0; i < coinCount; ++i) {
		jobject mintCoin = env->GetObjectArrayElement(jLelantusEntryList, i);
		amount = static_cast<long>(env->CallLongMethod(mintCoin, leGetAmountId));
		keydata = (jstring) env->CallObjectMethod(mintCoin, leGetPrivateKeyId);
		index = static_cast<int>(env->CallIntMethod(mintCoin, leGetIndexId));
		isUsed = static_cast<bool>(env->CallBooleanMethod(mintCoin, leIsUsedId));
		height = static_cast<bool>(env->CallIntMethod(mintCoin, leGetHeightId));
		anonymitySetId = static_cast<bool>(env->CallIntMethod(mintCoin, leGetAnonymitySetIdId));
		LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount,
									static_cast<uint32_t>(index),
									env->GetStringUTFChars(keydata, nullptr)};
		coins.push_back(lelantusEntry);
	}

	uint64_t changeToMint;
	uint64_t fee = EstimateFee(
			spendAmount,
			subtractFeeFromAmount,
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
		 jstring jPrivateKey, jint index, jobjectArray jLelantusEntryList,
		 jstring jTxHash, jintArray jSetIds, jobjectArray jAnonymitySets,
		 jobjectArray jAnonymitySetHashes, jobjectArray jBlockGroupHashes) {
	jclass leCls = env->FindClass("org/firo/lelantus/LelantusEntry");

	if (leCls == nullptr) {
		return nullptr;
	}

	jmethodID leGetAmountId = env->GetMethodID(leCls, "getAmount", "()J");
	jmethodID leGetPrivateKeyId = env->GetMethodID(leCls, "getPrivateKey", "()Ljava/lang/String;");
	jmethodID leGetIndexId = env->GetMethodID(leCls, "getIndex", "()I");
	jmethodID leIsUsedId = env->GetMethodID(leCls, "isUsed", "()Z");
	jmethodID leGetHeightId = env->GetMethodID(leCls, "getHeight", "()I");
	jmethodID leGetAnonymitySetIdId = env->GetMethodID(leCls, "getAnonymitySetId", "()I");

	std::list<LelantusEntry> coins;
	int coinIndex, height, anonymitySetId;
	jstring keydata;
	long amount;
	bool isUsed;

	int coinCount = env->GetArrayLength(jLelantusEntryList);
	for (int i = 0; i < coinCount; ++i) {
		jobject mintCoin = env->GetObjectArrayElement(jLelantusEntryList, i);
		amount = static_cast<long>(env->CallLongMethod(mintCoin, leGetAmountId));
		keydata = (jstring) env->CallObjectMethod(mintCoin, leGetPrivateKeyId);
		coinIndex = static_cast<int>(env->CallIntMethod(mintCoin, leGetIndexId));
		isUsed = static_cast<bool>(env->CallBooleanMethod(mintCoin, leIsUsedId));
		height = static_cast<bool>(env->CallIntMethod(mintCoin, leGetHeightId));
		anonymitySetId = static_cast<bool>(env->CallIntMethod(mintCoin, leGetAnonymitySetIdId));
		LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount,
									static_cast<uint32_t>(coinIndex),
									env->GetStringUTFChars(keydata, nullptr)};
		coins.push_back(lelantusEntry);
	}

	auto *privateKey = env->GetStringUTFChars(jPrivateKey, nullptr);
	auto *txHash = env->GetStringUTFChars(jTxHash, nullptr);

	std::vector<uint32_t> setIds;
	std::vector<std::vector<const char *>> anonymitySets;
	std::vector<std::vector<unsigned char>> anonymitySetHashes;
	std::vector<const char *> groupBlockHashes;

	int setIdsSize = env->GetArrayLength(jSetIds);
	jint *idList = env->GetIntArrayElements(jSetIds, nullptr);
	for (int i = 0; i < setIdsSize; i++) {
		setIds.push_back(idList[i]);

		anonymitySets.push_back(std::vector<const char *>());
		auto jAnonymitySet = (jobjectArray) (env->GetObjectArrayElement(jAnonymitySets, i));
		int anonymitySetSize = env->GetArrayLength(jAnonymitySet);
		for (int j = 0; j < anonymitySetSize; j++) {
			auto jSerializedCoin = (jstring) (env->GetObjectArrayElement(jAnonymitySet, j));
			const char *serializedCoin = env->GetStringUTFChars(jSerializedCoin, nullptr);
			anonymitySets[i].push_back(serializedCoin);
		}

		auto jAnonymitySetHash = (jstring) (env->GetObjectArrayElement(jAnonymitySetHashes, i));
		const char *setHash = env->GetStringUTFChars(jAnonymitySetHash, nullptr);
		vector<unsigned char>::size_type setHashSize = strlen((const char *) setHash);
		vector<unsigned char> anonymitySetHash(setHash, setHash + setHashSize);
		anonymitySetHashes.push_back(anonymitySetHash);

		auto jGroupBlockHash = (jstring) (env->GetObjectArrayElement(jBlockGroupHashes, i));
		const char *groupBlockHash = env->GetStringUTFChars(jGroupBlockHash, nullptr);
		groupBlockHashes.push_back(groupBlockHash);
	}

	const char *script = CreateJoinSplitScript(
			txHash,
			spendAmount,
			subtractFeeFromAmount,
			privateKey,
			index,
			coins,
			setIds,
			anonymitySets,
			anonymitySetHashes,
			groupBlockHashes
	);
	return env->NewStringUTF(script);
}

}