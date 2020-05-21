"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stream_2 = require("stream");
//Minimally Buffered, Concurrent Streams
//Utilities
const nulFalse = (...args) => {
    let result = true;
    for (const i in args) {
        const arg = args[i];
        const _arg = Boolean((arg !== null && arg !== void 0 ? arg : false));
        result = result && _arg;
    }
    return result;
};
const isFragment = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
const isParsable = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
const isTransaction = (x) => {
    const _x = x;
    if (nulFalse(_x.tid, _x.id, _x.amount, _x.operation)) {
        if (_x.operation === 'O') {
            if (!nulFalse(_x.unitCost, _x.itemName))
                return false;
        }
        return true;
    }
    return false;
};
const isCustomer = (x) => {
    const _x = x;
    if (nulFalse(_x.id, _x.name, _x.balance)) {
        return true;
    }
    return false;
};
class Parser extends stream_1.Transform {
    constructor(opts, mFn, rFn) {
        super(opts);
        this.mFn = mFn;
        this.rFn = rFn;
        this.state = {
            fragment: null,
            parse: []
        };
    }
    _transform(chunk, encoding, done) {
        var _a;
        const s = (_a = chunk.toString(), (_a !== null && _a !== void 0 ? _a : done())); //?
        console.log("PASS", s, "\n");
        const fmatch = this.mFn(s); //?
        const { fragment, parse } = this.rFn(this.state, fmatch); //?
        console.log(fragment, parse);
        if (parse.length > 0) {
            for (const p of parse)
                this.push(p.parse);
            this.state.parse = [];
        }
        else
            this.state.fragment = fragment;
        console.log(this.state);
        done();
    }
}
// Files, Paths, and Config
const MASTER_PATH = path.resolve(__dirname, `master.json`), TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`), OUTPUT_PATH = path.resolve(__dirname, `output3`);
const CUSTOMER_MAX = {
    id: "9999",
    name: "zzzzzzzzzzzzzzzzzzzz",
    balance: 9999.99
}, TRANSACTION_MAX = {
    tid: "9999",
    id: "9999",
    operation: 'O',
    itemName: "zzzzzzzzzzzzzzzzzzzz",
    amount: 9999,
    unitCost: 9999.99
};
//console.log(('[').length) //?
const encoding = 'utf-8';
const cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '')), tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, ''));
//console.log(cMax, tMax)//?
const c$Options = {
    encoding,
    highWaterMark: cMax * 2
}, t$Options = {
    encoding,
    highWaterMark: tMax * 2
};
const c$ = fs.createReadStream(MASTER_PATH, c$Options), t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options), o$ = fs.createWriteStream(OUTPUT_PATH);
const OPEN = '{', CLOSED = '}';
exports.JMatch = (cache) => {
    //if (cache) cache = cache.concat(str)
    //else cache = str
    const fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
    console.log("split", cache); //?
    const midParse = cache.substring(fO, lC + 1); //?
    const midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED)); //?
    if (!~fO || !~fC) {
        return [{ fragment: cache }];
    }
    else if (fC < fO) {
        if (lO === fO) {
            console.log(!midCheck ? `Return [${cache.substring(0, fC + 1)}] Original ${cache} END` : cache); //?
            return midCheck ? [
                { fragment: cache.substring(0, fC + 1) },
                { parse: cache.substring(fO, lC + 1) }
            ] : [
                { fragment: cache.substring(0, fC + 1) },
                { fragment: cache.substring(fO) }
            ];
        }
        else if (lO > lC) {
            const res1 = [
                { fragment: cache.substring(0, fC + 1) },
                { parse: cache.substring(fO, lC + 1) },
                { fragment: cache.substring(lO) }
            ], res2 = [
                { fragment: cache.substring(0, fC + 1) },
                { fragment: cache.substring(lO) }
            ];
            //console.log(cache)
            if (midCheck) {
                console.log(res1, cache); //?
                return res1;
            }
            else {
                console.log(res2, cache); //?
                return res2;
            }
        }
    }
    else if (fC > fO) {
        if (fO === lO && fC === lC)
            return [
                { parse: cache.substring(fO, fC + 1) }
            ];
        else if (fO === lO)
            return [
                { fragment: cache.substring(0, fO) },
                { parse: cache.substring(lO, lC + 1) }
            ];
        else if (fC === lC)
            return [
                { parse: cache.substring(fO, lC + 1) },
                { fragment: cache.substring(lO) }
            ];
        else if (fO !== lO && fC !== lC)
            return [
                { parse: cache.substring(fO, fC + 1) },
                { parse: cache.substring(lO, lC + 1) }
            ];
        else
            return [
                { parse: cache.substring(fO, fC + 1) },
                { fragment: cache.substring(fC + 1) }
            ];
    }
    console.log("error");
};
const defragStream = (j) => (acc, cur) => cur.reduce((state, FoP) => {
    const newState = state;
    if (isParsable(FoP)) {
        newState.parse.push(FoP);
        newState.fragment = null;
    }
    else if (isFragment(FoP)) {
        const cacheIsWarm = isFragment(state.fragment);
        if (cacheIsWarm) {
            const res = j(state.fragment.fragment.concat(FoP.fragment));
            const pRes = res.filter(x => isParsable(x));
            if (pRes.length > 0) {
                newState.parse.push(...pRes);
                newState.fragment = null;
            }
        }
        else {
            newState.fragment = FoP;
        }
    }
    return newState;
}, acc);
const p$ = new Parser({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true }, exports.JMatch, defragStream(exports.JMatch));
const p1$ = new Parser({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true }, exports.JMatch, defragStream(exports.JMatch));
const pass$ = new stream_2.PassThrough({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true });
const toString = new stream_1.Transform({
    readableObjectMode: false,
    writableObjectMode: true,
    transform: (c, e, d) => {
        console.log(`PASS ${JSON.stringify(c)} ${e} END`); //?
        try {
            if (nulFalse(c)) {
                d(null, JSON.stringify(c) + "\n");
            }
            else
                d();
        }
        catch (e) {
            console.log(`parse error ${e}`); //?
            d();
        }
    }
}).on('error', e => { console.log('somethin wrong', e); }), toObject = new stream_1.Transform({
    readableObjectMode: true,
    writableObjectMode: false,
    transform: (c, e, d) => {
        try {
            const obj = JSON.parse(c.toString()); //?
            d(null, obj);
        }
        catch (e) {
            d(e);
        }
    }
}).on('error', e => { console.log(e); });
const transaction$ = stream_2.pipeline(t$, p$, e => console.log(e ? e : "all good"));
const customers$ = stream_2.pipeline(c$, p1$, e => console.log(e ? e : "all good"));
p$.on("end", () => {
    console.log("end");
});
customers$.pipe(pass$, { end: false }).on('error', e => { console.log(`c$->pass$ fail ${e}`); });
transaction$.pipe(pass$, { end: false }).on('error', e => { console.log(`t$->pass$ fail ${e}`); });
stream_2.pipeline(pass$, toObject, toString, o$, e => console.log(e ? e : "all good"));
//# sourceMappingURL=test4.js.map