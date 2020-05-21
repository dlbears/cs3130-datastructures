import { nulFalse } from './utility'
import { ICustomer, Reciept } from './Customer' 


export interface ITransaction {
    tid: string,
    id: string,
    operation: ('O' | 'P'),
    amount: number,
    itemName?: string,
    unitCost?: number
}

export const isTransaction = (x: any): x is ITransaction => {
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

export class Transaction implements ITransaction {
    tid: string
    _tid: number
    itemName?: string
    id: string
    operation: ('O' | 'P')
    amount: number
    unitCost?: number
    totalAdj: number

    private static _done: boolean = false
    private static _any: boolean = false
    private static _latest: Reciept = { cid: -1, tid: -2}
    private static _MAX: ITransaction = null

    static setMAX(t: ITransaction) { 
      this._MAX = t 
    }

    static getMAX() { 
      return this._MAX 
    }

    static latestProcessed(): Reciept {
      return this._latest
    }

    static any(): boolean {
      return this._any
    }

    static isDone(): boolean {
      return this._done
    }

    static done(): void {
      this._done = true
    }

    static toString(tx: ITransaction) {
      return JSON.stringify(tx,null,2)
    }

    private static present(t: ITransaction) {
      this._any = true
      const tid: number = parseInt(t.tid),
            cid: number = parseInt(t.id)
      if ((this._latest?.tid ?? -1) <= tid) {
        this._latest = {
          tid,
          cid
        }  
      } else {
        console.error("Transaction Data not in ascending order: undetermined behavior")
      }
    }

    constructor(t: ITransaction) {
      this.tid = t.tid
      this._tid = parseInt(t.tid)
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
    
    _getTotalAdj() {
      return this.totalAdj
    }
  
    belongsTo(c: ICustomer) {
      return this.id === c.id
    }
  
    invoice() {
      const type = this.itemName ?? "Payment"
      const maxItemSize = Transaction.getMAX().itemName.length
      const tabOverlap = (maxItemSize - type.length) % 4
      const rawTabs = Math.floor((maxItemSize - type.length) / 4)
      const tabs = tabOverlap > 0 ? rawTabs + 1 : rawTabs
      const typePost = new Array(tabs).fill("\t").join("")
      const op = this.operation === 'O' ? '+' : '-'
      const finAmount: string = Math.abs(this._getTotalAdj()).toFixed(2)
      const amountSpacing = new Array(7 - finAmount.length).fill(" ").join("")
      const res = `\t${this.tid}#\t${type.concat(typePost)}\t$${op}${amountSpacing.concat(finAmount)}\n`
      return res
    }
  
  }

  