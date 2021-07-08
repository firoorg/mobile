import React, {FC, useContext} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {FiroGetFiroButton} from './Button';
import localization from '../localization';
import { FiroContext } from '../FiroContext';

const colors = CurrentFiroTheme.colors;

type BalanceCardProp = {
  style: StyleProp<ViewStyle>;
  balance: number;
};

export const BalanceCard: FC<BalanceCardProp> = props => {
  const { getFiroRate, getSettings } = useContext(FiroContext);
  const onGetFiroClick = () => {};
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1.42}}
        colors={['#9B1C2E', '#C73D48']}
        style={[styles.card, props.style]}>
        <View style={styles.titleContainer}>
          <Image
            style={styles.icon}
            source={require('../img/ic_firo_balance_white.png')}
          />
          <Text style={styles.title}>Firo Balance</Text>
        </View>
        <Text style={styles.firo}>{props.balance.toFixed(2)}</Text>
        <Text style={styles.currency}>{(props.balance * getFiroRate()).toFixed(2)} {(localization.currencies as any)[getSettings().defaultCurrency]}</Text>
        {props.balance === 0 && (
          <FiroGetFiroButton
            buttonStyle={styles.getFiro}
            text={localization.component_button.get_firo}
            onClick={onGetFiroClick}
          />
        )}
      </LinearGradient>
      <View style={styles.cardShadow1} />
      <View style={styles.cardShadow2} />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'relative',
    marginTop: 20,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.primary,
    borderRadius: 20,
    elevation: 2,
    paddingBottom: 20,
    marginBottom: 20,
  },
  cardShadow1: {
    position: 'absolute',
    bottom: 11,
    left: '2%',
    height: 20,
    width: '96%',
    borderBottomEndRadius: 18,
    borderBottomStartRadius: 18,
    backgroundColor: '#C73D48',
    opacity: 0.07,
    zIndex: -1,
  },
  cardShadow2: {
    position: 'absolute',
    bottom: 2,
    left: '5%',
    height: 20,
    width: '90%',
    borderBottomEndRadius: 18,
    borderBottomStartRadius: 18,
    backgroundColor: '#C73D48',
    opacity: 0.07,
    zIndex: -2,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  icon: {
    width: 24,
    height: 24,
    marginEnd: 8,
  },
  title: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  firo: {
    marginTop: 17,
    fontFamily: 'Rubik-Medium',
    fontSize: 28,
    color: '#ffffff',
    textAlign: 'center',
  },
  currency: {
    marginBottom: 5,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  getFiro: {
    alignSelf: 'center',
    marginTop: 11,
  },
});
