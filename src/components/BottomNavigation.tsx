/* eslint react/prop-types: "off", react-native/no-inline-styles: "off" */
import React, {FC} from 'react';
import {Text} from 'react-native-elements';
import {TouchableOpacity, Image, StyleSheet, View} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';

const icons: {
  [key: string]: any;
} = {
  Wallet: require('../img/ic_wallet.png'),
  Send: require('../img/ic_send.png'),
  Receive: require('../img/ic_receive.png'),
  AddressBook: require('../img/ic_address_book.png'),
};

export const BottomTabBar: FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={styles.navigation}>
      {state.routes.map((route, index) => {
        const {options} = descriptors[route.key];
        const label: string =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const icon = icons[label];

        const isFocused = state.index === index;
        const titleStyle = isFocused ? styles.activeText : styles.inactiveText;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? {selected: true} : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.button}>
            <Image style={styles.icon} source={icon} />
            <Text style={[styles.text, titleStyle]}>{label}</Text>
            {isFocused && <View style={styles.mark} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navigation: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    elevation: 16,
    backgroundColor: '#fff',
  },
  button: {
    display: 'flex',
    height: 60,
    flexDirection: 'column',
    flexGrow: 1,
    flex: 1,
    paddingTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    lineHeight: 12,
  },
  inactiveText: {
    fontFamily: 'Rubik-Regular',
    fontWeight: '400',
  },
  activeText: {
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  mark: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '80%',
    backgroundColor: '#9B1C2E',
    borderTopStartRadius: 5,
    borderTopEndRadius: 5,
  },
});
