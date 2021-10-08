import React, {FC} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import {ListItem} from 'react-native-elements';
import {FlatList} from 'react-native';
import * as NavigationService from '../NavigationService';
import {CurrentFiroTheme} from '../Themes';
import {AddressBookItem} from '../data/AddressBookItem';

let onAddressSelect: ((item: string) => void) | undefined;

type AddressBookListProp = {
  addressBookList: Array<AddressBookItem>;
  onMenuClick?: (item: AddressBookItem) => void;
  onAddressSelect?: (item: string) => void;
};

const onAddressClick = (item: AddressBookItem) => {
  if (onAddressSelect) {
    onAddressSelect(item.address);
  } else {
    NavigationService.navigate('AddressDetailsScreen', {item});
  }
};

const keys = (item: AddressBookItem, index: number) => index.toString();

export const AddressBookList: FC<AddressBookListProp> = props => {
  onAddressSelect = props.onAddressSelect;

  const renderItem: ListRenderItem<AddressBookItem> = ({item}) => {
    return (
      <ListItem
        containerStyle={styles.listItem}
        onPress={() => onAddressClick(item)}>
        <View style={styles.listItemCard}>
          <View style={[styles.icon, {backgroundColor: item.iconColor}]}>
            <Text style={styles.iconLetter}>
              {item.name.substring(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.addressName}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
          </View>
          {props.onMenuClick && (
            <TouchableOpacity
              onPress={() => props.onMenuClick!(item)}
              style={styles.menuButton}>
              <Image
                style={styles.menu}
                source={require('../img/ic_more.png')}
              />
            </TouchableOpacity>
          )}
          {props.onAddressSelect && (
            <ListItem.CheckBox
              checkedColor={colors.primary}
              uncheckedColor={colors.unchecked}
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={false}
              onPress={() => onAddressClick(item)}
            />
          )}
        </View>
      </ListItem>
    );
  };

  return (
    <FlatList
      keyExtractor={keys}
      data={props.addressBookList}
      renderItem={renderItem}
    />
  );
};

const {colors} = CurrentFiroTheme;

const styles = StyleSheet.create({
  listItem: {
    marginVertical: -5,
    backgroundColor: colors.background,
  },
  listItemCard: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#f4f6f8',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
  },
  iconLetter: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ffffff',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingStart: 12,
    paddingEnd: 12,
  },
  addressName: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: '#858585',
  },
  address: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: '#3C3939',
  },
  menuButton: {
    padding: 10,
  },
  menu: {
    width: 24,
    height: 24,
  },
});
