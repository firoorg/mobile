import React, {FC} from 'react';
import {Image} from 'react-native-elements';
import {View, StyleSheet} from 'react-native';
import {FiroTextSmall, FiroTitleSmall} from './Texts';
import localization from '../localization';

export const FiroTransactionEmpty: FC = () => {
  return (
    <View style={styles.empty}>
      <Image
        source={require('../img/ic_empty_transaction.png')}
        containerStyle={styles.icon}
      />
      <FiroTitleSmall
        text={localization.empty_state.no_transaction}
        style={styles.title}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  icon: {
    width: 118,
    height: 118,
    alignSelf: 'center',
  },
  title: {
    marginTop: 12,
    marginBottom: 6,
  },
});
