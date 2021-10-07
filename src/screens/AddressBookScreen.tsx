import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {BottomSheet, ListItem, Avatar} from 'react-native-elements';
import {FiroToolbarWithoutBack} from '../components/Toolbar';
import {AddressBookList} from '../components/AddressBookList';
import * as NavigationService from '../NavigationService';
import {CurrentFiroTheme} from '../Themes';
import {AppStorage} from '../app-storage';
import {AddressBookItem} from '../data/AddressBookItem';
import localization from '../localization';
import {useFocusEffect} from '@react-navigation/native';
import {Divider} from 'react-native-elements/dist/divider/Divider';

const appStorage = new AppStorage();

const {colors} = CurrentFiroTheme;

const AddressBookScreen = () => {
  const [addressBookList, setAddressBookList] = useState<AddressBookItem[]>([]);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [currentAddress, setCurrentAddress] = useState<AddressBookItem>();

  const loadAddressBook = async () => {
    let addressBook = await appStorage.loadAddressBook();
    setAddressBookList(addressBook);
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

  const onAddNewClick = () => {
    NavigationService.navigate('AddEditAddressScreen', {undefined});
  };
  const onMenuIconClick = (item: AddressBookItem) => {
    setCurrentAddress(item);
    setIsMenuVisible(true);
  };
  const onCancelPress = () => {
    setIsMenuVisible(false);
  };
  const onCopyPress = () => {
    if (currentAddress !== undefined) {
      Clipboard.setString(currentAddress.address);
      ToastAndroid.showWithGravity(
        localization.address_book_screen.address_copied,
        ToastAndroid.SHORT,
        ToastAndroid.TOP,
      );
    }
    onCancelPress();
  };
  const onViewPress = () => {
    if (currentAddress !== undefined) {
      NavigationService.navigate('AddressDetailsScreen', {
        item: currentAddress,
      });
    }
    onCancelPress();
  };
  const onEditPress = () => {
    if (currentAddress !== undefined) {
      NavigationService.navigate('AddEditAddressScreen', {
        item: currentAddress,
      });
    }
    onCancelPress();
  };
  const onDeletePress = async () => {
    if (currentAddress !== undefined) {
      await appStorage.deleteAddressBookItem(currentAddress);
      setCurrentAddress(undefined);
      loadAddressBook();
    }
    onCancelPress();
  };

  return (
    <View style={styles.root}>
      <FiroToolbarWithoutBack title={localization.address_book_screen.title} />
      <View style={styles.menu}>
        <Image style={styles.search} source={require('../img/ic_search.png')} />
        <TouchableOpacity style={styles.addNew} onPress={onAddNewClick}>
          <Image style={styles.search} source={require('../img/ic_add.png')} />
          <Divider style={styles.divider} />
          <Text>{localization.address_book_screen.add_new}</Text>
        </TouchableOpacity>
      </View>
      <AddressBookList
        addressBookList={addressBookList}
        onMenuClick={onMenuIconClick}
      />
      <BottomSheet
        modalProps={{
          onRequestClose: () => {
            setIsMenuVisible(false);
          },
        }}
        isVisible={isMenuVisible}>
        <ListItem onPress={onCopyPress}>
          <Avatar source={require('../img/ic_copy.png')} />
          <ListItem.Content>
            <ListItem.Title>
              {localization.address_book_menu_screen.copy}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={onViewPress}>
          <Avatar source={require('../img/ic_view.png')} />
          <ListItem.Content>
            <ListItem.Title>
              {localization.address_book_menu_screen.view}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={onEditPress}>
          <Avatar source={require('../img/ic_edit.png')} />
          <ListItem.Content>
            <ListItem.Title>
              {localization.address_book_menu_screen.edit}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={onDeletePress}>
          <Avatar source={require('../img/ic_delete.png')} />
          <ListItem.Content>
            <ListItem.Title>
              {localization.address_book_menu_screen.delete}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
        <ListItem onPress={onCancelPress}>
          <Avatar source={require('../img/ic_close.png')} />
          <ListItem.Content>
            <ListItem.Title>
              {localization.address_book_menu_screen.cancel}
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      </BottomSheet>
    </View>
  );
};

export default AddressBookScreen;

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingTop: 30,
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  addNew: {
    flexDirection: 'row',
  },
  search: {
    width: 24,
    height: 24,
  },
  divider: {
    marginHorizontal: 5,
  },
});
