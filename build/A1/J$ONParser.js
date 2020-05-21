"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
exports.isFragment = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
exports.isParsable = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
class Parser extends stream_1.Transform {
    constructor(mFn, rFn, opts) {
        super({
            ...opts,
            readableObjectMode: true,
            writableObjectMode: false
        });
        this.mFn = mFn;
        this.rFn = rFn;
        this.state = {
            fragment: null,
            parse: []
        };
    }
    _transform(chunk, encoding, done) {
        var _a;
        const s = (_a = chunk.toString(), (_a !== null && _a !== void 0 ? _a : done()));
        const fmatch = this.mFn(s); //?
        const { fragment, parse } = this.rFn(this.state, fmatch);
        if (parse.length > 0) {
            for (const p of parse)
                this.push(JSON.parse(p.parse));
            this.state.parse = [];
        }
        else
            this.state.fragment = fragment;
        done();
    }
}
const OPEN = '{', CLOSED = '}';
exports.JMatch = (cache) => {
    const fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
    const midParse = cache.substring(fO, lC + 1);
    const midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED));
    if (!~fO || !~fC) {
        return [{ fragment: cache }];
    }
    else if (fC < fO) {
        if (lO === fO) {
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
            if (midCheck)
                return res1;
            else
                return res2;
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
    if (exports.isParsable(FoP)) {
        newState.parse.push(FoP);
        newState.fragment = null;
    }
    else if (exports.isFragment(FoP)) {
        const cacheIsWarm = exports.isFragment(state.fragment);
        if (cacheIsWarm) {
            const cache = state.fragment;
            const res = j(cache.fragment.concat(FoP.fragment));
            const pRes = res.filter(x => exports.isParsable(x));
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
exports.J$ONParser = (opts) => new Parser(exports.JMatch, defragStream(exports.JMatch), opts);
//# sourceMappingURL=J$ONParser.js.map