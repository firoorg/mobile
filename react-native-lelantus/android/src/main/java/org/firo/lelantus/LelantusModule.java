package org.firo.lelantus;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

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
	public void getMintCommitment(double value, String privateKey, int index, String seed, Callback callback) {
		String commitment = new Lelantus().createMintCommitment((long) value, privateKey, index, seed);
		callback.invoke(commitment);
	}
}
