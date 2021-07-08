import * as React from 'react';
import {
  NavigationAction,
  NavigationContainerRef,
  ParamListBase,
} from '@react-navigation/native';

export const navigationRef = React.createRef<NavigationContainerRef>();

export function navigate(name: string, params: ParamListBase | undefined) {
  navigationRef.current?.navigate(name, params);
}

export function dispatch(params: NavigationAction) {
  navigationRef.current?.dispatch(params);
}

export function back() {
  navigationRef.current?.goBack();
}
