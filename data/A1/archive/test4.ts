
import { Transform, TransformOptions } from 'stream'
import * as fs from 'fs'
import * as path from 'path'
import { pipeline, PassThrough } from 'stream'
//Minimally Buffered, Concurrent Streams

//Utilities
const nulFalse = (...args) => {
    let result = true 
    for (const i in args) {
        const arg = args[i]
        const _arg = Boolean(arg ?? false)
        result = result && _arg
    }
    return result
}

//Interfaces and Type Guards
export interface IFragment {
    fragment: string
}
  
export interface IParsable {
    parse: string
}

const isFragment = (x: any): x is IFragment => x?.fragment ?? false
const isParsable = (x: any): x is IParsable => x?.parse ?? false


export interface ITransaction {
    tid: string,
    id: string,
    operation: ('O' | 'P'),
    amount: number,
    itemName?: string,
    unitCost?: number
}
  
export interface ICustomer {
    id: string,
    name: string,
    balance: number
}

const isTransaction = (x: any): x is ITransaction => {
    const _x = x as ITransaction
        if (nulFalse(
            _x.tid,
            _x.id,
            _x.amount,
            _x.operation
        )) {
            if (_x.operation === 'O') {
                if (!nulFalse(_x.unitCost, _x.itemName)) return false
             }
             return true     
        } 
    return false
  }
const isCustomer = (x: any): x is ICustomer => {
    const _x = x as ICustomer
    if (nulFalse(
        _x.id,
        _x.name,
        _x.balance
    )) {
        return true
    } 
    return false
}
    

// Lazy Stream Parser
type Cache<T> = T | null

type CachedFragments = Cache<IFragment>
type Match = IParsable[]

interface parserState {
    fragment: CachedFragments,
    parse: Match 
}


type FuzyMatch = (IFragment | IParsable)[]
type StringMatcher = (s: string) => FuzyMatch
type StateFragReducer = (acc: parserState, cur: FuzyMatch) => parserState

class Parser extends Transform {
    private state: parserState = {
        fragment: null,
        parse: []
    }

    constructor(opts: TransformOptions, private mFn: StringMatcher, private rFn: StateFragReducer) {
        super(opts)
    }

    _transform(chunk: Buffer, encoding, done: Function) {
        const s: string = chunk.toString() ?? done() //?
        console.log("PASS", s, "\n")
        const fmatch: FuzyMatch = this.mFn(s) //?
        const { fragment, parse } = this.rFn(this.state, fmatch) //?
        console.log(fragment, parse)
        if (parse.length > 0) { 
            for (const p of parse) this.push(p.parse)
            this.state.parse = []
        }
        else this.state.fragment = fragment
        console.log(this.state)
        done()
    }

}

// Files, Paths, and Config
const MASTER_PATH = path.resolve(__dirname, `master.json`),
  TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`),
  OUTPUT_PATH = path.resolve(__dirname, `output3`)

const CUSTOMER_MAX: ICustomer = {
    id: "9999",
    name: "zzzzzzzzzzzzzzzzzzzz",
    balance: 9999.99
  },
        TRANSACTION_MAX: ITransaction = {
          tid: "9999",
          id: "9999",
          operation: 'O',
          itemName: "zzzzzzzzzzzzzzzzzzzz",
          amount: 9999,
          unitCost: 9999.99
        }
  //console.log(('[').length) //?
  const encoding = 'utf-8'
  
  
  const cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '')),
        tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, ''))
  //console.log(cMax, tMax)//?
  
  const c$Options = {
    encoding,
    highWaterMark: cMax * 2
  },
    t$Options = {
      encoding,
      highWaterMark: tMax * 2
    }

const c$ = fs.createReadStream(MASTER_PATH, c$Options),
      t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options),
      o$ = fs.createWriteStream(OUTPUT_PATH)

const OPEN = '{',
      CLOSED = '}'

export const JMatch = (cache: string): (IFragment | IParsable)[] => {
        //if (cache) cache = cache.concat(str)
        //else cache = str
        
        const fO = cache.indexOf(OPEN),
              lO = cache.lastIndexOf(OPEN),
              fC = cache.indexOf(CLOSED),
              lC = cache.lastIndexOf(CLOSED)
        console.log("split", cache) //?
        const midParse = cache.substring(fO, lC+1) //?
        const midCheck = Boolean(~midParse.indexOf(OPEN) && ~midParse.indexOf(CLOSED)) //?
      
      
        if (!~fO || !~fC) {
          return [ { fragment: cache } ]
        } else if (fC < fO) { 
          if (lO === fO) {
              console.log(
                  !midCheck ? `Return [${cache.substring(0, fC+1)}] Original ${cache} END` : cache
                ) //?
            return midCheck ? [
              {fragment: cache.substring(0, fC+1)},
              {parse: cache.substring(fO, lC+1)}
            ] : [
                {fragment: cache.substring(0, fC+1)},
                {fragment: cache.substring(fO)}
            ]
          } else if (lO > lC) {
            const res1 = [ 
              {fragment: cache.substring(0, fC+1)}, 
              {parse: cache.substring(fO, lC+1)}, 
              {fragment: cache.substring(lO)}
            ],
            res2 = [
              {fragment: cache.substring(0, fC+1)},  
              {fragment: cache.substring(lO)}
            ] 
            //console.log(cache)
      
          if (midCheck) { 
            console.log(res1, cache) //?
            return res1 
          } else { 
            console.log(res2, cache) //?
            return res2 
          }
        }
        } else if (fC > fO) {
          if (fO === lO && fC === lC) return [ 
            { parse: cache.substring(fO, fC+1) } 
          ]
          else if (fO === lO) return [ 
            { fragment: cache.substring(0, fO) }, 
            { parse: cache.substring(lO, lC+1) } 
          ] 
          else if (fC === lC) return [ 
            { parse: cache.substring(fO, lC+1) }, 
            { fragment: cache.substring(lO) } 
          ]
          else if (fO !== lO && fC !== lC) return [
            {parse: cache.substring(fO, fC+1)},
            {parse: cache.substring(lO, lC+1)}
          ]
          else return [ 
            {parse: cache.substring(fO, fC+1)}, 
            {fragment: cache.substring(fC+1)} 
          ] 
        }
        console.log("error")  
      }
 
const defragStream = (j: StringMatcher) => 
                     (acc: parserState, cur: FuzyMatch) => 
                     cur.reduce((state, FoP) => 
        {
        const newState = state
        if (isParsable(FoP)) {
            newState.parse.push(FoP)
            newState.fragment = null
        } else if (isFragment(FoP)) {
            const cacheIsWarm = isFragment(state.fragment)
            if (cacheIsWarm) {
                const res = j(state.fragment.fragment.concat(FoP.fragment))
                const pRes = res.filter(x => isParsable(x)) as Match
                if (pRes.length > 0) {
                    newState.parse.push(...pRes)
                    newState.fragment = null
                }
            } else {
                newState.fragment = FoP
            }
        }
        return newState
      }, acc)
  

  const p$ = new Parser({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true }, JMatch, defragStream(JMatch))
  const p1$ = new Parser({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true}, JMatch, defragStream(JMatch))
  const pass$ = new PassThrough({ readableObjectMode: false, writableObjectMode: false, allowHalfOpen: true})
  const toString = new Transform({
      readableObjectMode: false,
      writableObjectMode: true,
      transform: (c, e, d) => {
        console.log(`PASS ${JSON.stringify(c)} ${e} END`) //?
        try {
            if(nulFalse(c)) {
              d(null, JSON.stringify(c) + "\n")
            } else d()
        } catch(e) {
            console.log(`parse error ${e}`) //?
            d()
        }
      }
  }).on('error', e => {console.log('somethin wrong', e) }),
      toObject = new Transform({
        readableObjectMode: true,
        writableObjectMode: false,
        transform: (c, e, d) => {
          try {
            const obj = JSON.parse(c.toString()) //?
            d(null, obj)
          } catch(e) {
            d(e)
          }
        }

      }).on('error', e => {console.log(e)})

  const transaction$ = pipeline(
      t$,
      p$, 
      e => console.log(e ? e : "all good")
  )

  const customers$ = pipeline(
      c$,
      p1$,
      e => console.log(e ? e : "all good")
  )
    p$.on("end", () => {
      console.log("end")
    })
  customers$.pipe(pass$, {end: false}).on('error', e => {console.log(`c$->pass$ fail ${e}`)}) 
  transaction$.pipe(pass$, {end: false}).on('error', e => {console.log(`t$->pass$ fail ${e}`)})

    pipeline(
        pass$,
        toObject,
        toString,
        o$,
        e => console.log(e ? e : "all good")
    )