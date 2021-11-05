import React, {useContext, useEffect, useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {CreateAddressCard} from '../components/CreateAddressCard';
import {FiroTextBig} from '../components/Texts';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {CurrentFiroTheme} from '../Themes';
import {FiroSelectFromSavedAddress} from '../components/Button';
import QRCode from 'react-native-qrcode-svg';
import localization from '../localization';
import {FiroContext} from '../FiroContext';
import {ScrollView} from 'react-native-gesture-handler';
import {AppStorage} from '../app-storage';
import {AddressItem} from '../data/AddressItem';
import {useFocusEffect} from '@react-navigation/native';
import {BottomSheet} from 'react-native-elements';
import {SavedAddressesList} from '../components/SavedAddressesList';
import Logger from '../utils/logger';

const {colors} = CurrentFiroTheme;

const appStorage = new AppStorage();

const ReceiveScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [address, setAddress] = useState('loading...');
  const [initialName, setInitialName] = useState<string | undefined>();
  const [isSavedAddressesVisible, setSavedAddressesVisible] = useState(false);
  const [savedAddressesList, setSavedAddressesList] = useState<AddressItem[]>(
    [],
  );

  const onClickCreateAddress = () => {
    const wallet = getWallet();
    if (wallet) {
      wallet.getAddressAsync().then(addr => {
        setAddress(addr);
        Logger.info('receive_screen:onClickCreateAddress', addr);
      });
    }
  };

  const onClickSelectFromAddress = async () => {
    setSavedAddressesVisible(true);
  };

  const onAddressSelect = async (_address: string) => {
    setAddress(_address);
    setSavedAddressesVisible(false);
  };

  useEffect(() => {
    onClickCreateAddress();
  }, []);

  const loadSavedAddresses = async () => {
    const savedAddresses = await appStorage.loadSavedAddresses();
    setSavedAddressesList(savedAddresses);
    Logger.info('receive_screen:loadSavedAddress', savedAddresses);
  };

  const findAddressItem = async () => {
    const foundAddress = savedAddressesList.find(
      item => item.address === address,
    );
    Logger.info('receive_screen:findAddressItem ', savedAddressesList);
    Logger.info('receive_screen:findAddressItem ', foundAddress);
    if (foundAddress !== undefined) {
      setInitialName(foundAddress.name);
    }
  };

  useEffect(() => {
    findAddressItem();
  }, [address, savedAddressesList]);
  useFocusEffect(
    React.useCallback(() => {
      loadSavedAddresses();
      return () => {};
    }, []),
  );

  return (
    <ScrollView>
      <View style={styles.root}>
        <FiroToolbarWithoutBack title={localization.receive_screen.title} />
        <View style={styles.content}>
          <FiroTextBig
            style={styles.qrLabel}
            text={localization.receive_screen.scan_qr}
          />
          <View style={styles.qr}>
            <QRCode
              value={address}
              size={226}
              color="#000000"
              backgroundColor="#F7F9FB"
              ecl="H"
            />
          </View>
          <CreateAddressCard
            address={address}
            name={initialName}
            onRefreshClick={onClickCreateAddress}
            onAddressSave={() => loadSavedAddresses()}
          />
          <FiroSelectFromSavedAddress
            onClick={onClickSelectFromAddress}
            buttonStyle={styles.savedAddress}
            text={localization.receive_screen.select_from_saved_address}
            disable={savedAddressesList.length === 0}
          />
        </View>
        <BottomSheet
          modalProps={{
            onRequestClose: () => {
              setSavedAddressesVisible(false);
            },
          }}
          isVisible={isSavedAddressesVisible}>
          <View style={{...styles.savedAddressesView}}>
            <TouchableOpacity
              style={styles.closeBottomSheet}
              onPress={() => {
                setSavedAddressesVisible(false);
              }}>
              <Image source={require('../img/ic_close.png')} />
            </TouchableOpacity>
            <View style={{display: 'flex'}}>
              <Text style={styles.selectAddress}>
                {localization.send_screen.select_address}
              </Text>
            </View>
            <SavedAddressesList
              savedAddressesList={savedAddressesList}
              onAddressSelect={onAddressSelect}
            />
          </View>
        </BottomSheet>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  content: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  qrLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: 'rgba(15, 14, 14, 0.7)',
  },
  qr: {
    backgroundColor: '#F7F9FB',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  savedAddress: {
    width: '100%',
    marginTop: 20,
  },
  savedAddressesView: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 0,
  },
  closeBottomSheet: {
    width: 30,
    height: 30,
    position: 'absolute',
    right: 5,
    top: 10,
  },
  selectAddress: {
    color: colors.text,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 16,
    paddingTop: 15,
    alignSelf: 'center',
  },
});

export default ReceiveScreen;
