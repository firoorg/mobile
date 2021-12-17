#include "Utils.h"
#include <iostream>
#include <sstream>
#include <utility>

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
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
}

const char *bin2hex(const char *bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = (const unsigned char) bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
}

const char *bin2hex(std::vector<unsigned char> bytes, int size) {
	std::string str;
	for (int i = 0; i < size; ++i) {
		const unsigned char ch = bytes[i];
		str.append(&hexArray[(ch & 0xF0) >> 4], 1);
		str.append(&hexArray[ch & 0xF], 1);
	}
    char *new_str = new char[std::strlen(str.c_str()) + 1];
    std::strcpy(new_str, str.c_str());
	return new_str;
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
	return bin2hex(script, script.size());
}

const char *CreateTag(
		const char *keydata,
		int32_t index,
		const char *seedID
) {
	auto *seed = hex2bin(seedID);
	std::vector<unsigned char> seedVector(seed, seed + 20);

	uint256 tag = CreateMintTag(hex2bin(keydata), index, uint160(seedVector));
	const std::string &tagHex = tag.GetHex();
	return tagHex.c_str();
}

const char *GetPublicCoin(
		uint64_t value,
		const char *keydata,
		int32_t index) {
	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(
			value, hex2bin(keydata), index, keyPathOut
	);
	const lelantus::PublicCoin &publicCoin = privateCoin.getPublicCoin();
	return bin2hex(publicCoin.getValue().getvch().data(),
				   publicCoin.getValue().getvch().size());
}

const char *GetSerialNumber(
		uint64_t value,
		const char *keydata,
		int32_t index) {
	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(
			value, hex2bin(keydata), index, keyPathOut
	);
	auto* buffer = new unsigned char[32];
	privateCoin.getSerialNumber().serialize(buffer);
	return bin2hex(buffer, 32);
}

uint64_t EstimateFee(
		uint64_t spendAmount,
		bool subtractFeeFromAmount,
		std::list<LelantusEntry> coins,
		uint64_t &changeToMint,
		std::vector<int32_t> &spendCoinIndexes
) {
	std::list<lelantus::CLelantusEntry> coinsl;
	std::list<LelantusEntry>::iterator it;
	for (it = coins.begin(); it != coins.end(); ++it) {
		uint32_t keyPathOut;
		lelantus::PrivateCoin coin = CreateMintPrivateCoin(
				it->amount,
				hex2bin(it->keydata),
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
						coin.getEcdsaSeckey() + 32
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

	for (const auto& entry : coinsToBeSpent) {
			for (it = coins.begin(); it != coins.end(); ++it) {
			uint32_t keyPathOut;
			lelantus::PrivateCoin coin = CreateMintPrivateCoin(
					it->amount,
					hex2bin(it->keydata),
					it->index,
					keyPathOut
			);
			if (coin.getSerialNumber() == entry.serialNumber) {
				spendCoinIndexes.push_back(it->index);
			}
		}
	}

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

uint32_t GetAesKeyPath(
		const char *serializedCoin
) {
	uint32_t aesKeyPath = GenerateAESKeyPath(serializedCoin);
	return aesKeyPath;
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
	return bin2hex(script, script.size());
}

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
		std::vector<const char *> groupBlockHashes) {
	std::list<lelantus::CLelantusEntry> coinsl;
	std::list<LelantusEntry>::iterator it;
	for (it = coins.begin(); it != coins.end(); ++it) {
		uint32_t keyPathOut;
		lelantus::PrivateCoin coin = CreateMintPrivateCoin(
				it->amount,
				hex2bin(it->keydata),
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
						coin.getEcdsaSeckey() + 32
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

	if (subtractFeeFromAmount) {
		spendAmount -= fee;
	}

	uint32_t keyPathOut;
	lelantus::PrivateCoin privateCoin = CreateMintPrivateCoin(changeToMint, hex2bin(keydata), index,
															  keyPathOut);

	std::map<uint32_t, std::vector<lelantus::PublicCoin>> anonymity_sets;
	std::vector<std::vector<unsigned char>> _anonymitySetHashes;
	std::map<uint32_t, uint256> group_block_hashes;

	for (int i = 0; i < setIds.size(); i++) {
		uint32_t setId = setIds[i];

		anonymity_sets.insert({setId, std::vector<lelantus::PublicCoin>()});
		std::vector<const char *> serializedCoins = anonymitySets[i];
		for (auto &serializedCoin : serializedCoins) {
			secp_primitives::GroupElement groupElement;
			groupElement.deserialize(hex2bin(serializedCoin));
			lelantus::PublicCoin publicCoin(groupElement);
			anonymity_sets.at(setId).push_back(publicCoin);
		}

		unsigned char *setHash = hex2bin(anonymitySetHashes[i]);
		vector<unsigned char> anonymitySetHash(setHash, setHash + 32);
		_anonymitySetHashes.push_back(anonymitySetHash);

		uint256 blockHash;
		blockHash.SetHex(groupBlockHashes[i]);
		group_block_hashes.insert({setId, blockHash});
	}

	uint256 _txHash;
	_txHash.SetHex(txHash);

	std::vector<unsigned char> script = std::vector<unsigned char>();
	CreateJoinSplit(_txHash, privateCoin, spendAmount, fee, coinsToBeSpent, anonymity_sets,
					_anonymitySetHashes, group_block_hashes, script);
	return bin2hex(script, script.size());
}

uint64_t DecryptMintAmount(
		const char *privateKeyAES,
		const char *encryptedValueHex
) {
	auto *encryptedValue = hex2bin(encryptedValueHex);
	std::vector<unsigned char> encryptedValueVector(encryptedValue, encryptedValue + 48);

	uint64_t amount;
	DecryptMintAmount(hex2bin(privateKeyAES), encryptedValueVector, amount);
	return amount;
}
