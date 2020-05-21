import { Transducers, Reducers, TransduceStreamInto, TransduceIterableInto, compose, makeDispatcher, pipe } from "./utilities"
import { StaticDCList, Queue } from "./LinkedList"
import { createReadStream, createWriteStream } from 'fs'
import { createInterface } from 'readline'
import { resolve } from 'path'

// IO (readline) interface
const I = pipe(
    resolve,
    createReadStream
)

const O = pipe(
    resolve,
    createWriteStream
)

const writeIO = IO => v => {
    IO.setPrompt(v)
    IO.prompt()
}

const IO = createInterface(
        I(__dirname + "/input"),
        O(__dirname + "/output") 
    )

const write = writeIO(IO)

//Runtime Constants 
const MARKUP = 1.3
const PROMO_USES = 2
const match = /(\w+[\.]?\w*)/g
const initialState = {
    reciepts: Queue.of(),
    promotions: StaticDCList.empty()
}


//Output String Template Functions
const finalInventory = (amt, cost) => `${amt} at $${cost} each left\n`
const header = (size: number) => new Array(size).fill('-').join("").concat('\n\nRemaining Widget Inventory:\n')
const saleAmount = (amount: number) => `${amount} Widgets sold\n`
const itemSaleTemp = (amount: number, unitCost: number, total: number) => `${amount.toFixed(2)}\tat\t$${unitCost.toFixed(2)} each\tSales: $${total.toFixed(2)}\n`
const itemNoStockTemp = (remainder: number) => `remainder of ${remainder} Widgets not available\n`
const saleTotalTemp = (total: number) => `\t\t\t\t  Total Sales: $${total.toFixed(2)}\n`

const listSales = <K extends StaticDCList<K>>(l: K, discount=0) => {
    let res = ""
    let total = 0
    for(const node of l.iterate()) {
        const amt = Number(StaticDCList.head(node.data)) 
        const unit = Number(StaticDCList.tail(node.data) * (MARKUP - discount))
        const iTotal = Number(amt * unit)
        total += iTotal
        res += itemSaleTemp(
            amt,
            unit,
            iTotal
        )
    }
    res += saleTotalTemp(total)
    return res
}

// Impure IO Functions
const registerSale = <K extends StaticDCList<K>>(l: K, amount, missing, discount): void => {
    let res = "\n"
    res += saleAmount(amount - missing)
    res += listSales(l, discount)
    if (missing > 0) res += itemNoStockTemp(missing)
    write(res + '\n')
}

const registerReciept = (amount: number, unitCost: number): void => write(`${amount} Widgets recieved at $${unitCost} each\n`)
const registerPromotion = (discount: number): void => write(`\nPromotion of ${discount}% off applied for next 2 sales\n`)

// State Helpers
const mergeProp = (p: string) => (o: object, v: any) => ({ ...o, [p]:v })
const mergeObj = (o: object, n: object) => ({ ...o, ...n })
const mergeReciepts = mergeProp("reciepts")
const mergePromotions = mergeProp("promotions")

//StateReducers:: State -> Event -> State
const handleSale = (acc, { data: list }) => {
    const sAmt = StaticDCList.head(list) //?
    let rQ = acc.reciepts //?
    let pS = acc.promotions //?
    let discount = 0
    if (!rQ.isEmpty() && !pS.isEmpty()) {
        const [ dis, usesLeft ] = [
            StaticDCList.head(pS),
            StaticDCList.tail(pS)
        ] 
        if (usesLeft > 0) {
            discount = dis / 100
            pS = StaticDCList.of([
                dis,
                usesLeft - 1
            ])
        } else {
            pS = StaticDCList.empty()
        }
         //?
    }
    if (!rQ.isEmpty()) {
        let rDQ = Queue.of()
        let missing = sAmt
        while(!rQ.isEmpty() && StaticDCList.head(rQ.peek()) - missing < 0) { 
            rDQ = rDQ.enqueue(rQ.dequeue())
            missing -= StaticDCList.head(rDQ.peek()) //?
        }
        if (missing > 0 && !rQ.isEmpty()) {
            const reciept = rQ.dequeue() //?
            rQ = StaticDCList.head(reciept) - missing === 0 ? rQ : rQ.enqueueFirst(StaticDCList.of([
                StaticDCList.head(reciept) - missing,
                StaticDCList.tail(reciept)
            ])) //?
            rDQ = rDQ.enqueue(StaticDCList.of([
                missing,
                StaticDCList.tail(rQ.peek())
            ])) //?
            missing = 0
        }
        registerSale(rDQ, sAmt, missing, discount)
    const reciepts = rQ
    const promotions = pS
    return mergeObj(acc, ({
        reciepts,
        promotions
    }))
}
}

const handleReciept = (acc, cur) => {
    const rQ = acc?.reciepts //?
    registerReciept(StaticDCList.head(cur.data), StaticDCList.tail(cur.data))
    const reciepts = rQ.enqueue(cur.data) //?
    return mergeReciepts(acc, reciepts)
}

const handlePromotion = (acc, cur) => {
    const discount = StaticDCList.head(cur.data) 
    registerPromotion(discount)
    return mergePromotions(acc, StaticDCList.of([ discount, PROMO_USES ]))
}

// Map<EventType, StateReducers>
const customReducers = {
    'S': handleSale,
    'R': handleReciept,
    'P': handlePromotion
}

const encodeTransaction = compose(
    Transducers.map(s => s.match(match)),
    Transducers.map(([type, ...rest]) => ({ type, data: StaticDCList.of(rest) }))
)

const toState = makeDispatcher(customReducers)

const registerFinalInventory = compose(
    Transducers.map(StaticDCList.extract),
    Transducers.map(n => finalInventory(
        StaticDCList.head(n),
        StaticDCList.tail(n)
    ))
)

const handleFinal = ({ reciepts }) => pipe(
    TransduceIterableInto,
    write
)(
    reciepts, 
    registerFinalInventory, 
    header(50), 
    Reducers.concat
)

TransduceStreamInto(IO, compose(
    encodeTransaction,
    toState
), initialState, Reducers.swap).then(handleFinal)






