import React, {FC, useContext} from 'react';
import * as NavigationService from '../NavigationService';
import {ListItem} from 'react-native-elements';
import {StyleSheet, FlatList} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import {TransactionRow} from './TransactionRow';

const {colors} = CurrentFiroTheme;

const keys = (item: TransactionItem) => item.txId;

const renderItem: (
  item: TransactionItem,
  firoRate: number,
  currentCurrency: string,
) => React.ReactElement = (item, firoRate, currentCurrency) => {
  const onTransactionClick = () => {
    NavigationService.navigate('TransactionDetailsScreen', {item});
  };

  return (
    <ListItem containerStyle={styles.listItem} onPress={onTransactionClick}>
      <TransactionRow
        style={styles.listItemCard}
        item={item}
        firoRate={firoRate}
        currentCurrency={currentCurrency}
      />
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
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 5,
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
  unconfirmed: {
    color: '#9F0E0E',
  },
});
