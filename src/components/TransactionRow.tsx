import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {View, StyleSheet, Image, ViewStyle, StyleProp} from 'react-native';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import {TX_DATE_FORMAT} from '../core/FiroWallet';
import {Currency} from '../utils/currency';
import { formatTimestamp } from '../utils/datetime';
import BigNumber from 'bignumber.js';

type TransactionRowProps = {
  style: StyleProp<ViewStyle>;
  item: TransactionItem;
  firoRate: number;
  currentCurrency: string;
};

export const TransactionRow: FC<TransactionRowProps> = props => {
  const item = props.item;
  const ic = item.received
    ? require('../img/ic_received_tx.png')
    : item.isMint
    ? require('../img/ic_anonymized_tx.png')
    : require('../img/ic_sent_tx.png');

  const title = !item.confirmed
    ? localization.transaction_list_item.unconfirmed.toLowerCase()
    : item.received
    ? localization.transaction_list_item.receive
    : item.isMint
    ? localization.transaction_list_item.anonymize
    : localization.transaction_list_item.send;

  // let unconfirmed = <Text />;
  // if (!item.confirmed) {
  //   unconfirmed = (
  //     <Text style={styles.unconfirmed}>
  //       ({localization.transaction_list_item.unconfirmed.toLowerCase()})
  //     </Text>
  //   );
  // }

  return (
    <View style={[styles.root, props.style]}>
      <Image style={styles.icon} source={ic} />
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {Currency.formatFiroAmountWithCurrency(new BigNumber(item.value))} 
          </Text>
          <Text style={styles.title}>
            {Currency.formatFiroAmountWithCurrency(
              new BigNumber(item.value),
              props.firoRate,
              props.currentCurrency,
            )}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.subtitle}>{title}</Text>
          <Text style={styles.subtitle}>
            {formatTimestamp(item.date)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    height: 32,
    width: 32,
    marginHorizontal: 12,
    marginVertical: 16,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingEnd: 12,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: '#000000',
  },
  subtitle: {
    paddingTop: 4,
    fontFamily: 'Rubik-Regular',
    fontWeight: '500',
    fontSize: 14,
    color: '#0F0E0E',
    opacity: 0.7,
  },
  unconfirmed: {
    color: '#9B1C2E',
  },
});
