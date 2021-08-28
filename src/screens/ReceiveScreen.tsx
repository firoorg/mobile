import React, {useContext, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {CreateAddressCard} from '../components/CreateAddressCard';
import {FiroTextBig} from '../components/Texts';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {CurrentFiroTheme} from '../Themes';
import {FiroSelectFromSavedAddress} from '../components/Button';
import {ReceiveAmountInputCard} from '../components/AmountInput';
import QRCode from 'react-native-qrcode-svg';
import localization from '../localization';
import {FiroContext} from '../FiroContext';

const {colors} = CurrentFiroTheme;

const ReceiveScreen = () => {
  const {getWallet} = useContext(FiroContext);
  const [address, setAddress] = useState('loading...');
  const onClickSelectFromAddress = async () => {};
  const onClickCreateAddress = async () => {
    const wallet = getWallet();
    if (wallet) {
      const addr = await wallet?.getAddressAsync();
      setAddress(addr);
      console.log(addr);
    }
  };

  useEffect(() => {
    onClickCreateAddress();
  }, []);

  return (
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
        <CreateAddressCard address={address} onClick={onClickCreateAddress} />
        <FiroSelectFromSavedAddress
          onClick={onClickSelectFromAddress}
          buttonStyle={styles.savedAddress}
          text={localization.receive_screen.select_from_saved_address}
        />
        <ReceiveAmountInputCard />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
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
});

export default ReceiveScreen;
