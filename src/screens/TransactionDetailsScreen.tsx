import React, {FC, useContext} from 'react';
import {StyleSheet, View, Text, Linking} from 'react-native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInfoText, FiroInfoTextWithCopy} from '../components/Texts';
import {RouteProp} from '@react-navigation/core';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import {TransactionRow} from '../components/TransactionRow';
import {Currency} from '../utils/currency';
import BigNumber from 'bignumber.js';
import Logger from '../utils/logger';

type WalletStackRouteProps = {
  TransactionDetails: {item: TransactionItem};
};

type TransactionDetailsProps = {
  route: RouteProp<WalletStackRouteProps, 'TransactionDetails'>;
};

const FIRO_EXPLORER_URL = 'https://testexplorer.firo.org/';

const TransactionDetailsScreen: FC<TransactionDetailsProps> = props => {
  const {getFiroRate, getSettings} = useContext(FiroContext);
  const {item} = props.route.params;

  const backgroundColor = item.received
    ? '#2fa29920'
    : item.isMint
    ? '#9B1C2E20'
    : '#a22f7220';

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

  const openUrl = (url: string) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Logger.warn(
          'transaction_detail_screen',
          `Don't know how to open URI: ${url}`,
        );
      }
    });
  };

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
        <FiroInfoTextWithCopy
          style={styles.infoText}
          title={localization.transaction_details.transaction_id}
          text={item.txId}
          toastMessage={localization.transaction_details.id_copied}
          onClick={() => openUrl(`${FIRO_EXPLORER_URL}/tx/${item.txId}`)}
        />
        <FiroInfoTextWithCopy
          style={styles.infoText}
          title={localization.transaction_details.address}
          text={item.address}
          toastMessage={localization.transaction_details.address_copied}
          onClick={() =>
            openUrl(`${FIRO_EXPLORER_URL}/address/${item.address}`)
          }
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.fee}
          text={Currency.formatFiroAmount(new BigNumber(item.fee)).toString()}
        />
        {label}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    paddingStart: 30,
    paddingEnd: 30,
  },
  txDetails: {
    display: 'flex',
    paddingTop: 34,
  },
  transactionCard: {
    width: '100%',
    borderRadius: 10,
  },
  infoText: {
    flexGrow: 1,
    paddingTop: 30,
  },
});

export default TransactionDetailsScreen;
