import React, { FC, useState } from 'react';
import { RouteProp } from '@react-navigation/native';
import {
    View,
    StyleSheet,
    Text,
    TouchableHighlight,
    Switch,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Image
} from 'react-native';
import { BottomSheet, ListItem } from 'react-native-elements';
import { CurrentFiroTheme } from '../Themes';
import { FiroToolbar } from '../components/Toolbar';
import localization from '../localization';
import { useContext } from 'react';
import { FiroContext } from '../FiroContext';
import { useEffect } from 'react';
import { FiroPrimaryGreenButton, FiroSecondaryButton } from '../components/Button';
import { Currency } from '../utils/currency';
import { Alert } from 'react-native';

const { colors } = CurrentFiroTheme;
const supportedCurrencies: string[] = ["usd", "eur", "gbp", "aud", "btc"];

const SettingsScreen = () => {
    const { getSettings, setSettings } = useContext(FiroContext);
    const [saveInProgress, changeSaveProgress] = useState(false);
    const [chooseCurrency, changeChooseCurrency] = useState(false);
    const [windowHeight, changeWindowHeight] = useState(Dimensions.get('window').height);
    const currentCurrency: string = getSettings().defaultCurrency;
    const [selectedCurrency, changeSelectedCurrency] = useState(currentCurrency);
    
    useEffect(() => {
        const onChange = () => {
            changeWindowHeight(Dimensions.get('window').height);
        };
        Dimensions.addEventListener('change', onChange);
        return () => Dimensions.removeEventListener('change', onChange);
    });
    return (
        <ScrollView>
            <View style={styles.toolbar}>
                <FiroToolbar title={localization.settings.title} />
            </View>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => {
                changeChooseCurrency(true);
            }}>
                <View style={styles.section}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{localization.settings.title_currency}</Text>
                            <Text style={styles.description}>{localization.settings.description_currency}</Text>
                        </View>
                        <Text style={styles.currency}>{(localization.currencies as any)[currentCurrency]}</Text>
                    </View>
                </View>
            </TouchableHighlight>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => {
                const settings = getSettings();
                changeSaveProgress(true);
                setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled }).finally(() => changeSaveProgress(false));
            }}>
                <View style={styles.section}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{localization.settings.title_notification}</Text>
                            <Text style={styles.description}>{localization.settings.description_notification}</Text>
                        </View>
                        <Switch value={getSettings()?.notificationsEnabled} thumbColor={colors.switchThumb} trackColor={{ false: colors.switchTrackFalse, true: colors.switchTrackTrue }} onValueChange={enable => {
                            changeSaveProgress(true);
                            setSettings({ ...getSettings(), notificationsEnabled: enable }).finally(() => changeSaveProgress(false));
                        }} />
                    </View>
                </View>
            </TouchableHighlight>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => { }}>
                <View style={styles.section}>
                    <Text style={styles.title}>{localization.settings.title_passphrase}</Text>
                    <Text style={styles.description}>{localization.settings.description_passphrase}</Text>
                </View>
            </TouchableHighlight>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => { }}>
                <View style={styles.section}>
                    <Text style={styles.title}>{localization.settings.title_mnemonic}</Text>
                    <Text style={styles.description}>{localization.settings.description_mnemonic}</Text>
                </View>
            </TouchableHighlight>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => { }}>
                <View style={styles.section}>
                    <Text style={styles.title}>{localization.settings.title_restore}</Text>
                    <Text style={styles.description}>{localization.settings.description_restore}</Text>
                </View>
            </TouchableHighlight>
            <TouchableHighlight disabled={saveInProgress} underlayColor={colors.highlight} onPress={() => { }}>
                <View style={styles.section}>
                    <Text style={styles.title}>{localization.settings.title_fingerprint}</Text>
                    <Text style={styles.description}>{localization.settings.description_fingerprint}</Text>
                </View>
            </TouchableHighlight>
            <BottomSheet isVisible={chooseCurrency} modalProps={{ }}>
                <View style={{ ...styles.currenciesView, height: windowHeight / 2, padding: 0 }}>
                    <TouchableOpacity style={styles.closeCurrencies} onPress={() => {
                        changeChooseCurrency(false);
                        changeSelectedCurrency(currentCurrency);
                    }}>
                        <Image source={require('../img/ic_close.png')} />
                    </TouchableOpacity>
                    <View style={{ display: "flex" }}>
                        <Text style={styles.changeCurrency}>Change Currency</Text>
                    </View>
                    <ScrollView style={{ marginTop: 30 }} contentContainerStyle={{ paddingBottom: 52 }}>
                        {
                            supportedCurrencies.map(currency => {
                                return <ListItem key={currency} disabled={saveInProgress} underlayColor='' onPress={() => changeSelectedCurrency(currency)} containerStyle={styles.currencyItem}>
                                    <ListItem.Content>
                                        <ListItem.Title style={styles.title}>{(localization.currencies as any)[currency]}</ListItem.Title>
                                    </ListItem.Content>
                                    <ListItem.CheckBox disabled={saveInProgress} checkedColor={colors.primary} uncheckedColor={colors.unchecked} checkedIcon="dot-circle-o" uncheckedIcon="circle-o" checked={currency == selectedCurrency} onPress={() => changeSelectedCurrency(currency)} />
                                </ListItem>
                            })
                        }
                    </ScrollView>
                    <TouchableOpacity activeOpacity={1} style={styles.changeCurrencyButton} disabled={saveInProgress}>
                        <FiroPrimaryGreenButton text={localization.settings.button_done} onClick={async () => {
                            const settings = getSettings();
                            changeSaveProgress(true);
                            try {
                                await setSettings({ ...settings, defaultCurrency: selectedCurrency });
                                Currency.setCurrentCurrency(selectedCurrency);
                            }
                            finally {
                                changeChooseCurrency(false);
                                changeSaveProgress(false);
                            }
                        }} buttonStyle={{ backgroundColor: undefined, marginTop: 15 }} />
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    toolbar: {
        paddingTop: 30,
        paddingLeft: 20,
        paddingBottom: 15
    },
    section: {
        marginTop: 15,
        marginBottom: 15,
        marginLeft: 20,
        marginRight: 20
    },
    title: {
        color: colors.text,
        fontFamily: 'Rubik-Medium',
        fontWeight: '500',
        fontSize: 14
    },
    description: {
        color: colors.text,
        fontFamily: 'Rubik-Medium',
        fontWeight: '400',
        fontSize: 12,
        opacity: 0.6,
        marginTop: 9
    },
    currency: {
        color: colors.text,
        fontFamily: 'Rubik-Medium',
        fontWeight: '500',
        fontSize: 14,
        opacity: 0.6,
        marginRight: 9
    },
    currenciesView: {
        backgroundColor: colors.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20
    },
    closeCurrencies: {
        width: 30,
        height: 30,
        position: 'absolute',
        right: 5,
        top: 10,
    },
    changeCurrency: {
        color: colors.text,
        fontFamily: 'Rubik-Medium',
        fontWeight: '500',
        fontSize: 16,
        paddingTop: 15,
        alignSelf: "center"
    },
    currencyItem: {
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 12,
        padding: 0,
        paddingRight: 15,
        paddingLeft: 15,
        backgroundColor: colors.secondaryBackground,
        borderRadius: 10,
        height: 40
    },
    changeCurrencyButton: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: colors.cardBackground,
        height: 60,
        width: '100%'
    }
});

export default SettingsScreen;