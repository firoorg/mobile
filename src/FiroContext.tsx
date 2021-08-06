import React, {createContext, useState, FC} from 'react';
import {AbstractWallet} from './core/AbstractWallet';
import {AppStorage} from './app-storage';
import {Currency} from './utils/currency';
import {CoreSettings} from './core/CoreSettings';

const appStorage = new AppStorage();

type FiroContextType = {
  setWallet: (wallet: AbstractWallet) => void;
  getWallet: () => AbstractWallet | undefined;
  encryptStorage: (password: string) => Promise<void>;
  isStorageEncrypted: () => Promise<boolean>;
  saveToDisk: (password: string) => Promise<void>;
  loadFromDisk: (password: string) => Promise<boolean>;
  getFiroRate: () => number;
  getSettings: () => CoreSettings;
  setSettings: (settings: CoreSettings, notPersist?: boolean) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
};

export const FiroContext = createContext<FiroContextType>({
  setWallet: () => { },
  getWallet: () => undefined,
  encryptStorage: async () => { },
  isStorageEncrypted: async () => false,
  saveToDisk: async () => { },
  loadFromDisk: async () => false,
  getFiroRate: () => 0,
  getSettings: () => {
    return { notificationsEnabled: true, defaultCurrency: "usd" };
  },
  setSettings: async (settings, notPersist) => { },
  verifyPassword: async (password) => { return false;}
});

export const FiroContextProvider: FC = props => {
  const [walletState, setWalletState] = useState<AbstractWallet>();
  const [firoRate, changeFiroRate] = useState<number>(Currency.firoToFiat(1));
  const [settings, changeSettings] = useState<CoreSettings>({ notificationsEnabled: true, defaultCurrency: "usd" });
  Currency.setUpdateContextRate(changeFiroRate);
  const setWallet = (wallet: AbstractWallet) => {
    setWalletState(wallet);
  };

  const getWallet = () => {
    return walletState;
  };

  const encryptStorage = async () => {};

  const isStorageEncrypted = async () => {
    return await appStorage.hasSavedWallet();
  };

  const saveToDisk = async (password: string) => {
    let wallet = getWallet();
    if (typeof wallet !== 'undefined') {
      appStorage.saveWalletToDisk(password, wallet);
    }
  };

  const loadFromDisk = async (password: string) => {
    let wallet = await appStorage.loadWalletFromDisk(password);
    if (wallet !== null) {
      setWallet(wallet);
      return true;
    }
    return false;
  };

  const getFiroRate = () => {
    return firoRate;
  };

  const getSettings = () => {
    return settings;
  };

  const setSettings = async (newSettings: CoreSettings, notPersist?: boolean) => {
    if (!newSettings) {
      return;
    }
    changeSettings(newSettings);
    if (!notPersist) {
      await appStorage.setItem(AppStorage.SETTINGS, JSON.stringify(newSettings));
    }
  };

  const verifyPassword = async (password: string) => {
    return appStorage.verifyPassword(password)
  };

  return (
    <FiroContext.Provider
      value={{
        setWallet,
        getWallet,
        encryptStorage,
        isStorageEncrypted,
        saveToDisk,
        loadFromDisk,
        getFiroRate,
        getSettings,
        setSettings,
        verifyPassword
      }}>
      {props.children}
    </FiroContext.Provider>
  );
};
