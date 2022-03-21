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
    const char *cPublicCoin = CreateMintScript(value, cPrivateKey, index, cSeed);
    
    NSString* publicCoin = [NSString stringWithUTF8String:cPublicCoin];
    NSString* script = [NSString stringWithUTF8String:cScript];
    
    delete cScript;
    delete cPublicCoin;
        
    callback(@[script, publicCoin]);
}

RCT_EXPORT_METHOD(
                  getSerialNumber:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSString* serialNumber = [NSString stringWithUTF8String:"serialNumber"];
    callback(@[serialNumber]);
}

RCT_EXPORT_METHOD(
                  getMintTag:(nonnull NSString*) privateKey
                  index:(double) index
                  seed:(nonnull NSString*) seed
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSString* tag = [NSString stringWithUTF8String:"tag"];
    callback(@[tag]);
}

RCT_EXPORT_METHOD(
                  estimateJoinSplitFee:(double) spendAmount
                  privateKey:(BOOL) subtractFeeFromAmount
                  coins:(nonnull NSArray*) coins
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSNumber* fee = [NSNumber numberWithInt:2];
    NSNumber* chageToMint = [NSNumber numberWithInt:10];
    NSNumber* spendCoinIndexes = [NSNumber numberWithInt:1];
    callback(@[fee, chageToMint, spendCoinIndexes]);
}

RCT_EXPORT_METHOD(
                  getMintKeyPath:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSNumber* keyPath = [NSNumber numberWithInt:1];
    callback(@[keyPath]);
}

RCT_EXPORT_METHOD(
                  getAesKeyPath:(nonnull NSString*) serializedCoin
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSNumber* keyPath = [NSNumber numberWithInt:1];
    callback(@[keyPath]);
}

RCT_EXPORT_METHOD(
                  getJMintScript:(double) value
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  seed:(nonnull NSString*) seed
                  privateKeyAES:(nonnull NSString*) privateKeyAES
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSString* script = [NSString stringWithUTF8String:"script"];
    NSString* publicCoin = [NSString stringWithUTF8String:"publicCoin"];
    callback(@[script, publicCoin]);
}

RCT_EXPORT_METHOD(
                  getSpendScript:(double) spendAmount
                  privateKey:(BOOL) subtractFeeFromAmount
                  privateKey:(nonnull NSString*) privateKey
                  index:(double) index
                  coins:(nonnull NSArray*) coins
                  txHash:(nonnull NSString*) txHash
                  setIds:(nonnull NSArray*) setIds
                  anonymitySets:(nonnull NSArray*) anonymitySets
                  anonymitySetHashes:(nonnull NSArray*) anonymitySetHashes
                  groupBlockHashes:(nonnull NSArray*) groupBlockHashes
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSString* script = [NSString stringWithUTF8String:"script"];
    callback(@[script]);
}

RCT_EXPORT_METHOD(
                  decryptMintAmount:(nonnull NSString*) privateKeyAES
                  encryptedValue:(nonnull NSString*) encryptedValue
                  c:(RCTResponseSenderBlock) callback
                  ) {
    NSNumber* amount = [NSNumber numberWithInt:1];
    callback(@[amount]);
}

@end
