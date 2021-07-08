import React, {FC, useContext} from 'react';
import {StyleSheet, View, Image, Text} from 'react-native';
import {FiroToolbar} from '../components/Toolbar';
import {FiroInfoText} from '../components/Texts';
import {RouteProp} from '@react-navigation/core';
import {FiroContext} from '../FiroContext';
import {TransactionItem} from '../data/TransactionItem';
import localization from '../localization';

var options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};

type WalletStackRouteProps = {
  TransactionDetails: {item: TransactionItem};
};

type TransactionDetailsProps = {
  route: RouteProp<WalletStackRouteProps, 'TransactionDetails'>;
};

const TransactionDetailsScreen: FC<TransactionDetailsProps> = props => {
  const { getFiroRate, getSettings } = useContext(FiroContext);
  const {item} = props.route.params;
  const ic = item.received
    ? require('../img/ic_received_tx_filled.png')
    : require('../img/ic_sent_tx_filled.png');
  const backgroundColor = item.received ? '#2fa29920' : '#a22f7220';
  const title = item.received
    ? localization.transaction_details.received_from
    : localization.transaction_details.sent_to;

  return (
    <View style={styles.root}>
      <FiroToolbar title={localization.transaction_details.title} />
      <View style={styles.txDetails}>
        <View
          style={[styles.transactionCard, {backgroundColor: backgroundColor}]}>
          <Image style={styles.icon} source={ic} />
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Text style={styles.title}>
                {item.firo} {localization.global.firo}
              </Text>
              <Text style={styles.title}>
                ${(item.firo * getFiroRate()).toFixed(2)} {(localization.currencies as any)[getSettings().defaultCurrency]}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.subtitle}>
                {item.received
                  ? localization.transaction_details.received
                  : localization.transaction_details.sent}
              </Text>
              <Text style={styles.subtitle}>
                {item.date.toLocaleDateString('en-US', options)}
              </Text>
            </View>
          </View>
        </View>
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.transaction_id}
          text={item.transactionId}
        />
        <FiroInfoText
          style={styles.infoText}
          title={title}
          text={item.address}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.fee}
          text={item.fee.toString()}
        />
        <FiroInfoText
          style={styles.infoText}
          title={localization.transaction_details.label}
          text={item.label}
        />
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
  infoText: {
    paddingTop: 30,
  },
});

export default TransactionDetailsScreen;
