#import "Lelantus.h"


@implementation RNLelantus

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(getMintScript:(long) value privateKey:(nonnull NSString*) privateKey index:(NSInteger) index seed:(nonnull NSString*) seed c:(RCTResponseSenderBlock) callback)
{
    callback(@[[NSString stringWithUTF8String:"script"]]);
}

@end
