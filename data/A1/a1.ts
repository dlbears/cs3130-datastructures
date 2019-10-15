import * as fs from 'fs'
import { Transform } from 'stream'
import * as readline from 'readline'
import * as path from 'path'

const MASTER_PATH = path.resolve(__dirname, `master.json`)
const TRANSACTIONS_PATH = path.resolve(__dirname, `transactions.json`)

const tryCatch = (f, g) => (val=null) => {
    try {
        return f(val) ?? true
    } catch(e) {
        return g(e) ?? false
    }
}

const safeJSONParse = g => tryCatch(JSON.parse, g)

interface JFragment {
    fragment: string
}

interface JParsible {
    parse: string
}

interface Transaction {
    id: string,
    operation: ('O' | 'P'),
    amount: number,
    unitCost?: number
}

interface Customer {
    id: string,
    name: string,
    balance: number
}

const nulFalse = (...args) => {
    let result = true 
    for (const i in args) {
        const arg = args[i]
        const _arg = Boolean(arg ?? false)
        result = result && _arg
    }
    return result
}
nulFalse(true, true, true, null) //?

const isJFragment = (x: any): x is JFragment => {
    const _x = x as JFragment
    return nulFalse(_x.fragment)
}

const isJParsible = (x: any): x is JParsible => {
    const _x = x as JParsible,
          jParse = safeJSONParse(_ => false)
    if (nulFalse(_x.parse)) {
        const res = jParse(_x.parse)
        if (res) return true
    }
    return false
}

const isTransaction = (x: any): x is Transaction => {
    const _x = x as Transaction
        if (nulFalse(
            _x.id,
            _x.amount,
            _x.operation
        )) {
            if (_x.operation === 'O') {
                if (!nulFalse(_x.unitCost)) return false
            return true  
            }    
        } 
    return false
}
const isCustomer = (x: any): x is Customer => {
    const _x = x as Customer
    if (nulFalse(
        _x.id,
        _x.name,
        _x.balance
    )) {
        return true
    } 
    return false
}

const master = fs.readFileSync(MASTER_PATH).toString()

//const res = tryCatch(() => JSON.parse(master), e => console.log(`Failed: ${e}`))
const debug = (err, data) => err ? console.error(`Fail, err: ${err}`) : console.log(`Success, data: ${data}`)
const makeTransform = transform => new Transform({ transform })
const OPEN_BRACKET = /{/g
const CLOSED_BRACKET = /}/g

const JStringTemplate = (id, op, qt, uc, final=false) => `{
    "id": ${id},
    "operation": "${op}",
    "quantity": ${qt},
    "unitCost": ${uc}
}${final ? '' : ','}
`


const genJStrings = (amt=50) => {
    const round = Math.round
    const next = (index, final=false) => {
        const random = Math.random()
        const id: number = 1000,//= getID(index, amt), 
              op: string = round(random) === 0 ? 'O' : 'P',
              qt: number = round(random*95)+5, 
              uc: number = round(random*10)
        return JStringTemplate(id, op, qt, uc, final)
    }
    let builder = "["
    for(let i = 1; i <= amt; i++) 
        builder += next(i, i === amt)
    builder += "]"
    const res2 = tryCatch(() => JSON.parse(builder), e => console.log(e))
    if (res2) console.log("Mock generator test: ", JSON.stringify(res2))
}

const TemplateUTest = () => {
    let eg = JStringTemplate(1001, 'O', 200, 1.04, true)
    try {
        eg = JSON.stringify(JSON.parse(eg))
        console.log("success: \n", eg)
        return true
    } catch (e) {
        console.log("Failed \n")
        console.error(e)
        return false
    }
}
export const a1 = async () => {
    let chunks = ""
    //genJStrings()
    //const test1 = TemplateUTest()
    //console.log('test log', ` status: ${test1?"success":"failure"}`)
    const stream = fs.createReadStream(MASTER_PATH, { encoding: 'utf-8', highWaterMark: 96, start: 2})
    const outputStream = fs.createWriteStream(path.resolve(__dirname, `output`), { encoding: 'utf-8' })
    /*const rl = readline.createInterface({
        input: stream,
        output: outputStream
    })*/
    //stream.on(`data`, chunk => chunks.push(chunk.toString()))
    //stream.pipe(toJSON$)
    const safeFirst = <T, >(arr: T[]) => (arr?.length > 0) ? arr[0] : false
    
    const makeJParsible = (parse: string): JParsible => ({ parse })
    const makeJFragment = (fragment: string): JFragment => ({ fragment })

    const matchJObject = (l: string): (JFragment | JParsible)[] => {
        const start = l.indexOf('{'),
              end = l.indexOf('}'),
              lastC = l.lastIndexOf('}'),
              lastO = l.lastIndexOf('{')
        console.log(start, end)
              //let result = []
        if (start === -1 || end === -1) return [makeJFragment(l)] //?
        if (end < start) {
            if (lastO === start) {
                if (lastC === end) return [makeJFragment(l.substring(0, start))] 
                else if (lastC > start) return [
                    makeJFragment(l.substring(0, lastO+1)),
                    makeJParsible(l.substring(lastO, lastC+1))
                ]
            }
        } else if (end > start) {
            if (lastC === end && lastO === start) return [makeJParsible(l.substring(start, end+1))]
            if (lastO === end && lastC > end) return [
                makeJParsible(l.substring(start, end+1)),
                makeJFragment(l.substring(end))
            ]
        } 
        console.log(l)
        console.log(start, end, lastC, lastO)
        //if (start === -1) return
        //if (start < end && end <= last) return l.substring(start, last) 
        //else if (start)
        //const test = { parse: l }
        //if (isJParsible(test)) return [ test ]

    }
    //const result = matchJObject(`{ "test": "tessssst" }`)[0] //?
    //isJParsible(result) //?
    
    const identity = x => x //?

    let builder = ""
    const getB = () => builder
    const setB = str => {
        builder = str
        return str
    }

    for await (const buf of stream) {
        
        const line = buf //?
        let stateBuilder = ""
        
        //const builderHasFragment = state.builder.length > 0
        const parseRes = matchJObject(line)
              
        console.log(parseRes)

        const indicies = parseRes.map((_, i) => i)
        const jsonFragments = parseRes //?
                                .reduce((acc, cv) => {
                                    if (isJFragment(cv)) {
                                        //if (ci === 0) {
                                        console.log(cv)
                                        const possibleJSON = stateBuilder.concat(cv.fragment)
                                        stateBuilder += cv.fragment 
                                        const __res = matchJObject(possibleJSON)
                                        if (__res != null) {
                                            //const parsibleJson = __res.filter(x => (isJParsible(x)) ? true : false)
                                            //const possibleObj = parsibleJson.map(({ parse }) => JSON.parse(parse)) 
                                            const possibleObj = __res.map(x => {
                                                if (isJParsible(x)) {
                                                    return JSON.parse(x.parse)
                                                } else {
                                                    return null
                                                }
                                            }).filter(x => Boolean(x ?? false))
                                            stateBuilder = ""
                                            return (possibleObj ?? false) ? acc.concat(possibleObj) : acc
                                        }
                                        //}
                                        //if (state.builder() ?? false) 
                                        //state.set(cv)
                                    } else {
                                        const pasrsedJson = safeJSONParse(x => null)(cv.parse)
                                        if (pasrsedJson) {
                                            stateBuilder = ""
                                            return [...acc, pasrsedJson]
                                        }
                                    }
                                    return acc
                                }, [])

        console.log(jsonFragments) //?

        /*state.set(
            (builderHasFragment) ?
            (jsonFragments.reduce((acc, { fragment }) => acc.concat(fragment), state.builder) :
            ""
        )*/
    
            //                    .reduce((acc, { fragment }) => acc.concat(fragment), state.builder)
                        //.reduce((p, c) => {
            
                    //(state.builder.length > 0) ? matchJObject(state.builder.concat(line)) : matchJObject(line) //?
        /*
                    if (builder.length > 0) builder = ""
        if (result.filter(isJFragment).length > 0) {
            builder = builder.concat(result.filter(isJFragment).flatMap(x => x.fragment).join('')) //?
        } 
        if (result.filter(isJParsible).length > 0) {
            const _result = safeJSONParse(result.filter(isJParsible).flatMap(x => x.parse))
            Object.keys(_result) //?
        }
        */
        //result.filter(isJParsible) //?
        //const pJSON = line.substring(start, end)
        //const result = tryCatch(() => JSON.stringify(JSON.parse(pJSON)), e => `error: ${e}`)
        //.map(safeFirst) 
        //let testOutput = []
        //if (object.every(identity))
          //  testOutput = object.flatMap(({ index }) => index)
        //const testOutput = `Chunk #:\n${line}\n`
        //console.log(testOutput)
        outputStream.write(`update\n result: ${JSON.stringify(jsonFragments, null, 2)}\n`)
    }
    return new Promise((res, rej) => {
        stream.on(`end`, () => res(chunks))
        stream.on(`error`, rej)
    })
}

a1().then(x => x).catch(console.error)