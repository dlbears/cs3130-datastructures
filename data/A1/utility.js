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
//text formatters
var Valuable = function (value) { return ({
    value: value,
    map: function (f) { return Valuable(f(value)); },
    unwrap: function () { return value; }
}); };
var genStr = function (size, substr) { return new Array(size).fill(substr).join(""); };
var textCell = function (align) {
    return function (max_size) {
        return function (spacer) {
            return function (s) { return Valuable(align === 'R' ?
                genStr(max_size - s.length, spacer).concat(s) :
                s.concat(genStr(max_size - s.length, spacer))); };
        };
    };
};
exports.finCell = textCell('R');
// Find the size of an object as a UTF-8 string
exports.objSizeOf = function (obj) { return Buffer.byteLength(JSON.stringify(obj)); };
// easy tryCatch
exports.tryCatch = function (f) { return function (res, err) {
    try {
        return res(f());
    }
    catch (e) {
        err(e);
    }
}; };
// Check if any value is null
exports.nulFalse = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (args === null || args === undefined)
        return false;
    for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
        var arg = args_1[_a];
        if (arg === null || arg === undefined)
            return false;
    }
    return true;
};
exports.defaultTo = function (defaultValue) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return exports.nulFalse(args) ?
            args.length === 1 ? args[0] : args : defaultValue;
    };
};
//Functional Utilities
exports.compose = function () {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return function (x) {
        return fns.reduceRight(function (acc, fn) { return fn(acc); }, x);
    };
};
// Stream Utilities
var Reduce = /** @class */ (function (_super) {
    __extends(Reduce, _super);
    function Reduce(process, final, collector, opts) {
        var _this = _super.call(this, opts) || this;
        _this.process = process;
        _this.final = final;
        _this.collector = collector;
        return _this;
    }
    Reduce.prototype._transform = function (chunk, encoding, done) {
        try {
            this.collector = this.process(this.collector, chunk, encoding);
            done();
        }
        catch (e) {
            done(e);
        }
    };
    Reduce.prototype._flush = function (done) {
        try {
            var result = this.final(this.collector);
            if (result)
                done(null, result);
            else
                done("Pushing Nothing fromReduce");
        }
        catch (e) {
            done(e);
        }
    };
    return Reduce;
}(stream_1.Transform));
var defaultObjectMode = {
    readableObjectMode: true,
    writableObjectMode: true
};
exports.terminator = function (isDone, terminate) { return function (f) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    if (isDone())
        terminate();
    return f.apply(void 0, args);
}; }; };
exports.reduce$ = function (opts) {
    if (opts === void 0) { opts = defaultObjectMode; }
    return function (p, f, c) {
        if (c === void 0) { c = null; }
        return new Reduce(p, f, c, opts);
    };
};
exports.map$ = function (opts) {
    if (opts === void 0) { opts = defaultObjectMode; }
    return function (mF) { return new stream_1.Transform(__assign(__assign({}, opts), { transform: function (c, e, d) { return (e && e === "buffer") ? d(null, mF(c.toString())) : d(null, mF(c)); } })); };
};
exports.toString = function (opts) { return new stream_1.Transform(__assign(__assign({}, opts), { readableObjectMode: false, writableObjectMode: true, transform: function (c, _, d) {
        exports.tryCatch(function () { return JSON.stringify(c); })(function (res) { return d(null, res); }, function (err) { return d(err); });
    } })); };
exports.toObj = function (opts) { return new stream_1.Transform(__assign(__assign({}, opts), { readableObjectMode: true, writableObjectMode: false, transform: function (c, e, d) {
        exports.tryCatch(function () { return JSON.parse(c.toString()); })(function (res) { return d(null, res); }, function (err) { return d(err); });
    } })); };
