package org.firo.lelantus;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.Arrays;

public class LelantusModule extends ReactContextBaseJavaModule {

	private final ReactApplicationContext reactContext;

	static {
		System.loadLibrary("lelantus");
	}

	public LelantusModule(ReactApplicationContext reactContext) {
		super(reactContext);
		this.reactContext = reactContext;
	}

	@Override
	public String getName() {
		return "RNLelantus";
	}

	@ReactMethod
	public void getMintScript(
			double value,
			String privateKey,
			int index,
			String seed,
			Callback callback
	) {
		String script = Lelantus.INSTANCE.createMintScript((long) value, privateKey, index, seed);
		String publicCoin = Lelantus.INSTANCE.getPublicCoin((long) value, privateKey, index);
		callback.invoke(script, publicCoin);
	}

	@ReactMethod
	public void estimateJoinSplitFee(
			double spendAmount,
			boolean subtractFeeFromAmount,
			ReadableArray coinsArray,
			Callback callback
	) {
		LelantusEntry[] coins = new LelantusEntry[coinsArray.size()];
		for (int i = 0; i < coinsArray.size(); i++) {
			ReadableMap lelantusEntryMap = coinsArray.getMap(i);
			LelantusEntry lelantusEntry = new LelantusEntry(
					(long) lelantusEntryMap.getDouble("amount"),
					lelantusEntryMap.getString("privateKey"),
					lelantusEntryMap.getInt("index"),
					lelantusEntryMap.getBoolean("isUsed"),
					lelantusEntryMap.getInt("height"),
					lelantusEntryMap.getInt("anonymitySetId")
			);
			coins[i] = lelantusEntry;
		}
		JoinSplitData data = Lelantus.INSTANCE.estimateJoinSplitFee(
				(long) spendAmount,
				subtractFeeFromAmount,
				coins
		);
		callback.invoke((double) data.getFee(), (double) data.getChangeToMint());
	}

	@ReactMethod
	public void getMintKeyPath(
			double value,
			String privateKey,
			int index,
			Callback callback
	) {
		int keyPath = Lelantus.INSTANCE.getMintKeyPath((long) value, privateKey, index);
		callback.invoke(keyPath);
	}

	@ReactMethod
	public void getJMintScript(
			double value,
			String privateKey,
			int index,
			String seed,
			String privateKeyAES,
			Callback callback
	) {
		String script = Lelantus.INSTANCE.createJMintScript((long) value, privateKey, index, seed, privateKeyAES);
		callback.invoke(script);
	}

	@ReactMethod
	public void getSpendScript(
			double spendAmount,
			boolean subtractFeeFromAmount,
			String privateKey,
			int index,
			ReadableArray coinsArray,
			String txHash,
			ReadableArray setIdsArray,
			ReadableArray anonymitySetsArray,
			ReadableArray anonymitySetHashesArray,
			ReadableArray groupBlockHashesArray,
			Callback callback
	) {
		LelantusEntry[] coins = new LelantusEntry[coinsArray.size()];
		for (int i = 0; i < coinsArray.size(); i++) {
			ReadableMap lelantusEntryMap = coinsArray.getMap(i);
			LelantusEntry lelantusEntry = new LelantusEntry(
					(long) lelantusEntryMap.getDouble("amount"),
					lelantusEntryMap.getString("privateKey"),
					lelantusEntryMap.getInt("index"),
					lelantusEntryMap.getBoolean("isUsed"),
					lelantusEntryMap.getInt("height"),
					lelantusEntryMap.getInt("anonymitySetId")
			);
			coins[i] = lelantusEntry;
		}

		int[] setIds = new int[setIdsArray.size()];
		for (int i = 0; i < setIdsArray.size(); i++) {
			setIds[i] = setIdsArray.getInt(i);
		}

		String[][] anonymitySets = new String[anonymitySetsArray.size()][];
		for (int i = 0; i < anonymitySetsArray.size(); i++) {
			ReadableArray anonymitySetArray = anonymitySetsArray.getArray(i);
			String[] anonymitySet = new String[anonymitySetArray.size()];
			anonymitySets[i] = anonymitySet;
			for (int j = 0; j < anonymitySetArray.size(); j++) {
				anonymitySet[j] = anonymitySetArray.getString(j);
			}
		}

		String[] anonymitySetHashes = new String[anonymitySetHashesArray.size()];
		for (int i = 0; i < anonymitySetHashesArray.size(); i++) {
			anonymitySetHashes[i] = anonymitySetHashesArray.getString(i);
		}

		String[] groupBlockHashes = new String[groupBlockHashesArray.size()];
		for (int i = 0; i < groupBlockHashesArray.size(); i++) {
			groupBlockHashes[i] = groupBlockHashesArray.getString(i);
		}

		String script = Lelantus.INSTANCE.createSpendScript(
				(long) spendAmount,
				subtractFeeFromAmount,
				privateKey,
				index,
				coins,
				txHash,
				setIds,
				anonymitySets,
				anonymitySetHashes,
				groupBlockHashes);
		callback.invoke(script);
	}
}
