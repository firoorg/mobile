import React, {FC} from 'react';
import {Header, HeaderProps} from 'react-native-elements';
import {StyleSheet} from 'react-native';
import {CurrentFiroTheme} from '../Themes';
import {FiroBackButton, FiroMenuButton} from './Button';
import * as NavigationService from '../NavigationService';
import {FiroTitleBig} from './Texts';

const {colors} = CurrentFiroTheme;

type ToolbarProps = HeaderProps;

type ToolbarWithTitleProps = HeaderProps & {
  title: string;
};

export const FiroEmptyToolbar: FC<ToolbarProps> = props => {
  return (
    <Header
      {...props}
      backgroundColor="transparent"
      containerStyle={styles.toolbar}
    />
  );
};

export const FiroToolbarWithoutBack: FC<ToolbarWithTitleProps> = props => {
  return (
    <Header
      {...props}
      containerStyle={styles.toolbar}
      placement="left"
      centerContainerStyle={styles.containerBase}
      rightContainerStyle={styles.containerBase}
      centerComponent={<FiroTitleBig text={props.title} />}
      rightComponent={
        <FiroMenuButton
          onClick={() => NavigationService.navigate('Settings', {})}
          buttonStyle={styles.navigationButton}
        />
      }
    />
  );
};

export const FiroToolbar: FC<ToolbarWithTitleProps> = props => {
  return (
    <Header
      {...props}
      containerStyle={styles.toolbar}
      leftContainerStyle={styles.containerBase}
      centerContainerStyle={styles.containerBase}
      leftComponent={
        <FiroBackButton
          onClick={() => NavigationService.back()}
          buttonStyle={styles.navigationButton}
        />
      }
      centerComponent={{
        text: props.title,
        style: styles.titleWithBack,
      }}
    />
  );
};

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderBottomWidth: 0,
  },
  titleWithoutBack: {
    color: colors.textOnBackground,
    fontSize: 20,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  titleWithBack: {
    color: colors.textOnBackground,
    fontSize: 14,
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  containerBase: {
    justifyContent: 'center',
  },
  navigationButton: {
    paddingVertical: 25,
    paddingHorizontal: 25,
  },
});
