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
import { Card } from './Card';

const {colors} = CurrentFiroTheme;

type FiroInputProps = {
  style: StyleProp<ViewStyle>;
  onTextChanged: (text: string) => void;
  placeholder?: string;
  enabled?: boolean;
  subscribeToTextChanges?: (textChange: (text: string, placeholder: string | null) => void) => void;
};

export const FiroInputPassword: FC<FiroInputProps> = props => {
  const [secureText, setSecureText] = useState(true);
  const eyeImage = secureText
    ? require('../img/ic_hide.png')
    : require('../img/ic_show.png');
  return (
    <Card style={[styles.container, props.style]}>
      <TextInput
        style={[styles.input]}
        placeholderTextColor={colors.textPlaceholder}
        placeholder={
          props.placeholder
            ? props.placeholder
            : localization.component_input.passphrase_input_hint
        }
        secureTextEntry={secureText}
        onChangeText={props.onTextChanged}
        blurOnSubmit={false}
      />
      <TouchableWithoutFeedback onPress={() => setSecureText(!secureText)}>
        <Image style={styles.eye} source={eyeImage} />
      </TouchableWithoutFeedback>
    </Card>
  );
};

export const FiroInputMnemonic: FC<FiroInputProps> = props => {
  const [mnemonic, setMnemonic] = useState('');
  const [placeholder, setPlaceholder] = useState(props.placeholder
    ? props.placeholder
    : localization.component_input.mnemonic_input_hint
  );

  const onMnemonicChanged = (text: string) => {
    setMnemonic(text);
    props.onTextChanged(text);
  };

  if (props.subscribeToTextChanges) {
    props.subscribeToTextChanges((mnemonic, placeholder) => {
      setMnemonic(mnemonic)
      if (placeholder != null) {
        setPlaceholder(placeholder)
      } else {
        setPlaceholder(props.placeholder
          ? props.placeholder
          : localization.component_input.mnemonic_input_hint
        )
      }
    });
  }

  return (
    <View style={[styles.container, props.style]}>
      <TextInput
        style={[styles.input, styles.mnemonic]}
        onChangeText={onMnemonicChanged}
        placeholderTextColor={colors.textPlaceholder}
        placeholder={placeholder}
        multiline
        numberOfLines={5}
        editable={props.enabled}
        value={mnemonic}
      />
    </View>
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
    color: colors.text,
  },
  mnemonic: {
    height: '100%',
  },
  eye: {
    width: 24,
    height: 24,
    position: 'absolute',
    right: 20,
    top: 9,
  },
});
