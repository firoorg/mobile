import {FiroWallet} from './core/FiroWallet';
import {AbstractWallet} from './core/AbstractWallet';
import AsyncStorage from '@react-native-community/async-storage';
import RNSecureKeyStore, {ACCESSIBLE} from 'react-native-secure-key-store';
import {AddressBookItem} from './data/AddressBookItem';
import {AddressItem} from './data/AddressItem';
import Logger from './utils/logger';
import {AnonymitySet} from './data/AnonymitySet';

const Realm = require('realm');
const createHash = require('create-hash');
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
  static SAVED_ADDRESSES = 'saved_addresses';
  static SETTINGS = 'settings';
  static ENCRYPTED_PASSWORD = 'encrypted_password';

  private cachedPassword: string | null = null;

  private static realm: typeof Realm | null = null;

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

  /**
   * Returns instace of the Realm database, which is encrypted by user's password.
   * Database file is deterministically derived from encryption key.
   *
   * @returns {Promise<Realm>}
   */
  async getRealm(): Promise<typeof Realm> {
    if (AppStorage.realm) {
      return AppStorage.realm;
    }

    const password = this.hashIt(this.cachedPassword || 'fyegjitkyf[eqjnc.lf');
    const buf = Buffer.from(
      this.hashIt(password) + this.hashIt(password),
      'hex',
    );
    const encryptionKey = Int8Array.from(buf);
    const path = this.hashIt(this.hashIt(password)) + '-wallets.realm';

    const schema = [
      {
        name: 'Transaction',
        primaryKey: 'id',
        properties: {
          id: {type: 'int', indexed: true},
          _txs_by_external_index: 'string', // stringified json
          _txs_by_internal_index: 'string', // stringified json
        },
      },
      {
        name: 'AnonymitySet',
        primaryKey: 'set_id',
        properties: {
          set_id: {type: 'int', indexed: true},
          block_hash: 'string',
          set_hash: 'string',
          public_coins: 'string', // stringified json
        },
      },
    ];
    AppStorage.realm = Realm.open({
      schema,
      path,
      encryptionKey,
    });
    return AppStorage.realm;
  }

  hashIt = (s: string) => {
    return createHash('sha256').update(s).digest().toString('hex');
  };

  async loadWalletFromDisk(password: string): Promise<AbstractWallet | null> {
    try {
      let data = await this.getItem('data');
      data = encryption.decrypt(JSON.parse(data), password);
      if (data) {
        // password is good, cache it
        this.cachedPassword = password;
      }
      if (data !== null) {
        data = JSON.parse(data);
        if (!data.wallet) {
          return null;
        }
        const wallet = data.wallet;
        let unserializedWallet = FiroWallet.fromJson(wallet);

        const realm = await this.getRealm();
        this.inflateTransactionsFromRealm(realm, unserializedWallet);

        return unserializedWallet;
      } else {
        Logger.warn(
          'storage:loadWalletFromDisk',
          'failed loading data or loading/decryptin data',
        );
        return null;
      }
    } catch (error) {
      Logger.warn('storage:loadWalletFromDisk', error);
      return null;
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    if (this.cachedPassword == null) {
      const wallet = await this.loadWalletFromDisk(password);
      if (!wallet) {
        return false;
      }
    }
    return this.cachedPassword === password;
  }

  /**
   * Serializes and saves to storage object data.
   *
   * @returns {Promise} Result of storage save
   */
  async saveWalletToDisk(
    password: string | null,
    wallet: AbstractWallet,
  ): Promise<any> {
    if (password == null) {
      password = this.cachedPassword;
    }
    if (password == null) {
      throw Error('No password');
    }

    // stripping down:
    const walletJson = JSON.stringify(wallet);
    const keyCloned = FiroWallet.fromJson(walletJson);
    keyCloned.prepareForSerialization();

    const realm = await this.getRealm();
    this.offloadWalletToRealm(realm, wallet);
    let walletToSave = JSON.stringify(keyCloned);
    let data = {
      wallet: walletToSave,
      // tx_metadata: this.tx_metadata,
    };

    let newData = encryption.encrypt(JSON.stringify(data), password);
    try {
      this.cachedPassword = password;
      await this.setItem(AppStorage.FLAG_ENCRYPTED, '1');
      return await this.setItem('data', JSON.stringify(newData));
    } catch (error) {
      Logger.warn('storage:saveWalletToDisk', error);
    }
  }

  inflateTransactionsFromRealm(realm: typeof Realm, wallet: FiroWallet) {
    const realmTxHistoryData = realm.objects('Transaction');
    for (const realmTxData of realmTxHistoryData) {
      try {
        if (realmTxData._txs_by_external_index) {
          const txsByExternalIndex = JSON.parse(
            realmTxData._txs_by_external_index,
          );
          const txsByInternalIndex = JSON.parse(
            realmTxData._txs_by_internal_index,
          );

          wallet._txs_by_external_index = txsByExternalIndex;
          wallet._txs_by_internal_index = txsByInternalIndex;
        }
      } catch (error) {
        Logger.warn('storage:inflateTransactionsFromRealm', error);
      }
    }

    const realmAnonymitySetData = realm.objects('AnonymitySet');
    for (const realmAnonymitySet of realmAnonymitySetData) {
      try {
        const anonytmiySet = new AnonymitySet();
        anonytmiySet.setId = realmAnonymitySet.set_id;
        anonytmiySet.blockHash = realmAnonymitySet.block_hash;
        anonytmiySet.setHash = realmAnonymitySet.set_hash;
        anonytmiySet.publicCoins = JSON.parse(realmAnonymitySet.public_coins);
        wallet._anonymity_sets.push(anonytmiySet);
      } catch (error) {
        Logger.warn('storage:inflateAnonymitySetsFromRealm', error);
      }
    }
  }

  offloadWalletToRealm(realm: typeof Realm, wallet: AbstractWallet) {
    realm.write(() => {
      const txsByInternalIndex = JSON.stringify(wallet._txs_by_external_index);
      const txsByExternalIndex = JSON.stringify(wallet._txs_by_internal_index);
      realm.create(
        'Transaction',
        {
          id: 1,
          _txs_by_external_index: txsByInternalIndex,
          _txs_by_internal_index: txsByExternalIndex,
        },
        Realm.UpdateMode.Modified,
      );

      wallet._anonymity_sets.forEach(anonymitySet => {
        const publicCoins = JSON.stringify(anonymitySet.publicCoins);
        realm.create(
          'AnonymitySet',
          {
            set_id: anonymitySet.setId,
            block_hash: anonymitySet.blockHash,
            set_hash: anonymitySet.setHash,
            public_coins: publicCoins,
          },
          Realm.UpdateMode.Modified,
        );
      });
    });
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
      addressBook.push(addressBookItem);
      addressBook.sort((ad1: AddressBookItem, ad2: AddressBookItem) => {
        return ad1.name.localeCompare(ad2.name);
      });
      return await this.setItem(
        AppStorage.ADDRESS_BOOK,
        JSON.stringify(addressBook),
      );
    } catch (error) {
      Logger.warn('storage:addNewAddressBookItem', error);
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
      Logger.warn('storage:updateAddressBookItem', error);
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
      Logger.warn('storage:deleteAddressBookItem', error);
    }
  }

  async loadSavedAddresses(): Promise<Array<AddressItem>> {
    try {
      let savedAddressesJson = await this.getItem(AppStorage.SAVED_ADDRESSES);
      return JSON.parse(savedAddressesJson) as Array<AddressItem>;
    } catch (error) {
      return [];
    }
  }

  async addSavedAddress(addressItem: AddressItem): Promise<any> {
    try {
      let savedAddresses = await this.loadSavedAddresses();
      savedAddresses.push(addressItem);
      savedAddresses.sort((ad1: AddressItem, ad2: AddressItem) => {
        return ad1.name.localeCompare(ad2.name);
      });
      return await this.setItem(
        AppStorage.SAVED_ADDRESSES,
        JSON.stringify(savedAddresses),
      );
    } catch (error) {
      Logger.warn('storage:addSavedAddress', error);
    }
  }
}
