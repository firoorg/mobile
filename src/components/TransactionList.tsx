import React, {FC, useContext} from 'react';
import * as NavigationService from '../NavigationService';
import {ListItem, Text} from 'react-native-elements';
import {View, StyleSheet, Image} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

var options = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const keys = (_: TransactionItem, index: number) => index.toString();

const renderItem: (
  item: TransactionItem,
  firoRate: number,
  currentCurrency: string,
) => React.ReactElement = (item, firoRate, currentCurrency) => {
  const onTransactionClick = () => {
    NavigationService.navigate('TransactionDetailsScreen', {item});
  };
  const ic = item.received
    ? require('../img/ic_received_tx.png')
    : require('../img/ic_sent_tx.png');

  return (
    <ListItem containerStyle={styles.listItem} onPress={onTransactionClick}>
      <View style={styles.listItemCard}>
        <Image style={styles.icon} source={ic} />
        <View style={styles.textContainer}>
          <View style={styles.row}>
            <Text style={styles.title}>
              {item.value} {localization.global.firo}
            </Text>
            <Text style={styles.title}>
              ${(item.value * firoRate).toFixed(2)}{' '}
              {(localization.currencies as any)[currentCurrency]}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.subtitle}>
              {item.received
                ? localization.transaction_list_item.received
                : localization.transaction_list_item.sent}
            </Text>
            <Text style={styles.subtitle}>
              {item.date.toLocaleDateString('en-US', options)}
            </Text>
          </View>
        </View>
      </View>
    </ListItem>
  );
};

type TransactionListProps = {
  transactionList: Array<TransactionItem>;
};

export const TransactionList: FC<TransactionListProps> = props => {
  const {getFiroRate, getSettings} = useContext(FiroContext);
  return (
    <FlatList
      keyExtractor={keys}
      data={props.transactionList}
      renderItem={item => {
        return renderItem(
          item.item,
          getFiroRate(),
          getSettings().defaultCurrency,
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  listItem: {
    marginVertical: -5,
    backgroundColor: colors.background,
  },
  listItemCard: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    elevation: 4,
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
});
