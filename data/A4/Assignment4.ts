import { Transducers, Reducers, TransduceStreamInto, TransduceIterableInto, compose, makeDispatcher, pipe } from "../A3/utilities"
//import { StaticDCList, Queue } from "./LinkedList"
import { BinaryTree } from './BinaryTree'
import { createReadStream, createWriteStream, WriteStream } from 'fs'
import { createInterface } from 'readline'
import { resolve } from 'path'

const taggedEvent = tag => val => ({
    type: tag,
    data: val
})

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

const printChildren = t => {
    let acc = ""
    const str = (d, n) => `Node(${d}) has ${n} children\n`
    const num = n => {
        if(n?.left && n?.right) return 2
        else if(n?.left || n?.right) return 1
        else return 0
    }
    t.inTrav(v => {
        acc += str(v.data, num(v))
    }, t.root)
    write(acc) //?
}

const printCount = t => {
    let count = 0
    t.inTrav((v) => {
        console.log(v.data) //?
        if(!Array.isArray(v.data)) count++ 
    }, t.root)
    write("Node count: " + count + '\n') //?
}

const printTree = t => {
    let acc = "In order\n"
    
    function nodeAdder(n) {
        acc += (" " + n.data)
    }

    t.inTrav(nodeAdder, t.root)
    acc += "\nPre order\n"
    t.preTrav(nodeAdder, t.root)
    acc += "\nPost order\n"
    t.postTrav(nodeAdder, t.root)
    acc += '\n'
    write(acc) //?
}

const write = writeIO(IO)

const makeSet = taggedEvent('set'),
      makeOp = taggedEvent('operation')

let setNum = 0

const customReducers = {
    set: (acc, { data }) => {
        write("\nSet #" + (++setNum) + '\n')
        const tree = BinaryTree.of(data) 
        //console.log(.root) //?
        printTree(tree)
        printCount(tree)
        printChildren(tree)
        console.log(data) //?
        if (data ?? false) acc.set = data
        return acc
    },
    operation: (acc, val) => {
        let set = acc.set
        console.log(acc, val.data) //?
        val.data.map(({ type, data }) => {
            switch(type) {
                case "Insert":
                    if (set.indexOf(data) === -1) set = set.concat(data)
                    break
                case "Delete":
                    if (set.indexOf(data) > -1) set = set.slice(0, set.indexOf(data)).concat(set.slice(set.indexOf(data) + 1))
            }
        })
        const nTree = BinaryTree.of(set)
        printTree(nTree)
        printCount(nTree)
        printChildren(nTree)

        acc.set = set //?
        return acc
    }
}

const init = {
    set: null,
    operation: null
}

const reg = /[^#]\d+/g
const regOp = /\w+\s+\d+/g

TransduceStreamInto(IO, compose(
    Transducers.filter(x => x ?? false),
    Transducers.map(x => {
        if (x.startsWith("Set")) {
            const sData = x.match(reg)
                           .flatMap(y => {
                                const num = parseInt(y)
                                if (num === -999) return []
                                return num
                            }) //?
            return makeSet(sData)
        } else {
            const matched = x.match(regOp) //?
            const opData = matched?.map(y => {
                const [ op, val ] = y.split(" ")
                return taggedEvent(op.trim())(parseInt(val))
            })
            return makeOp(opData)
        }
        console.log((x as string).startsWith("Set")) //?
    }),
    makeDispatcher(customReducers)
), init, Reducers.swap)