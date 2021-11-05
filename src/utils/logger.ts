import {
  logger,
  consoleTransport,
  configLoggerType,
  fileAsyncTransport,
  transportFunctionType,
} from 'react-native-logs';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

const customTransport: transportFunctionType = props => {
  consoleTransport(props);
  fileAsyncTransport(props);
};

const defaultConfig: configLoggerType = {
  severity: 'debug',
  transport: customTransport,
  transportOptions: {
    FS: RNFS,
    fileName: 'log.txt',
    // colors: "ansi",
  },
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
  // async: true,
  dateFormat: 'utc',
  printLevel: true,
  printDate: true,
  enabled: true,
};

const log = logger.createLogger(defaultConfig);

export default class Logger {
  public static info(tag: string, msg: any) {
    const tagedLog = log.extend(tag);
    log.enable(tag);
    tagedLog.info(msg);
    log.disable(tag);
  }

  public static debug(tag: string, msg: any) {
    const tagedLog = log.extend(tag);
    log.enable(tag);
    tagedLog.debug(msg);
    log.disable(tag);
  }

  public static warn(tag: string, msg: any) {
    const tagedLog = log.extend(tag);
    log.enable(tag);
    tagedLog.warn(msg);
    log.disable(tag);
  }

  public static error(tag: string, msg: any) {
    const tagedLog = log.extend(tag);
    log.enable(tag);
    tagedLog.error(msg);
    log.disable(tag);
  }

  static clear() {
    const fileUrl = RNFS.DocumentDirectoryPath + '/log.txt';
    RNFS.writeFile(fileUrl, '', 'utf8');
  }

  static shareAndroid() {
    const fileUrl = RNFS.DocumentDirectoryPath + '/log.txt';
    RNFS.readFile(fileUrl, 'base64').then(async base64Data => {
      base64Data = 'data:text/plain;base64,' + base64Data;
      await Share.open({url: base64Data});
    });
  }
}
