package org.firo.lelantus

object Lelantus {

    fun createMintScript(value: Long, privateKey: String, index: Int, seed: String): String {
        return jCreateMintScript(value, privateKey, index, seed)
    }

    fun getPublicCoin(value: Long, privateKey: String, index: Int): String {
        return jGetPublicCoin(value, privateKey, index)
    }

    fun estimateJoinSplitFee(
        spendAmount: Long,
        subtractFeeFromAmount: Boolean,
        coins: Array<LelantusEntry>
    ): JoinSplitData {
        return jEstimateJoinSplitFee(spendAmount, subtractFeeFromAmount, coins)
    }

    fun getMintKeyPath(value: Long, privateKey: String, index: Int): Long {
        return jGetMintKeyPath(value, privateKey, index)
    }

    fun createJMintScript(
        value: Long,
        privateKey: String,
        index: Int,
        seed: String,
        privateKeyAES: String
    ): String {
        return jCreateJMintScript(value, privateKey, index, seed, privateKeyAES)
    }

    fun createSpendScript(
        spendAmount: Long,
        subtractFeeFromAmount: Boolean,
        privateKey: String,
        index: Int,
        coins: Array<LelantusEntry>,
        txHash: String,
        setIds: IntArray,
        anonymitySets: Array<Array<String>>,
        anonymitySetHashes: Array<String>,
        groupBlockHashes: Array<String>
    ): String {
        return jCreateSpendScript(
            spendAmount,
            subtractFeeFromAmount,
            privateKey,
            index,
            coins,
            txHash,
            setIds,
            anonymitySets,
            anonymitySetHashes,
            groupBlockHashes
        )
    }

    external fun jCreateMintScript(
        value: Long,
        privateKey: String,
        index: Int,
        seed: String
    ): String

    external fun jGetPublicCoin(
        value: Long,
        privateKey: String,
        index: Int
    ): String

    external fun jEstimateJoinSplitFee(
        spendAmount: Long,
        subtractFeeFromAmount: Boolean,
        lelantusEntryList: Array<LelantusEntry>
    ): JoinSplitData

    external fun jGetMintKeyPath(value: Long, privateKey: String, index: Int): Long

    external fun jCreateJMintScript(
        value: Long,
        privateKey: String,
        index: Int,
        seed: String,
        privateKeyAES: String
    ): String

    external fun jCreateSpendScript(
        spendAmount: Long,
        subtractFeeFromAmount: Boolean,
        privateKey: String,
        index: Int,
        coins: Array<LelantusEntry>,
        txHash: String,
        setIds: IntArray,
        anonymitySets: Array<Array<String>>,
        anonymitySetHashes: Array<String>,
        groupBlockHashes: Array<String>
    ): String
}