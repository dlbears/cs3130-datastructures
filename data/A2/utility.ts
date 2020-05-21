import { Transform, TransformOptions } from "stream"


// Utilities
type Nothing = null | undefined
type Mapper = <T, K>(value: T) => K 

//text formatters
const Valuable = <T>(value: T) => ({
    value,
    map: (f: Mapper) => Valuable(f(value)),
    unwrap: () => value
})

const genStr = (size, substr) => new Array(size).fill(substr).join("")

const textCell= (align: 'R' | 'L') =>
                (max_size: number) => 
                (spacer: string) => 
                (s: string) => Valuable(
                        align === 'R' ? 
                                genStr(max_size - s.length, spacer).concat(s) :
                                s.concat(genStr(max_size - s.length, spacer)) 
                )

export const finCell = textCell('R')

// Find the size of an object as a UTF-8 string
export const objSizeOf = obj => Buffer.byteLength(JSON.stringify(obj))


// easy tryCatch
export const tryCatch = f => (res, err) => {
    try {
        return res(f())
    } catch (e) {
        err(e)
    }
}

// Check if any value is null
export const nulFalse = (...args: any[]): boolean => { 
    if (args === null || args === undefined) return false
    for (const arg of args) {
        if (arg === null || arg === undefined) return false
    }
    return true
}

export const defaultTo = (defaultValue: any) => 
                            (...args: any[]) => 
                            nulFalse(args) ?
                                args.length === 1 ? args[0] : args : defaultValue


//Functional Utilities


export const compose = (...fns: Function[]) => 
                      (x: any) => 
                      fns.reduceRight((acc: any, fn: Function) => fn(acc), x)


// Stream Utilities
class Reduce extends Transform {
    constructor(
        private process: Function,
        private final: Function,
        private collector?: object,
        opts?: TransformOptions
    ) { super(opts) }
    
    _transform(chunk, encoding, done) {
        try {
            this.collector = this.process(this.collector, chunk, encoding)
            done()
        } catch (e) {
            done(e)
        }
    }

    _flush(done) {
        try{
            const result = this.final(this.collector)
            if (result) done(null, result)
            else done("Pushing Nothing fromReduce")
        } catch (e) {
            done(e)
        }
    }

}

const defaultObjectMode = {
    readableObjectMode: true,
    writableObjectMode: true
} 

export const terminator = (isDone, terminate) => f => (...args) => {
    if (isDone()) terminate() 
    return f(...args)
}


export const reduce$ = (opts=defaultObjectMode) => (p, f, c=null) => new Reduce(p, f, c, opts)

export const map$ = (opts=defaultObjectMode) => mF => new Transform({
    ...opts,
    transform: (c, e, d) => (e && e === "buffer") ? d(null, mF(c.toString())) : d(null, mF(c))
})

export const toString = (opts?: TransformOptions) => new Transform({ 
    ...opts,
    readableObjectMode: false, 
    writableObjectMode: true,
    transform: (c, _, d) => {
        tryCatch(() => JSON.stringify(c))(
            res => d(null, res),
            err => d(err)
        )
    }
})

export const toObj = (opts?: TransformOptions) => new Transform({
    ...opts,
    readableObjectMode: true,
    writableObjectMode: false,
    transform: (c, e, d) => {
        tryCatch(() => JSON.parse(c.toString()))(
            res => d(null, res),
            err => d(err)
        )
    }
})