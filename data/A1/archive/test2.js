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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var stream_1 = require("stream");
var path = require("path");
var MASTER_PATH = path.resolve(__dirname, "master.json"), TRANSACTIONS_PATH = path.resolve(__dirname, "transactions.json"), OUTPUT_PATH = path.resolve(__dirname, "output3");
var testObject = "{\n  \"id\": \"1111\",\n  \"name\": \"12345678901234567890\",\n  \"balance\": 234.5\n}";
var fragmentedObjs = [
    "{ \"id\": \"1234\", \"name\": \"11111111112222222222\", \"balance\": 111.4",
    "}, { \"id\": \"1235\", \"name\": \"12121212123232323232\", \"balance\": 123.4 }, {",
    "\"id\": \"1236\", \"name\": \"22222222222222222222\", \"balance\": 222.5 },",
    "{ \"id\": \"1237\", \"name\": \"33333333333333333333\", \"balance\": 333.6 },",
];
var OPEN = '{', CLOSED = '}';
var JMatch = function (cache) {
    //if (cache) cache = cache.concat(str)
    //else cache = str
    var fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
    if (!~fO || !~fC) {
        return [{ fragment: cache }];
    }
    else if (fC < fO) {
        if (lO > lC) {
            return (~cache.substring(fO, lC + 1).indexOf(OPEN) && ~cache.substring(fO, lC + 1).indexOf(CLOSED)) ? [
                { fragment: cache.substring(0, fC + 1) },
                { parse: cache.substring(fO, lC + 1) },
                { fragment: cache.substring(lO) }
            ] : [
                { fragment: cache.substring(0, fC + 1) },
                { fragment: cache.substring(lO) }
            ];
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
};
var testData = __spreadArrays([
    testObject
], fragmentedObjs);
var res = testData.map(function (value) { return JMatch(value); }).flat();
var isFragment = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
var isParsable = function (x) { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
var initState = {
    cache: undefined,
    parse: []
};
var defragStream = function (acc, cur) {
    var _a, _b, _c, _d;
    console.log("\n  { \n    Value: " + (isParsable(cur) ? cur.parse : cur.fragment) + ", \n    Parsable: " + Boolean(isParsable(cur)) + "\n    Fragment: " + Boolean(isFragment(cur)) + " \n  }");
    if (isParsable(cur)) {
        return { cache: undefined, parse: Boolean((_a = acc.parse, (_a !== null && _a !== void 0 ? _a : false))) ? __spreadArrays(acc.parse, [cur]) : [cur] };
    }
    if (isFragment((_b = acc) === null || _b === void 0 ? void 0 : _b.cache) && isFragment(cur)) {
        if (isFragment(acc.cache)) {
            var _res = JMatch(acc.cache.fragment.concat(cur.fragment)); //?
            var parse = (_c = _res) === null || _c === void 0 ? void 0 : _c.filter(isParsable); //?
            return (_d = parse) === null || _d === void 0 ? void 0 : _d.every(isParsable) ? { cache: undefined, parse: __spreadArrays(acc.parse, parse) } : acc;
        }
    }
    if (isFragment(cur)) {
        return { cache: cur, parse: acc.parse };
    }
    else {
        return acc;
    }
};
var defraggedRes = res.reduce(defragStream, initState);
//JSON.parse(testObject)
console.log(defraggedRes.parse.map(function (x) { return JSON.parse(x.parse); }));
var CUSTOMER_MAX = {
    id: "9999",
    name: "zzzzzzzzzzzzzzzzzzzz",
    balance: 9999.99
}, TRANSACTION_MAX = {
    id: "9999",
    operation: 'O',
    amount: 9999,
    unitCost: 9999.99
};
//console.log(('[').length) //?
var encoding = 'utf-8';
var cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '\t\t')), tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, '\t\t'));
//console.log(cMax, tMax)
var c$Options = {
    encoding: encoding,
    highWaterMark: cMax
}, t$Options = {
    encoding: encoding,
    highWaterMark: tMax
};
var c$ = fs.createReadStream(MASTER_PATH, c$Options), t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options);
/*c$.on('data', val => {
  JMatch(val)?.flat().reduce(defragStream, initState) //?
})*/
var passThrough$ = new stream_1.PassThrough({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true });
var stateLogger = fs.createWriteStream(OUTPUT_PATH);
var toJSON = /** @class */ (function (_super) {
    __extends(toJSON, _super);
    function toJSON(opt) {
        var _this = _super.call(this, opt) || this;
        _this.accState = __assign({}, initState); //?
        return _this;
    }
    toJSON.prototype.setAccState = function (x) {
        //stateLogger.write(JSON.stringify(x), e => console.log(`toJSON setState Error`))
        console.log(x); //?
        this.accState = x;
    };
    toJSON.prototype._transform = function (chunk, encoding, callback) {
        var _a;
        console.log("pass " + chunk);
        try {
            var str = chunk.toString().trim(); //?
            var match = (_a = JMatch(str), (_a !== null && _a !== void 0 ? _a : false)); //?
            var res_1 = match ? match.reduce(defragStream, this.accState) : false;
            console.log(res_1); //?
            console.log((res_1 !== null && res_1 !== void 0 ? res_1 : "broke, res is undefined, endBroke"));
            console.log((res_1 !== null && res_1 !== void 0 ? res_1 : true));
            //this.accState = JMatch(str)?.reduce(defragStream, this.accState) ?? this.accState//?
            if (res_1)
                this.setAccState(res_1);
            if (this.accState.parse.length > 0) {
                var parseMe = this.accState.parse; //?
                for (var _i = 0, parseMe_1 = parseMe; _i < parseMe_1.length; _i++) {
                    var p = parseMe_1[_i];
                    this.push(p.parse);
                }
            }
            else {
                console.log(this.accState);
            }
            callback();
        }
        catch (e) {
            console.log("JSON broke " + e);
            callback(e);
        }
    };
    return toJSON;
}(stream_1.Transform));
var defaultOpts = {
    writableObjectMode: true,
    readableObjectMode: true
};
var mapTransform = function (f) { return function (chk, enc, cb) {
    var _a;
    var res = (_a = f(chk), (_a !== null && _a !== void 0 ? _a : false));
    //console.log(res) //?
    if (res) {
        cb(null, res);
    }
    else {
        cb();
    }
}; };
var map = function (opts, f) {
    if (opts === void 0) { opts = defaultOpts; }
    return (new stream_1.Transform(__assign(__assign({}, opts), { transform: mapTransform(f) })));
};
var outout = fs.createWriteStream(OUTPUT_PATH);
//console.log({ ...({id: 1, name: "der" }) })
var jTx = new toJSON({ writableObjectMode: false, readableObjectMode: true, allowHalfOpen: true });
var jTx2 = new toJSON({ writableObjectMode: false, readableObjectMode: true, allowHalfOpen: true });
var objMap = map(null, function (str) {
    console.log("parse step " + str); //?
    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.error(e);
        return e;
    }
});
var idMap = map({ highWaterMark: 100, writableObjectMode: true, readableObjectMode: true, allowHalfOpen: true }, function (x) { return x; });
var toString = map({ writableObjectMode: true, readableObjectMode: false }, function (x) {
    //console.log(`val ${x}`) //?
    try {
        return "\n" + JSON.stringify(x);
    }
    catch (e) {
        console.error("At toString() " + e);
        return e;
    }
});
//c$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//t$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//const stdOut$ = new WriteStream(process.stdout)
c$.on('unpipe', function handleUnpipe(x) {
    console.log(x);
    this.destroy();
});
c$.on('error', function handleError(e) {
    console.log(e);
});
jTx.on('unpipe', function handleUnpipe(x) {
    console.log("JSON transform unpipe");
    //this.destroy()
});
jTx.on('error', function handlerError(e) {
    console.log("JSON transform error: " + e);
});
toString.on('unpipe', function handleUnpipe(e) {
    console.log("toString unpipe");
    //this.destroy()
});
toString.on('error', function handleError(e) {
    console.log("toString error: " + e);
});
var log$$ = function ($arr, f) { return $arr.map(function ($) {
    $.on('unpipe', f(null, $.name));
    $.on('error', f($.name));
}); };
var arr$ = [
    c$,
    t$,
    jTx,
    jTx2,
    toString,
    outout
];
log$$(arr$, function (e, d) { return e ? function (err) { return console.error("@" + e + " error " + err); } : function (data) { return console.log("@" + d + " complete " + data); }; }); //?
var customer$ = stream_1.pipeline(c$, jTx, passThrough$, 
//idMap,
//toString,
//outout,
function (e) {
    if (e)
        console.log(e);
    else
        console.log("success");
    //c$.destroy()
    //jTx.destroy()
});
var transaction$ = stream_1.pipeline(t$, jTx2, 
//idMap,
passThrough$, function (e) {
    if (e)
        console.log(e);
    else
        console.log("$2 success");
    //t$.destroy()
    //jTx2.destroy()
});
var invoice$ = stream_1.pipeline(
//idMap,
passThrough$, toString, outout, function (e) {
    if (e)
        console.log(e);
    else {
        idMap.destroy();
        customer$.destroy();
        transaction$.destroy();
        invoice$.destroy();
        console.log("$$ success");
    }
});
