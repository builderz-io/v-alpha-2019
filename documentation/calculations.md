# Value Instrument Alpha

# Calculations

This document outlines the specifics of the technical implementation of the Value Instrument token design.

## On Chain Data Points

The following three data points are stored on-chain:

- Account Balance
- Balance’s Time-To-Zero
- Time of last account activity (last transaction)

Each transaction writes a new set of these three data points into the chain.

The following explains how the new set is calculated.


## a) Determine new Account Balance

### Sender

New Sender Account Balance = Burned Sender Account Balance - Sent Amount - Transaction Fee[1] - Community Tax[2]

### Recipient

New Recipient Account Balance = Burned Recipient Account Balance + Received Amount - Community Tax**

[1] burned on transaction
[2] optional, transferred automatically to community account

## Determine burned account balance

When a new transaction happens, the stored on-chain Account Balances of sender and recipient have ‘burned’ some of their stored amounts. The burned amount is not shown on-chain, the on-chain data is somewhat “out of date”. When calculating the new Account Balances, we have to first determine the “actual” account balance.

Burned Account Balance = On-Chain Balance - ( On-Chain Balance /  (Full Lifetime / ( New Transaction Time - Time of last account activity ) )[3] )

[3] given linear burning behaviour


## b) Determine new Time-To-Zero

When a new transaction happens, the stored on-chain Time-To-Zero of sender and recipient have to be updated. This is easy for the sender account: we just subtract the time passed from the time stored.

For the recipient, the calculation it is a little more advanced. Here we take into account that the recipient has an account balance with a lifetime and receives a new amount with full life time. Both lifetimes are now calculated into one new total lifetime, given their weight, according to the Burned Balance amount and new transaction amount.

### Recipient

New Recipient Time-To-Zero = ( Recipient last Account Activity + Recipient Balance Time-To-Zero - New Transaction Time ) * ( Burned Recipient Account Balance / New Recipient Account Balance ) + Full Lifetime * ( Received Amount / New Recipient Account Balance )


### Sender

New Sender Time-To-Zero = Sender last Account Activity + Sender Balance Time-To-Zero - New Transaction Time


## c) Set time of last activity

When a new transaction happens, the stored on-chain Time of last account activity of sender and recipient have to be updated to the time of the transaction.
