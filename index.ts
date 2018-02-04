import { IInfoResult, PublicAPI, TradeAPI } from "btc-e3";
import { IExchangePublicApi, IExchangeTradeApi, IMarketParamResult, ITickerValue } from "btc-trader";
export interface IWexAdapterConfig {
    key?: string;
    secret?: string;
    baseUrl?: string;
}
class WexAdapter implements IExchangeTradeApi, IExchangePublicApi {
    protected tradeApi: TradeAPI;
    protected publicApi: PublicAPI;
    protected info: IInfoResult;
    constructor(protected config?: IWexAdapterConfig) {
        this.config = this.config || {};
        const key = this.config.key;
        const secret = this.config.secret;
        if (key && secret) {
            this.tradeApi = new TradeAPI({ key, secret, baseUrl: this.config.baseUrl });
        }
        this.publicApi = new PublicAPI({
            baseUrl: this.config.baseUrl || "",
        });
    }
    public async pairs() {
        return Object.keys((await this.getInfo()).pairs);
    }
    public async pair(name: string) {
        const data = await this.getInfo();
        const pair = {
            name,
            decimal: data.pairs[name].decimal_places,
            minPrice: data.pairs[name].min_price,
            maxPrice: data.pairs[name].max_price,
            fee: data.pairs[name].fee,
            minAmount: data.pairs[name].min_amount,
        };
        return pair;
    }
    public async tickers(pairs: string[]) {
        const data = await this.publicApi.tickers(pairs as any);
        const result: {
            [index: string]: ITickerValue;
        } = {};
        for (const pairName of Object.keys(data)) {
            const tick = data[pairName];
            result[pairName] = {
                avg: tick.avg,
                high: tick.high,
                last: tick.last,
                low: tick.low,
                updated: tick.updated,
                volume: tick.vol,
                volumeCurrency: tick.vol_cur,
            };
        }
        return result;
    }
    public async markets(pairs: string[]) {
        const res = await this.publicApi.depths(pairs as any);
        const out: { [index: string]: IMarketParamResult } = {};
        Object.keys(res).forEach((pair) => {
            out[pair] = {
                buy: res[pair].bids.map((ask) => {
                    return {
                        rate: ask[0],
                        amount: ask[1],
                    };
                }),
                sell: res[pair].asks.map((bid) => {
                    return {
                        rate: bid[0],
                        amount: bid[1],
                    };
                }),
            };
        });
        return out;
    }
    public async activeOrders(pair: string) {
        const data = await this.tradeApi.ActiveOrders(pair as any);
        return Object.keys(data).map((orderId: any) => {
            const order = data[orderId];
            return {
                id: orderId,
                type: order.type,
                amount: order.amount,
                rate: order.rate,
                timestamp: order.timestamp_created,
            };
        });
    }
    public trade(type: "buy" | "sell", pair: string, rate: number, amount: number) {
        return this.tradeApi.Trade(pair as any, type as any, rate, amount);
    }
    protected async getInfo() {
        if (!this.info) {
            this.info = await this.publicApi.info();
        }
        return this.info;
    }
}
export default WexAdapter;
