import React, {FC, useState} from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import localization from '../localization';

const {colors} = CurrentFiroTheme;

type FiroInputProps = {
  style: StyleProp<ViewStyle>;
  onTextChanged: (text: string) => void;
};

export const FiroInputPassword: FC<FiroInputProps> = props => {
  const [secureText, setSecureText] = useState(true);
  const eyeImage = secureText
    ? require('../img/ic_hide.png')
    : require('../img/ic_show.png');
  return (
    <View style={[styles.container, props.style]}>
      <TextInput
        style={[styles.input]}
        placeholder={localization.component_input.passphrase_input_hint}
        secureTextEntry={secureText}
        onChangeText={props.onTextChanged}
      />
      <TouchableWithoutFeedback onPress={() => setSecureText(!secureText)}>
        <Image style={styles.eye} source={eyeImage} />
      </TouchableWithoutFeedback>
    </View>
  );
};

export const FiroInputMnemonic: FC<FiroInputProps> = props => {
  return (
    <TextInput
      style={[styles.input, props.style]}
      onChangeText={props.onTextChanged}
      placeholder={localization.component_input.mnemonic_input_hint}
      multiline
      numberOfLines={5}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    elevation: 2,
    borderRadius: 20,
  },
  input: {
    height: 42,
    paddingLeft: 20,
    paddingRight: 64,
    paddingVertical: 14,
    position: 'relative',
    textAlignVertical: 'top',
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
  },
  eye: {
    width: 24,
    height: 24,
    position: 'absolute',
    right: 20,
    top: 9,
  },
});
