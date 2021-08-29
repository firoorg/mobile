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
        privateKey: String,
        coins: List<LelantusEntry>
    ): JoinSplitData {
        return jEstimateJoinSplitFee(spendAmount, subtractFeeFromAmount, privateKey, coins)
    }

    fun getMintKeyPath(value: Long, privateKey: String, index: Int): Int {
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
        coins: List<LelantusEntry>,
        txHash: String,
        anonymitySet: Map<Int, String>,
        anonymitySetHashes: List<List<String>>,
        groupBlockHashes: Map<Int, String>
    ): String {
        return jCreateSpendScript(
            spendAmount,
            subtractFeeFromAmount,
            privateKey,
            index,
            coins,
            txHash,
            anonymitySet,
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
        privateKet: String,
        lelantusEntryList: List<LelantusEntry>
    ): JoinSplitData

    external fun jGetMintKeyPath(value: Long, privateKey: String, index: Int): Int

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
        coins: List<LelantusEntry>,
        txHash: String,
        anonymitySet: Map<Int, String>,
        anonymitySetHashes: List<List<String>>,
        groupBlockHashes: Map<Int, String>
    ): String
}