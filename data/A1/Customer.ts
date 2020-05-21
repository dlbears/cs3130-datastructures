import { Transaction, ITransaction } from './Transaction'
import { nulFalse, finCell } from './utility'

export interface ICustomer {
    id: string,
    name: string,
    balance: number
}

export const isCustomer = (x: any): x is ICustomer => {
  const _x = x as ICustomer
  if (nulFalse(
      _x.id,
      _x.name) && 
      typeof _x.balance === "number") {
      return true
  } 
  return false
}

export interface Reciept {
  cid: number,
  tid: number
}

export class Customer implements ICustomer {
    id: string
    _id: number
    name: string
    balance: number
  
    previousBalance: number
    transactions: Transaction[]
    private _modified: boolean = false

    private static _done: boolean = false
    private static _latestModified: Reciept = null
    private static _anyModified: boolean = false

    static done() {
      this._done = true
    }

    static isDone() {
      return this._done
    }

    static any(): boolean {
      return this._anyModified
    }

    static getLatestModified() {
      return this._latestModified
    }
    
    private static handleLatest(cid: number, { _tid: tid }) {

      if ((this.getLatestModified()?.cid ?? -1) > cid) console.error("Customers not in ascending order: undetermined behavior") 
      if ((this.getLatestModified()?.tid ?? -1) === tid) console.error("Duplicate Transaction IDs")
      this._latestModified = {
        cid,
        tid
      }
    }

    constructor(c: ICustomer) {
      this.id = c.id
      this._id = parseInt(c.id)
      this.name = c.name
      this.balance = this.previousBalance = c.balance
      this.transactions = []
    }

    isModified() {
      return this._modified
    }
  
    applyTransaction(t: Transaction) {
      this._modified = true
      Customer.handleLatest(this._id, t)

      this.transactions = this.transactions.concat(t)
      console.log(`Tx#: ${t.tid}, amount: ${t.amount}, totalAdj: ${t._getTotalAdj()}, OldBalance: ${this.balance}, NewBalance: ${this.balance + t._getTotalAdj()}`)
      this.balance += t._getTotalAdj()
      return t
    }

    generateInvoice(): string {
      const name = this.name,
            id = this.id,
            previousBalance = this.previousBalance.toFixed(2),
            balanceDue = this.balance.toFixed(2),
            transactions = this.transactions.map(t => t.invoice()).join("")
      
      const amountSpacing = numStr => new Array(7 - numStr.length).fill(" ").join("")
      return (`${name}\t${id}\nPREVIOUS BALANCE\t\t\t\t\t$ ${amountSpacing(previousBalance)}${previousBalance}\n${transactions}BALANCE DUE\t\t\t\t\t\t\t$ ${amountSpacing(balanceDue)}${balanceDue}\n\n`)
    }  
}