import * as fs from "fs";
import { Transform, Readable, DuplexOptions, TransformOptions, pipeline, PassThrough, Stream } from "stream";
import * as path from "path";
import { ReadStream, WriteStream } from "tty";
import { createBrotliCompress } from "zlib";

const MASTER_PATH = path.resolve(__dirname, `master.json`),
  TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`),
  OUTPUT_PATH = path.resolve(__dirname, `output3`)

  interface CustomersAndTransactions {
    customers: Customer[],
    transactions: Transaction[]
  }
  
  const newState: CustomersAndTransactions = { customers: [], transactions: [] }


  class Customer implements ICustomer {
    id: string
    name: string
    balance: number
  
    previousBalance: number
    transactions: Transaction[]
    private _modified: boolean
    private static _any: boolean = false

    constructor(c: ICustomer) {
      this.id = c.id
      this.name = c.name
      this.balance = this.previousBalance = c.balance
      this.transactions = []
      Customer.present()
    }
  
    applyTransaction(t: Transaction) {
      this._modified = true
      this.transactions = this.transactions.concat(t)
      this.balance += t._getTotalAdj()
      return this
    }
  
    isModified() {
      return this._modified
    }

    static checkModified(c: Customer) {
      return c?._modified ?? false
    }

    static present() {
      this._any = true
    }
  
    static any(): boolean {
      return this._any
    }

    static isInstance(c: ICustomer | Customer): c is Customer {
      //console.log(c instanceof Customer) //?
      return (c instanceof Customer) ?? false
    }
  
    generateInvoice(): string {
      return (`${this.name}\t${this.id}
      PREVIOUS BALANCE\t$${this.previousBalance}\n
      ${this.transactions.map(t => t.invoice()).reduce((s, cs) => s.concat(cs), "")}
      BALANCE DUE\t\t$${this.balance}
      `)
    }
  
  }
  
  class Transaction implements ITransaction {
    tid: string
    itemName?: string
    id: string
    operation: ('O' | 'P')
    amount: number
    unitCost?: number
    totalAdj: number
    private static _any: boolean = false
    private static _latest: number = 0
    private static _reading: boolean = true
    constructor(t: ITransaction) {
      this.tid = t.tid
      this.id = t.id
      this.operation = t.operation
      this.amount = t.amount
      if (t.operation === "O" && t?.unitCost) {
        this.itemName = t.itemName
        this.unitCost = t.unitCost
        this.totalAdj = t.unitCost * t.amount 
      } else if (t.operation === "P") {
        this.totalAdj = -t.amount 
      }
      Transaction.present(t)
    }
    
    private static present(t: ITransaction) {
      this._any = true
      const newId = parseInt(t.id)
      if (this._latest <= newId) {
        this._latest = newId  
      } else {
        console.error("Data not in ascending order: undetermined behavior")
      }
    }

    static latestProcessedID(): number {
      return this._latest
    }

    static any() {
      return this._any
    }

    private static _handleStreamEnd() {
      this._reading = false
      //this.end$.destroy("done")
      //this.end$.destroy()
    }
  
    static isDone(): boolean {
      return this._reading
    }
    
    private static end$: Transform 

    static bindStream<K extends Stream>(r$: K) {
      r$.on('end', this._handleStreamEnd)
    }

    static toEndStream<K extends Transform>(r$: K) {
      this.end$ = r$
    }
  
    _getTotalAdj() {
      return this.totalAdj
    }
  
    belongsTo(c: ICustomer | Customer) {
      return this.id === c.id
    }
  
    invoice() {
      const type = this.itemName ?? "Payment"
      const op = this.operation === 'O' ? '+' : '-'
      const res = `\t${this.tid}#\t${type}\t\t${op}$${this.amount}\n`
      return res
    }
  
  }


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
      return [
        {fragment: cache.substring(0, fC+1)},
        {parse: cache.substring(fO, lC+1)}
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
    else return [ 
      {parse: cache.substring(fO, fC+1)}, 
      {fragment: cache.substring(fC+1)} 
    ] 
  }
  console.log("error")  
}




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

export interface IFragment {
  fragment: string
}

export interface IParsable {
  parse: string
}

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

const isFragment = (x: any): x is IFragment => x?.fragment ?? false
const isParsable = (x: any): x is IParsable => x?.parse ?? false

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
    Raw: ${JSON.stringify(cur)}
    Value: ${isParsable(cur) ? cur.parse : cur.fragment}, 
    Parsable: ${Boolean(isParsable(cur))}
    Fragment: ${Boolean(isFragment(cur))} 
  }`) //?

  if (isParsable(cur)) {
    console.log(cur) //?
    if(~cur.parse.indexOf('{') && ~cur.parse.indexOf('}')) return { cache: undefined, parse: [cur] }//Boolean(acc.parse ?? false) ? [...acc.parse, cur] : [cur] } 
    return acc
  }
  //if (isFragment(acc?.cache) && isFragment(cur)) {
  if (isFragment(cur)) {  
    console.log(cur)
    if (isFragment(acc.cache)) {
      const _res = JMatch(acc.cache.fragment.concat(cur.fragment)) //?
      const parse: IParsable[] | undefined = _res?.filter(isParsable) //?
      return parse?.every(isParsable) ? { cache: undefined, parse: [...acc.parse, ...parse]} : acc //?
    } 
  } 
  if (isFragment(cur)) {
      console.log(cur) //?
      return { cache: cur, parse: acc.parse }
  } else {
    return acc
  }
}


const tttest = '[\r\n  {\r\n    "tid": "0001",\r\n    "id": "1000", \r\n    "operation": "O",\r\n    "amount": 436,\r\n    "itemName": "Weatherproof Nails",\r\n    '
console.log(JMatch(tttest)) //?

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


const cMax = Buffer.byteLength(JSON.stringify(CUSTOMER_MAX, null, '\t\t')),
      tMax = Buffer.byteLength(JSON.stringify(TRANSACTION_MAX, null, '\t\t'))
console.log(cMax, tMax)//?

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
  id: number
  private static uuid: number = 1
  constructor(opt: TransformOptions) {
    super(opt)
    this.accState = { ...initState } as defragState//?
    this.id = toJSON.generateID()
  }

  private static generateID() {
    return ++this.uuid
  }

  setAccState(x: defragState) {
    //stateLogger.write(JSON.stringify(x), e => console.log(`toJSON setState Error`))
    //console.log(x) //?
    this.accState = x
  }

  _transform(chunk: { toString: () => string }, encoding: any, callback) {
    //console.log(`pass ${chunk}`)
    try {
      const str: string = chunk.toString() 
      console.log(`Instance(${this.id}) Current: ${chunk.toString()}`)
      const match: ((IParsable | IFragment)[] | false) = (JMatch(str) ?? false)//?
      const res: (defragState | false) = (match ? match.reduce(defragStream, this.accState) : false) //?
      console.log(`Instance${this.id} match ${JSON.stringify(match)}`)
      console.log(`Instance(${this.id}) NewState ${JSON.stringify(res)}`) //?
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
  //console.log(`parse step ${str}`) //?
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
    return "\n" + JSON.stringify(x) //?
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
  acc: CustomersAndTransactions
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
    console.log("space", chunk)
    //?
    if (chunk) {
      this.acc = this.reduce(chunk)
      //this.push(this.acc)
    }
      /*
    let valid = this.filter(this.acc)
    if (valid.length > 0) {
      for (const value of valid) this.push(value)
    }
    */
    done()
  }

  _flush(done) {
    const res = this.acc.customers.filter(c => { //?
      console.log(c) //?
      return Customer.checkModified(c) //?
    }) 
    res.length //?
    if (res.length > 0) done(null, res)
    else done(`somethin wrong ${JSON.stringify(this.acc)}`)
    
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

Transaction.bindStream(jTx2)


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

const map$ = (opts, f) => new Transform({
  ...opts,
  transform(chunk, e, done) {
    done(null, f(chunk))
  }
})

//log$$(arr$, (e, d) => e ? (err) => console.error(`@${e} error ${err}`) : (data) => console.log(`@${d} complete ${data}`)) //?

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

const t$pass = transaction$.pipe(passThrough$, {end: false})//.on("data", x => console.log(x)) //?
customer$.pipe(passThrough$, {end: true})

t$pass.on('unpipe', () => { 
  console.log("!!!!!!!!!!!!transactions unpiped!!!!!!!!!!!!!!!!!!!!!!!!")
  // run cid , tid check
  //customer$.end()
  //passThrough$.end()
})

const validInvoice = (acc) => { return [] }


//.once('close', () => GLOBAL_T$_FLOW = false)

const makeInvoice = ({ customers, transactions }, cur): CustomersAndTransactions => {
  //console.log(cur, ({ customers, transactions, invoices }))
  console.log(cur, ({ customers, transactions })) //?
  let newState = { customers, transactions }
  if (isCustomer(cur)) {
    const cust = new Customer(cur)
    if(!Transaction.any()) newState.customers = customers.concat(cust)
    else if (parseInt(cust.id) >= Transaction.latestProcessedID()) { 
    const tHit = transactions.filter(t => t?.belongsTo(cur))
    if (tHit && tHit.length > 0) {
      const newTransactions = transactions.filter(t => !t.belongsTo(cur))
      const cust: Customer = tHit.reduce((c, t) => {
                          c.applyTransaction(t)
                        }, new Customer(cur))
      newState.customers = customers.concat(cust) 
      newState.transactions = newTransactions 
    }
  } 
  } else if (isTransaction(cur)) {
    const tx = new Transaction(cur)
    const cHit = customers.filter(c => tx.belongsTo(c))
    if (!Customer.any()) newState.transactions = transactions.concat(tx)
    else if (cHit && cHit.length > 0) {
      const newC = cHit.map(c => {
          c.applyTransaction(tx)
          c.isModified() //?
          const resInvoice: string = c.generateInvoice()//?
          //console.log(resInvoice) 
          return c
          }) //?
        newState.customers = customers
        newState.transactions = transactions.filter(t => t.tid !== tx.tid)
      //return { customers, transactions: transactions.filter(({ id }) => id !== tx.id), invoices: invoices.concat(newInvoices)}
  } else {
    newState.transactions = transactions.concat(tx)
  }
}
//console.log(newState)//?

  return newState
}



const ctReduce$ = new Reducer({readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true}, makeInvoice, validInvoice, newState)

const mapToInvoice = map$({
  readableObjectMode: false,
  writableObjectMode: true
}, (c: Customer[]) => c.reduce((i, cus) => i += cus.generateInvoice(), ""))

Transaction.toEndStream(passThrough$)

const invoice$ = pipeline(
  //idMap,
  passThrough$,
  objMap,
  ctReduce$,
  mapToInvoice,
  //toString,
  outout,
  (e) => {
    if (e) console.log(e)
    else {
      idMap.destroy()
      //customer$.destroy()
      passThrough$.destroy()
      objMap.destroy()
      ctReduce$.destroy()
      //invoice$.destroy()
      console.log("$$ success")
    } 
  }
)