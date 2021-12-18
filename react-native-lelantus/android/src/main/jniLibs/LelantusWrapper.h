#ifndef LELANTUSWRAPPERTEST_LELANTUSWRAPPER_H
#define LELANTUSWRAPPERTEST_LELANTUSWRAPPER_H

#include "liblelantus/include/lelantus.h"

struct LelantusEntry {
	bool isUsed;
	int height;
	int anonymitySetId;
	int64_t amount;
	uint32_t index;
	const char *keydata;
};

const char *CreateMintScript(
		uint64_t value,
		const char *keydata,
		int32_t index,
		const char *seedID
);

const char *CreateTag(
		const char *keydata,
		int32_t index,
		const char *seedID
);

const char *GetPublicCoin(
		uint64_t value,
		const char *keydata,
		int32_t index
);

const char *GetSerialNumber(
		uint64_t value,
		const char *keydata,
		int32_t index
);

uint64_t EstimateFee(
		uint64_t spendAmount,
		bool subtractFeeFromAmount,
		std::list<LelantusEntry> coins,
		uint64_t &changeToMint,
		std::vector<int32_t> &spendCoinIndexes
);

uint32_t GetMintKeyPath(
		uint64_t value,
		const char *keydata,
		int32_t index
);

uint32_t GetAesKeyPath(
		const char *serializedCoin
);

const char *CreateJMintScript(
		uint64_t value,
		const char *keydata,
		int32_t index,
		const char *seedID,
		const char *AESkeydata);

const char *CreateJoinSplitScript(
		const char *txHash,
		uint64_t spendAmount,
		bool subtractFeeFromAmount,
		const char *keydata,
		uint32_t index,
		std::list<LelantusEntry> coins,
		std::vector<uint32_t> setIds,
		std::vector<std::vector<const char *>> anonymitySets,
		const std::vector<const char *> &anonymitySetHashes,
		std::vector<const char *> groupBlockHashes
);

uint64_t DecryptMintAmount(
		const char *privateKeyAES,
		const char *encryptedValue
);

#endif //LELANTUSWRAPPERTEST_LELANTUSWRAPPER_H
