package org.firo.lelantus

class LelantusEntry(
    val amount: Long,
    val privateKey: String,
    val index: Int,
    val isUsed: Boolean,
    val height: Int,
    val anonymitySetId: Int
)