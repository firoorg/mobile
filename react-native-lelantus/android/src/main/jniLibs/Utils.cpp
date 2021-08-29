#include "Utils.h"
#include <iostream>
#include <sstream>
#include <utility>
#include <android/log.h>

unsigned char *hex2bin(const char *hexstr) {
	size_t length = strlen(hexstr) / 2;
	auto *chrs = (unsigned char *) malloc((length + 1) * sizeof(unsigned char));
	for (size_t i = 0, j = 0; j < length; i += 2, j++) {
		chrs[j] = (hexstr[i] % 32 + 9) % 25 * 16 + (hexstr[i + 1] % 32 + 9) % 25;
	}
	chrs[length] = '\0';
	return chrs;
}

const char *bin2hex(const unsigned char *bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
	return str.c_str();
}

const char *bin2hex(const char *bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = (const unsigned char) bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
	return str.c_str();
}

const char *bin2hex(std::vector<unsigned char> bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
	return str.c_str();
}

const char *CreateMintScript(
		uint64_t value,
		const char *keydata,
		int32_t index,
		const char *seedID) {
	auto *seed = hex2bin(seedID);
	std::vector<unsigned char> seedVector(seed, seed + 20);

	std::vector<unsigned char> script = std::vector<unsigned char>();
	CreateMintScript(value, hex2bin(keydata), index, uint160(seedVector), script);
	return bin2hex(script, MINT_SCRIPT_LENGTH);
}

const char *GetPublicCoin(
		uint64_t value,
		const char *keydata,
		int32_t index) {
	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(value, hex2bin(keydata), index, keyPathOut);
	const lelantus::PublicCoin& publicCoin = privateCoin.getPublicCoin();
	return bin2hex(publicCoin.getValue().getvch().data(), PUBLIC_COIN_LENGTH);
}

uint64_t EstimateFee(
		uint64_t spendAmount,
		bool subtractFeeFromAmount,
		const char *keydata,
		std::list<LelantusEntry> coins,
		uint64_t &changeToMint
) {
	std::list<lelantus::CLelantusEntry> coinsl;
	std::list<LelantusEntry>::iterator it;
	for (it = coins.begin(); it != coins.end(); ++it) {
		uint32_t keyPathOut;
		lelantus::PrivateCoin coin = CreateMintPrivateCoin(
				it->amount,
				hex2bin(keydata),
				it->index,
				keyPathOut
		);
		lelantus::CLelantusEntry lelantusEntry;
		lelantusEntry.value = coin.getPublicCoin().getValue();
		lelantusEntry.randomness = coin.getRandomness();
		lelantusEntry.serialNumber = coin.getSerialNumber();
		lelantusEntry.ecdsaSecretKey =
				std::vector<unsigned char>(
						coin.getEcdsaSeckey(),
						coin.getEcdsaSeckey() + sizeof(coin.getEcdsaSeckey())
				);
		lelantusEntry.IsUsed = it->isUsed;
		lelantusEntry.nHeight = it->height;
		lelantusEntry.id = it->anonymitySetId;
		lelantusEntry.amount = it->amount;
		coinsl.push_back(lelantusEntry);
	}

	std::vector<lelantus::CLelantusEntry> coinsToBeSpent;
	uint64_t fee = EstimateJoinSplitFee(
			spendAmount,
			subtractFeeFromAmount,
			coinsl,
			coinsToBeSpent,
			changeToMint);
	__android_log_print(ANDROID_LOG_INFO, "Tag", "size = %i", coinsToBeSpent.size());
	__android_log_print(ANDROID_LOG_INFO, "Tag", "changeToMint = %i", (int) changeToMint);
	return fee;
}

uint32_t GetMintKeyPath(
		uint64_t value,
		const char *keydata,
		int32_t index
) {
	uint32_t keyPathOut;
	CreateMintPrivateCoin(value, hex2bin(keydata), index, keyPathOut);
	return keyPathOut;
}

const char *CreateJMintScript(
		uint64_t value,
		const char *keydata,
		int32_t index,
		const char *seedID,
		const char *AESkeydata) {
	auto *seed = hex2bin(seedID);
	std::vector<unsigned char> seedVector(seed, seed + 20);

	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(value, hex2bin(keydata), index,
															  keyPathOut);

	std::vector<unsigned char> script = std::vector<unsigned char>();
	CreateJMintScriptFromPrivateCoin(
			privateCoin,
			value,
			uint160(seedVector),
			hex2bin(AESkeydata),
			script
	);
	return bin2hex(script, MINT_SCRIPT_LENGTH);
}

const char *CreateJoinSplitScript(
		const char *txHash,
		uint64_t spendAmount,
		bool subtractFeeFromAmount,
		const char *keydata,
		uint32_t index,
		std::list<LelantusEntry> coins) {
	std::list<lelantus::CLelantusEntry> coinsl;
	std::list<LelantusEntry>::iterator it;
	for (it = coins.begin(); it != coins.end(); ++it) {
		uint32_t keyPathOut;
		lelantus::PrivateCoin coin = CreateMintPrivateCoin(
				it->amount,
				hex2bin(keydata),
				it->index,
				keyPathOut
		);
		lelantus::CLelantusEntry lelantusEntry;
		lelantusEntry.value = coin.getPublicCoin().getValue();
		lelantusEntry.randomness = coin.getRandomness();
		lelantusEntry.serialNumber = coin.getSerialNumber();
		lelantusEntry.ecdsaSecretKey =
				std::vector<unsigned char>(
						coin.getEcdsaSeckey(),
						coin.getEcdsaSeckey() + sizeof(coin.getEcdsaSeckey())
				);
		lelantusEntry.IsUsed = it->isUsed;
		lelantusEntry.nHeight = it->height;
		lelantusEntry.id = it->anonymitySetId;
		lelantusEntry.amount = it->amount;
		coinsl.push_back(lelantusEntry);
	}

	std::vector<lelantus::CLelantusEntry> coinsToBeSpent;
	uint64_t changeToMint;
	uint64_t fee = EstimateJoinSplitFee(
			spendAmount,
			subtractFeeFromAmount,
			coinsl,
			coinsToBeSpent,
			changeToMint);

	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(changeToMint, hex2bin(keydata), index,
															  keyPathOut);

	const std::map<uint32_t, std::vector<lelantus::PublicCoin>> anonymitySet;
	const std::vector<std::vector<unsigned char>> anonymitySetHashes;
	const std::map<uint32_t, uint256> groupBlockHashes; // todo

	std::vector<unsigned char> script = std::vector<unsigned char>();
	CreateJoinSplit(uint256S(txHash), privateCoin, spendAmount, fee, coinsToBeSpent, anonymitySet,
					anonymitySetHashes, groupBlockHashes, script);
	return bin2hex(script, MINT_SCRIPT_LENGTH);
}