import React, {FC} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {FiroDefaultTheme} from './src/Themes';
import {FiroContextProvider} from './src/FiroContext';
import SplashRoot from './src/Navigation';
import {navigationRef} from './src/NavigationService';

const App: FC<{}> = () => {
  return (
    <FiroContextProvider>
      <NavigationContainer ref={navigationRef} theme={FiroDefaultTheme}>
        <SplashRoot />
      </NavigationContainer>
    </FiroContextProvider>
  );
};

export default App;
