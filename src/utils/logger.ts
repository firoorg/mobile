import { logger, consoleTransport, configLoggerType, fileAsyncTransport, transportFunctionType } from "react-native-logs";
import RNFS from "react-native-fs";

const customTransport: transportFunctionType = (props) => {
  consoleTransport(props);
  fileAsyncTransport(props);
};

const defaultConfig: configLoggerType = {
    severity: "debug",
    transport: customTransport,
    transportOptions: {
      FS: RNFS,
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
    const tagedLog = log.extend(tag)
    log.enable(tag)
    tagedLog.info(msg)
    log.disable(tag)
  }

  public static debug(tag: string, msg: any) {
    const tagedLog = log.extend(tag)
    log.enable(tag)
    tagedLog.debug(msg)
    log.disable(tag)
  }

  public static warn(tag: string, msg: any) {
    const tagedLog = log.extend(tag)
    log.enable(tag)
    tagedLog.warn(msg)
    log.disable(tag)
  }

  public static error(tag: string, msg: any) {
    const tagedLog = log.extend(tag)
    log.enable(tag)
    tagedLog.error(msg)
    log.disable(tag)
  }
}