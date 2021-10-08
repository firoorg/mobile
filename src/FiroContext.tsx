import React, {createContext, useState, FC} from 'react';
import {AbstractWallet} from './core/AbstractWallet';
import {AppStorage} from './app-storage';
import {Currency} from './utils/currency';
import {CoreSettings} from './core/CoreSettings';
import BigNumber from 'bignumber.js';
import Logger from './utils/logger';

const appStorage = new AppStorage();

type FiroContextType = {
  setWallet: (wallet: AbstractWallet) => void;
  getWallet: () => AbstractWallet | undefined;
  isStorageEncrypted: () => Promise<boolean>;
  encryptStorage: (password: string) => Promise<void>;
  saveToDisk: () => Promise<void>;
  loadFromDisk: (password: string) => Promise<boolean>;
  getFiroRate: () => number;
  getSettings: () => CoreSettings;
  setSettings: (settings: CoreSettings, notPersist?: boolean) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
};

export const FiroContext = createContext<FiroContextType>({
  setWallet: () => {},
  getWallet: () => undefined,
  isStorageEncrypted: async () => false,
  encryptStorage: async () => {},
  saveToDisk: async () => {},
  loadFromDisk: async () => false,
  getFiroRate: () => 0,
  getSettings: () => {
    return {notificationsEnabled: true, defaultCurrency: 'usd'};
  },
  setSettings: async (settings, notPersist) => {},
  verifyPassword: async password => {
    return false;
  },
});

export const FiroContextProvider: FC = props => {
  const [walletState, setWalletState] = useState<AbstractWallet>();
  const [firoRate, changeFiroRate] = useState<number>(Currency.firoToFiat(new BigNumber(1)).toNumber());
  const [settings, changeSettings] = useState<CoreSettings>({
    notificationsEnabled: true,
    defaultCurrency: 'usd',
  });
  Currency.setUpdateContextRate(changeFiroRate);
  const setWallet = (wallet: AbstractWallet) => {
    Logger.info('firo_context:setWallet', wallet)
    setWalletState(wallet);
  };

  const getWallet = () => {
    return walletState;
  };

  const isStorageEncrypted = async () => {
    return await appStorage.hasSavedWallet();
  };

  const encryptStorage = async (password: string) => {
    let wallet = getWallet();
    if (typeof wallet !== 'undefined') {
      appStorage.saveWalletToDisk(password, wallet);
    }
  };

  const saveToDisk = async () => {
    let wallet = getWallet();
    if (wallet !== undefined) {
      Logger.info('firo_context:saveToDisk', wallet)
      appStorage.saveWalletToDisk(null, wallet);
    } else {
      Logger.error('firo_context:saveToDisk', 'wallet is undefined')
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

  const setSettings = async (
    newSettings: CoreSettings,
    notPersist?: boolean,
  ) => {
    if (!newSettings) {
      return;
    }
    changeSettings(newSettings);
    if (!notPersist) {
      await appStorage.setItem(
        AppStorage.SETTINGS,
        JSON.stringify(newSettings),
      );
    }
  };

  const verifyPassword = async (password: string) => {
    return appStorage.verifyPassword(password);
  };

  return (
    <FiroContext.Provider
      value={{
        setWallet,
        getWallet,
        isStorageEncrypted,
        encryptStorage,
        saveToDisk,
        loadFromDisk,
        getFiroRate,
        getSettings,
        setSettings,
        verifyPassword,
      }}>
      {props.children}
    </FiroContext.Provider>
  );
};
