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
import {FiroStatusBar} from '../components/FiroStatusBar';

const appStorage = new AppStorage();
const {colors} = CurrentFiroTheme;

const ReceiveScreen = () => {
  const {getWallet, saveToDisk} = useContext(FiroContext);
  const [address, setAddress] = useState('loading...');
  const [initialName, setInitialName] = useState<string | undefined>();
  const [isSavedAddressesVisible, setSavedAddressesVisible] = useState(false);
  const [savedAddressesList, setSavedAddressesList] = useState<AddressItem[]>(
    [],
  );

  const onClickCreateAddress = () => {
    const wallet = getWallet();
    if (wallet) {
      setAddress('loading...');
      wallet.skipAddress();
      wallet.getAddressAsync().then(setAddress).then(saveToDisk);
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
    const wallet = getWallet();
    if (wallet) {
      setAddress('loading...');
      wallet.getAddressAsync().then(setAddress);
    }
  }, [getWallet]);

  const loadSavedAddresses = async () => {
    const savedAddresses = await appStorage.loadSavedAddresses();
    setSavedAddressesList(savedAddresses);
  };

  useEffect(() => {
    const foundAddress = savedAddressesList.find(
      item => item.address === address,
    );
    if (foundAddress !== undefined) {
      setInitialName(foundAddress.name);
    }
  }, [address, savedAddressesList]);

  useFocusEffect(
    React.useCallback(() => {
      loadSavedAddresses();
      return () => {};
    }, []),
  );

  return (
    <ScrollView keyboardShouldPersistTaps="always">
      <View>
        <FiroToolbarWithoutBack title={localization.receive_screen.title} />
        <FiroStatusBar />
        <View style={styles.root}>
          <FiroTextBig
            style={styles.qrLabel}
            text={localization.receive_screen.scan_qr}
          />
          <View style={styles.qr}>
            <QRCode
              value={'firo:' + address}
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
            <View style={styles.selectAddressContainer}>
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
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: 20,
  },
  qrLabel: {
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
  selectAddressContainer: {
    display: 'flex',
  },
});

export default ReceiveScreen;
