import {AppStorage} from '../app-storage';

export class Currency {
  private static interval: number = 0;
  private static lastUpdated: Date;
  private static currentRate: number = 0;
  private static currentCurrency: string = 'usd';
  private static updateContextRate: (rate: number) => void;

  public static async setCurrentCurrency(newCurrency: string) {
    if (newCurrency) {
      Currency.currentCurrency = newCurrency;
    }
    return Currency.startUpdater();
  }

  public static firoToFiat(amount: number): number {
    return Currency.currentRate * amount;
  }

  public static fiatToFiro(amount: number): number {
    return Currency.currentRate ? amount / Currency.currentRate : amount;
  }

  public static setUpdateContextRate(updateRate: (rate: number) => void) {
    Currency.updateContextRate = updateRate;
  }

  private static async startUpdater() {
    if (Currency.interval) {
      clearInterval(Currency.interval);
      Currency.lastUpdated = new Date(new Date().getTime() - 5 * 60 * 1000);
    }

    Currency.interval = setInterval(
      () => Currency.updateExchangeRate(), 60 * 1000);
    await Currency.updateExchangeRate();
  }

  private static async updateExchangeRate() {
    if (
      Currency.lastUpdated &&
      new Date().getTime() - Currency.lastUpdated.getTime() <= 2 * 60 * 1000
    ) {
      //not updating too often
      return;
    }
    const appStorage = new AppStorage();
    let storedRates: {[key: string]: number} = {};
    try {
      storedRates = JSON.parse(await appStorage.getItem(AppStorage.EXCHANGE_RATES));
    } catch (error) {}
    try {
      const response: Response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=zcoin&vs_currencies=' +
          Currency.currentCurrency,
      );
      const jsonResult = await response.json();
      Currency.currentRate = jsonResult.zcoin[Currency.currentCurrency];
      if (Currency.updateContextRate) {
        Currency.updateContextRate(Currency.currentRate);
      }
      storedRates[Currency.currentCurrency] = Currency.currentRate;
      Currency.lastUpdated = new Date();
      await appStorage.setItem(AppStorage.EXCHANGE_RATES, JSON.stringify(storedRates));
    } catch (error) {
      console.warn("Can't retrieve current rate: " + error);
      if (storedRates) {
        const lastSavedRate: number = Number(
          storedRates[Currency.currentCurrency],
        );
        if (storedRates && lastSavedRate > 0) {
          Currency.currentRate = lastSavedRate;
          if (Currency.updateContextRate) {
            Currency.updateContextRate(Currency.currentRate);
          }
        }
      }
    }
  }
}
