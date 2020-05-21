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
var newState = { customers: [], transactions: [] };
var Customer = /** @class */ (function () {
    function Customer(c) {
        this.id = c.id;
        this.name = c.name;
        this.balance = this.previousBalance = c.balance;
        this.transactions = [];
        Customer.present();
    }
    Customer.prototype.applyTransaction = function (t) {
        this._modified = true;
        this.transactions = this.transactions.concat(t);
        this.balance += t._getTotalAdj();
        return this;
    };
    Customer.prototype.isModified = function () {
        return this._modified;
    };
    Customer.checkModified = function (c) {
        var _a, _b;
        return _b = (_a = c) === null || _a === void 0 ? void 0 : _a._modified, (_b !== null && _b !== void 0 ? _b : false);
    };
    Customer.present = function () {
        this._any = true;
    };
    Customer.any = function () {
        return this._any;
    };
    Customer.isInstance = function (c) {
        var _a;
        //console.log(c instanceof Customer) //?
        return _a = (c instanceof Customer), (_a !== null && _a !== void 0 ? _a : false);
    };
    Customer.prototype.generateInvoice = function () {
        return (this.name + "\t" + this.id + "\n      PREVIOUS BALANCE\t$" + this.previousBalance + "\n\n      " + this.transactions.map(function (t) { return t.invoice(); }).reduce(function (s, cs) { return s.concat(cs); }, "") + "\n      BALANCE DUE\t\t$" + this.balance + "\n      ");
    };
    Customer._any = false;
    return Customer;
}());
var Transaction = /** @class */ (function () {
    function Transaction(t) {
        var _a;
        this.tid = t.tid;
        this.id = t.id;
        this.operation = t.operation;
        this.amount = t.amount;
        if (t.operation === "O" && ((_a = t) === null || _a === void 0 ? void 0 : _a.unitCost)) {
            this.itemName = t.itemName;
            this.unitCost = t.unitCost;
            this.totalAdj = t.unitCost * t.amount;
        }
        else if (t.operation === "P") {
            this.totalAdj = -t.amount;
        }
        Transaction.present(t);
    }
    Transaction.present = function (t) {
        this._any = true;
        var newId = parseInt(t.id);
        if (this._latest <= newId) {
            this._latest = newId;
        }
        else {
            console.error("Data not in ascending order: undetermined behavior");
        }
    };
    Transaction.latestProcessedID = function () {
        return this._latest;
    };
    Transaction.any = function () {
        return this._any;
    };
    Transaction._handleStreamEnd = function () {
        this._reading = false;
        //this.end$.destroy("done")
        //this.end$.destroy()
    };
    Transaction.isDone = function () {
        return this._reading;
    };
    Transaction.bindStream = function (r$) {
        r$.on('end', this._handleStreamEnd);
    };
    Transaction.toEndStream = function (r$) {
        this.end$ = r$;
    };
    Transaction.prototype._getTotalAdj = function () {
        return this.totalAdj;
    };
    Transaction.prototype.belongsTo = function (c) {
        return this.id === c.id;
    };
    Transaction.prototype.invoice = function () {
        var _a;
        var type = (_a = this.itemName, (_a !== null && _a !== void 0 ? _a : "Payment"));
        var op = this.operation === 'O' ? '+' : '-';
        var res = "\t" + this.tid + "#\t" + type + "\t\t" + op + "$" + this.amount + "\n";
        return res;
    };
    Transaction._any = false;
    Transaction._latest = 0;
    Transaction._reading = true;
    return Transaction;
}());
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
            return [
                { fragment: cache.substring(0, fC + 1) },
                { parse: cache.substring(fO, lC + 1) }
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
//console.log(res.flat())
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
    cache: undefined,
    parse: []
};
var defragStream = function (acc, cur) {
    var _a, _b;
    console.log("\n  { \n    Raw: " + JSON.stringify(cur) + "\n    Value: " + (isParsable(cur) ? cur.parse : cur.fragment) + ", \n    Parsable: " + Boolean(isParsable(cur)) + "\n    Fragment: " + Boolean(isFragment(cur)) + " \n  }"); //?
    if (isParsable(cur)) {
        console.log(cur); //?
        if (~cur.parse.indexOf('{') && ~cur.parse.indexOf('}'))
            return { cache: undefined, parse: [cur] }; //Boolean(acc.parse ?? false) ? [...acc.parse, cur] : [cur] } 
        return acc;
    }
    //if (isFragment(acc?.cache) && isFragment(cur)) {
    if (isFragment(cur)) {
        console.log(cur);
        if (isFragment(acc.cache)) {
            var _res = exports.JMatch(acc.cache.fragment.concat(cur.fragment)); //?
            var parse = (_a = _res) === null || _a === void 0 ? void 0 : _a.filter(isParsable); //?
            return (_b = parse) === null || _b === void 0 ? void 0 : _b.every(isParsable) ? { cache: undefined, parse: __spreadArrays(acc.parse, parse) } : acc; //?
        }
    }
    if (isFragment(cur)) {
        console.log(cur); //?
        return { cache: cur, parse: acc.parse };
    }
    else {
        return acc;
    }
};
var tttest = '[\r\n  {\r\n    "tid": "0001",\r\n    "id": "1000", \r\n    "operation": "O",\r\n    "amount": 436,\r\n    "itemName": "Weatherproof Nails",\r\n    ';
console.log(exports.JMatch(tttest)); //?
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
console.log(cMax, tMax); //?
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
var passThrough$ = new stream_1.PassThrough({ readableObjectMode: true, allowHalfOpen: true });
var passThrough$2 = new stream_1.PassThrough({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true });
//const stateLogger = fs.createWriteStream(OUTPUT_PATH)
var toJSON = /** @class */ (function (_super) {
    __extends(toJSON, _super);
    function toJSON(opt) {
        var _this = _super.call(this, opt) || this;
        _this.accState = __assign({}, initState); //?
        _this.id = toJSON.generateID();
        return _this;
    }
    toJSON.generateID = function () {
        return ++this.uuid;
    };
    toJSON.prototype.setAccState = function (x) {
        //stateLogger.write(JSON.stringify(x), e => console.log(`toJSON setState Error`))
        //console.log(x) //?
        this.accState = x;
    };
    toJSON.prototype._transform = function (chunk, encoding, callback) {
        var _a, _b;
        //console.log(`pass ${chunk}`)
        try {
            var str = chunk.toString();
            console.log("Instance(" + this.id + ") Current: " + chunk.toString());
            var match = (_a = exports.JMatch(str), (_a !== null && _a !== void 0 ? _a : false)); //?
            var res = (match ? match.reduce(defragStream, this.accState) : false); //?
            console.log("Instance" + this.id + " match " + JSON.stringify(match));
            console.log("Instance(" + this.id + ") NewState " + JSON.stringify(res)); //?
            //console.log(res ?? `broke, res is undefined, endBroke`)
            //console.log(res ?? true)
            //this.accState = JMatch(str)?.reduce(defragStream, this.accState) ?? this.accState//?
            if (res)
                this.setAccState(res);
            if (this.accState.parse.length > 0) {
                var parseMe = __spreadArrays(this.accState.parse); //?
                for (var _i = 0, parseMe_1 = parseMe; _i < parseMe_1.length; _i++) {
                    var p = parseMe_1[_i];
                    var success = false;
                    //isParsable(p) //?
                    if (isParsable(p) && (_b = p.parse, (_b !== null && _b !== void 0 ? _b : false))) {
                        success = this.push(p.parse);
                    }
                    console.log(success, p); //?
                }
                this.setAccState({ cache: this.accState.cache, parse: [] });
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
    toJSON.uuid = 1;
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
var objMap = map({ writableObjectMode: true, readableObjectMode: true, allowHalfOpen: true }, function (str) {
    //console.log(`parse step ${str}`) //?
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
        return "\n" + JSON.stringify(x); //?
    }
    catch (e) {
        console.error("At toString() " + e);
        return e;
    }
});
//c$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//t$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//const stdOut$ = new WriteStream(process.stdout)
var Reducer = /** @class */ (function (_super) {
    __extends(Reducer, _super);
    function Reducer(opts, rf, ff, init) {
        var _this = _super.call(this, opts) || this;
        _this.acc = init;
        _this.rFunc = rf;
        _this.fFunc = ff;
        return _this;
    }
    Reducer.prototype.reduce = function (cur) {
        return this.rFunc(this.acc, cur);
    };
    Reducer.prototype.filter = function (v) {
        return this.fFunc(v);
    };
    Reducer.prototype._transform = function (chunk, encoding, done) {
        console.log("space", chunk);
        //?
        if (chunk) {
            this.acc = this.reduce(chunk);
            //this.push(this.acc)
        }
        /*
      let valid = this.filter(this.acc)
      if (valid.length > 0) {
        for (const value of valid) this.push(value)
      }
      */
        done();
    };
    Reducer.prototype._flush = function (done) {
        var res = this.acc.customers.filter(function (c) {
            console.log(c); //?
            return Customer.checkModified(c); //?
        });
        res.length; //?
        if (res.length > 0)
            done(null, res);
        else
            done("somethin wrong " + JSON.stringify(this.acc));
    };
    return Reducer;
}(stream_1.Transform));
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
Transaction.bindStream(jTx2);
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
var map$ = function (opts, f) { return new stream_1.Transform(__assign(__assign({}, opts), { transform: function (chunk, e, done) {
        done(null, f(chunk));
    } })); };
//log$$(arr$, (e, d) => e ? (err) => console.error(`@${e} error ${err}`) : (data) => console.log(`@${d} complete ${data}`)) //?
var customer$ = stream_1.pipeline(c$, jTx, 
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
function (e) {
    if (e)
        console.log(e);
    else
        console.log("$2 success");
    //t$.destroy()
    //jTx2.destroy()
});
var t$pass = transaction$.pipe(passThrough$, { end: false }); //.on("data", x => console.log(x)) //?
customer$.pipe(passThrough$, { end: true });
t$pass.on('unpipe', function () {
    console.log("!!!!!!!!!!!!transactions unpiped!!!!!!!!!!!!!!!!!!!!!!!!");
    // run cid , tid check
    //customer$.end()
    //passThrough$.end()
});
var validInvoice = function (acc) { return []; };
//.once('close', () => GLOBAL_T$_FLOW = false)
var makeInvoice = function (_a, cur) {
    var customers = _a.customers, transactions = _a.transactions;
    //console.log(cur, ({ customers, transactions, invoices }))
    console.log(cur, ({ customers: customers, transactions: transactions })); //?
    var newState = { customers: customers, transactions: transactions };
    if (isCustomer(cur)) {
        var cust = new Customer(cur);
        if (!Transaction.any())
            newState.customers = customers.concat(cust);
        else if (parseInt(cust.id) >= Transaction.latestProcessedID()) {
            var tHit = transactions.filter(function (t) { var _a; return (_a = t) === null || _a === void 0 ? void 0 : _a.belongsTo(cur); });
            if (tHit && tHit.length > 0) {
                var newTransactions = transactions.filter(function (t) { return !t.belongsTo(cur); });
                var cust_1 = tHit.reduce(function (c, t) {
                    c.applyTransaction(t);
                }, new Customer(cur));
                newState.customers = customers.concat(cust_1);
                newState.transactions = newTransactions;
            }
        }
    }
    else if (isTransaction(cur)) {
        var tx_1 = new Transaction(cur);
        var cHit = customers.filter(function (c) { return tx_1.belongsTo(c); });
        if (!Customer.any())
            newState.transactions = transactions.concat(tx_1);
        else if (cHit && cHit.length > 0) {
            var newC = cHit.map(function (c) {
                c.applyTransaction(tx_1);
                c.isModified(); //?
                var resInvoice = c.generateInvoice(); //?
                //console.log(resInvoice) 
                return c;
            }); //?
            newState.customers = customers;
            newState.transactions = transactions.filter(function (t) { return t.tid !== tx_1.tid; });
            //return { customers, transactions: transactions.filter(({ id }) => id !== tx.id), invoices: invoices.concat(newInvoices)}
        }
        else {
            newState.transactions = transactions.concat(tx_1);
        }
    }
    //console.log(newState)//?
    return newState;
};
var ctReduce$ = new Reducer({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true }, makeInvoice, validInvoice, newState);
var mapToInvoice = map$({
    readableObjectMode: false,
    writableObjectMode: true
}, function (c) { return c.reduce(function (i, cus) { return i += cus.generateInvoice(); }, ""); });
Transaction.toEndStream(passThrough$);
var invoice$ = stream_1.pipeline(
//idMap,
passThrough$, objMap, ctReduce$, mapToInvoice, 
//toString,
outout, function (e) {
    if (e)
        console.log(e);
    else {
        idMap.destroy();
        //customer$.destroy()
        passThrough$.destroy();
        objMap.destroy();
        ctReduce$.destroy();
        //invoice$.destroy()
        console.log("$$ success");
    }
});
