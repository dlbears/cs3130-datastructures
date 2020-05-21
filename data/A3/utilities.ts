export type Nothing = null | undefined
type Anything = any
type Something<T> = NonNullable<T>

interface Tagged<T> {
    tag: Something<T>,
    value: any
}

interface Done extends Tagged<'done'> {}
interface Cont extends Tagged<'continue'> {}


export const TransduceStreamInto = async ($, transform, target, reducer=Reducers.concat) => {
    const transduce = transform(reducer)
    let accumulation = target
    for await (const current of $) {
        accumulation = transduce(accumulation, current)
    }
    return accumulation
}

export const TransduceIterableInto = ($, transform, target, reducer=Reducers.concat) => {
    const transduce = transform(reducer)
    let accumulation = target
    for (const current of $) {
        accumulation = transduce(accumulation, current)
    }
    return accumulation
}

export const Transducers = {
    filter: predicate => combine =>
               (accumulation, current) => predicate(current) ? combine(accumulation, current) : accumulation,
    map: transform => combine =>
            (accumulation, current) => combine(accumulation, transform(current)),
    flatMap: transform => combine =>
                (accumulation, current) => {
                    const transformed = transform(current)
                    return transformed != null ? combine(accumulation, transformed) : accumulation  
                },
    ifElse: (predicate, pass, fail) => combine => 
                (accumulation, current) => combine(
                    accumulation, 
                    predicate(accumulation, current) ? pass(current) : fail(current)
                ),
    fold: tf => combine => 
            (accumulation, current) => 
                combine(accumulation, tf(accumulation, current)),
    unfold: recTransform => combine => 
                (accumulation, current) => 
                    combine(accumulation, trampoline(recTransform)(current)),
    chain: monad => f => combine => 
                (accumulation, current) => 
                    combine(accumulation, monad.chain(f, monad.of(current)))
}



export const Reducers = {
    concat: (acc, cur) => {
        console.log(cur)
        return acc.concat(cur)
    },
    swap: (acc, cur) => cur

}


export const makeDispatcher = reducers => Transducers.fold((state, event) => reducers?.[event?.type](state, event))

export const compose = (...fs) => fs.length === 1 ? (...args) => fs[0](...args) : fs.reduceRight((g, f) => (...args) => f(g(...args)))
export const pipe = (...fs) => fs.length === 1 ? (...args) => fs[0](...args) : fs.reduce((g, f) => (...args) => f(g(...args)))                
export const done = (value): Done => ({ tag: 'done', value }),
      cont = (value): Cont => ({ tag: 'continue', value }),
      isDone = (val): val is Done => (val?.tag === 'done') ?? false,
      isContinue = (val): val is Cont => (val?.tag === 'continue') ?? false,
      pure = ({ value }: Something<Done | Cont>) => value  

export const trampoline = f => (...args) => {
    let result = f(...args)
    while (!isDone(result)) {
        result = result.value()
    }
    return result.value
}

const rFact = (num, acc=BigInt(1)) => {
    return num > BigInt(0) ? 
        cont(() => rFact(num - BigInt(1), acc*num))
        : done(acc)
} 

const arr = [1, 2, 3, 4, 5]

TransduceStreamInto(arr, compose(
    Transducers.map(n => BigInt(n)),
    Transducers.unfold(rFact),

), [], Reducers.concat) //?














// Utility Types 
type Maybe<T> = Something<T> | Nothing
const isNothing = <T>(val: Maybe<T>): val is Nothing => (val === null && val === undefined)
const isSomething = <T>(val: Maybe<T>): val is Something<T> => !isNothing(val) 

type State<T> = { [key: string]: Something<T> }
type EventTypes = Something<('P' | 'R' | 'S')>
type StateEvent = {
    type: EventTypes,
    data: any    
} 
type StateTransducer<T> = { [key in keyof State<T>]: (s: State<T>, e: StateEvent) => State<T> }
type UpdateTuple<T> = [State<T>, StateEvent]

const dispatchWith = <T>(s: State<T>, t: StateTransducer<T>) => (e: StateEvent) => t[e.type](s, e)


// Functor Laws

const mapIdentity = (F, a) => F.map(x => x, a) === a
const mapComposition = (F, f, g, a) => F.map(x => f(g(x)), a) === F.map(f, F.map(g, a))
const isFunctor = (F, f, g, a) => mapIdentity(F, a) && mapComposition(F, f, g, a)

// Apply Laws

const apMap = isFunctor
const apComposition = (A, a, u, v) => A.ap(A.ap(A.map(f => g => x => f(g(x)), a), u), v) === A.ap(a, A.ap(u, v))
const isAp = (A, a, f, g, u, v) => apMap(A, f, g, a) && apComposition(A, a, u, v)

//Applicative Laws

const ofAp = isAp
const ofIdentity = (A, v) => A.ap(A.of(x => x), v) === v
const ofHomomorph = (A, f, x) => A.ap(A.of(f), A.of(x)) === A.of(f(x))
const ofInterchange = (A, f, x) => A.ap(f, A.of(x)) === A.ap(A.of(g => g(x)), f)
export const isApplicative = (A, a, f, g, u, v, x) => ofAp(A, a, f, g, u, v) 
                                           && ofIdentity(A, v)
                                           && ofHomomorph(A, f, x)
                                           && ofInterchange(A, f, x)

//Chain Laws

const chainAp = isAp
const chainAssociative = (C, g, f, u) => C.chain(g, C.chain(f, u)) === C.chain(x => C.chain(g, f(x)), u)
const isChainable = (C, a, f, g, u, v) => chainAp(C, a, f, g, u, v) && chainAssociative(C, g, f, u)

//Monad Laws

const monadChainOf = (M, a, f, g, u, v, x) => isChainable(M, a, f, g, u, v) 
                                           && isApplicative(M, a, f, g, u, v, x)
const monadLeft = (M, f, a) => M.chain(f, M.of(a)) === f(a)
const monadRight = (M, u) => M.chain(M.of, u) === u
const isMonad = (M, a, f, g, u, v, x) => monadChainOf(M, a, f, g, u, v, x)
                                      && monadLeft(M, f, a)
                                      && monadRight(M, u)