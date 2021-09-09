import React, {FC, useState} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import {Divider} from 'react-native-elements';
import * as NavigationService from '../NavigationService';
import localization from '../localization';
import {useEffect} from 'react';

type SendAddressProps = {
  style: StyleProp<ViewStyle>;
  onAddressSelect: (address: string) => void;
};

export const SendAddress: FC<SendAddressProps> = props => {
  const [firoIndex, setFiroIndex] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  useEffect(() => {
    props.onAddressSelect(sendAddress);
  }, [sendAddress]);
  return (
    <View style={[styles.card, props.style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={localization.send_address.address}
          value={sendAddress}
          onChangeText={text => setSendAddress(text)}
        />
      </View>
      <TouchableOpacity onPress={() => setFiroIndex(1 - firoIndex)}>
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
});
