import { nulFalse } from "./utility"
import { Transform, TransformOptions } from "stream"
import t from 'transducers-js'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import { resolve } from 'path'


type Nothing = void | undefined | null
type Just<T> = NonNullable<T>
type Maybe<T> = Just<T> | Nothing
type Lens<P, O extends P> = (property: P) => (target: O) => P
type Reducer<X, Y> = (accumulation: Y, current: X) => Y
type Transducer<X, Y, Z> = (f: Reducer<X, Y>) => Reducer<Z, Y> | Just<Y>
type Mapper<X, Y> = (value: X) =>  Y
type TransMap<X, Y, Z> = (f: Mapper<X, Z>) => Transducer<X, Y, Z> 
type Filter<P, X> = (predicate: P) => (value: X) => boolean
type TransFilter<X, Y, P> = (f: Filter<X, P>) => Transducer<X, Y, X>
type FlatMap<X, Y> = Mapper<X, Maybe<Y> >
type TransFlatMap<X, Y, Z> = (f: FlatMap<X, Z>) => Transducer<X, Y, Z> 


export const Lens = {
    of: state => prop => {
        if (Array.isArray(state)) {
            return arrayLens(prop)
        } else if (typeof state === 'object') {
            return objectLens(prop)
        } else {
            throw "Unsupported Cast"
        }
    },
    fromProp: (prop: string | symbol) => objectLens(prop),
    fromIndex: (index: number) => arrayLens(index)
}

const objectLens = (property: string | symbol) => ({
    view: state => state[property],
    set: (state, value) => ({
        ...state,
        [property]: value
    }) 
})

const arrayLens = (index: number) => ({
    view: state => state[index],
    set: (state, value) => {
        state[index] = value
        return state
    }
}) 

export const filter = predicate => combine =>
               (accumulation, current) => predicate(current) ? combine(accumulation, current) : accumulation

export const map = transform => combine =>
            (accumulation, current) => combine(accumulation, transform(current))

export const over = (lens, transform) => map(
                state => lens.set(
                    state, 
                    transform(lens.view(state))
                )
            )

const reduce = reduction => combine =>
               (accumulation, current) => combine(...reduction(accumulation, current))



export const compose = (...fs) => fs.reduce((f, g) => (...args) =>{ 
    const partial = g(...args)
    const full = f(partial)
    //console.log("Before", partial, "After", full) //?
    //console.log(...args)
    return full//f(g(...args)) 
})

const pushReducer = (acc: any[], cur) => {
    //console.log(acc, cur)//?
    acc.push(cur)
    return acc
}

const take = x => reduction => combine => {
    let count = 0
    return reduce((acc, cur) => {
        return (++count <= x) ? reduction(acc, cur) : [ acc, cur ]
    })(combine)
}


const composeTest = [
    {
        number: 2,
        value: "Something",
        filter: true
    },
    {
        number: 3,
        value: "Something Odd",
        filter: true
    },
    {
        value: "Nothing",
        filter: false
    },
    {
        value: "Something Weird",
        number: Infinity,
        filter: false
    }
]

const nums = new Array(100).fill(1).map((x, i) => i+1)
const bools = [ true, true, false, false ]
const genTestObjs = amount => {
    let accumulation = []
    let numCounter = 0,
        boolCounter = 0
    while(amount >= 0) {
        if (boolCounter === bools.length) boolCounter = 0
        if (numCounter === nums.length) numCounter = 0
        accumulation.push({
            value: "Some Generic Thing", 
            number: nums[numCounter++],
            filter: bools[boolCounter++] 
        })
        amount--
    }
    return accumulation
}

const thousands = genTestObjs(1000)

const minus8 = x => x - 8,
      add10 = x => x + 10,
      multiply3 = x => x * 3

const isOdd = x => {
    return x % 2 !== 0
}

const imperative = (...fs) => data => {
    //compose(... fs)(data) //?
    let accumulation = []
    for (const datum of data) {
        const xf = x => (x - 8 + 10) * 3
        const i = xf(datum)
        if (isOdd(i)) accumulation.push(xf(i)) /* ?. */
    }
    return accumulation
}

const transduction = (xfs, combiner, data) => {
    const transform = xfs(combiner)
    
    let accumulation = []
    for (const datum of data) {
        //const newAcc 
        accumulation = transform(accumulation, datum) /* ?. */
        //if (newAcc.length === accumulation.length) continue
        //else accumulation = newAcc
    }
    return accumulation//data.reduce(transform, [])
}

const millionNums = new Array(10).fill(1).map((x, i) => x + i) /* ?. */

const ooopTestData = millionNums
//(new Array(100))//? 
 //.map((x, i) => i + 1) //?
// x - 8 -> x + 10 -> x * 3 -> x % 2 !== 0 -> x
const xfs = compose(
    map(minus8),
    map(add10),
    map(multiply3),
    filter(isOdd),
    map(minus8),
    map(add10),
    map(multiply3)
)

const optXfs = t.comp(
    t.map(minus8),
    t.map(add10),
    t.map(multiply3),
    t.filter(isOdd),
    t.map(minus8),
    t.map(add10),
    t.map(multiply3)
) //?

const imperativeNumTest = () => imperative(minus8, add10, multiply3)(ooopTestData)

const loopTransductionTest = () => transduction(
    xfs, 
    pushReducer,
    ooopTestData
) 

const libTransduceTest = () => t.into([], optXfs, ooopTestData) 

// /*?.*/
//const tensThousands = genTestObjs(10000) /*?.*/
//const hundredThousands = genTestObjs(100000) /*?.*/
const millions = genTestObjs(10000) /*?.*/
//const tensMillions = genTestObjs(10000000) /*?.*/
//const hundredMillions = genTestObjs(100000000) /*?.*/
//const billions = genTestObjs(1000000000) /*?.*/

const transduce = (xfs, collection: any[], reducer, init=[]) => {
    const transform = xfs(reducer)
    //let accumulation = init
    return collection.reduce(transform, init) /* ?. */
    /*
    for (const value of collection) {
        accumulation = transform(accumulation, value)
    }
    return accumulation
    */
}

const reduceTransduceTest = () => transduce(
    xfs,
    ooopTestData,
    pushReducer
) /* ?. */

const logger = x => {
    let y = JSON.stringify(x)
    console.log(y)
    return y
}

const numTrials = 5
for(let t = 1; t <= numTrials; t++) {
    imperativeNumTest() //? logger(?.)
    //loopTransductionTest() /*?.*/
    //libTransduceTest() /*?.*/
    //reduceTransduceTest() /*?.*/
}


const transforms = compose(
    filter(obj => obj.filter),
    map(obj => {
        obj.number += 10 
        return obj
    }), 
    map(obj => {
        obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12)
        return obj
    }),
    map(obj => {
        obj.number *= 2 
    return obj
    }), 
    map(obj => {
        obj.number -= 10 
    return obj
    }), 
    map(obj => {
        obj.number /= 2 
    return obj
    }), 
    map(obj => {
        obj.value = obj.value.substring(0, 4)
    return obj
    })
)

const chainedTest = data => data.filter(obj => obj.filter)
                               .map(obj => {
                                    obj.number += 10 
                                return obj
                                }) 
                               .map(obj => {
                                    obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12)
                                return obj
                                })
                                .map(obj => {
                                    obj.number *= 2 
                                return obj
                                }) 
                                .map(obj => {
                                    obj.number -= 10 
                                return obj
                                }) 
                                .map(obj => {
                                    obj.number /= 2 
                                return obj
                                }) 
                                .map(obj => {
                                    obj.value = obj.value.substring(0, 4)
                                return obj
                                })

//hundredThousands.reduce(transforms(pushReducer), []) //?

const transducerTest = data => transduce(transforms, data, pushReducer, [])

const imperativeTest = data => {
    let accumulation = []
    for (let obj of data) {
        if (obj.filter) {
            obj.number += 10
            obj.number *= 2
            obj.number -= 10
            obj.number /= 2
            obj.value = obj.value.substring(0, 4) + obj.value.substring(5, 12)
            obj.value = obj.value.substring(0, 4)
            accumulation.push(obj)
        }
    }
    return accumulation 
}

//transducerTest(millions) //?
//chainedTest(millions) //?
//imperativeTest(millions) //?



const trials = 0
for(let t = 1; t <= trials; t++) {
    transducerTest(millions) //?.
    chainedTest(millions) /*?.*/
    imperativeTest(millions) /*?.*/
}

class $Transducer extends Transform {
    constructor(
            opts: TransformOptions,
            private xfs,
            private state: State,
        ) { super(opts) }

    private _reducer(acc, cur) {
        this.push(cur)
        return acc
    }

    _transform(chunk, encoding, done) {
        const transform = this.xfs(this._reducer)
        this.state = transform(this.state, chunk)
        done()
    }
}

class State {
    constructor(private _state: Readonly<any>, private _reducers: Readonly<any[]>) {}


    private setState(newState) {
        return new State(newState, this._reducers)
    }

    private safeGetReducer(event: string) {
        return this._reducers[event] ?? this._reducers["default"]
    }

    getState() {
        return this._state
    }

    dispatch(event: string, value: any) {
        const transition = this.safeGetReducer(event)
        const newState = transition(this.getState() , value)
        return this.setState(newState)
    }

}

const Left = Symbol(),
      Right = Symbol()

interface Left {
    [Left]: any,
}

interface Right {
    [Right]: any
}

const make = (sym: symbol) => (value: any) => ({ [sym]: value })
const makeLeft = make(Left),
      makeRight = make(Right)

const isLeft = (x: any): x is Left => Object.getOwnPropertySymbols(x).includes(Left)
const isRight = (x: any): x is Right => Object.getOwnPropertySymbols(x).includes(Right)

const isNothing = (x: any): x is Nothing => (x === null || x === undefined)


export class Either {
        private isFunc: Readonly<boolean>
        private isLeft: Readonly<boolean>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
        constructor(private value) {
            this.isFunc = typeof value === 'function'
            this.isLeft = isLeft(value)
        }
        public static of = value => new Either(value)
        public static fromTry = lazy => {
            let res
            try {
                res = makeRight(lazy())
            } catch (e) {
                res = makeLeft(e)
            }
            return Either.of(res)
        }
        public static fromMaybe = (maybe, msg=null) => 
                                    Either.of(isNothing)
                                            .ap(maybe)
                                            .map(not => not ? 
                                                makeLeft(msg) : 
                                                makeRight(maybe))
        private ap = funVal => this.isFunc ?
                                this.value(funVal) :
                                funVal(this.value)
        fork = (lchain, rchain) => this.ap(this.isLeft ? lchain : rchain)
        chain = funVal => this.isLeft ? this.value : this.ap(funVal)
        map = funVal => Either.of(this.chain(funVal))
    }

const nullCheck = x => x === null || x === undefined





