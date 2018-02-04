"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const btc_e3_1 = require("btc-e3");
class WexAdapter {
    constructor(config) {
        this.config = config;
        this.config = this.config || {};
        const key = this.config.key;
        const secret = this.config.secret;
        if (key && secret) {
            this.tradeApi = new btc_e3_1.TradeAPI({ key, secret, baseUrl: this.config.baseUrl });
        }
        this.publicApi = new btc_e3_1.PublicAPI({
            baseUrl: this.config.baseUrl || "",
        });
    }
    pairs() {
        return __awaiter(this, void 0, void 0, function* () {
            return Object.keys((yield this.getInfo()).pairs);
        });
    }
    pair(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getInfo();
            const pair = {
                name,
                decimal: data.pairs[name].decimal_places,
                minPrice: data.pairs[name].min_price,
                maxPrice: data.pairs[name].max_price,
                fee: data.pairs[name].fee,
                minAmount: data.pairs[name].min_amount,
            };
            return pair;
        });
    }
    tickers(pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.publicApi.tickers(pairs);
            const result = {};
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
        });
    }
    markets(pairs) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.publicApi.depths(pairs);
            const out = {};
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
        });
    }
    activeOrders(pair) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.tradeApi.ActiveOrders(pair);
            return Object.keys(data).map((orderId) => {
                const order = data[orderId];
                return {
                    id: orderId,
                    type: order.type,
                    amount: order.amount,
                    rate: order.rate,
                    timestamp: order.timestamp_created,
                };
            });
        });
    }
    trade(type, pair, rate, amount) {
        return this.tradeApi.Trade(pair, type, rate, amount);
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.info) {
                this.info = yield this.publicApi.info();
            }
            return this.info;
        });
    }
}
exports.default = WexAdapter;
