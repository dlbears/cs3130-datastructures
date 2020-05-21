import { StaticDCList, Node } from "../A3/LinkedList"
import { pure, done, cont, TransduceIterableInto, Transducers, compose, Reducers, Nothing, isDone } from "../A3/utilities"

class TreeNode<T> extends Node<T> {
    public left?: TreeNode<T> | Nothing
    public right?: TreeNode<T> | Nothing

    constructor(
        public data?: T,
        private maxChildren?: number,
        public children?: StaticDCList<T>, 
        public parent?: TreeNode<T>
    ) { super(data) }

    inspect = () => `TreeNode( ${this.data} )`
    size = () => this.children?.size() ?? 0
    noChildren = () => this.children?.size() === 0 ?? true

    maxReached = () => (this.maxChildren ?? false) ? this.maxChildren === this.size() : false 

    getLeft = (): TreeNode<T> => {
        if (this.noChildren()) throw "No children left"
        return (this.children.get(0) as TreeNode<T>)
    }

    getRight = (): TreeNode<T> => {
        if (this.noChildren() || this.size() === 1) throw "No children right"
        return (this.children.get(this.size()) as TreeNode<T>) 
    }

    insertLeft = (child: TreeNode<T>): boolean => {
        if (this.noChildren()) {
            child.parent = this
            this.children = StaticDCList.of(child)
        }
        if (this.maxReached()) return false
        else {
            child.parent = this
            this.children = this.children.insert(child, 0)
        }
        return true
    } 

    insertRight = (child: TreeNode<T>): boolean => {
        if (this.noChildren()) {
            child.parent = this
            this.children = StaticDCList.of(child)
        }
        if (this.maxReached()) return false
        else {
            this.children = this.children.insert(child, this.size())
        }
        return true
    } 

    removeLeft = (): TreeNode<T> => {
        if (this.noChildren()) throw "Already Has No Children Left"
        else {
            return (this.children.removeFirst() as TreeNode<T>) 
        }

    }

    removeRight = (): TreeNode<T> => {
        if (this.noChildren() || this.size() === 1) throw "Already Has No Children Right"
        else {
            return (this.children.removeLast() as TreeNode<T>) 
        }

    }

    public static of = (...a: any) => new TreeNode(...a)
    
}

const makeBtree = (arr: any[], s, e) => {
    if (s >= e || arr.length === 0) {
        return done(null)
    } else {
        return cont(() => {
            const mid = Math.floor((s + e) / 2)
            const root = TreeNode.of(arr[mid]),
                  l = arr.slice(s, mid),
                  r = arr.slice(mid + 1, e)

            const left = tbTree(l, 0, l.length) ?? null,
                  right = tbTree(r, 0, r.length) ?? null

            root.left = left 
            if(root?.left?.parent ?? false) root.left.parent = root
            root.right = right  
            if(root?.right?.parent ?? false) root.right.parent = root
            return done(root)
        })
    }
}

const trampoline = f => (...args) => {
    let result = f(...args)
    while (!isDone(result) && typeof result?.value === "function") {
        console.log(result)//?
        result = result.value()
    }
    return result?.value
}

const tbTree = trampoline(makeBtree)

//const inorder = 

export class BinaryTree<T> {
    constructor(public root?: TreeNode<T>) {}

    isEmpty = () => !(this.root?.data ?? false)
    inTrav = (f, n?: TreeNode<T>) => {
      if (n ?? false) {
          this.inTrav(f, n.left)
          f(n)
          this.inTrav(f, n.right)
      }
    }
    preTrav = (f, n?: TreeNode<T>) => {
        if (n ?? false) {
            f(n)
            this.preTrav(f, n.left)
            this.preTrav(f, n.right)
        }
    }
    postTrav = (f, n?: TreeNode<T>) => {
        if (n ?? false) {
            this.postTrav(f, n.left)
            this.postTrav(f, n.right)
            f(n)
        }
    }

    //inorder = (f) => trampoline(this.inTrav)(f, this.root)

    public static of = <T>(a ?: any | T) => {
        if (a ?? false) {
            if (Array.isArray(a) && a.length > 0) {
                //if (isSorted(a)) return makeBST(a)
                return new BinaryTree(tbTree(a, 0, a.length))
            }
            return new BinaryTree(new TreeNode(a, 2))
        } else {
            return new BinaryTree()
        }
    }
     

}

const isSorted = (a: number[] | string[]) => {
    if (
        a.length === 1
        || (a.length === 2 && a[0] === a[a.length - 1])
    ) return true
    else if (a.length > 2 && a[0] === a[a.length - 1]) return false
    const dir = (a[0] < a[a.length - 1]) ? (p, c) => (p <= c) 
                                         : (p, c) => (p >= c)
    for (let i = 0; i < a.length - 2; i++) {
        if (!dir(a[i], a[i + 1])) return false
    }
    return true
}

const curryPower = b => x => Math.pow(b, x)
const sub = y => x => x - y
const add = x => y => x + y

const two = curryPower(2)

const twoN = n => 2**n
const makeBST = (sArr) => {
    const len = 31//sArr.length

    // Perfect Binary Tree Height === Log2(n) |> floor or Log2(n) - 1 |> ciel 
    const pHeight = compose(
        Math.ceil,
        Math.log2
    )((len + 1) / 2) //?
    

    console.log(((2**(pHeight + 1)) - (len + 1)))//?
    const imperfections = compose(
        sub(len)
    )(twoN(pHeight + 1)) //?

    TransduceIterableInto(sArr, compose(
        Transducers.map(TreeNode.of),
        Transducers.map(x => {
            console.log(x) //?
            return x
        })
    ), BinaryTree.of(), Reducers.swap)
}

const test = [1, 2, 3, 4, 5, 6, 7, 8, 9]

makeBST(test)




let acc = ""
const t = BinaryTree.of(test)
t.inTrav((v) => {
    
    console.log(v) //?
    acc += v.data //?
}, t.root) //?
//of("a")
acc //?
//BinaryTree.of().isEmpty() //?