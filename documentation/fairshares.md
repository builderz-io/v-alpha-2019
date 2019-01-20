# Value Instrument Alpha

# FairShares

This document outlines the concept for a token, which is given to contributors and stakeholders for their dedication, time spent, skill and knowledge provided to an organization. A contributor for that matter is everyone, who adds some form of _value of notable substance_ to the activity and the organization itself, called a Qualifying Contribution.

The concept of Qualifying Contributions stems from the work of [FairShares](http://www.fairshares.coop), which is a model for self-governing organizations with a multi-stakeholder approach to increasing value within and around such organization.


## Using the software to run a Fair Shares implementation

The software can be used in the context of a group running the Fair Shares model. In this case, the token design follows certain settings.

Here is an example:

```
exports.tokenDyn = {  // Fair Shares
                      baseTimeToZero: 60 * 60 * 24,  // token-lifetime in seconds // e.g. 60 * 60 * 24 is one day // Type Number (integer)
                      daysToZero: 360 * 200, // multiplier for token-lifetime in days // this can ALSO be seconds, if baseTimeToZero is set to 1 // Type Number (integer)
                      payout: 12,  // regular payout amount // expressed in tokens // Type Number (integer)
                      payoutInterval: 60 * 60 * 24,  // regular payout interval // expressed in sec // Maximum delay value is 24 days // Type Number (integer)
                      initialBalance: 12,  // initial balance on new accounts // expressed in tokens // Type Number (integer)
                      updateVisFreq: 60 * 60,  // how often the user interface updates // expressed in sec // Type Number (integer)
                      setTxFee: 0, // transaction fee // e.g. 0.5 for 50%, can also be 0 // Type Number (decimal)
                   }
```

## Value Instrument using FairShares

Value Instrument is using the Fair Shares Model to drive inclusivity of all stakeholders in the Value Instrument activity. What is defined as Qualifying Contributions will be developed and updated continuously and made available in [fairshares-vi.md](fairshares-vi.md).


### Technology

The token will be run using the Value Instrument Alpha software and made available through a link.

### Token Dynamics

The token creation will be split into time intervals to allow for more flexibility in governance, token-design and valuation given the status of the organization and its activities at the time.

The Value Instrument organization will initially create 200,000 tokens named __FS-One__, which are spendable until 31st December 2019. The remaining tokens are burned thereafter. __FS-One__ is given to contributors as per the list of definitions of Qualifying Contributions and remain valid indefinitely.

On 1st January 2020 the Value Instrument organization will create 200,000 new tokens named __FS-Two__, which are spendable until 31st December 2020. The remaining tokens are burned thereafter. __FS-Two__ is given to contributors as per the list of definitions of Qualifying Contributions and remain valid indefinitely. __FS-One__ tokens will be converted to __FS-Two__ tokens at a rate of 1 __FS-One__ = 1.15 __FS-Two__.

Following 1st January 2020 the Value Instrument organization will review this process and determine next steps and iterations.
