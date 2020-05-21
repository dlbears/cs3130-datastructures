"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs = require("fs");
var stream_1 = require("stream");
var path = require("path");
var MASTER_PATH = path.resolve(__dirname, "master.json");
var TRANSACTIONS_PATH = path.resolve(__dirname, "transactions.json");
var tryCatch = function (f, g) { return function (val) {
    if (val === void 0) { val = null; }
    var _a, _b;
    try {
        return _a = f(val), (_a !== null && _a !== void 0 ? _a : true);
    }
    catch (e) {
        return _b = g(e), (_b !== null && _b !== void 0 ? _b : false);
    }
}; };
var safeJSONParse = function (g) { return tryCatch(JSON.parse, g); };
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
nulFalse(true, true, true, null); //?
var isJFragment = function (x) {
    var _x = x;
    return nulFalse(_x.fragment);
};
var isJParsible = function (x) {
    var _x = x, jParse = safeJSONParse(function (_) { return false; });
    if (nulFalse(_x.parse)) {
        var res = jParse(_x.parse);
        if (res)
            return true;
    }
    return false;
};
var isTransaction = function (x) {
    var _x = x;
    if (nulFalse(_x.id, _x.amount, _x.operation)) {
        if (_x.operation === 'O') {
            if (!nulFalse(_x.unitCost))
                return false;
            return true;
        }
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
var master = fs.readFileSync(MASTER_PATH).toString();
//const res = tryCatch(() => JSON.parse(master), e => console.log(`Failed: ${e}`))
var debug = function (err, data) { return err ? console.error("Fail, err: " + err) : console.log("Success, data: " + data); };
var makeTransform = function (transform) { return new stream_1.Transform({ transform: transform }); };
var OPEN_BRACKET = /{/g;
var CLOSED_BRACKET = /}/g;
var JStringTemplate = function (id, op, qt, uc, final) {
    if (final === void 0) { final = false; }
    return "{\n    \"id\": " + id + ",\n    \"operation\": \"" + op + "\",\n    \"quantity\": " + qt + ",\n    \"unitCost\": " + uc + "\n}" + (final ? '' : ',') + "\n";
};
var genJStrings = function (amt) {
    if (amt === void 0) { amt = 50; }
    var round = Math.round;
    var next = function (index, final) {
        if (final === void 0) { final = false; }
        var random = Math.random();
        var id = 1000, //= getID(index, amt), 
        op = round(random) === 0 ? 'O' : 'P', qt = round(random * 95) + 5, uc = round(random * 10);
        return JStringTemplate(id, op, qt, uc, final);
    };
    var builder = "[";
    for (var i = 1; i <= amt; i++)
        builder += next(i, i === amt);
    builder += "]";
    var res2 = tryCatch(function () { return JSON.parse(builder); }, function (e) { return console.log(e); });
    if (res2)
        console.log("Mock generator test: ", JSON.stringify(res2));
};
var TemplateUTest = function () {
    var eg = JStringTemplate(1001, 'O', 200, 1.04, true);
    try {
        eg = JSON.stringify(JSON.parse(eg));
        console.log("success: \n", eg);
        return true;
    }
    catch (e) {
        console.log("Failed \n");
        console.error(e);
        return false;
    }
};
exports.a1 = function () { return __awaiter(void 0, void 0, void 0, function () {
    var chunks, stream, outputStream, safeFirst, makeJParsible, makeJFragment, matchJObject, identity, builder, getB, setB, stream_2, stream_2_1, buf, line, stateBuilder, parseRes, indicies, jsonFragments, e_1_1;
    var e_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                chunks = "";
                stream = fs.createReadStream(MASTER_PATH, { encoding: 'utf-8', highWaterMark: 96, start: 2 });
                outputStream = fs.createWriteStream(path.resolve(__dirname, "output"), { encoding: 'utf-8' });
                safeFirst = function (arr) { var _a; return (((_a = arr) === null || _a === void 0 ? void 0 : _a.length) > 0) ? arr[0] : false; };
                makeJParsible = function (parse) { return ({ parse: parse }); };
                makeJFragment = function (fragment) { return ({ fragment: fragment }); };
                matchJObject = function (l) {
                    var start = l.indexOf('{'), end = l.indexOf('}'), lastC = l.lastIndexOf('}'), lastO = l.lastIndexOf('{');
                    console.log(start, end);
                    //let result = []
                    if (start === -1 || end === -1)
                        return [makeJFragment(l)]; //?
                    if (end < start) {
                        if (lastO === start) {
                            if (lastC === end)
                                return [makeJFragment(l.substring(0, start))];
                            else if (lastC > start)
                                return [
                                    makeJFragment(l.substring(0, lastO + 1)),
                                    makeJParsible(l.substring(lastO, lastC + 1))
                                ];
                        }
                    }
                    else if (end > start) {
                        if (lastC === end && lastO === start)
                            return [makeJParsible(l.substring(start, end + 1))];
                        if (lastO === end && lastC > end)
                            return [
                                makeJParsible(l.substring(start, end + 1)),
                                makeJFragment(l.substring(end))
                            ];
                    }
                    console.log(l);
                    console.log(start, end, lastC, lastO);
                    //if (start === -1) return
                    //if (start < end && end <= last) return l.substring(start, last) 
                    //else if (start)
                    //const test = { parse: l }
                    //if (isJParsible(test)) return [ test ]
                };
                identity = function (x) { return x; } //?
                ;
                builder = "";
                getB = function () { return builder; };
                setB = function (str) {
                    builder = str;
                    return str;
                };
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, 7, 12]);
                stream_2 = __asyncValues(stream);
                _b.label = 2;
            case 2: return [4 /*yield*/, stream_2.next()];
            case 3:
                if (!(stream_2_1 = _b.sent(), !stream_2_1.done)) return [3 /*break*/, 5];
                buf = stream_2_1.value;
                line = buf //?
                ;
                stateBuilder = "";
                parseRes = matchJObject(line);
                console.log(parseRes);
                indicies = parseRes.map(function (_, i) { return i; });
                jsonFragments = parseRes //?
                    .reduce(function (acc, cv) {
                    if (isJFragment(cv)) {
                        //if (ci === 0) {
                        console.log(cv);
                        var possibleJSON = stateBuilder.concat(cv.fragment);
                        stateBuilder += cv.fragment;
                        var __res = matchJObject(possibleJSON);
                        if (__res != null) {
                            //const parsibleJson = __res.filter(x => (isJParsible(x)) ? true : false)
                            //const possibleObj = parsibleJson.map(({ parse }) => JSON.parse(parse)) 
                            var possibleObj = __res.map(function (x) {
                                if (isJParsible(x)) {
                                    return JSON.parse(x.parse);
                                }
                                else {
                                    return null;
                                }
                            });
                            stateBuilder = "";
                            return ((possibleObj !== null && possibleObj !== void 0 ? possibleObj : false)) ? acc.concat(possibleObj) : acc;
                        }
                        //}
                        //if (state.builder() ?? false) 
                        //state.set(cv)
                    }
                    else {
                        var pasrsedJson = safeJSONParse(function (x) { return null; })(cv.parse);
                        if (pasrsedJson) {
                            stateBuilder = "";
                            return __spreadArrays(acc, [pasrsedJson]);
                        }
                    }
                    return acc;
                }, []);
                console.log(jsonFragments); //?
                /*state.set(
                    (builderHasFragment) ?
                    (jsonFragments.reduce((acc, { fragment }) => acc.concat(fragment), state.builder) :
                    ""
                )*/
                //                    .reduce((acc, { fragment }) => acc.concat(fragment), state.builder)
                //.reduce((p, c) => {
                //(state.builder.length > 0) ? matchJObject(state.builder.concat(line)) : matchJObject(line) //?
                /*
                            if (builder.length > 0) builder = ""
                if (result.filter(isJFragment).length > 0) {
                    builder = builder.concat(result.filter(isJFragment).flatMap(x => x.fragment).join('')) //?
                }
                if (result.filter(isJParsible).length > 0) {
                    const _result = safeJSONParse(result.filter(isJParsible).flatMap(x => x.parse))
                    Object.keys(_result) //?
                }
                */
                //result.filter(isJParsible) //?
                //const pJSON = line.substring(start, end)
                //const result = tryCatch(() => JSON.stringify(JSON.parse(pJSON)), e => `error: ${e}`)
                //.map(safeFirst) 
                //let testOutput = []
                //if (object.every(identity))
                //  testOutput = object.flatMap(({ index }) => index)
                //const testOutput = `Chunk #:\n${line}\n`
                //console.log(testOutput)
                outputStream.write("update\n result: " + JSON.stringify(jsonFragments, null, 2) + "\n");
                _b.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_1_1 = _b.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 7:
                _b.trys.push([7, , 10, 11]);
                if (!(stream_2_1 && !stream_2_1.done && (_a = stream_2["return"]))) return [3 /*break*/, 9];
                return [4 /*yield*/, _a.call(stream_2)];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [2 /*return*/, new Promise(function (res, rej) {
                    stream.on("end", function () { return res(chunks); });
                    stream.on("error", rej);
                })];
        }
    });
}); };
exports.a1().then(function (x) { return x; })["catch"](console.error);
