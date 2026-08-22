const Counter = require('../models/Counter');
const { moneyToString } = require('../utils/money');

const nextTransactionId = async (transactionDate = new Date(), session) => {
  const year = transactionDate.getUTCFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `finance-${year}` },
    { $inc: { sequence: 1 } },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, session },
  );
  return `FIN-${year}-${String(counter.sequence).padStart(6, '0')}`;
};

const serializeDonation = (donation) => {
  const value = donation.toObject ? donation.toObject() : donation;
  return { ...value, amount: moneyToString(value.amount) };
};

const serializeTransaction = (transaction) => {
  const value = transaction.toObject ? transaction.toObject() : transaction;
  return { ...value, amount: moneyToString(value.amount) };
};

const formatCurrencyTotals = (rows) => Object.fromEntries(rows.map((row) => [
  row._id,
  {
    income: moneyToString(row.income),
    expense: moneyToString(row.expense),
    balance: moneyToString(row.balance),
  },
]));

module.exports = { nextTransactionId, serializeDonation, serializeTransaction, formatCurrencyTotals };
