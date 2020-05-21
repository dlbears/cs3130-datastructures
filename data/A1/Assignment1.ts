import { J$ONParser } from './J$ONParser'
import { ICustomer, Customer } from './Customer'
import { ITransaction, Transaction } from './Transaction'
import { pipeline, PassThrough } from 'stream'
import { terminator, map$, objSizeOf, reduce$ } from './utility'
import { resolve } from 'path'
import { createReadStream, createWriteStream, statSync } from 'fs'

const encoding = 'utf-8',
      buffer_multiple = 1.5

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

Transaction.setMAX(TRANSACTION_MAX)

const MASTER_PATH = resolve(__dirname, `master.json`),
      TRANSACTIONS_PATH = resolve(__dirname, `transactions.json`),
      OUTPUT_PATH = resolve(__dirname, `output`)

const transaction_max_bytes = Math.round(objSizeOf(TRANSACTION_MAX) * buffer_multiple),
      customer_max_bytes = Math.round(objSizeOf(CUSTOMER_MAX) * buffer_multiple)

const c$ = createReadStream(MASTER_PATH, { encoding, highWaterMark: customer_max_bytes  }),
      t$ = createReadStream(TRANSACTIONS_PATH, { encoding, highWaterMark: transaction_max_bytes }),
      o$ = createWriteStream(OUTPUT_PATH, { encoding })

t$.on('end', () => Transaction.done())
c$.on('end', () => Customer.done())

const customer_file_size = statSync(MASTER_PATH).size,
      transaction_file_size = statSync(TRANSACTIONS_PATH).size
      
const customerIsLarger = (customer_file_size / customer_max_bytes) > (transaction_file_size / transaction_max_bytes)


export class Assignment1 {

    handleError = (pre, post="END") => e => {
        if (e) console.error(`${pre} ${e} `)
        else console.log(" Success ")
    }

    makeCompleteHandler = (done, err) => (e=false) => e ? err(e) : done()  

    makeEndHandler = (...$arr) => () => {
        $arr.forEach($ => $.destroy()) 
        return $arr
    }

    cunstructor() {}
    run() {
        const pass$ = new PassThrough({ readableObjectMode: true, writableObjectMode: true, allowHalfOpen: true}),
              objMap = map$({ readableObjectMode: true, writableObjectMode: true }),
              reduceObjs2Str = reduce$({ readableObjectMode: false, writableObjectMode: true })
        const tParser$ = J$ONParser(),
              tRegister$ = objMap(t => new Transaction(t)),
              cParser$ = J$ONParser(),
              cRegister$ = objMap(c => new Customer(c))

        
        const transaction$ = pipeline(
            t$,
            tParser$,
            tRegister$,
            this.handleError("atTransaction$")
        ),
             customer$ = pipeline(
             c$,
             cParser$,
             cRegister$,
             this.handleError("atCustomer$")
        )
        
        let neverEnding$ = customerIsLarger ? 
                               transaction$.pipe(pass$, { end: false }) : customer$.pipe(pass$, { end: false })

        customerIsLarger ? 
            customer$.pipe(pass$) : transaction$.pipe(pass$)

        const doneEarly = () => (customerIsLarger ? Transaction.isDone() : Customer.isDone()) && 
                                ((Transaction.latestProcessed().tid ?? -1) === (Customer.getLatestModified().tid ?? -2))

        const terminateEarly = () => {
            t$.close()
            c$.close()
            neverEnding$.end()
            transaction$.end()
            customer$.end()
            pass$.end()
            getInvoices$.end()
        }

        const terminatorBinding = terminator(doneEarly, terminateEarly)

        const stateReducer = (acc, cur) => {
                if (cur instanceof Customer) {
                    const appliedTransactions: number = acc.transactions.filter(t => t.belongsTo(cur)).
                                                                         map(t => cur.applyTransaction(t)).
                                                                         length ?? 0
                    acc.customers.push(cur)
                    if (appliedTransactions > 0) acc.transactions = acc.transactions.filter(t => !t.belongsTo(cur)) 
                } else if (cur instanceof Transaction) {
                    const customerMatches: number = acc.customers.filter(c => cur.belongsTo(c)).
                                                                  map(c => c.applyTransaction(cur)).
                                                                  length ?? 0
                    if (customerMatches > 1) console.error("Duplicate Customer Records")
                    if (customerMatches === 0) acc.transactions.push(cur)
                }
                return acc
        }
        const pushNewInvoices = acc => acc.customers.
                                 filter(c => c.isModified()).
                                 map(c => c.generateInvoice()).join("")
        const initialState = {
                customers: [],
                transactions: []
        }
    
        const getInvoices$ = reduceObjs2Str(
            terminatorBinding(stateReducer), 
            pushNewInvoices, 
            initialState
        )        

        const Invoice$ = pipeline(
            pass$,
            getInvoices$,
            this.handleError("onInvoice$")
        )

        
        const cleanup = this.makeEndHandler(
            c$,
            t$,
            customer$,
            transaction$,
            pass$,
            neverEnding$,
            Invoice$
        )

        const onComplete = this.makeCompleteHandler(cleanup, this.handleError("onComplete"))

        Invoice$.pipe(o$).on("close", onComplete).
                          on("error", onComplete)

    }
}

//const a1 = new Assignment1()
//a1.run()