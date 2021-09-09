import React, {FC, useState, useContext} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import {Divider} from 'react-native-elements';
import {FiroPrimaryButton} from './Button';
import localization from '../localization';
import {FiroContext} from '../FiroContext';

type SendAmountInputCardProp = {
  onAmountSelect: (amount: number) => void;
};

export const SendAmountInputCard: FC<SendAmountInputCardProp> = props => {
  const [firoIndex, setFiroIndex] = useState(0);
  const {getSettings} = useContext(FiroContext);
  const placeholders = [
    localization.global.firo,
    (localization.currencies as any)[getSettings().defaultCurrency],
  ];
  const currencyIndex = 1 - firoIndex;
  const onMaxClick = () => {};
  return (
    <View style={styles.card}>
      <View style={styles.inputContainer}>
        <View style={styles.sendInputContainer}>
          <TextInput
            style={styles.input}
            placeholder={`${localization.amount_input.enter_amount} (${placeholders[firoIndex]})`}
            onChangeText={text => props.onAmountSelect(parseInt(text, 10))}
          />
          <FiroPrimaryButton
            onClick={onMaxClick}
            buttonStyle={styles.max}
            text={localization.component_button.max}
          />
        </View>
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
  divider: {
    marginHorizontal: 10,
  },
  swap: {
    marginHorizontal: 10,
    width: 24,
    height: 24,
  },
});
