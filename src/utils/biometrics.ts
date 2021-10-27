import ReactNativeBiometrics from 'react-native-biometrics';
import { AppStorage } from '../app-storage';
const encryption = require('./encryption');
import localization from '../localization';
import { Alert } from 'react-native';

export class Biometrics {
    public static async isBiometricsAvailable(): Promise<boolean> {
        const result = await ReactNativeBiometrics.isSensorAvailable()
        return result.available && result.biometryType != undefined;
    }

    public static async biometricAuthorizationEnabled(): Promise<boolean> {
        const storage: AppStorage = new AppStorage();
        let encryptedPassword: string = '';
        try {
            encryptedPassword = await storage.getItem(AppStorage.ENCRYPTED_PASSWORD);
        } catch (error) { }
        return !!encryptedPassword;
    }

    public static async encryptPassphraseAndSave(password: string, biometricPromptMessage: string, startSaving?: () => Promise<boolean>): Promise<{ success: boolean, error?: string }> {
        try {
            const checkResult = await ReactNativeBiometrics.biometricKeysExist();
            if (!checkResult.keysExist) {
                await ReactNativeBiometrics.createKeys();
            }
            const signResult = await ReactNativeBiometrics.createSignature({ payload: "Password", promptMessage: biometricPromptMessage, cancelButtonText: localization.component_button.cancel });
            if (signResult.success) {
                if (startSaving) {
                    try {
                        const result = await startSaving();
                        if (!result) {
                            return { success: false, error: "" };
                        }
                    } catch { }
                }
                const storage: AppStorage = new AppStorage();
                const encryptedPassword: string = encryption.encrypt("0123456789" + password, signResult.signature);
                await storage.setItem(AppStorage.ENCRYPTED_PASSWORD, encryptedPassword);
                return { success: true };
            } else {
                return { success: false, error: "" };
            }
        }
        catch (error) {
            if (typeof error == 'object' && (error as any).Error) {
                return { success: false, error: (error as any).Error };
            }
            return { success: false, error: "" + error };
        }
    }

    public static async clearPassphraseFromStorage(promptMessage: string, startClearing?: () => void): Promise<{ success: boolean, error?: string }> {
        try {
            const signResult = await ReactNativeBiometrics.createSignature({ payload: "Password", promptMessage: promptMessage, cancelButtonText: localization.component_button.cancel });
            if (signResult.success) {
                if (startClearing) {
                    try {
                        startClearing();
                    } catch { }
                }
                const storage: AppStorage = new AppStorage();
                await storage.setItem(AppStorage.ENCRYPTED_PASSWORD, "");
                return { success: true };
            } else {
                return { success: false, error: "" };
            }
        }
        catch (error) {
            if (typeof error == 'object' && (error as any).Error) {
                return { success: false, error: (error as any).Error };
            }
            return { success: false, error: "" + error };
        }
    }

    public static async getPassphrase(promptMessage: string): Promise<{ success: boolean, password?: string, error?: string }> {
        try {
            const storage: AppStorage = new AppStorage();
            const encryptedPassword: string = await storage.getItem(AppStorage.ENCRYPTED_PASSWORD);
            if (!encryptedPassword) {
                return { success: false, error: localization.errors.error_biometric_disabled };
            }
            const signResult = await ReactNativeBiometrics.createSignature({ payload: "Password", promptMessage, cancelButtonText: localization.component_button.cancel });
            if (signResult.success) {
                const password: string = encryption.decrypt(encryptedPassword, signResult.signature);
                return { success: true, password: password.substr(10) };
            } else {
                return { success: false, error: "" };
            }
        }
        catch (error) {
            if (typeof error == 'object' && (error as any).Error) {
                return { success: false, error: (error as any).Error };
            }
            return { success: false, error: "" + error };
        }
    }
}