import React, {FC} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {FiroDefaultTheme} from './src/Themes';
import {FiroContextProvider} from './src/FiroContext';
import SplashRoot from './src/Navigation';
import {navigationRef} from './src/NavigationService';
// import { SafeAreaView } from 'react-native-safe-area-context';
import {StyleSheet, SafeAreaView} from 'react-native';

const App: FC<{}> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <FiroContextProvider>
        <NavigationContainer ref={navigationRef} theme={FiroDefaultTheme}>
          <SplashRoot />
        </NavigationContainer>
      </FiroContextProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
