import React, {useState, FC} from 'react';
import {
  Image,
  View,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Alert,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import {decodeUR, extractSingleWorkload} from 'bc-ur';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/core';
import {FiroTextSmall} from '../components/Texts';
import {FiroPrimaryButton} from '../components/Button';
import {openPrivacyDesktopSettings} from '../utils/camera';
const createHash = require('create-hash');
import localization from '../localization';
import Logger from '../utils/logger';

type ScanQRCodeRouteProps = {
  ScanQRCode: {onBarScanned: (data: any) => void};
};

type ScanQRCodeProps = {
  route: RouteProp<ScanQRCodeRouteProps, 'ScanQRCode'>;
};

const ScanQRCodeScreen: FC<ScanQRCodeProps> = props => {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const onBarScanned = props.route.params.onBarScanned;
  const scannedCache: {[key: string]: Date} = {};
  const isFocused = useIsFocused();
  const [cameraStatus, setCameraStatus] = useState(
    RNCamera.Constants.CameraStatus.PENDING_AUTHORIZATION as string,
  );
  const [urTotal, setUrTotal] = useState(0);
  const [urHave, setUrHave] = useState(0);
  const [animatedQRCodeData, setAnimatedQRCodeData] = useState({} as any);
  const stylesHook = StyleSheet.create({
    openSettingsContainer: {
      //backgroundColor: colors.brandingColor,
    },
  });
  const HashIt = function (data: string) {
    return createHash('sha256').update(data).digest().toString('hex');
  };

  const readBarcodeFromUniformResource = (resource: string) => {
    try {
      const [index, total] = extractSingleWorkload(resource);
      animatedQRCodeData[index + 'of' + total] = resource;
      setUrTotal(total);
      setUrHave(Object.values(animatedQRCodeData).length);
      if (Object.values(animatedQRCodeData).length === total) {
        const payload = decodeUR(Object.values(animatedQRCodeData));
        // lets look inside that data
        let data: any = false;
        if (Buffer.from(payload, 'hex').toString().startsWith('psbt')) {
          // its a psbt, and whoever requested it expects it encoded in base64
          data = Buffer.from(payload, 'hex').toString('base64');
        } else {
          // its something else. probably plain text is expected
          data = Buffer.from(payload, 'hex').toString();
        }
        navigation.goBack();
        onBarScanned({data});
      } else {
        setAnimatedQRCodeData(animatedQRCodeData);
      }
    } catch (error) {
      Logger.error('scan_qr_screen:readBarcodeFromUniformResource', error);
      Alert.alert(localization.scan_qrcode_screen.invalid_qrcode_fragment);
    }
  };

  const onBarCodeRead = (ret: any) => {
    const h: string = HashIt(ret.data);
    if (scannedCache[h]) {
      // this QR was already scanned by this ScanQRCode, lets prevent firing duplicate callbacks
      return;
    }
    scannedCache[h] = new Date();

    if (ret.data.toUpperCase().startsWith('UR')) {
      return readBarcodeFromUniformResource(ret.data);
    }

    // is it base43? stupid electrum desktop
    /*try {
      const hex = Base43.decode(ret.data);
      bitcoin.Psbt.fromHex(hex); // if it doesnt throw - all good

      if (launchedBy) {
        navigation.navigate(launchedBy);
      }
      onBarScanned({ data: Buffer.from(hex, 'hex').toString('base64') });
      return;
    } catch (error) {}*/

    if (!isLoading) {
      setIsLoading(true);
      try {
        navigation.goBack();
        if (ret.additionalProperties) {
          onBarScanned({
            data: ret.data,
            additionalData: ret.additionalProperties,
          });
        } else {
          onBarScanned({data: ret.data});
        }
      } catch (e) {
        Logger.error('scan_qr_code_screen:onBarCodeRead', e);
      }
    }
    setIsLoading(false);
  };

  const showFilePicker = async () => {
    /*setIsLoading(true);
    const { data } = await fs.showFilePickerAndReadFile();
    if (data) onBarCodeRead({ data });
    setIsLoading(false);*/
  };

  const showImagePicker = () => {
    /*if (!isLoading) {
      setIsLoading(true);
      launchImageLibrary(
        {
          title: null,
          mediaType: 'photo',
          takePhotoButtonTitle: null,
        },
        response => {
          if (response.uri) {
            const uri = Platform.OS === 'ios' ? response.uri.toString().replace('file://', '') : response.uri;
            LocalQRCode.decode(uri, (error, result) => {
              if (!error) {
                onBarCodeRead({ data: result });
              } else {
                alert(loc.send.qr_error_no_qrcode);
                setIsLoading(false);
              }
            });
          } else {
            setIsLoading(false);
          }
        },
      );
    }*/
  };

  const handleCameraStatusChange = (event: any) => {
    setCameraStatus(event.cameraStatus);
  };

  return isLoading ? (
    <View style={styles.root}>{/* <BlueLoading /> */}</View>
  ) : (
    <View style={styles.root}>
      <StatusBar hidden />
      {isFocused &&
        cameraStatus !== RNCamera.Constants.CameraStatus.NOT_AUTHORIZED && (
          <RNCamera
            captureAudio={false}
            androidCameraPermissionOptions={{
              title:
                localization.scan_qrcode_screen.camera_use_permission_title,
              message:
                localization.scan_qrcode_screen.camera_use_permission_message,
              buttonPositive: localization.component_button.ok,
              buttonNegative: localization.component_button.cancel,
            }}
            style={styles.rnCamera}
            onBarCodeRead={onBarCodeRead}
            barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
            onStatusChange={handleCameraStatusChange}
          />
        )}
      {cameraStatus === RNCamera.Constants.CameraStatus.NOT_AUTHORIZED && (
        <View
          style={[
            styles.openSettingsContainer,
            stylesHook.openSettingsContainer,
          ]}>
          <FiroTextSmall
            text={localization.scan_qrcode_screen.camera_use_permission_message}
          />
          <View style={{height: 50}} />
          <FiroPrimaryButton
            text={localization.scan_qrcode_screen.open_settings}
            onClick={openPrivacyDesktopSettings}
          />
        </View>
      )}
      <TouchableOpacity
        style={styles.closeTouch}
        onPress={() => navigation.goBack()}>
        <Image
          style={styles.closeImage}
          source={require('../img/ic_close_white.png')}
        />
      </TouchableOpacity>
      {/*<TouchableOpacity style={styles.imagePickerTouch} onPress={showImagePicker}>
        <Icon name="image" type="font-awesome" color="#ffffff" />
      </TouchableOpacity>*/}
      {urTotal > 0 && (
        <View style={styles.progressWrapper} testID="UrProgressBar">
          <FiroTextSmall text={urHave + ' / ' + urTotal} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  rnCamera: {
    flex: 1,
  },
  closeTouch: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    borderRadius: 20,
    position: 'absolute',
    right: 16,
    top: 44,
  },
  closeImage: {
    alignSelf: 'center',
  },
  imagePickerTouch: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    borderRadius: 20,
    position: 'absolute',
    left: 24,
    bottom: 48,
  },
  filePickerTouch: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    borderRadius: 20,
    position: 'absolute',
    left: 96,
    bottom: 48,
  },
  openSettingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    position: 'absolute',
    right: '50%',
    top: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ScanQRCodeScreen;
