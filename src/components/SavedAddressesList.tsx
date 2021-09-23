import React, {FC} from 'react';
import {StyleSheet, View, Text, ListRenderItem} from 'react-native';
import {ListItem} from 'react-native-elements';
import {FlatList} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {AddressItem} from '../data/AddressItem';

type SavedAddressesListProp = {
  savedAddressesList: Array<AddressItem>;
  onAddressSelect: (item: string) => void;
};

const keys = (item: AddressItem, index: number) => index.toString();

export const SavedAddressesList: FC<SavedAddressesListProp> = props => {
  const renderItem: ListRenderItem<AddressItem> = ({item}) => {
    return (
      <ListItem
        containerStyle={styles.listItem}
        onPress={() => props.onAddressSelect(item.address)}>
        <View style={styles.listItemCard}>
          <View style={styles.textContainer}>
            <Text style={styles.addressName}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
          </View>
          <ListItem.CheckBox
            checkedColor={colors.primary}
            uncheckedColor={colors.unchecked}
            checkedIcon="dot-circle-o"
            uncheckedIcon="circle-o"
            checked={false}
            onPress={() => props.onAddressSelect(item.address)}
          />
        </View>
      </ListItem>
    );
  };

  return (
    <FlatList
      keyExtractor={keys}
      data={props.savedAddressesList}
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
  menu: {
    width: 24,
    height: 24,
  },
});
