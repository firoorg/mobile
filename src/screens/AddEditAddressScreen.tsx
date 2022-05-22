import React, {FC, useState, useContext} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroContext} from '../FiroContext';
import {CurrentFiroTheme} from '../Themes';
import {AddressBookItem} from '../data/AddressBookItem';
import {Confirmation} from '../components/Confirmation';
import * as NavigationService from '../NavigationService';
import {AppStorage} from '../app-storage';
import localization from '../localization';
import {FiroStatusBar} from '../components/FiroStatusBar';
import { Card } from '../components/Card';
const bip21 = require('bip21');

const appStorage = new AppStorage();
const {colors} = CurrentFiroTheme;

type AddressBookStackRouteProps = {
  Address: {item: AddressBookItem; onSuccess?: () => void};
};

type AddEditAddressProps = {
  route: RouteProp<AddressBookStackRouteProps, 'Address'>;
};

const AddEditAddress: FC<AddEditAddressProps> = props => {
  const {getWallet} = useContext(FiroContext);
  let {item, onSuccess} = props.route.params;
  const hasInputAddress = item !== undefined;

  const [address, setAddress] = useState(hasInputAddress ? item.address : '');
  const [name, setName] = useState(hasInputAddress ? item.name : '');
  const [saveButtonEsabled, setSaveButtonEsabled] = useState(false)

  const onAddressChange = (address: string) => {
    setAddress(address);
    validateAddressAndName(address, name)
  }
  const onNameChange = (name: string) => {
    setName(name);
    validateAddressAndName(address, name)
  }
  const validateAddressAndName = (address: string, name: string) => {
    const wallet = getWallet();
    if (!wallet) {
      return;
    }
    setSaveButtonEsabled(wallet.validate(address) && name !== '');
  }
  const onDiscard = () => {
    NavigationService.back();
  };
  const onConfirm = async () => {
    if (hasInputAddress) {
      item.address = address;
      item.name = name.trim();

      await appStorage.updateAddressBookItem(item);
    } else {
      await appStorage.addNewAddressBookItem(
        new AddressBookItem(name.trim(), address),
      );
    }
    if (onSuccess) {
      onSuccess();
    }
    NavigationService.back();
  };

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={Platform.select({ios: 48, android: 0})}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <FiroToolbar
        title={
          hasInputAddress
            ? localization.add_edit_address_screen.edit_address
            : localization.add_edit_address_screen.add_new_address
        }
      />
      <FiroStatusBar />
      <View style={styles.root}>
        <Card style={[styles.card]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textPlaceholder}
              placeholder={localization.send_address.address}
              value={address}
              autoCorrect={false}
              onChangeText={txt => onAddressChange(txt)}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              NavigationService.navigate('ScanQRCode', {
                screen: 'ScanQRCodeScreen' as any,
                params: {
                  onBarScanned: (info: {data: string}) => {
                    if (info.data) {
                      try {
                        const decoded = bip21.decode(info.data, 'firo');
                        onAddressChange(decoded.address);
                      } catch {}
                    }
                  },
                },
              });
            }}>
            <Image style={styles.icon} source={require('../img/ic_scan.png')} />
          </TouchableOpacity>
        </Card>
        <Card style={styles.nameCard}>
          <TextInput
            style={styles.name}
            value={name}
            autoCorrect={false}
            placeholderTextColor={colors.textPlaceholder}
            placeholder={localization.add_edit_address_screen.name}
            onChangeText={txt => onNameChange(txt)}
          />
        </Card>
      </View>

      <Confirmation
        style={styles.confirmation}
        confirmButtonText={localization.add_edit_address_screen.save}
        onDiscardAction={onDiscard}
        onConfirmAction={onConfirm}
        enabled={saveButtonEsabled}
      />
    </KeyboardAvoidingView>
  );
};

export default AddEditAddress;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  root: {
    height: '100%',
    display: 'flex',
    paddingHorizontal: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    width: '100%',
  },
  inputContainer: {
    flexGrow: 1,
    width: 0,
  },
  input: {
    height: 48,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: colors.text,
  },
  divider: {
    width: 30,
    marginHorizontal: -15,
    transform: [{rotate: '90deg'}],
  },
  icon: {
    marginHorizontal: 10,
    width: 24,
    height: 24,
  },
  nameCard: {
    marginTop: 25,
    borderRadius: 20,
    width: '100%',
    backgroundColor: colors.cardBackground,
  },
  name: {
    paddingHorizontal: 20,
    color: colors.text,
    height: 48,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    paddingVertical: 10,
  },
  confirmation: {
    marginTop: 'auto',
    elevation: 16,
    backgroundColor: '#fff',
    padding: 20,
  },
});
