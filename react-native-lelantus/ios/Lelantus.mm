#import "Lelantus.h"
#import "LelantusWrapper.h"
#import "Utils.h"

@implementation RNLelantus

RCT_EXPORT_MODULE(RNLelantus)

RCT_EXPORT_METHOD(
                  getMintScript:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  seed:(nonnull NSString*) seed
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cSeed = [seed cStringUsingEncoding:NSUTF8StringEncoding];
    
    const char *cScript = CreateMintScript(value, cPrivateKey, index, cSeed);
    const char *cPublicCoin = GetPublicCoin(value, cPrivateKey, index);
    
    NSString* publicCoin = [NSString stringWithUTF8String:cPublicCoin];
    NSString* script = [NSString stringWithUTF8String:cScript];
    
//    delete cPrivateKey;
//    delete cSeed;
//    delete cScript;
//    delete cPublicCoin;
        
    callback(@[script, publicCoin]);
}

RCT_EXPORT_METHOD(
                  getSerialNumber:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  c:(RCTResponseSenderBlock) callback
                  ) {

    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cSerialNumber = GetSerialNumber(value, cPrivateKey, index);
    
    NSLog(@"cSerialNumber: %s", cSerialNumber);
    NSString* serialNumber = [NSString stringWithUTF8String:cSerialNumber];

//    delete cPrivateKey;
//    delete cSerialNumber;

    callback(@[serialNumber]);
}

RCT_EXPORT_METHOD(
                  getMintTag:(nonnull NSString*) privateKey
                  index:(double) index
                  seed:(nonnull NSString*) seed
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cSeed = [seed cStringUsingEncoding:NSUTF8StringEncoding];
    
    string cTag = CreateTag2(cPrivateKey, index, cSeed);

    NSString* tag = [NSString stringWithUTF8String:cTag.c_str()];
    callback(@[tag]);
}

RCT_EXPORT_METHOD(
                  estimateJoinSplitFee:(double) spendAmount
                  privateKey:(BOOL) subtractFeeFromAmount
                  coins:(nonnull NSArray*) coinsArray
                  c:(RCTResponseSenderBlock) callback
                  ) {
    std::list<LelantusEntry> coins;
    
    for (NSDictionary *coin in coinsArray) {
        long amount = [[coin objectForKey:@"amount"] longValue];
        const char *privateKey = [[coin objectForKey:@"privateKey"] cStringUsingEncoding:NSUTF8StringEncoding];
        uint32_t index = [[coin objectForKey:@"index"] intValue];
        BOOL isUsed = [[coin objectForKey:@"isUsed"] boolValue] ?: NO;
        int height = [[coin objectForKey:@"height"] intValue];
        int anonymitySetId = [[coin objectForKey:@"anonymitySetId"] intValue];
        
        LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount, index, privateKey};
        coins.push_back(lelantusEntry);
    }
    
    uint64_t changeToMint;
    std::vector<int32_t> spendCoinIndexes;
    uint64_t fee = EstimateFee(
            spendAmount,
            subtractFeeFromAmount,
            coins,
            changeToMint,
            spendCoinIndexes
    );
    
    NSNumber* cFee = [NSNumber numberWithLong:fee];
    NSNumber* cChageToMint = [NSNumber numberWithLong:changeToMint];
    NSMutableArray *cSpendCoinIndexes = [NSMutableArray array];
    
    for (int i = 0; i < spendCoinIndexes.size(); ++i) {
        [cSpendCoinIndexes addObject:[NSNumber numberWithInt:spendCoinIndexes[i]]];
    }
    
    callback(@[cFee, cChageToMint, cSpendCoinIndexes]);
}

RCT_EXPORT_METHOD(
                  getMintKeyPath:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    uint32_t keyPath = GetMintKeyPath((uint64_t)value, cPrivateKey, (int32_t)index);
    NSNumber* cKeyPath = [NSNumber numberWithUnsignedInt:keyPath];
    callback(@[cKeyPath]);
}

RCT_EXPORT_METHOD(
                  getAesKeyPath:(nonnull NSString*) serializedCoin
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cSerializedCoin = [serializedCoin cStringUsingEncoding:NSUTF8StringEncoding];
    uint32_t keyPath = GetAesKeyPath(cSerializedCoin);
    NSNumber* cKeyPath = [NSNumber numberWithUnsignedInt:keyPath];
    callback(@[cKeyPath]);
}

RCT_EXPORT_METHOD(
                  getJMintScript:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  seed:(nonnull NSString*) seed
                  privateKeyAES:(nonnull NSString*) privateKeyAES
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cSeed = [seed cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cPrivateKeyAES = [privateKeyAES cStringUsingEncoding:NSUTF8StringEncoding];
    
    const char *script = CreateJMintScript(value, cPrivateKey, index, cSeed, cPrivateKeyAES);
    const char *publicCoin = GetPublicCoin((long)value, cPrivateKey, (int)index);
    
    NSString* cPublicCoin = [NSString stringWithUTF8String:publicCoin];
    NSString* cScript = [NSString stringWithUTF8String:script];
    callback(@[cScript, cPublicCoin]);
}

RCT_EXPORT_METHOD(
                  getSpendScript:(double) spendAmount
                  subtractFeeFromAmount:(BOOL) subtractFeeFromAmount
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  coins:(nonnull NSArray*) coinsArray
                  txHash:(nonnull NSString*) txHash
                  setIds:(nonnull NSArray*) setIdsArray
                  anonymitySets:(nonnull NSArray*) anonymitySetsArray
                  anonymitySetHashes:(nonnull NSArray*) anonymitySetHashesArray
                  groupBlockHashes:(nonnull NSArray*) groupBlockHashesArray
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKey = [privateKey cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cTxHash = [txHash cStringUsingEncoding:NSUTF8StringEncoding];
    
    std::list<LelantusEntry> coins;
    
    for (NSDictionary *coin in coinsArray) {
        long amount = [[coin objectForKey:@"amount"] longValue];
        const char *privateKey = [[coin objectForKey:@"privateKey"] cStringUsingEncoding:NSUTF8StringEncoding];
        uint32_t index = [[coin objectForKey:@"index"] unsignedIntValue];
        BOOL isUsed = [[coin objectForKey:@"isUsed"] boolValue] ?: NO;
        int height = [[coin objectForKey:@"height"] intValue];
        int anonymitySetId = [[coin objectForKey:@"anonymitySetId"] intValue];
        
        LelantusEntry lelantusEntry{isUsed, height, anonymitySetId, amount, index, privateKey};
        coins.push_back(lelantusEntry);
    }
    
    std::vector<uint32_t> setIds;
    std::vector<std::vector<const char *>> anonymitySets;
    std::vector<const char *> anonymitySetHashes;
    std::vector<const char *> groupBlockHashes;
    
    for (int i = 0; i < setIdsArray.count; i++) {
        uint32_t id = [[setIdsArray objectAtIndex:i] unsignedIntValue];
        setIds.push_back(id);
        
        NSArray *anonymitySetArray = [anonymitySetsArray objectAtIndex:i];
        anonymitySets.emplace_back(std::vector<const char *>());
        for (int j = 0; j < anonymitySetArray.count; j++) {
            NSString *serializedCoin = [anonymitySetArray objectAtIndex:j];
            const char *cSerializedCoin = [serializedCoin cStringUsingEncoding:NSUTF8StringEncoding];
            anonymitySets[i].push_back(cSerializedCoin);
        }
        
        NSString *setHash = [anonymitySetHashesArray objectAtIndex:i];
        const char *cSetHash= [setHash cStringUsingEncoding:NSUTF8StringEncoding];
        anonymitySetHashes.push_back(cSetHash);
        
        NSString *groupBlockHash = [groupBlockHashesArray objectAtIndex:i];
        const char *cGroupBlockHash = [groupBlockHash cStringUsingEncoding:NSUTF8StringEncoding];
        groupBlockHashes.push_back(cGroupBlockHash);
    }
    
    const char *script = CreateJoinSplitScript(
                cTxHash,
                spendAmount,
                subtractFeeFromAmount,
                cPrivateKey,
                index,
                coins,
                setIds,
                anonymitySets,
                anonymitySetHashes,
                groupBlockHashes
        );
    
    NSString* cScript = [NSString stringWithUTF8String:script];
    callback(@[cScript]);
}

RCT_EXPORT_METHOD(
                  decryptMintAmount:(nonnull NSString*) privateKeyAES
                  encryptedValue:(nonnull NSString*) encryptedValue
                  c:(RCTResponseSenderBlock) callback
                  ) {
    const char *cPrivateKeyAES = [privateKeyAES cStringUsingEncoding:NSUTF8StringEncoding];
    const char *cEncryptedValue = [encryptedValue cStringUsingEncoding:NSUTF8StringEncoding];
    
    uint64_t amount = DecryptMintAmount(cPrivateKeyAES, cEncryptedValue);
    
    NSNumber* cAmount = [NSNumber numberWithLong:amount];
    callback(@[cAmount]);
}

@end
