export type Network = {
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
  messagePrefix: string;
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
};

const FIRO_TEST_NET = {
  messagePrefix: '\x19Firo Signed Message:\n',
  bech32: 'firo',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x41,
  scriptHash: 0xb2,
  wif: 0xb9,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FIRO_MAIN_NET = {
  messagePrefix: '\x19Firo Signed Message:\n',
  bech32: 'firo',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x52,
  scriptHash: 0x7,
  wif: 0xd2,
};

export const network = FIRO_TEST_NET;
