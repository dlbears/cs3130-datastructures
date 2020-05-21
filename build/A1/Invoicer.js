"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const utility_1 = require("./utility");
const Transaction_1 = require("./Transaction");
const AMOUNT_LENGTH_MAX = (_a = Transaction_1.Transaction.getMAX()) === null || _a === void 0 ? void 0 : _a.amount.toFixed(2).length;
const spaceBoundFormatter = utility_1.compose(utility_1.defaultTo(Number.MAX_SAFE_INTEGER), utility_1.finCell);
const spacedFormatter = utility_1.compose(boundedFormatter(AMOUNT_LENGTH_MAX))(" ");
const financialFormatter = utility_1.compose(defaultToMaxSafeInt);
const InvoiceTemplate = (name, id, previousBalance, balanceDue) => transactions => `${name}\t${id}\nPREVIOUS BALANCE\t\t\t\t\t$ ${previousBalance}\n${transactions}BALANCE DUE\t\t\t\t\t\t\t$ ${balanceDue}\n\n`;
const TransactionTemplate = `\t${tid}#\t${type.concat(typePost)}\t$${operation}${amountSpacing.concat(finAmount)}`;
const Invoicer = (c) => {
    const name = this.name, id = this.id, previousBalance = this.previousBalance.toFixed(2), balanceDue = this.balance.toFixed(2), transactions = this.transactions.map(t => t.invoice()).join("\n");
    return ();
};
//# sourceMappingURL=Invoicer.js.map