import {NativeModules} from 'react-native';

const {RNRandomBytes} = NativeModules;

export const randomBytes = async (size: number): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    RNRandomBytes.randomBytes(size, (error: any, bytes: any) => {
      if (error) {
        reject(Error('cannot get random bytes'));
      } else {
        // eslint-disable-next-line no-undef
        const buf = Buffer.from(bytes, 'base64');
        resolve(buf);
      }
    });
  });
};
