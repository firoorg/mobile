/* eslint react/prop-types: "off", react-native/no-inline-styles: "off" */
import React, {FC} from 'react';
import {FiroPrimaryButton, FiroSubtleButton} from './Button';
import {StyleSheet, StyleProp, View, ViewStyle} from 'react-native';
import localization from '../localization';

type ConfirmationProps = {
  style: StyleProp<ViewStyle>;
  confirmButtonText: string;
  onDiscardAction: () => void;
  onConfirmAction: () => void;
};

export const Confirmation: FC<ConfirmationProps> = props => {
  return (
    <View style={[styles.root, props.style]}>
      <FiroSubtleButton
        buttonStyle={styles.button}
        text={localization.component_button.cancel}
        onClick={props.onDiscardAction}
      />
      <FiroPrimaryButton
        buttonStyle={styles.button}
        text={props.confirmButtonText}
        onClick={props.onConfirmAction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    flex: 1,
  },
});
