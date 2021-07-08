export interface AbstractWallet {
  generate(): Promise<void>;
  setSecret(secret: string): void;
  getSecret(): string;

  address(): Promise<string>;
}
