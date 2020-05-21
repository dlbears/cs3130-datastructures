import { createReadStream, ReadStream } from 'fs'
import { createInterface } from 'readline'
import { resolve } from 'path'
import { Lens, over } from './utilities-test'
import { Stream } from 'stream'
import { fail } from 'assert'



const compose = (...fs) => fs.reduceRight((g, f) => (...args) => { 
    console.log(f.name) 
    const full = f(g(...args))
    //console.log("Before", partial, "After", full) //?
    //console.log(...args)
    return full//f(g(...args)) 
})

const filter = predicate => combine =>
               (accumulation, current) => predicate(current) ? combine(accumulation, current) : accumulation

const map = transform => combine =>
            (accumulation, current) => combine(accumulation, transform(current))

const flatMap = transform => combine =>
                (accumulation, current) => {
                    const transformed = transform(current)
                    return transformed != null ? combine(accumulation, transformed) : accumulation  
                }

const ifElse = (predicate, pass, fail) => combine => 
                (accumulation, current) => combine(
                    accumulation, 
                    predicate(accumulation, current) ? pass(current) : fail(current)
                )

// match :: RegEx -> String -> [ String ] | [ Nothing ]
const match = reg => map(str => str.match(reg))

const transactionsPath = resolve(__dirname + '/transactions.json')

const file$ = createReadStream(transactionsPath)

const rl = createInterface(file$)

const toReadline = compose(
    createInterface,
    createReadStream,
    resolve
) 

const withArgs = (f, ...Yargs) => (...Xargs) => f(...Xargs, ...Yargs) 

const path = __dirname + '/transactions.json'

const toReadStream = path => config => createReadStream(path, config)

let first = true
let res = []
const reg = /([A-z]+\s?[A-z]*)|[0-9]+/g
/*rl.on('line', x => {
    const value = x.trim()
    if (first) {
        console.log(value.split(" ").filter(x => x !== "Price").map(x => x.split("=")))
        first = false
    } else if (x != null && x.length !== 0) {
        const val = x.match(reg) //?
        res.push(val)
    } else {
        console.log(x) //?
    }
})
*/
rl.on('close', () => {
    console.log(res)
})

const concatReducer = (acc, cur) => acc.concat(cur)

const dispatchReducer = dispatch => (acc, cur) => dispatch(acc, cur)

const dispatcher = (init, reducers) => (state, {type, ...rest}) => reducers[type](state, rest)
const scopedDispatcher = lens => reducers => (state, action) => reducers[action.type](lens.get(state), action.value)

const lineStream = toReadline(path)

const TakeFromStream = async function * ($, take) {
    if (take === 1) {
        yield (await $[Symbol.asyncIterator]().next()).value
    } else {
        let count = take
        for await (const value of $) {
            if (count === 0) break
            else yield value
            count--
        }
    }
}

const supported_cities = ["New York", "Los Angeles", "Miami", "Houston", "Chicago"]
const supported_items = 3

const genArray = size => new Array(size)
const initialState = supported_cities.reduce((acc, city) => ({...acc, [city]: genArray(supported_items).fill(0) }) , {}) //?

const TransduceStreamInto = async ($, transform, target, reducer=concatReducer) => {
    const transduce = transform(reducer)
    let accumulation = target
    for await (const current of $) {
        accumulation = transduce(accumulation, current)
    }
    return accumulation
}
 

const ducer = TransduceStreamInto(lineStream, compose(
    filter(line => line !== ''),
    map(x => {
        x == null //?
        return x
    })
), [])


const taker = TakeFromStream(lineStream, 1)

const run = async (iter) => {
    let vals = []
    for await (const value of iter) vals.push(value)
    return vals
}

const take1 = $ => TakeFromStream($, 1)

const terminalTrace = filter(val => {
    console.log(val) //?
    return false
})

const trace = map(val => {
    console.log(val) //?
    return val
})

const removeEmptyLines = filter(str => str !== "")

const toInt = x => parseInt(x)

const tryCatch = f => (...args) => {
    try {
        return f(...args)
    } catch (e) {
        console.error(e)
        return undefined
    }
}

const safe = f => compose(
    map(tryCatch(f)),
    filter(x => x ?? false)
)

const makeTransaction = compose(
    match(reg),
    map(([head, second, ...rest]) => ({
        type: head.trim(),
        city: second.trim(),
        amounts: rest
    })),
    safe(({ amounts, ...rest}) => ({ amounts: amounts.map(toInt), ...rest }))
)

const main = async () => {
    const firstLine = take1(lineStream)

    // lineParser :: line -> [ map | filter ] -> Tranasaction
    const lineParser = compose(
        removeEmptyLines,
        makeTransaction,
        trace
        //terminalTrace
    )

    const add = (x, y) => x + y
    const sub = (x, y) => x - y
    const zip = (xs, ys, combiner) => {
        console.log(xs) //?
        console.log(ys) //?
        return xs.map((x, i) => combiner(x, ys[i]))
    }
    
    const handleS = (acc, cur) => {
        console.log(cur)//?
        console.log(acc[cur.city])//?
        acc[cur.city] = zip(cur.amounts, acc[cur.city], add) //?
        return acc;
    }
    
    const descendSortCityByItem = (item, acc) => Object.entries(acc).sort(([ _c1, a1 ], [ _c2, a2 ]) => a2[item] - a1[item])

    const stateReducer = ({
        's': handleS,
        'o': (acc, cur) => {
            const attemptOrder = zip(acc[cur.city], cur.amounts, sub) //?
            const failedToFill = attemptOrder.flatMap((x, i) => x < 0 ? {x, i} : [])
            if (failedToFill.length > 0) {
                const attemptDeepOrder = failedToFill.reduce(compose(
                    map(({ x, i }) => {
                        let reciepts = []
                        let remaining = Math.abs(x)
                        const sorted = descendSortCityByItem(i, acc) //?
                        for (let j = 0; remaining > 0 && j < sorted.length; j++) {
                            const curr = sorted[j][1][i]
                            if(curr === undefined) continue //?
                            if (curr <= remaining) {
                                 remaining -= curr
                                 reciepts.push([sorted[j][0], (sorted[j][1] as Array<number>).map((y, k) => k === i ? 0 : y)])
                            } else {
                                reciepts.push([sorted[j][0], (sorted[j][1] as Array<number>).map((y, k) => k === i ? y - remaining : y )])
                            }
                        }
                        console.log(reciepts) //?
                        if (remaining > 0) return "Order Unfilled"
                        return { reciepts, i }
                    })
                )(concatReducer), [])

                for(const attempt of attemptDeepOrder) {
                    if (attempt?.reciepts ?? false) {
                        attempt.reciepts.map(([city, amts]) => acc[city] = amts)
                    }
                }

            } else {
                 acc[cur.city] = attemptOrder
            }

            //Object.entries(acc).sort((city1, city2) => - city1[1][0] + city2[1][0])//?
            console.log(cur)
            console.log(acc) //?
            return acc
        }
    });

    const restLines = TransduceStreamInto(lineStream, lineParser, initialState, dispatcher(initialState, stateReducer))

    console.log(await restLines) //? 
}

main().then(x => x)

/*
run(taker).then(x => {
    console.log(x) //?
})
*/
/*
run(ducer).then(x => {
    console.log(x)
})

const runner = async (...iters) => {
    for (const iter of iters)
        for await (const value of iter)
}

// async iterator -> async transduce [newState, transaction] -> Invoice

*/