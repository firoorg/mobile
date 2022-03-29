import React, {FC, useState} from 'react';
import {Text, Divider} from 'react-native-elements';
import {View, StyleSheet, Image, TextInput, ToastAndroid} from 'react-native';
import {FiroPrimaryGreenButton} from './Button';
import localization from '../localization';
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import Clipboard from '@react-native-clipboard/clipboard';
import {AppStorage} from '../app-storage';
import {AddressItem} from '../data/AddressItem';
import {FiroInfoText} from './Texts';
import {CurrentFiroTheme} from '../Themes';
const {colors} = CurrentFiroTheme;

const appStorage = new AppStorage();

type CreateAddressProp = {
  address: string;
  name?: string | undefined;
  onRefreshClick: () => void;
  onAddressSave?: () => void;
};

export const CreateAddressCard: FC<CreateAddressProp> = props => {
  const [name, setName] = useState(props.name);

  const onAddressSaveClick = async () => {
    if (name !== undefined) {
      await appStorage.addSavedAddress(
        new AddressItem(name.trim(), props.address),
      );
      if (props.onAddressSave) {
        props.onAddressSave();
      }
    }
  };

  const onCopyClick = () => {
    console.log(props.address);
    Clipboard.setString(props.address);
    ToastAndroid.showWithGravityAndOffset(
      localization.create_address_card.address_copied,
      ToastAndroid.SHORT,
      ToastAndroid.TOP,
      0,
      100,
    );
  };

  let nameField;
  if (props.name !== undefined) {
    nameField = (
      <FiroInfoText
        style={styles.addressNameInfo}
        title={localization.create_address_card.address_name}
        text={props.name}
      />
    );
  } else {
    nameField = (
      <TextInput
        style={styles.addressName}
        placeholderTextColor={colors.textPlaceholder}
        placeholder={localization.create_address_card.address_name}
        onChangeText={txt => setName(txt)}
      />
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.currentAddressLabel}>
        {localization.create_address_card.current_address}
      </Text>
      <View style={styles.currentAddress}>
        <Text style={styles.address}>{props.address}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCopyClick}>
            <Image style={styles.icon} source={require('../img/ic_copy.png')} />
          </TouchableOpacity>
          <TouchableWithoutFeedback onPress={props.onRefreshClick}>
            <Image
              style={styles.icon}
              source={require('../img/ic_refresh.png')}
            />
          </TouchableWithoutFeedback>
        </View>
      </View>
      {nameField}
      <Divider style={styles.divider} />
      <FiroPrimaryGreenButton
        text={localization.create_address_card.save_address}
        onClick={onAddressSaveClick}
        disable={props.name !== undefined || name === undefined || name === ''}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 12,
    elevation: 2,
  },
  currentAddressLabel: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    fontSize: 12,
    color: 'rgba(15, 14, 14, 0.5)',
    marginBottom: 5,
  },
  currentAddress: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
  },
  address: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 12,
    color: '#3C3939',
  },
  icon: {
    width: 24,
    height: 24,
    marginLeft: 8,
  },
  addressName: {
    height: 36,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    textAlignVertical: 'top',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 24,
    color: colors.text,
  },
  addressNameInfo: {
    paddingTop: 20,
  },
  divider: {
    marginTop: 12,
    marginBottom: 12,
  },
});
