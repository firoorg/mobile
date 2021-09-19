import React, {FC, useState, useContext, useEffect} from 'react';
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
import { Currency } from '../utils/currency';

const CRYPTO = 0
const CURRANCY = 1
type SendAmountInputCardProp = {
  maxBalance: number;
  onAmountSelect: (amount: number) => void;
};

export const SendAmountInputCard: FC<SendAmountInputCardProp> = props => {
  const {getSettings} = useContext(FiroContext);
  const getPlaceholder = (crypto: boolean) => {
    const c = getSettings().defaultCurrency
    return crypto ? 
      localization.global.firo :
      localization.currencies[c];
  }

  const [isCrypto, setType] = useState(true);
  const [input, setInput] = useState('')
  const [converted, setConverted] = useState(
    `${localization.amount_input.amount} (${getPlaceholder(isCrypto)})`
    )

  const onTextChnaged = (text: string) => {
    setInput(text)
  }

  const onClickToSwap = () => {
    const i = parseFloat(input)
    let txt = ''
    if (isNaN(i)) {
    } else if (isCrypto) {
      txt =  Currency.firoToFiat(i).toString()
    } else {
      txt = Currency.fiatToFiro(i).toString()
    }

    setInput(txt)
    setType(!isCrypto)
  }

  const onClickMax = () => {
    let txt = ''
    if (isCrypto) {
      txt = props.maxBalance.toString()
    } else {
      txt = Currency.firoToFiat(props.maxBalance).toString()
    }

    setInput(txt)
  }

  useEffect(() => {
    const i = parseFloat(input)
    let txt = ''
    let crypto = 0
    if (isNaN(i)) {
      crypto = 0
      txt = `${localization.amount_input.amount} (${getPlaceholder(!isCrypto)})`
    } else if (isCrypto) {
      crypto = i
      txt = Currency.firoToFiat(i).toString()
    } else {
      crypto = Currency.fiatToFiro(i)
      txt = crypto.toString()
    }

    props.onAmountSelect(crypto)
    setConverted(txt)
  }, [input, isCrypto])

  return (
    <View style={styles.card}>
      <View style={styles.inputContainer}>
        <View style={styles.sendInputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={input}
            placeholder={`${localization.amount_input.enter_amount} (${getPlaceholder(isCrypto)})`}
            onChangeText={onTextChnaged}
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

export const ReceiveAmountInputCard: FC = () => {
  const [firoIndex, setFiroIndex] = useState(0);
  const {getSettings} = useContext(FiroContext);
  const placeholders = [
    localization.global.firo,
    (localization.currencies as any)[getSettings().defaultCurrency],
  ];
  const currencyIndex = 1 - firoIndex;
  return (
    <View style={styles.card}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`${localization.amount_input.enter_amount} (${placeholders[firoIndex]})`}
        />
        <Divider style={styles.divider} />
        <TextInput
          style={styles.secondaryInput}
          placeholder={`${localization.amount_input.amount} (${placeholders[currencyIndex]})`}
        />
      </View>
      <TouchableOpacity onPress={() => setFiroIndex(1 - firoIndex)}>
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
    color: 'rgba(15, 14, 14, 0.5)',
  },
  secondaryInput: {
    marginHorizontal: 20,
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
    fontSize: 12,
    color: 'rgba(15, 14, 14, 0.5)',
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
