"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var fs = require("fs");
var path = require("path");
var stream_2 = require("stream");
//Minimally Buffered, Concurrent Streams
//Utilities
var nulFalse = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var result = true;
    for (var i in args) {
        var arg = args[i];
        var _arg = Boolean((arg !== null && arg !== void 0 ? arg : false));
        result = result && _arg;
    }
    return result;
};
var isFragment = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
var isParsable = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
var isTransaction = function (x) {
    var _x = x;
    if (nulFalse(_x.tid, _x.id, _x.amount, _x.operation)) {
        if (_x.operation === 'O') {
            if (!nulFalse(_x.unitCost, _x.itemName))
                return false;
        }
        return true;
    }
    return false;
};
var isCustomer = function (x) {
    var _x = x;
    if (nulFalse(_x.id, _x.name, _x.balance)) {
        return true;
    }
    return false;
};
var initState = {
    fragment: null,
    parse: []
};
var Parser = /** @class */ (function (_super) {
    __extends(Parser, _super);
    function Parser(opts, mFn, rFn) {
        var _this = _super.call(this, opts) || this;
        _this.mFn = mFn;
        _this.rFn = rFn;
        _this.state = {
            fragment: null,
            parse: []
        };
        return _this;
    }
    Parser.prototype._transform = function (chunk, encoding, done) {
        var _a;
        var s = (_a = chunk.toString(), (_a !== null && _a !== void 0 ? _a : done()));
        var match = this.mFn(s);
        var _b = this.rFn(this.state, match), fragment = _b.fragment, parse = _b.parse;
        console.log(fragment, parse);
        if (parse.length > 0)
            for (var _i = 0, parse_1 = parse; _i < parse_1.length; _i++) {
                var p = parse_1[_i];
                this.push(p);
            }
        else
            this.state.fragment = fragment;
        console.log(this.state);
        done();
    };
    return Parser;
}(stream_1.Transform));
// Files, Paths, and Config
var MASTER_PATH = path.resolve(__dirname, "master.json"), TRANSACTIONS_PATH = path.resolve(__dirname, "transactions.json"), OUTPUT_PATH = path.resolve(__dirname, "output3");
var CUSTOMER_MAX = {
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
var encoding = 'utf-8';
var cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '\t\t')), tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, '\t\t'));
//console.log(cMax, tMax)//?
var c$Options = {
    encoding: encoding,
    highWaterMark: cMax
}, t$Options = {
    encoding: encoding,
    highWaterMark: tMax
};
var c$ = fs.createReadStream(MASTER_PATH, c$Options), t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options), o$ = fs.createWriteStream(OUTPUT_PATH);
var OPEN = '{', CLOSED = '}';
exports.JMatch = function (cache) {
    //if (cache) cache = cache.concat(str)
    //else cache = str
    var fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
    console.log("split", cache); //?
    var midParse = cache.substring(fO, lC + 1); //?
    var midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED)); //?
    if (!~fO || !~fC) {
        return [{ fragment: cache }];
    }
    else if (fC < fO) {
        if (lO === fO) {
            console.log({ fragment: cache.substring(0, fC + 1) }, true ? { parse: cache.substring(fO, lC + 1) } : null); //?
            return midCheck ? [
                { fragment: cache.substring(0, fC + 1) },
                { parse: cache.substring(fO, lC + 1) }
            ] : [
                { fragment: cache.substring(0, fC + 1) }
            ];
        }
        else if (lO > lC) {
            var res1 = [
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
        else
            return [
                { parse: cache.substring(fO, fC + 1) },
                { fragment: cache.substring(fC + 1) }
            ];
    }
    console.log("error");
};
var defragStream = function (j) { return function (acc, cur) {
    return cur.reduce(function (state, FoP) {
        var _a;
        var newState = state;
        if (isParsable(FoP)) {
            newState.parse.push(FoP);
            newState.fragment = null;
        }
        else if (isFragment(FoP)) {
            var cacheIsWarm = isFragment(state.fragment);
            if (cacheIsWarm) {
                var res = j(state.fragment.fragment.concat(FoP.fragment));
                var pRes = res.filter(function (x) { return isParsable(x); });
                if (pRes.length > 0) {
                    (_a = newState.parse).push.apply(_a, pRes);
                    newState.fragment = null;
                }
            }
            else {
                newState.fragment = FoP;
            }
        }
        console.log("pass", state, newState, "\n");
        return newState;
    }, acc);
}; };
var p$ = new Parser({ readableObjectMode: true, writableObjectMode: true }, exports.JMatch, defragStream(exports.JMatch));
var p1$ = new Parser({ readableObjectMode: true, writableObjectMode: true }, exports.JMatch, defragStream(exports.JMatch));
var pass$ = new stream_2.PassThrough({ readableObjectMode: true, writableObjectMode: true });
var toString = new stream_1.Transform({
    readableObjectMode: false,
    writableObjectMode: true,
    transform: function (c, e, d) {
        console.log(c == null);
        if (nulFalse(c) && c !== undefined) {
            console.log(c); //?
            d(null, JSON.stringify(JSON.parse(c)));
        }
        d();
    }
}).on('error', function (e) { console.log('somethin wrong', e); });
var transaction$ = stream_2.pipeline(t$, p$, function (e) { return console.log(e ? e : "all good"); });
var customers$ = stream_2.pipeline(c$, p1$, function (e) { return console.log(e ? e : "all good"); });
customers$.pipe(pass$, { end: false }).on('error', function (e) { console.log("c$->pass$ fail " + e); });
transaction$.pipe(pass$, { end: false }).on('error', function (e) { console.log("t$->pass$ fail " + e); });
stream_2.pipeline(pass$, toString, o$, function (e) { return console.log(e ? e : "all good"); });
