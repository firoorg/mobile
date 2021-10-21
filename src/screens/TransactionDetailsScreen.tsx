import React, {FC, useContext} from 'react';
import {StyleSheet, View, Text, Linking, ToastAndroid} from 'react-native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInfoText} from '../components/Texts';
import {RouteProp} from '@react-navigation/core';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';
import {TransactionRow} from '../components/TransactionRow';
import {Currency} from '../utils/currency';
import BigNumber from 'bignumber.js';
import Logger from '../utils/logger';
import Clipboard from '@react-native-clipboard/clipboard';

type WalletStackRouteProps = {
  TransactionDetails: {item: TransactionItem};
};

type TransactionDetailsProps = {
  route: RouteProp<WalletStackRouteProps, 'TransactionDetails'>;
};

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

  const copyText = (text: string) => {
    Clipboard.setString(text);
    ToastAndroid.showWithGravityAndOffset(
      localization.global.copy_to_clipboard,
      ToastAndroid.SHORT,
      ToastAndroid.BOTTOM,
      0,
      100,
    );
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
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.transaction_id}
          text={item.txId}
          onClick={() =>
            openUrl(`https://testexplorer.firo.org/tx/${item.txId}`)
          }
          onLongPress={() => copyText(item.txId)}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.address}
          text={item.address}
          onClick={() =>
            openUrl(`https://testexplorer.firo.org/address/${item.address}`)
          }
          onLongPress={() => copyText(item.address)}
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
