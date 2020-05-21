import * as fs from "fs";
import { Transform, pipeline } from "stream";
import * as path from "path";
const MASTER_PATH = path.resolve(__dirname, `master.json`), TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`), OUTPUT_PATH = path.resolve(__dirname, `output2`);
const testObject = `{
  "id": "1111",
  "name": "12345678901234567890",
  "balance": 234.5
}`;
const fragmentedObjs = [
    `{ "id": "1234", "name": "11111111112222222222", "balance": 111.4`,
    `}, { "id": "1235", "name": "12121212123232323232", "balance": 123.4 }, {`,
    `"id": "1236", "name": "22222222222222222222", "balance": 222.5 },`,
    `{ "id": "1237", "name": "33333333333333333333", "balance": 333.6 },`,
];
const OPEN = '{', CLOSED = '}';
const JMatch = (cache) => {
    //if (cache) cache = cache.concat(str)
    //else cache = str
    const fO = cache.indexOf(OPEN), lO = cache.lastIndexOf(OPEN), fC = cache.indexOf(CLOSED), lC = cache.lastIndexOf(CLOSED);
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
const testData = [
    testObject,
    ...fragmentedObjs
];
const res = testData.map(value => JMatch(value)).flat();
const isFragment = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.fragment, (_b !== null && _b !== void 0 ? _b : false); };
const isParsable = (x) => { var _a, _b; return _b = (_a = x) === null || _a === void 0 ? void 0 : _a.parse, (_b !== null && _b !== void 0 ? _b : false); };
const initState = {
    cache: undefined,
    parse: []
};
const defragStream = (acc, cur) => {
    var _a, _b, _c, _d;
    console.log(`
  { 
    Value: ${isParsable(cur) ? cur.parse : cur.fragment}, 
    Parsable: ${Boolean(isParsable(cur))}
    Fragment: ${Boolean(isFragment(cur))} 
  }`);
    if (isParsable(cur)) {
        return { cache: undefined, parse: Boolean((_a = acc.parse, (_a !== null && _a !== void 0 ? _a : false))) ? [...acc.parse, cur] : [cur] };
    }
    if (isFragment((_b = acc) === null || _b === void 0 ? void 0 : _b.cache) && isFragment(cur)) {
        if (isFragment(acc.cache)) {
            const _res = JMatch(acc.cache.fragment.concat(cur.fragment)); //?
            const parse = (_c = _res) === null || _c === void 0 ? void 0 : _c.filter(isParsable); //?
            return (_d = parse) === null || _d === void 0 ? void 0 : _d.every(isParsable) ? { cache: undefined, parse: [...acc.parse, ...parse] } : acc;
        }
    }
    if (isFragment(cur)) {
        return { cache: cur, parse: acc.parse };
    }
    else {
        return acc;
    }
};
const defraggedRes = res.reduce(defragStream, initState);
//JSON.parse(testObject)
console.log(defraggedRes.parse.map(x => JSON.parse(x.parse)));
const CUSTOMER_MAX = {
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
const encoding = 'utf-8';
const cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '\t\t')), tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, '\t\t'));
//console.log(cMax, tMax)
const c$Options = {
    encoding,
    highWaterMark: cMax
}, t$Options = {
    encoding,
    highWaterMark: tMax
};
const c$ = fs.createReadStream(MASTER_PATH, c$Options), t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options);
/*c$.on('data', val => {
  JMatch(val)?.flat().reduce(defragStream, initState) //?
})*/
const stateLogger = fs.createWriteStream(OUTPUT_PATH);
class toJSON extends Transform {
    constructor(opt) {
        super(opt);
        this.accState = initState;
    }
    setAccState(x) {
        stateLogger.write(x, e => console.log(`toJSON setState Error`));
        this.accState = x;
    }
    _transform(chunk, encoding, callback) {
        var _a;
        console.log(`pass ${chunk}`);
        try {
            const str = chunk.toString().trim(); //?
            const match = (_a = JMatch(str), (_a !== null && _a !== void 0 ? _a : false)); //?
            const res = match ? match.reduce(defragStream, this.accState) : false;
            console.log(res); //?
            //this.accState = JMatch(str)?.reduce(defragStream, this.accState) ?? this.accState//?
            if (res)
                this.setAccState(res);
            if (this.accState.parse.length > 0) {
                const parseMe = this.accState.parse; //?
                for (const p of parseMe) {
                    p; //?
                    callback(null, p.parse);
                }
            }
            else {
                console.log(this.accState);
            }
            callback();
        }
        catch (e) {
            callback(e);
        }
    }
}
const defaultOpts = {
    writableObjectMode: true,
    readableObjectMode: true
};
const mapTransform = f => (chk, enc, cb) => {
    var _a;
    const res = (_a = f(chk), (_a !== null && _a !== void 0 ? _a : false));
    console.log(res); //?
    if (res) {
        cb(null, res);
    }
};
const map = (opts = defaultOpts, f) => (new Transform(Object.assign(Object.assign({}, opts), { transform: mapTransform(f) })));
//const outout = fs.createWriteStream(OUTPUT_PATH)
//console.log({ ...({id: 1, name: "der" }) })
const jTx = new toJSON({ writableObjectMode: true, readableObjectMode: true, objectMode: true });
const objMap = map(null, (str) => {
    console.log(`parse step ${str}`); //?
    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.error(e);
        return e;
    }
});
const toString = map({ writableObjectMode: true, readableObjectMode: false, objectMode: true }, x => {
    console.log(`val ${x}`); //?
    try {
        return JSON.stringify(x);
    }
    catch (e) {
        console.error(`At toString() ${e}`);
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
    console.log(`JSON transform unpipe`);
    this.destroy();
});
jTx.on('error', function handlerError(e) {
    console.log(`JSON transform error: ${e}`);
});
toString.on('unpipe', function handleUnpipe(e) {
    console.log(`toString unpipe`);
    this.destroy();
});
toString.on('error', function handleError(e) {
    console.log(`toString error: ${e}`);
});
pipeline(c$, jTx, toString, process.stdout, (e) => {
    if (e)
        console.log(e);
    else
        console.log("success");
});
