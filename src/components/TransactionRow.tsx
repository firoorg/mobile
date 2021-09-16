import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {View, StyleSheet, Image, ViewStyle, StyleProp} from 'react-native';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import {TX_DATE_FORMAT} from '../core/FiroWallet';

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
    ? require('../img/ic_receive.png')
    : require('../img/ic_sent_tx.png');

  const title = item.received
    ? localization.transaction_list_item.receive
    : item.isMint
    ? localization.transaction_list_item.anonymize
    : localization.transaction_list_item.send;

  let uncondirmed = <Text />;
  if (!item.condirmed) {
    uncondirmed = (
      <Text style={styles.uncondirmed}>
        ({localization.transaction_list_item.uncondirmed.toLowerCase()})
      </Text>
    );
  }

  return (
    <View style={[styles.root, props.style]}>
      <Image style={styles.icon} source={ic} />
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {item.value} {localization.global.firo} {uncondirmed}
          </Text>
          <Text style={styles.title}>
            ${(item.value * props.firoRate).toFixed(2)}{' '}
            {(localization.currencies as any)[props.currentCurrency]}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.subtitle}>{title}</Text>
          <Text style={styles.subtitle}>
            {item.date.toLocaleDateString('en-US', TX_DATE_FORMAT)}
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
  uncondirmed: {
    color: '#9F0E0E',
  },
});
