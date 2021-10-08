import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';

import MnemonicInputScreen from './screens/MnemonicInputScreen';
import MnemonicViewScreen from './screens/MnemonicViewScreen';
import PassphraseScreen from './screens/PassphraseScreen';
import EnterPassphraseScreen from './screens/EnterPassphraseScreen';
import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import MyWalletScreen from './screens/MyWalletScreen';
import TransactionDetailsScreen from './screens/TransactionDetailsScreen';
import AddressDetailsScreen from './screens/AddressDetailsScreen';
import AddEditAddressScreen from './screens/AddEditAddressScreen';
import SendScreen from './screens/SendScreen';
import ReceiveScreen from './screens/ReceiveScreen';
import AddressBookScreen from './screens/AddressBookScreen';
import {BottomTabBar} from './components/BottomNavigation';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import ScanQRCodeScreen from './screens/ScanQRCodeScreen';
import { Platform } from 'react-native';
import SettingsScreen from './screens/SettingsScreen';
import SendConfirmScreen from './screens/SendConfirmScreen';
import MyMnemonicScreen from './screens/MyMnemonicScreen';
import DebugSettings from './screens/DebugSettingsScreen';

type SettingsStackParamList = {
  SettingsScreen: undefined;
  MyMnemonicScreen: undefined;
  DebugSettings: undefined;
};
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const Settings = () => (
  <SettingsStack.Navigator screenOptions={{headerShown: false}}>
    <SettingsStack.Screen name="SettingsScreen" component={SettingsScreen} />
    <SettingsStack.Screen name="MyMnemonicScreen" component={MyMnemonicScreen} />
    <SettingsStack.Screen name="DebugSettings" component={DebugSettings} />
  </SettingsStack.Navigator>
);

type ScanQRCodeStackParamList = {
  ScanQRCodeScreen: undefined;
};
const ScanQRCodeStack = createStackNavigator<ScanQRCodeStackParamList>();
const ScanQRCode = () => (
  <ScanQRCodeStack.Navigator screenOptions={{headerShown: false, presentation: 'modal'}}>
    <ScanQRCodeStack.Screen name="ScanQRCodeScreen" component={ScanQRCodeScreen} />
  </ScanQRCodeStack.Navigator>
);

type TabStackParamList = {
  Wallet: undefined;
  Receive: undefined;
  Send: undefined;
  AddressBook: undefined;
};
const TabStack = createBottomTabNavigator<TabStackParamList>();
const TabScreen = () => (
  <TabStack.Navigator screenOptions={{headerShown: false}} tabBar={props => <BottomTabBar {...props} />}>
    <TabStack.Screen name="Wallet" component={MyWalletScreen} />
    <TabStack.Screen name="Receive" component={ReceiveScreen} />
    <TabStack.Screen name="Send" component={SendScreen} />
    <TabStack.Screen name="AddressBook" component={AddressBookScreen} />
  </TabStack.Navigator>
);

type CreateWalletStackParamList = {
  WelcomeScreen: undefined;
  MnemonicViewScreen: undefined;
  MnemonicInputScreen: undefined;
  PassphraseScreen: undefined;
  MainScreen: undefined;
  AddressDetailsScreen: undefined;
  AddEditAddressScreen: undefined;
  TransactionDetailsScreen: undefined;
  Settings: undefined;
  ScanQRCode: undefined;
  SendConfirmScreen: undefined;
};
const CreateWalletStack = createStackNavigator<CreateWalletStackParamList>();
const CreateWallet = () => (
  <CreateWalletStack.Navigator screenOptions={{headerShown: false}}>
    <CreateWalletStack.Screen name="WelcomeScreen" component={WelcomeScreen} />
    <CreateWalletStack.Screen
      name="MnemonicViewScreen"
      component={MnemonicViewScreen}
    />
    <CreateWalletStack.Screen
      name="MnemonicInputScreen"
      component={MnemonicInputScreen}
    />
    <CreateWalletStack.Screen
      name="PassphraseScreen"
      component={PassphraseScreen}
    />
    <CreateWalletStack.Screen name="MainScreen" component={TabScreen} />
    <CreateWalletStack.Screen
      name="AddressDetailsScreen"
      component={AddressDetailsScreen}
    />
    <CreateWalletStack.Screen
      name="AddEditAddressScreen"
      component={AddEditAddressScreen}
    />
    <CreateWalletStack.Screen
      name="TransactionDetailsScreen"
      component={TransactionDetailsScreen}
    />
    <CreateWalletStack.Screen name="Settings" component={Settings} />
    <CreateWalletStack.Screen name="ScanQRCode" component={ScanQRCode} />
    <CreateWalletStack.Screen name="SendConfirmScreen" component={SendConfirmScreen} />
  </CreateWalletStack.Navigator>
);

type EnterWalletStackParamList = {
  EnterPassphraseScreen: undefined;
  MainScreen: undefined;
  AddressDetailsScreen: undefined;
  AddEditAddressScreen: undefined;
  TransactionDetailsScreen: undefined;
  Settings: undefined;
  ScanQRCode: undefined;
  SendConfirmScreen: undefined;
};
const EnterWalletStack = createStackNavigator<EnterWalletStackParamList>();
const EnterWallet = () => (
  <EnterWalletStack.Navigator screenOptions={{headerShown: false}}>
    <EnterWalletStack.Screen
      name="EnterPassphraseScreen"
      component={EnterPassphraseScreen}
    />
    <EnterWalletStack.Screen name="MainScreen" component={TabScreen} />
    <EnterWalletStack.Screen
      name="AddressDetailsScreen"
      component={AddressDetailsScreen}
    />
    <EnterWalletStack.Screen
      name="AddEditAddressScreen"
      component={AddEditAddressScreen}
    />
    <EnterWalletStack.Screen
      name="TransactionDetailsScreen"
      component={TransactionDetailsScreen}
    />
    <EnterWalletStack.Screen name="Settings" component={Settings} />
    <EnterWalletStack.Screen
      name="ScanQRCode"
      component={ScanQRCode}
      options={{
        ...(Platform.OS === 'ios'
          ? TransitionPresets.ModalTransition
          : TransitionPresets.ScaleFromCenterAndroid),
        headerShown: false,
      }}
    />
    <EnterWalletStack.Screen name="SendConfirmScreen" component={SendConfirmScreen} />
  </EnterWalletStack.Navigator>
);

type SplashStackParamList = {
  SplashScreen: undefined;
  CreateWallet: undefined;
  EnterWallet: undefined;
};
const SplashStack = createStackNavigator<SplashStackParamList>();
const SplashRoot = () => (
  <SplashStack.Navigator screenOptions={{headerShown: false}}>
    <SplashStack.Screen name="SplashScreen" component={SplashScreen} />
    <SplashStack.Screen name="CreateWallet" component={CreateWallet} />
    <SplashStack.Screen name="EnterWallet" component={EnterWallet} />
  </SplashStack.Navigator>
);

export default SplashRoot;
