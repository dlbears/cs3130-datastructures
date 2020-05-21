"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
//text formatters
const Valuable = (value) => ({
    value,
    map: (f) => Valuable(f(value)),
    unwrap: () => value
});
const genStr = (size, substr) => new Array(size).fill(substr).join("");
const textCell = (align) => (max_size) => (spacer) => (s) => Valuable(align === 'R' ?
    genStr(max_size - s.length, spacer).concat(s) :
    s.concat(genStr(max_size - s.length, spacer)));
exports.finCell = textCell('R');
// Find the size of an object as a UTF-8 string
exports.objSizeOf = obj => Buffer.byteLength(JSON.stringify(obj));
// easy tryCatch
exports.tryCatch = f => (res, err) => {
    try {
        return res(f());
    }
    catch (e) {
        err(e);
    }
};
// Check if any value is null
exports.nulFalse = (...args) => {
    if (args === null || args === undefined)
        return false;
    for (const arg of args) {
        if (arg === null || arg === undefined)
            return false;
    }
    return true;
};
exports.defaultTo = (defaultValue) => (...args) => exports.nulFalse(args) ?
    args.length === 1 ? args[0] : args : defaultValue;
//Functional Utilities
exports.compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);
// Stream Utilities
class Reduce extends stream_1.Transform {
    constructor(process, final, collector, opts) {
        super(opts);
        this.process = process;
        this.final = final;
        this.collector = collector;
    }
    _transform(chunk, encoding, done) {
        try {
            this.collector = this.process(this.collector, chunk, encoding);
            done();
        }
        catch (e) {
            done(e);
        }
    }
    _flush(done) {
        try {
            const result = this.final(this.collector);
            if (result)
                done(null, result);
            else
                done("Pushing Nothing fromReduce");
        }
        catch (e) {
            done(e);
        }
    }
}
const defaultObjectMode = {
    readableObjectMode: true,
    writableObjectMode: true
};
exports.terminator = (isDone, terminate) => f => (...args) => {
    if (isDone())
        terminate();
    return f(...args);
};
exports.reduce$ = (opts = defaultObjectMode) => (p, f, c = null) => new Reduce(p, f, c, opts);
exports.map$ = (opts = defaultObjectMode) => mF => new stream_1.Transform({
    ...opts,
    transform: (c, e, d) => (e && e === "buffer") ? d(null, mF(c.toString())) : d(null, mF(c))
});
exports.toString = (opts) => new stream_1.Transform({
    ...opts,
    readableObjectMode: false,
    writableObjectMode: true,
    transform: (c, _, d) => {
        exports.tryCatch(() => JSON.stringify(c))(res => d(null, res), err => d(err));
    }
});
exports.toObj = (opts) => new stream_1.Transform({
    ...opts,
    readableObjectMode: true,
    writableObjectMode: false,
    transform: (c, e, d) => {
        exports.tryCatch(() => JSON.parse(c.toString()))(res => d(null, res), err => d(err));
    }
});
//# sourceMappingURL=utility.js.map