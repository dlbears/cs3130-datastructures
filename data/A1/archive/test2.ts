import * as fs from "fs";
import { Transform, Readable, DuplexOptions, TransformOptions, pipeline, PassThrough } from "stream";
import * as path from "path";

const MASTER_PATH = path.resolve(__dirname, `master.json`),
  TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`),
  OUTPUT_PATH = path.resolve(__dirname, `output3`);

const testObject = `{
  "id": "1111",
  "name": "12345678901234567890",
  "balance": 234.5
}`

const fragmentedObjs = [
  `{ "id": "1234", "name": "11111111112222222222", "balance": 111.4`,
  `}, { "id": "1235", "name": "12121212123232323232", "balance": 123.4 }, {`,
  `"id": "1236", "name": "22222222222222222222", "balance": 222.5 },`,
  `{ "id": "1237", "name": "33333333333333333333", "balance": 333.6 },`,
  
]

const OPEN = '{',
      CLOSED = '}'

const JMatch = (cache: string): (IFragment | IParsable)[] => {
  //if (cache) cache = cache.concat(str)
  //else cache = str
  
  const fO = cache.indexOf(OPEN),
        lO = cache.lastIndexOf(OPEN),
        fC = cache.indexOf(CLOSED),
        lC = cache.lastIndexOf(CLOSED)
  
  if (!~fO || !~fC) {
    return [ { fragment: cache } ]
  } else if (fC < fO) { 
    if (lO > lC) {
      
    return (~cache.substring(fO, lC+1).indexOf(OPEN) && ~cache.substring(fO, lC+1).indexOf(CLOSED)) ? [
      {fragment: cache.substring(0, fC+1)}, 
      {parse: cache.substring(fO, lC+1)}, 
      {fragment: cache.substring(lO)}
    ] : [
      {fragment: cache.substring(0, fC+1)},  
      {fragment: cache.substring(lO)}
    ]
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
    else return [ 
      {parse: cache.substring(fO, fC+1)}, 
      {fragment: cache.substring(fC+1)} 
    ] 
  }  
}

const testData = [
  testObject,
  ...fragmentedObjs
]

const res: (IFragment | IParsable)[] = testData.map(value => JMatch(value)).flat()
//console.log(res.flat())


const nulFalse = (...args) => {
  let result = true 
  for (const i in args) {
      const arg = args[i]
      const _arg = Boolean(arg ?? false)
      result = result && _arg
  }
  return result
}

interface IFragment {
  fragment: string
}

interface IParsable {
  parse: string
}

interface ITransaction {
  id: string,
  operation: ('O' | 'P'),
  amount: number,
  unitCost?: number
}

interface ICustomer {
  id: string,
  name: string,
  balance: number
}

const isFragment = (x: any): x is IFragment => x?.fragment ?? false
const isParsable = (x: any): x is IParsable => x?.parse ?? false

const isTransaction = (x: any): x is ITransaction => {
  const _x = x as ITransaction
      if (nulFalse(
          _x.id,
          _x.amount,
          _x.operation
      )) {
          if (_x.operation === 'O') {
              if (!nulFalse(_x.unitCost)) return false
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

type Cache<T> = T | undefined

interface defragState {
  cache: Cache<(IParsable | IFragment)>,
  parse: IParsable[]
}

const initState: defragState = {
  cache: undefined,
  parse: []
}

  
const defragStream = (acc: defragState, cur: IParsable | IFragment) => {
  console.log(`
  { 
    Value: ${isParsable(cur) ? cur.parse : cur.fragment}, 
    Parsable: ${Boolean(isParsable(cur))}
    Fragment: ${Boolean(isFragment(cur))} 
  }`)
  if (isParsable(cur)) {
    return { cache: undefined, parse: [cur] }//Boolean(acc.parse ?? false) ? [...acc.parse, cur] : [cur] } 
  }
  //if (isFragment(acc?.cache) && isFragment(cur)) {
  if (isFragment(cur)) {  
    if (isFragment(acc.cache)) {
      const _res = JMatch(acc.cache.fragment.concat(cur.fragment)) //?
      const parse: IParsable[] | undefined = _res?.filter(isParsable) //?
      return parse?.every(isParsable) ? { cache: undefined, parse: [...acc.parse, ...parse]} : acc
    } 
  } 
  if (isFragment(cur)) {
      return { cache: cur, parse: acc.parse }
  } else {
    return acc
  }
}

const defraggedRes = res.reduce(defragStream, initState) 
//JSON.parse(testObject)
console.log(defraggedRes.parse.map(x => JSON.parse(x.parse)))


const CUSTOMER_MAX = {
  id: "9999",
  name: "zzzzzzzzzzzzzzzzzzzz",
  balance: 9999.99
},
      TRANSACTION_MAX = {
        id: "9999",
        operation: 'O',
        amount: 9999,
        unitCost: 9999.99
      }
//console.log(('[').length) //?
const encoding = 'utf-8'


const cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '\t\t')),
      tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, '\t\t'))
//console.log(cMax, tMax)

const c$Options = {
  encoding,
  highWaterMark: cMax
},
  t$Options = {
    encoding,
    highWaterMark: tMax
  }

const c$ = fs.createReadStream(MASTER_PATH, c$Options),
      t$ = fs.createReadStream(TRANSACTIONS_PATH, t$Options)

/*c$.on('data', val => {
  JMatch(val)?.flat().reduce(defragStream, initState) //?
})*/
const passThrough$ = new PassThrough({ readableObjectMode: true, allowHalfOpen: true })
const passThrough$2 = new PassThrough({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true})
//const stateLogger = fs.createWriteStream(OUTPUT_PATH)

class toJSON extends Transform {
  accState: defragState
  stateLogger: fs.WriteStream
  constructor(opt: TransformOptions) {
    super(opt)
    this.accState = { ...initState } as defragState //?
  }

  setAccState(x: defragState) {
    //stateLogger.write(JSON.stringify(x), e => console.log(`toJSON setState Error`))
    console.log(x) //?
    this.accState = x
  }

  _transform(chunk: { toString: () => string }, encoding: any, callback) {
    console.log(`pass ${chunk}`)
    try {
      const str: string = chunk.toString() //?
      const match: ((IParsable | IFragment)[] | false) = (JMatch(str) ?? false)//?
      const res: (defragState | false) = (match ? match.reduce(defragStream, this.accState) : false) //?
      //console.log(res) //?
      //console.log(res ?? `broke, res is undefined, endBroke`)
      //console.log(res ?? true)
      //this.accState = JMatch(str)?.reduce(defragStream, this.accState) ?? this.accState//?
      if (res) this.setAccState(res)
      if (this.accState.parse.length > 0) {
        const parseMe =[...this.accState.parse] //?
        for (const p of parseMe) {
          let success = false
          //isParsable(p) //?
          if (isParsable(p) && (p.parse ?? false)) {
            success = this.push(p.parse)
          }
          console.log(success, p) //?
        }
        this.setAccState({ cache: this.accState.cache, parse: [] })
      } else {
        console.log(this.accState)
      }
      callback()
    } catch(e) {
      console.log(`JSON broke ${e}`)
      callback(e)
    }
  } 
}

const defaultOpts: TransformOptions = {
  writableObjectMode: true,
  readableObjectMode: true
}

const mapTransform = f => (chk, enc, cb) => {
  const res = f(chk) ?? false
  //console.log(res) //?
  if (res) {
    cb(null, res)
  } else {
    cb()
  }
}

const map = (opts=defaultOpts, f: Function) => (new Transform({
  ...opts,
  transform: mapTransform(f)
}))

const outout = fs.createWriteStream(OUTPUT_PATH)
//console.log({ ...({id: 1, name: "der" }) })
const jTx = new toJSON({ writableObjectMode: false, readableObjectMode: true, allowHalfOpen: true })
const jTx2 = new toJSON({ writableObjectMode: false, readableObjectMode: true, allowHalfOpen: true })
const objMap = map({writableObjectMode: true, readableObjectMode: true, allowHalfOpen: true}, (str: string) => {
  console.log(`parse step ${str}`) //?
  try {
    return JSON.parse(str) 
  } catch(e) {
    console.error(e)
    return e
  }
})
const idMap = map({highWaterMark: 100, writableObjectMode: true, readableObjectMode: true, allowHalfOpen: true}, x => x)
const toString = map({writableObjectMode: true, readableObjectMode: false}, x => {
  //console.log(`val ${x}`) //?
  try {
    return "\n" + JSON.stringify(x)
  } catch (e) {
    console.error(`At toString() ${e}`)
    return e
  }
})
//c$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//t$.pipe(jTx).pipe(objMap).pipe(toString).pipe(outout)
//const stdOut$ = new WriteStream(process.stdout)
class Reducer extends Transform {
  rFunc: Function
  fFunc: Function
  acc: any
  constructor(opts, rf, ff, init) {
    super(opts)
    this.acc = init
    this.rFunc = rf
    this.fFunc = ff
  }

  reduce(cur) {
    return this.rFunc(this.acc, cur)
  }

  filter(v): any[] {
    return this.fFunc(v)
  }

  _transform(chunk, encoding, done) {
    this.acc = this.reduce(chunk)
    /*
    let valid = this.filter(this.acc)
    if (valid.length > 0) {
      for (const value of valid) this.push(value)
    }
    */
    done(null, this.acc)
  }

}


c$.on('unpipe', function handleUnpipe(x) {
  console.log(x)
  this.destroy()
})

c$.on('error', function handleError(e) {
  console.log(e)
})

jTx.on('unpipe', function handleUnpipe(x) {
  console.log(`JSON transform unpipe`)
  //this.destroy()
})

jTx.on('error', function handlerError(e) {
  console.log(`JSON transform error: ${e}`)
})

toString.on('unpipe', function handleUnpipe(e) {
  console.log(`toString unpipe`)
  //this.destroy()
})

toString.on('error', function handleError(e) {
  console.log(`toString error: ${e}`)
})

const log$$ = ($arr: any[], f) => $arr.map($ => {
  $.on('unpipe', f(null, $.name))  
  $.on('error', f($.name))
})

const arr$ = [
  c$,
  t$,
  jTx,
  jTx2,
  toString,
  outout
]

log$$(arr$, (e, d) => e ? (err) => console.error(`@${e} error ${err}`) : (data) => console.log(`@${d} complete ${data}`)) //?

const customer$ = pipeline(
  c$,
  jTx,
  //idMap,
  //toString,
  //outout,
  (e) => {
    if (e) console.log(e)
    else console.log("success")
    //c$.destroy()
    //jTx.destroy()
  }
)

const transaction$ = pipeline(
  t$,
  jTx2,
  //idMap,
  
  (e) => {
    if (e) console.log(e)
    else console.log("$2 success")
    //t$.destroy()
    //jTx2.destroy()
  }
)

transaction$.pipe(passThrough$, {end: false})//.on("data", x => console.log(x)) //?
customer$.pipe(passThrough$, {end: false})

const validInvoice = (acc) => { return [] }

class Customer implements ICustomer {
  id: string
  name: string
  balance: number

  previousBalance: number
  transactions: Transaction[]

  constructor(c: ICustomer) {
    this.id = c.id
    this.name = c.name
    this.balance = this.previousBalance = c.balance
  }

  applyTransaction(t: Transaction) {}

  generateInvoice(): string {
    return `
      ${this.name}\t${this.id}\n
      \t\tPREVIOUS BALANCE\t$${this.previousBalance}\n
      ${this.transactions.map(t => t.toString())}\n
      \t\tBALANCE DUE\t$${this.balance}\n
    `
  }

}

class Transaction implements ITransaction {
  t_id?: string
  item_name?: string
  id: string
  operation: ('O' | 'P')
  amount: number
  unitCost?: number
  totalAdj: number

  constructor(t: ITransaction) {
    this.id = t.id
    this.operation = t.operation
    this.amount = t.amount
    if (t?.unitCost) {
      this.unitCost = t.unitCost
      this.totalAdj = t.unitCost * t.amount 
    } else {
      this.totalAdj = -t.amount 
    }
  }

  toString() {
    return ``
  }

}


const makeInvoice = ({ customers, transactions, invoices }, cur) => {
  if (isCustomer(cur)) {
    const tHit = transactions.filter(({ id }) => id === cur.id)
                             .map()
    
    return  { customers: [...customers, cur], transactions }
  } else if (isTransaction(cur)) { 
    return { customers, transactions: [...transactions, cur ]}
  }
  return { customers, transactions }
}

const newState = { customers: [], transactions: [], invoices: [] }

const ctReduce$ = new Reducer({readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true}, makeInvoice, validInvoice, newState)

const invoice$ = pipeline(
  //idMap,
  passThrough$,
  objMap,
  ctReduce$,
  toString,
  outout,
  (e) => {
    if (e) console.log(e)
    else {
      idMap.destroy()
      customer$.destroy()
      passThrough$.destroy()
      objMap.destroy()
      ctReduce$.destroy()
      invoice$.destroy()
      console.log("$$ success")
    } 
  }
)