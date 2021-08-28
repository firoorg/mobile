package org.firo.lelantus;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.util.ArrayList;
import java.util.List;

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
		callback.invoke(script);
	}

	@ReactMethod
	public void estimateJoinSplitFee(
			double spendAmount,
			boolean subtractFeeFromAmount,
			String privateKey,
			ReadableArray coinsArray,
			Callback callback
	) {
		List<LelantusEntry> coins = new ArrayList<>();
		for (int i = 0; i < coinsArray.size(); i++) {
			ReadableMap lelantusEntryMap = coinsArray.getMap(i);
			LelantusEntry lelantusEntry = new LelantusEntry(
					(long) lelantusEntryMap.getDouble("amount"),
					lelantusEntryMap.getInt("index"),
					lelantusEntryMap.getBoolean("isUsed"),
					lelantusEntryMap.getInt("height"),
					lelantusEntryMap.getInt("anonymitySetId")
			);
			coins.add(lelantusEntry);
		}
		JoinSplitData data = Lelantus.INSTANCE.estimateJoinSplitFee(
				(long) spendAmount,
				subtractFeeFromAmount,
				privateKey,
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
}
