import React, {FC, useState} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Text,
} from 'react-native';
import {BottomSheet, Divider} from 'react-native-elements';
import * as NavigationService from '../NavigationService';
import localization from '../localization';
import {useEffect} from 'react';
import {AppStorage} from '../app-storage';
import {AddressBookList} from './AddressBookList';
import {AddressBookItem} from '../data/AddressBookItem';
import {CurrentFiroTheme} from '../Themes';
import {useFocusEffect} from '@react-navigation/native';

const {colors} = CurrentFiroTheme;

const appStorage = new AppStorage();

type SendAddressProps = {
  style: StyleProp<ViewStyle>;
  onAddressSelect: (address: string) => void;
  address?: string;
};

export const SendAddress: FC<SendAddressProps> = props => {
  const [sendAddress, setSendAddress] = useState('');
  const [isAddressbookVisible, setAddressbookVisible] = useState(false);
  const [addressBookList, setAddressBookList] = useState<AddressBookItem[]>([]);

  const openAddressBook = () => {
    setAddressbookVisible(true);
  };

  useEffect(() => {
    props.onAddressSelect(sendAddress);
  }, [sendAddress]);

  const loadAddressBook = async () => {
    let addressBook = await appStorage.loadAddressBook();
    setAddressBookList(addressBook);
  };

  const onAddressSelect = async (address: string) => {
    setSendAddress(address);
    setAddressbookVisible(false);
  };

  useEffect(() => {
    loadAddressBook();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      loadAddressBook();
      return () => {};
    }, []),
  );

  return (
    <View style={[styles.card, props.style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={localization.send_address.address}
          value={props.address}
          onChangeText={text => setSendAddress(text)}
        />
      </View>
      <TouchableOpacity onPress={openAddressBook}>
        <Image
          style={styles.icon}
          source={require('../img/ic_address_book.png')}
        />
      </TouchableOpacity>
      <Divider style={styles.divider} />
      <TouchableOpacity
        onPress={() => {
          NavigationService.navigate('ScanQRCode', {
            screen: 'ScanQRCodeScreen' as any,
            params: {
              onBarScanned: (info: {data: string}) => {
                if (info.data) {
                  setSendAddress(info.data);
                }
              },
            },
          });
        }}>
        <Image style={styles.icon} source={require('../img/ic_scan.png')} />
      </TouchableOpacity>
      <BottomSheet modalProps={{}} isVisible={isAddressbookVisible}>
        <View style={{...styles.addresbookView}}>
          <TouchableOpacity
            style={styles.closeBottomSheet}
            onPress={() => {
              setAddressbookVisible(false);
            }}>
            <Image source={require('../img/ic_close.png')} />
          </TouchableOpacity>
          <View style={{display: 'flex'}}>
            <Text style={styles.selectAddress}>
              {localization.send_screen.select_address}
            </Text>
          </View>
          <AddressBookList
            addressBookList={addressBookList}
            onAddressSelect={onAddressSelect}
          />
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    elevation: 2,
    width: '100%',
  },
  inputContainer: {
    flexGrow: 1,
    width: 0,
  },
  input: {
    marginLeft: 20,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: 'rgba(15, 14, 14, 0.5)',
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
  addresbookView: {
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
