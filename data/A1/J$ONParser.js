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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var stream_1 = require("stream");
exports.isFragment = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
exports.isParsable = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
var Parser = /** @class */ (function (_super) {
    __extends(Parser, _super);
    function Parser(mFn, rFn, opts) {
        var _this = _super.call(this, __assign(__assign({}, opts), { readableObjectMode: true, writableObjectMode: false })) || this;
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
        var fmatch = this.mFn(s); //?
        var _b = this.rFn(this.state, fmatch), fragment = _b.fragment, parse = _b.parse;
        if (parse.length > 0) {
            for (var _i = 0, parse_1 = parse; _i < parse_1.length; _i++) {
                var p = parse_1[_i];
                this.push(JSON.parse(p.parse));
            }
            this.state.parse = [];
        }
        else
            this.state.fragment = fragment;
        done();
    };
    return Parser;
}(stream_1.Transform));
var OPEN = '{', CLOSED = '}';
exports.JMatch = function (cache) {
    var fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
    var midParse = cache.substring(fO, lC + 1);
    var midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED));
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
            var res1 = [
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
var defragStream = function (j) {
    return function (acc, cur) {
        return cur.reduce(function (state, FoP) {
            var _a;
            var newState = state;
            if (exports.isParsable(FoP)) {
                newState.parse.push(FoP);
                newState.fragment = null;
            }
            else if (exports.isFragment(FoP)) {
                var cacheIsWarm = exports.isFragment(state.fragment);
                if (cacheIsWarm) {
                    var cache = state.fragment;
                    var res = j(cache.fragment.concat(FoP.fragment));
                    var pRes = res.filter(function (x) { return exports.isParsable(x); });
                    if (pRes.length > 0) {
                        (_a = newState.parse).push.apply(_a, pRes);
                        newState.fragment = null;
                    }
                }
                else {
                    newState.fragment = FoP;
                }
            }
            return newState;
        }, acc);
    };
};
exports.J$ONParser = function (opts) { return new Parser(exports.JMatch, defragStream(exports.JMatch), opts); };
