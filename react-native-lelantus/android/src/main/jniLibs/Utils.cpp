#include "Utils.h"
#include <iostream>
#include <sstream>

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

//sigma::PublicCoin CreatePublicCoin(const sigma::CoinDenomination &denomination, const char *script) {
//    secp_primitives::GroupElement groupElement;
//    groupElement.deserialize(hex2bin(script));
//    return sigma::PublicCoin(groupElement, denomination);
//}
//
const char *CreateMintCommitment(uint64_t value,
                                 unsigned char* keydata,
                                 int32_t index,
                                 uint160 seedID) {
    std::vector<unsigned char> script = std::vector<unsigned char>();
    lelantus::PrivateCoin privateCoin = CreateMintScript(value, keydata, index, seedID, script);
    return bin2hex(script, COMMITMENT_LENGTH);
}
//
//const char *CreateSpendProof(sigma::CoinDenomination denomination,
//                             const char *privateKey,
//                             int index,
//                             std::vector<const char *> &anonymity_set,
//                             int groupId,
//                             const char *blockHash,
//                             const char *txHash) {
//    sigma::Params *sigmaParams = sigma::Params::get_default();
//    sigma::BIP44MintData bip44MintData = sigma::BIP44MintData(hex2bin(privateKey), index);
//    sigma::PrivateCoin privateCoin(sigmaParams, denomination, bip44MintData, ZEROCOIN_TX_VERSION_3_1);
//
//    std::vector<sigma::PublicCoin> publicCoins;
//    for (auto &commitment : anonymity_set) {
//        publicCoins.push_back(CreatePublicCoin(denomination, commitment));
//    }
//
//    sigma::SpendMetaData spendMetaData(static_cast<uint32_t>(groupId), uint256S(blockHash), uint256S(txHash));
//
//    sigma::CoinSpend coinSpend(privateCoin.getParams(), privateCoin, publicCoins, spendMetaData, true);
//    coinSpend.setVersion(privateCoin.getVersion());
//
//    CDataStream serializedCoinSpend(SER_NETWORK, PROTOCOL_VERSION);
//    serializedCoinSpend << coinSpend;
//
//    if (coinSpend.Verify(publicCoins, spendMetaData, true)) {
//        return bin2hex(serializedCoinSpend.str().c_str(), PROOF_LENGTH);
//    } else {
//        return new char[1];
//    }
//}
//
//const char *GetSerialNumber(sigma::CoinDenomination denomination,
//                               const char *privateKey,
//                               int index) {
//    sigma::Params *sigmaParams = sigma::Params::get_default();
//    sigma::BIP44MintData bip44MintData = sigma::BIP44MintData(hex2bin(privateKey), index);
//    sigma::PrivateCoin privateCoin(sigmaParams, denomination, bip44MintData, ZEROCOIN_TX_VERSION_3);
//    auto* buffer = new unsigned char[SERIAL_NUMBER_LENGTH];
//    privateCoin.getSerialNumber().serialize(buffer);
//    return bin2hex(buffer, SERIAL_NUMBER_LENGTH);
//}