import { Transform } from "stream";
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
export const finCell = textCell('R');
// Find the size of an object as a UTF-8 string
export const objSizeOf = obj => Buffer.byteLength(JSON.stringify(obj));
// easy tryCatch
export const tryCatch = f => (res, err) => {
    try {
        return res(f());
    }
    catch (e) {
        err(e);
    }
};
// Check if any value is null
export const nulFalse = (...args) => {
    if (args === null || args === undefined)
        return false;
    for (const arg of args) {
        if (arg === null || arg === undefined)
            return false;
    }
    return true;
};
export const defaultTo = (defaultValue) => (...args) => nulFalse(args) ?
    args.length === 1 ? args[0] : args : defaultValue;
//Functional Utilities
export const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);
// Stream Utilities
class Reduce extends Transform {
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
export const terminator = (isDone, terminate) => f => (...args) => {
    if (isDone())
        terminate();
    return f(...args);
};
export const reduce$ = (opts = defaultObjectMode) => (p, f, c = null) => new Reduce(p, f, c, opts);
export const map$ = (opts = defaultObjectMode) => mF => new Transform(Object.assign(Object.assign({}, opts), { transform: (c, e, d) => (e && e === "buffer") ? d(null, mF(c.toString())) : d(null, mF(c)) }));
export const toString = (opts) => new Transform(Object.assign(Object.assign({}, opts), { readableObjectMode: false, writableObjectMode: true, transform: (c, _, d) => {
        tryCatch(() => JSON.stringify(c))(res => d(null, res), err => d(err));
    } }));
export const toObj = (opts) => new Transform(Object.assign(Object.assign({}, opts), { readableObjectMode: true, writableObjectMode: false, transform: (c, e, d) => {
        tryCatch(() => JSON.parse(c.toString()))(res => d(null, res), err => d(err));
    } }));
