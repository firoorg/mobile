import React, {FC, useContext} from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInfoText} from '../components/Texts';
import {RouteProp} from '@react-navigation/core';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import {TransactionRow} from '../components/TransactionRow';

type WalletStackRouteProps = {
  TransactionDetails: {item: TransactionItem};
};

type TransactionDetailsProps = {
  route: RouteProp<WalletStackRouteProps, 'TransactionDetails'>;
};

const TransactionDetailsScreen: FC<TransactionDetailsProps> = props => {
  const {getFiroRate, getSettings} = useContext(FiroContext);
  const {item} = props.route.params;

  const backgroundColor =
    item.received || item.isMint ? '#2fa29920' : '#a22f7220';

  let label = <Text />;
  if (item.label !== undefined) {
    label = (
      <FiroInfoText
        style={styles.infoText}
        title={localization.transaction_details.label}
        text={item.label}
      />
    );
  }

  return (
    <View style={styles.root}>
      <FiroToolbar title={localization.transaction_details.title} />
      <View style={styles.txDetails}>
        <TransactionRow
          style={[styles.transactionCard, {backgroundColor: backgroundColor}]}
          item={item}
          firoRate={getFiroRate()}
          currentCurrency={getSettings().defaultCurrency}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.transaction_id}
          text={item.txId}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.address}
          text={item.address}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.fee}
          text={item.fee.toString()}
        />
        {label}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    height: '100%',
    display: 'flex',
    padding: 30,
  },
  txDetails: {
    paddingTop: 34,
  },
  transactionCard: {
    width: '100%',
    borderRadius: 10,
  },
  infoText: {
    paddingTop: 30,
  },
});

export default TransactionDetailsScreen;
