import React, {FC, useContext} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInfoText} from '../components/Texts';
import {FiroContext} from '../FiroContext';
import {TransactionList} from '../components/TransactionList';
import {CurrentFiroTheme} from '../Themes';
import {AddressBookItem} from '../data/AddressBookItem';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

type AddressBookStackRouteProps = {
  Address: {item: AddressBookItem};
};

type AddressDetailsProps = {
  route: RouteProp<AddressBookStackRouteProps, 'Address'>;
};

const AddressDetailsScreen: FC<AddressDetailsProps> = props => {
  const {getWallet} = useContext(FiroContext);
  const {item} = props.route.params;

  const wallet = getWallet();
  let txList: TransactionItem[] = [];
  if (wallet) {
    txList = wallet.getTransactionsByAddress(item.address);
  }

  return (
    <View style={styles.root}>
      <FiroToolbar title={localization.address_details_screen.title} />
      <View style={styles.addressDetails}>
        <View style={[styles.icon, {backgroundColor: item.iconColor}]}>
          <Text style={styles.iconLetter}>{item.name.substring(0, 1)}</Text>
        </View>
        <FiroInfoText
          style={styles.infoText}
          title={localization.address_details_screen.address}
          text={item.address}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.address_details_screen.name}
          text={item.name}
        />
        {txList.length > 0 && (
          <View style={styles.infoText}>
            <Text style={styles.transactionHistory}>Transaction History</Text>
            <TransactionList transactionList={txList} />
          </View>
        )}
      </View>
    </View>
  );
};

export default AddressDetailsScreen;

const styles = StyleSheet.create({
  root: {
    height: '100%',
    display: 'flex',
    padding: 30,
  },
  addressDetails: {
    paddingTop: 34,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  iconLetter: {
    textAlign: 'center',
    fontSize: 16,
    color: '#ffffff',
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: colors.text,
  },
  infoText: {
    paddingTop: 30,
  },
  transactionHistory: {
    fontFamily: 'Rubik-Regular',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
