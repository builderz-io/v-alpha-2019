# Value Instrument Alpha

# Ethereum Smart Contract Functions (excerpt)

Deploying contract with args

```
lifetimeInBlocks, generationAmount, blocksBetweenGenerationEvents
```

Adding accounts (role '10' for member)

```
addNewAccountAndApprove(accounts[0], 10);
addNewAccountAndApprove(accounts[1], 10);
addNewAccountAndApprove(accounts[2], 10);
etc...
```

Generating tokens

```
generateTokens({from: accounts[0]});
```

Creating a pool (role '1' for pool)

```
addNewAccountAndApprove(accounts[0], 1);
```

Transferring to a pool

```
transfer(poolAccount, 50000, {from: accounts[0]});
```

Requesting from a pool

```
requestFromPool(poolAccount, 100);
```
