import {FiroWallet} from './core/FiroWallet';
import {AbstractWallet} from './core/AbstractWallet';
import AsyncStorage from '@react-native-community/async-storage';
import RNSecureKeyStore, {ACCESSIBLE} from 'react-native-secure-key-store';
import {AddressBookItem} from './data/AddressBookItem';

const encryption = require('./utils/encryption');

export class AppStorage {
  static FLAG_ENCRYPTED = 'data_encrypted';
  static LANG = 'lang';
  static EXCHANGE_RATES = 'currency';
  static LNDHUB = 'lndhub';
  static ELECTRUM_HOST = 'electrum_host';
  static ELECTRUM_TCP_PORT = 'electrum_tcp_port';
  static ELECTRUM_SSL_PORT = 'electrum_ssl_port';
  static PREFERRED_CURRENCY = 'preferredCurrency';
  static ADVANCED_MODE_ENABLED = 'advancedmodeenabled';
  static DELETE_WALLET_AFTER_UNINSTALL = 'deleteWalletAfterUninstall';
  static ADDRESS_BOOK = 'address_book';
  static SETTINGS = 'settings';

  /**
   * Wrapper for storage call. Secure store works only in RN environment. AsyncStorage is
   * used for cli/tests
   *
   * @param key
   * @param value
   * @returns {Promise<any>|Promise<any> | Promise<void> | * | Promise | void}
   */
  setItem = (key: string, value: any): Promise<any> => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    ) {
      return RNSecureKeyStore.set(key, value, {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      });
    } else {
      return AsyncStorage.setItem(key, value);
    }
  };

  /**
   * Wrapper for storage call. Secure store works only in RN environment. AsyncStorage is
   * used for cli/tests
   *
   * @param key
   * @returns {Promise<any>|*}
   */
  getItem = (key: string): Promise<any> => {
    if (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    ) {
      return RNSecureKeyStore.get(key);
    } else {
      return AsyncStorage.getItem(key);
    }
  };

  async loadWalletFromDisk(password: string): Promise<AbstractWallet | null> {
    try {
      let data = await this.getItem('data');
      data = encryption.decrypt(JSON.parse(data), password);

      if (data !== null) {
        // const realm = await this.getRealm();
        data = JSON.parse(data);
        if (!data.wallet) {
          return null;
        }
        const wallet = data.wallet;
        let unserializedWallet = FiroWallet.fromJson(wallet);

        // this.inflateWalletFromRealm(realm, unserializedWallet);

        // done
        // this.tx_metadata = data.tx_metadata;

        // realm.close();
        console.log('load wallet', unserializedWallet);
        return unserializedWallet;
      } else {
        return null; // failed loading data or loading/decryptin data
      }
    } catch (error) {
      console.warn(error.message);
      return null;
    }
  }

  /**
   * Serializes and saves to storage object data.
   *
   * @returns {Promise} Result of storage save
   */
  async saveWalletToDisk(
    password: string,
    wallet: AbstractWallet,
  ): Promise<any> {
    // const realm = await this.getRealm();
    // wallet.prepareForSerialization();
    // delete wallet.current;
    const keyCloned = Object.assign({}, wallet); // stripped-down version of a wallet to save to secure keystore
    // if (wallet._hdWalletInstance) {
    //   keyCloned._hdWalletInstance = Object.assign({}, wallet._hdWalletInstance);
    // }
    // // this.offloadWalletToRealm(realm, wallet);
    // // stripping down:
    // if (wallet._txs_by_external_index) {
    //   keyCloned._txs_by_external_index = {};
    //   keyCloned._txs_by_internal_index = {};
    // }
    // if (wallet._hdWalletInstance) {
    //   keyCloned._hdWalletInstance._txs_by_external_index = {};
    //   keyCloned._hdWalletInstance._txs_by_internal_index = {};
    // }
    let walletToSave = JSON.stringify(keyCloned);
    // realm.close();
    let data = {
      wallet: walletToSave,
      // tx_metadata: this.tx_metadata,
    };

    let newData = encryption.encrypt(JSON.stringify(data), password);
    try {
      await this.setItem(AppStorage.FLAG_ENCRYPTED, '1');
      return await this.setItem('data', JSON.stringify(newData));
    } catch (error) {
      console.warn(error.message);
    }
  }

  async hasSavedWallet(): Promise<boolean> {
    try {
      return (await this.getItem(AppStorage.FLAG_ENCRYPTED)) === '1';
    } catch (error) {
      return false;
    }
  }

  async loadAddressBook(): Promise<Array<AddressBookItem>> {
    try {
      let addressBookJson = await this.getItem(AppStorage.ADDRESS_BOOK);
      return JSON.parse(addressBookJson) as Array<AddressBookItem>;
    } catch (error) {
      return [];
    }
  }

  async addNewAddressBookItem(addressBookItem: AddressBookItem): Promise<any> {
    try {
      let addressBook = await this.loadAddressBook();
      if (addressBook.length > 0) {
        addressBookItem.id = addressBook[addressBook.length - 1].id + 1;
      } else {
        addressBookItem.id = 0;
      }
      addressBook[addressBook.length] = addressBookItem;
      return await this.setItem(
        AppStorage.ADDRESS_BOOK,
        JSON.stringify(addressBook),
      );
    } catch (error) {
      console.warn(error.message);
    }
  }

  async updateAddressBookItem(addressBookItem: AddressBookItem): Promise<any> {
    try {
      let addressBook = await this.loadAddressBook();
      addressBook.forEach((item, index) => {
        if (item.id === addressBookItem.id) {
          addressBook[index] = addressBookItem;
        }
      });
      return await this.setItem(
        AppStorage.ADDRESS_BOOK,
        JSON.stringify(addressBook),
      );
    } catch (error) {
      console.warn(error.message);
    }
  }

  async deleteAddressBookItem(addressBookItem: AddressBookItem): Promise<any> {
    try {
      let addressBook = await this.loadAddressBook();
      let delelteIndex = -1;
      addressBook.forEach((item, index) => {
        if (item.id === addressBookItem.id) {
          delelteIndex = index;
        }
      });
      if (delelteIndex > -1) {
        addressBook.splice(delelteIndex, 1);
      }
      return await this.setItem(
        AppStorage.ADDRESS_BOOK,
        JSON.stringify(addressBook),
      );
    } catch (error) {
      console.warn(error.message);
    }
  }
}
