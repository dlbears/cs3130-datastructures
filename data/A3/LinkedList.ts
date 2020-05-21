

type Maybe<T> = NonNullable<T> | null | undefined

interface LinkedList<T> {
    isEmpty: () => boolean,
    size: () => number,
    iterate: (start?: Node<T>) => Iterable<T>,
    link: (from: Node<T>, to: Node<T>) => void,
    delink: (from: Node<T>, at: Node<T>) => boolean,
    insertAfter: (n: Node<T>, a: number) => void,
    insertBefore: (n: Node<T>, b: number) => void,
    //deleteAfter: (a: number) => boolean,
    //deleteBefore: (b: number) => boolean
}

type Nothing = null | undefined
type Anything = any
type Something<T> = NonNullable<T>
type SomethingPointy<T, U> = Something<(T) => U>

interface Tagged<T> {
    tag: Something<T>,
    value: any
}

interface Done extends Tagged<'done'> {}
interface Cont extends Tagged<'continue'> {}



interface Foldable<T> {
    reduce: <a, b>(fn: (a, b) => a, s: a, f: Foldable<T>) => a
}

interface Traversable<T> extends Foldable<T>, Functor<T> {
    traverse: <U extends Applicative<U>, a extends Applicative<a>, b extends Traversable<b>>(pointy: U, f: (T) => a, xs: Traversable<T>) => b extends U ? b : never
}

interface Functor<T> {
    map: <a, b extends Functor<a>>(f: (T) => a, v: Functor<T>) => b
}

interface BiFunctor<U, K> {
    bimap: <a, b, c extends BiFunctor<a, b>>(f: (U) => a, g: (K) => b, x: BiFunctor<U, K>) => c 
}

interface Apply<T> extends Functor<T> {
    ap: <a extends Apply<(T) => b>, b extends Apply<T>>(pf: a, v: T) => Something<b>
}

interface Applicative<T> extends Apply<T> {
    of: <a>(a) => Applicative<a>
}

interface Pair<T, U> {
    bimap: <V,W>(f :(t: T) => V, g: (u: U) => W) => Pair<V,W>
    chain: <V,W>(f: (t: Pair<T,U>) => (Pair<V,W>)) => Pair<V,W>
}

const truthy = x => x !== false

const thunk = (f,...args) => () => f(...args)

const done = (value): Done => ({ tag: 'done', value }),
      cont = (value): Cont => ({ tag: 'continue', value }),
      isDone = (val): val is Done => (val?.tag === 'done') ?? false,
      isContinue = (val): val is Cont => (val?.tag === 'continue') ?? false,
      pure = ({ value }: Something<Done | Cont>) => value  

const trampoline = f => (...args) => {
    let result = f(...args)
    while (!isDone(result)) {
        result = pure(result)()
    }
    return pure(result)
}

const rFact = (num, acc=BigInt(1)) => {
    return num > BigInt(0) ? 
        cont(() => rFact(num - BigInt(1), acc*num))
        : done(acc)
} 

const fact = (num, acc=BigInt(1)) => {
    return num > BigInt(0) ? 
        fact(num - BigInt(1), acc*num)
        : acc
}

//Trompoline Test
//trampoline(rFact)(BigInt(100000)) //? 
//fact(BigInt(10000))//?

// Doubly Circular List with a Static Monadic Interface
export class StaticDCList<T> {
    public length = 0
    protected constructor(public head?: Node<T>, public tail?: Node<T>) { 
        const headPresent = truthy(this.head ?? false),
              tailPresent = truthy(this.tail ?? false)
        const both = headPresent && tailPresent
        const neither = !both
        const same = both && this.head === this.tail

        if (both && !same) { StaticDCList.link(this.tail, this.head); this.length += 2 }
        else if (headPresent || same) { this.tail = this.head; StaticDCList.link(this.head, this.head); this.length++ }
        else if (tailPresent) { this.head = this.tail; StaticDCList.link(this.tail, this.tail); this.length++ }
        else if (neither) {}
        else {
            throw "Case Not Covered"
        }

        this[Symbol.iterator] = this.iterate
    }

    isEmpty = () => this.length === 0
    size = () => this.length

    concat = (l2) => StaticDCList.concat(this, l2)

    get = (i): Maybe<Node<T>> => {
        if (i <= this.size() && i >= 0) {
            let count = 0
            for (const node of this.iterate()) {
                if (i === count++) return node
            }
        }
    }

    private static linkAfter = (f, t) => {
        t.prev = f
        t.next = f.next
        f.next = t
        if ((t.next ?? false)) t.next.prev = t 
    }

    private static linkBefore = (f, t) => {
        t.prev = f.prev
        f.prev = t
        t.next = f
        if (t.prev ?? false) t.prev.next = t
    }

    private static link = <T>(f: Node<T>, t: Node<T>): Node<T> => {
        f.next = t
        t.prev = f
        return f
    }

    private static delink = (f, a) => {
        if (f.next === a) {
            f.next = a.next
            if (f.next ?? false) f.next.prev = f
        } else if (f.prev === a) {
            f.prev = a.prev
            if (f.prev ?? false) f.prev.next = f
        } else {
            throw "Can't delink that which was never linked"
        }
        f.next = a.next
        if (a.next ?? false) a.next.prev = f
        a.prev = null
    }

    insert(n: Node<T>, a: number): StaticDCList<T> {
        let l = StaticDCList.of(this) //?
        l.head === this.head//?
        l.tail === this.tail//?
        if(a > this.size()) throw "insert at node: List out of bounds"
        else if(this.isEmpty()) return StaticDCList.of(n)
        else if(a === 0) {
            console.log(StaticDCList.of(n), l) //?
            l = StaticDCList.concat(StaticDCList.of(n), l)
            l.head === this.head //?
            console.log(l, l.head)
            l.tail === this.tail//?
            test
            console.log("Iter start", l, "STOP")
        } else if(a === this.size()) {
            //StaticDCList.linkAfter(this.tail, n)
            l = StaticDCList.concat(l, StaticDCList.of(n))
            l.tail !== this.tail //?
        } else if (n ?? false) {
            const after = this.get(a)
            if (after ?? false) {
                const before = after.prev //?
                StaticDCList.link(n, after)
                StaticDCList.link(before, n)
            }
        }
        //this.length++
        //const list = StaticDCList.of(this)
        console.log(l)
        return l
    }

    removeFirst = () => {
        if(this.isEmpty()) return Node.of()
        if(this.size() === 1) {
            const res = this.head
            this.head = this.tail = null
            this.length = 0
            return res
        }
        const res = this.head
        this.head = this.head.next 
        this.length -= 1
        StaticDCList.link(this.tail, this.head)
        return res    
    }

    removeLast = () => {
        if(this.isEmpty()) return Node.of()
        if(this.size() === 1) {
            const res = this.head
            this.head = this.tail = null
            this.length = 0
            return res
        }
        const res = this.tail
        this.tail = this.tail.prev 
        this.length -= 1
        StaticDCList.link(this.tail, this.head)
        return res        
    }


    remove = (a: number): Node<T> => {
        let tmp: Node<T>
        if(a > this.size()) throw "remove ath node: List out of bounds"
        else if(this.size() === 1 && a <= 1) {
            tmp = this.head
            this.head = null
            this.length--
        }
        else {
            const remove = StaticDCList.chain((v, i) => StaticDCList.of(i === a ? v : null), StaticDCList.of(this))
            StaticDCList.ap(
                StaticDCList.ap(
                    StaticDCList.of(x => y => StaticDCList.delink(x, y)),
                    StaticDCList.map((v, i) => v.prev ?? v.next, remove)
                ),
                remove
            )
            console.log(remove)
            //tmp = StaticDCList.extract(remove.head)
            if(a === this.size()) this.tail = tmp.prev
        }
        return tmp
    }

    iterate = function* (start?: Node<T>) {
        let temp
        if(!this.isEmpty()) {
            for (temp = start ?? this.head; temp !== this.tail; temp = temp.next) {
                yield temp
            }
            yield temp
        }
    }

    inspect = (deepNode=true) => {
        let res = ""
        let first = true
        for (const n of this.iterate()) {
            res += (first ? "" : "<=>") + ` (${ deepNode ? n.inspect() : n.data }) `
            if (first) first = false
        }
        return res += "<=>"
    }

    iterateReverse = function* (start?: Node<T>) {
        let temp
        for (temp = start ?? this.tail; temp !== this.head; temp = temp.prev) 
            yield temp
        yield temp
    }

    public static of = (a?: any, t?: any, l?: number) => {
        if (l ?? false) {
            const list = new StaticDCList(a, t)
            list.length = l
            return list
        }
        else if ((a ?? false) && (t ?? false)) return new StaticDCList(a instanceof Node ? a : new Node(a), t instanceof Node ? t : new Node(t) ) 
        else if ((a ?? false) || typeof a === 'boolean') {
            if (a instanceof StaticDCList) {
                const list = new StaticDCList(a.head, a.tail)
                list.length = a.length
                return list
            } else if (a instanceof Node) return (a.empty()) ? new StaticDCList() : new StaticDCList(new Node(a.data))
            else if (Array.isArray(a) && typeof a[Symbol.iterator] === "function") return StaticDCList.fromIterable(a)
            else return new StaticDCList(new Node(a))
        } else {
            return new StaticDCList()
        }

    }

    public static empty = (): StaticDCList<Nothing> => StaticDCList.of()
    public static head = list => StaticDCList.extract(list.head)
    public static tail = list => StaticDCList.extract(list.tail)
    private static fromIterable = it => {
        let list = StaticDCList.of() 
        for(const i of it) {
            console.log(i) //?
                list = StaticDCList.concat(
                    list,
                    StaticDCList.of(new Node(i))
                )
        }
        return list 
    }
    public static traverse = <T>(pointy, f, list) => {
        let acc = pointy.of() //?
        let count = 0
        for (const x of list) {
            const res = f(x, count++) //?
            acc = pointy.concat(acc, pointy.of(res)) //? $.data 
        }
        return acc //?


    }
    public static map = (f, list) => {
        let acc = StaticDCList.empty()
        let count = 0
        console.log(list) //?
        for (const item of list) {
            console.log(item.data) //?
            const res = f(item.data, count++) //?
            const lres = StaticDCList.of(res)
            acc = StaticDCList.concat(acc, lres)
        }
        return acc
    }

    public static concat = <T>(l1, l2): StaticDCList<T> => {

        const nLen = l1.size() + l2.size() //?
        if (l1.isEmpty() && l2.isEmpty()) return StaticDCList.empty() 
        else if (l1.isEmpty()) return StaticDCList.of(l2)
        else if (l2.isEmpty()) return StaticDCList.of(l1)
        StaticDCList.link(l1.tail, l2.head)
        StaticDCList.link(l2.tail, l1.head)
        const l3 = StaticDCList.of(l1.head, l2.tail)
        l3.length = nLen
        return l3
    }

    public static extract = (node) => node.data
    public static reduce = (f, initial, list) => {
        let acc = initial,
            index = 0
        for(const node of list.iterate()) {
            node.data //?
            acc = f(acc, StaticDCList.extract(node), index++)
        }
        return acc
    }
    public static chain = (f, list) => StaticDCList.traverse(StaticDCList, f, list)
    public static chainRec = (f, list) => StaticDCList.chain(trampoline(f), list)
    
    public static ap = (af, xs) => {
        if (af.size() === 0 && xs.size() === 0) return StaticDCList.empty()
        if (xs.size() === 0) {
            StaticDCList.map(f => f(StaticDCList.empty()), af)
        }
        if (af.size() === 1) {
            console.log(xs.head)
            return StaticDCList.map(StaticDCList.head(af), xs)
        }
        if (xs.size() === 1) {
            const mapf = StaticDCList.map(f => f(StaticDCList.head(xs)), af) //?
            return mapf
        }
        let res = []
        const pureN = StaticDCList.extract
        for (const x of xs) {
            let inner = []
            for (const f of af) {
                console.log(x, f) //?
                inner = inner.concat(pureN(f)(pureN(x)))
            }
            res.push(inner)
        }
        console.log(res) //?
        return StaticDCList.of(res)

    }
 
}






export class Node<T> {
    public next: Node<T>
    public prev?: Node<T>
    constructor(public data?: T) {}
    empty = () => this.data === null || this.data === undefined
    inspect = () => {
        let inner, 
            left, 
            right
        if (this.data instanceof StaticDCList) {
            inner = this.data.inspect(false)
            if (this.prev.data instanceof StaticDCList) left = this.prev.data.inspect(false)
            if(this.next.data instanceof StaticDCList) right = this.next.data.inspect(false)
        } else {
            inner = this.data
            left = this?.prev.data ?? false
            right = this?.next.data ?? false
        }
        return `({${(left ?? false) ? left + ") <-" : ""} ${"(" + inner + ")"} ${(right ?? false) ? "-> (" + right : ""}})`
    }
    map = f => Node.map(f, this)
    concat = n2 => Node.concat(this, n2)
    
    public static concat = <T>(n1: Node<T>, x: Node<T>) => {
        if (n1.empty()) {
            return Node.of(x) //? $.data

        } else if (x.data instanceof StaticDCList && n1.data instanceof StaticDCList) return Node.of(n1.data.concat(x.data)) 
        else if (x.data instanceof StaticDCList) return Node.of(StaticDCList.concat(x.data, StaticDCList.of(n1)))
        else if (n1.data instanceof StaticDCList) return Node.of(n1.data.concat(StaticDCList.of(x)))
        else return Node.of(StaticDCList.of(n1, x))
        
    }
 
    public static map = (f, n) => Node.of(f(n.data))
    public static ap = (af, n) => {
        if (n.data instanceof StaticDCList && af.data instanceof StaticDCList) return StaticDCList.ap(af.data, n.data)
        else if (n.data instanceof StaticDCList) return StaticDCList.ap(StaticDCList.of(af), n.data)
        else if (af.data instanceof StaticDCList) return StaticDCList.ap(af.data, StaticDCList.of(n))
        else {
            if(n.empty() && af.empty()) return Node.of()
            else if(n.empty()) return af
            else if (af.empty()) return n
            else {
                return Node.of(af.data(n.data))
            }
        }
    }
    public static of = (a ?: any) => {
        if (a ?? false) {
            if (a instanceof Node) return new Node(a.data)
            return new Node(a)
        } else {
            return new Node()
        }
    }
}

StaticDCList.of(Node.of()) //?

export class Queue<T> extends StaticDCList<T> {

    private constructor(head?: Node<T>, tail?: Node<T>) { super(head, tail) }

    public static of(a ?: any) {
        let q
        if (a instanceof StaticDCList) {
            q = new Queue(a.head, a.tail)
            q.length = a.length
        } else if (a ?? false) {
            q = new Queue(new Node(a))
        } else {
            q = new Queue()
        }
        return q
    }

    enqueue = (item: T) => Queue.of(this.insert(new Node(item), 0))
    enqueueFirst = (item: T) => Queue.of(this.insert(new Node(item), this.size()))
    dequeue = () => StaticDCList.extract(this.removeLast())
    peek = () => StaticDCList.extract(this.tail)

}

export class Stack<T> extends StaticDCList<T> {
    private constructor(head?: Node<T>, tail?: Node<T>) { super(head, tail) }

    public static of(a ?: any) {
        let q
        if (a instanceof StaticDCList) {
            q = new Stack(a.head, a.tail)
            q.length = a.length
        } else if (a ?? false) {
            q = new Stack(new Node(a))
        } else {
            q = new Stack()
        }
        return q
    }

    push = (item: T) => Stack.of(this.insert(new Node(item), this.size()))
    pop = (): T => StaticDCList.extract(this.removeLast())
    peek = (): T => StaticDCList.extract(this.tail)
}

const qTest = Queue.of()
Node.of("z").data//?
const test = qTest.enqueue('a')
const test2 = test.enqueue('b').enqueue("c")
test2.removeFirst() //?
test2.isEmpty() //?
test2.size() //?
test2 //?
//StaticDCList.chain((v, i) => StaticDCList.of(i === 2 ? v : null), test2)
//let node = test.dequeue()//?
//console.log(test2) //?
/*
const iterable = test2//?
//console.log(test2.next) //?
const applicative = StaticDCList.of(x => x + ' ' + "morph")

for (const f of test2) {
    console.log(f.data)//?
} 

StaticDCList.of() instanceof StaticDCList //?

const apTest = StaticDCList.of(x => x + ' ' + "morph")

for(const f of apTest) {
    console.log(StaticDCList.extract(f)("b"))
}
*/
/*
StaticDCList.ap(
    StaticDCList.of(x => x + ' ' + "morph"),
    test2
).head.next.data //?
*/
/*
const arrayTest = StaticDCList.of([
    1,
    2,
    3,
    4,
    5
]) //?

StaticDCList.traverse(Node, (v, i) => {
    console.log(v, i)
    return Node.of(v)
}, arrayTest).data //?

StaticDCList.chain((v, i) => v.data * 2, arrayTest) //?

StaticDCList.map((v, i) => acc => StaticDCList.concat(acc, StaticDCList.of(v + 1)), arrayTest).head //?
*/
/*
StaticDCList.ap(
StaticDCList.map((v, i) => acc => StaticDCList.concat(acc, StaticDCList.of(v + 1)), arrayTest),
StaticDCList.of()
)//?
*/
/*
const arrayConcat = StaticDCList.of([
    1, 
    2
])
*/

//StaticDCList.concat(arrayConcat, StaticDCList.of(3)) //?
//const arrayAp = StaticDCList.of([x => x + 1, x => x - 1])
/*

StaticDCList.ap(
    arrayAp,
    arrayTest
) //?


StaticDCList.reduce((acc, v, i) => {
    //console.log(v, i)
    return StaticDCList.concat(acc, StaticDCList.of(v))
}, StaticDCList.of(), test2) //?
//qTest.enqueue('c')
//qTest.enqueue('d')
//qTest.enqueue('e')
//StaticDCList.traverse(StaticDCList,(v, i) => StaticDCList.of(i === 2 ? v : null), test2)//?
//StaticDCList.concat(test2, StaticDCList.of('q')).head.data //?

console.log(qTest) //?

for (const val of test2.iterate()) {
    console.log(val.data) //?
}

StaticDCList.of().iterate().next()//?

const isNothing = (x) => x ?? false


while (!qTest.isEmpty()) {
    console.log(`
    peek: ${isNothing(qTest.peek())} 
    deq: ${isNothing(qTest.dequeue())}
    size: ${isNothing(qTest.size())}
    `) //?
}

*/
