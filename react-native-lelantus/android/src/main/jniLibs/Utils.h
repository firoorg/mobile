#ifndef ORG_FIRO_LELANTUS_UTILS_H
#define ORG_FIRO_LELANTUS_UTILS_H

#include "liblelantus/include/lelantus.h"

#define ZEROCOIN_TX_VERSION_3 30
#define ZEROCOIN_TX_VERSION_3_1 31

static const int PROTOCOL_VERSION = 90026;

static const int COMMITMENT_LENGTH = 165;
static const int SERIAL_NUMBER_LENGTH = 32;
static const int PROOF_LENGTH = 1319;

char const hexArray[16] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'};

unsigned char* hex2bin(const char* str);

const char* bin2hex(const unsigned char* bytes, int size);

const char* bin2hex(const char* bytes, int size);

const char *bin2hex(std::vector<unsigned char> bytes, int size);

//sigma::PublicCoin CreatePublicCoin(const sigma::CoinDenomination &denomination, const char *script);

const char* CreateMintCommitment(uint64_t value,
								 unsigned char* keydata,
								 int32_t index,
								 uint160 seedID);
//
//const char* CreateSpendProof(sigma::CoinDenomination denomination,
//                              const char* privateKey,
//                              int index,
//                              std::vector<const char *> &anonymity_set,
//                              int groupId,
//                              const char* blockHash,
//                              const char* txHash);
//
//const char *GetSerialNumber(sigma::CoinDenomination denomination,
//                               const char *privateKey,
//                               int index);

#endif //ORG_FIRO_LELANTUS_UTILS_H
