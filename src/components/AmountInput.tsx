import React, {FC, useState, useContext, useEffect, RefObject} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  TouchableOpacity,
  Text,
} from 'react-native';
import {Divider} from 'react-native-elements';
import {FiroPrimaryButton} from './Button';
import localization from '../localization';
import {FiroContext} from '../FiroContext';
import {Currency} from '../utils/currency';
import BigNumber from 'bignumber.js';
import {CurrentFiroTheme} from '../Themes';
const {colors} = CurrentFiroTheme;

type SendAmountInputCardProp = {
  maxBalance: BigNumber;
  onAmountSelect: (amount: BigNumber, isMax: boolean) => void;
  inputRef: RefObject<TextInput>;
};

export const SendAmountInputCard: FC<SendAmountInputCardProp> = props => {
  const {getFiroRate, getSettings} = useContext(FiroContext);
  const getPlaceholder = (crypto: boolean) => {
    const c = getSettings().defaultCurrency;
    return crypto ? localization.global.firo : localization.currencies[c];
  };

  const [currencyInfo, setCurrencyInfo] = useState({
    rate: getFiroRate(),
    currency: getSettings().defaultCurrency,
  });
  const [isCrypto, setType] = useState(true);
  const [input, setInput] = useState('');
  const [converted, setConverted] = useState(
    `${localization.amount_input.amount} (${getPlaceholder(!isCrypto)})`,
  );

  useEffect(() => {
    const newInfo = {
      rate: getFiroRate(),
      currency: getSettings().defaultCurrency,
    };
    if (JSON.stringify(newInfo) !== JSON.stringify(currencyInfo)) {
      setCurrencyInfo(newInfo);
      updateConverted(input, isCrypto);
    }
  }, []);

  const updateConverted = (value: string, is_crypto: boolean) => {
    const i = new BigNumber(value);
    let txt = '';
    let crypto = new BigNumber(0);
    if (i.isNaN()) {
      crypto = new BigNumber(0);
      txt = `${localization.amount_input.amount} (${getPlaceholder(
        !is_crypto,
      )})`;
    } else if (is_crypto) {
      crypto = i;
      txt = Currency.firoToFiat(i, true).toString();
    } else {
      crypto = Currency.fiatToFiro(i, true);
      txt = crypto.toString();
    }
    setConverted(txt);
    return crypto;
  };

  const notifyAmountChanged = (
    value: string,
    is_crypto: boolean,
    isMax: boolean,
  ) => {
    const crypto = updateConverted(value, is_crypto);
    props.onAmountSelect(crypto, isMax);
  };

  const onTextChnaged = (text: string) => {
    setInput(text);
    notifyAmountChanged(text, isCrypto, false);
  };

  const onClickToSwap = () => {
    const i = new BigNumber(input);
    let txt = '';
    if (i.isNaN()) {
    } else if (isCrypto) {
      txt = Currency.firoToFiat(i, true).toString();
    } else {
      txt = Currency.fiatToFiro(i, true).toString();
    }

    const swaped = !isCrypto;
    setInput(txt);
    setType(swaped);
    notifyAmountChanged(txt, swaped, false);
  };

  const onClickMax = () => {
    let txt = '';
    if (isCrypto) {
      txt = props.maxBalance.toString();
    } else {
      txt = Currency.firoToFiat(props.maxBalance, true).toString();
    }

    setInput(txt);
    notifyAmountChanged(txt, isCrypto, true);
  };

  return (
    <View style={styles.card}>
      <View style={styles.inputContainer}>
        <View style={styles.sendInputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={input}
            placeholder={`${
              localization.amount_input.enter_amount
            } (${getPlaceholder(isCrypto)})`}
            onChangeText={onTextChnaged}
            ref={props.inputRef}
          />
          <FiroPrimaryButton
            onClick={onClickMax}
            buttonStyle={styles.max}
            text={localization.component_button.max}
          />
        </View>
        <Divider style={styles.divider} />
        <Text style={styles.secondaryText}>{converted}</Text>
      </View>
      <TouchableOpacity onPress={onClickToSwap}>
        <Image style={styles.swap} source={require('../img/ic_swap.png')} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 2,
    marginTop: 20,
    width: '100%',
  },
  inputContainer: {
    flexGrow: 1,
  },
  sendInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  max: {
    height: 30,
    alignSelf: 'center',
  },
  input: {
    flexGrow: 1,
    marginHorizontal: 20,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
    fontSize: 14,
    color: colors.text,
  },
  secondaryText: {
    height: 42,
    textAlignVertical: 'center',
    marginHorizontal: 24,
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    fontSize: 12,
    color: 'rgba(15, 14, 14, 0.5)',
  },
  divider: {
    marginHorizontal: 10,
  },
  swap: {
    marginHorizontal: 10,
    width: 24,
    height: 24,
  },
});
