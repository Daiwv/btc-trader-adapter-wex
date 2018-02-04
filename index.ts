import { IInfoResult, PublicAPI, TradeAPI } from "btc-e3";
import { IExchangePublicApi, IExchangeTradeApi, IMarketParamResult, ITickerValue } from "btc-trader";
class WexAdapter implements IExchangeTradeApi, IExchangePublicApi {
    protected tradeApi: TradeAPI;
    protected publicApi: PublicAPI;
    protected info: IInfoResult;
    constructor(protected credentials?: any) {
        if (credentials) {
            this.tradeApi = new TradeAPI(credentials);
        }
        this.publicApi = new PublicAPI();
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
