package org.firo.lelantus

class Lelantus {

    fun CreateMintCommitment(value: Long, privateKey: String, index: Int, seed: String): String {
        return jCreateMintCommitment(value, privateKey, index, seed)
    }

    external fun jCreateMintCommitment(value: Long, privateKey: String, index: Int, seed: String): String
}