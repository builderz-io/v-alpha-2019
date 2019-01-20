# Value Instrument Alpha

# Manual

This manual describes the functionalities that this implementation of the Value Instrument's four principles for monetary design offers.

Installing and running this alpha will give you an online-banking-web-app with a chat-like user interface. It includes functionalities such as crowdfunding, mapping and a Fair Shares management option.

You will be able to experience a demurrage-token first hand!


## Principles presented in this alpha

* You get a payout on a regular basis.
* You burn the amounts received, if not used within their lifetime.
* Your received amounts always have fully renewed lifetime.
* You pay a transaction fee, to avoid ping-pong transfers for regaining new lifetime.


## Fair Shares

Value Instrument is deploying its software in the context of FairShares. You can read about the concept in [fairshares.md](fairshares.md).

Also visit fairshares.coop for more information on the concept of FairShares and Qualifying Contributions


## Installing

Refer to the [README.md](README.md) file to get started with your own install


## Balance and Lifetime

The purple circle displays the lifetime of your funds as percentage of the total possible lifetime.

In the midst of the circle you find your current _spendable_ balance.


## Names of Entities

All users and accounts created - e.g. for pools - are called "entities".

Entities can have up to 3 words as their name/title
```
Jeanclaude Van Damme
```
or
```
Bob
```
or
```
Build Garden Tables
```


## Tags of Entities

Entities will be allocated a 4-digit tag automatically:
```
#2121
```
Users can choose the same name or title for their accounts during creation. They will be allocated a different 4-digit tag automatically:

```
#8454
```
Note that the 1st and 3rd number of this tag will never be the same and the 2nd and 4th will always be.


## Using Names and Tags together

Performing a transaction or any entity management function requires the entity name and entity tag to be used together. Hence you must know the tag of the entity you want to address.

E.g.

```
send 5 to jeanclaude van damme #2121
```
or
```
verify jeanclaude van damme #2121
```

## Creating Community Admins

In a deployed version of this software someone has to verify users. By default, only a community-admin can verify an entity. You can verify entities by logging into any community-admin account, which have to be setup first. Other than their ability to manage entities, community-admin accounts have all the same functionality as normal accounts.

To create a community-admin account

1. Log into the community account (as defined in systemInit):

```
To log in, use the "commuPhrase" you set in systemInit starting with "vx"
```

2. Add admins to this account:

```
makeadmin chosen-name-here-with-tag
```

You should at first use one or several of the admin users you set in systemInit here.


## Managing Entities (community admins only)

To manage entities, the following commands are available when being logged in as a community admin account (enter into the chat message field):

You can verify entities

```
verify jeanclaude van damme #2121
```

You can disable entities

```
disable jeanclaude van damme #2121
```

You can also re-enable entities

```
enable jeanclaude van damme #2121
```


## Add Admins to Entities (anyone)

You can add admins to entities. When creating pools or other entities they generally have to be managed. You can add others as admins to the entities/accounts you created.

```
makeadmin jeanclaude van damme #2121
```

And you can also revoke admins from entities

```
revokeadmin jeanclaude van damme #2121
```


## Sending Funds

Sending funds from your account to another is triggered by entering one of the following commands into the chat message field:

```
send 5 to jeanclaude van damme #2121 | ... you can omit the word "to" also
```

```
send bob #2121 5
```

```
+5 jeanclaude van damme #2121
```


## Include a reference

You can include a useful reference for the transaction by using the word "for":

```
send 45 to jeanclaude van damme #2121 for building my garden tables
```


## Requesting Funds

The request command allows you to withdraw funds from pools. This is practical to avoid micromanaging budgets. Note that you have to include a reference for the transaction here. This is triggered by entering the following into the chat message field:

```
request 70 from an-available-pool-with-tag for helping to build the tables in the garden | ... you can omit the word "from" also
```
in short
```
-70 an-available-pool-with-tag for helping to build the tables in the garden
```

## Transferring Funds

The transfer command saves you time when wanting to send funds from an account you created (like a pool or offer, etc...) to any other. You dont have to log into that account. Note that you have to include a reference for the transaction here. This is triggered by entering the following into the chat message field:

```
transfer 70 from the-account-you-created-with-tag to entity-with-tag for helping to build the chairs in the garden
```

## Adding Funds

You can use the chat message field as a calculator (adding and subtracting only)

```
send 8 10 27 -3 bob #2121
```
The above will result in 42 being sent to Bob


## Send to several recipients

You can use the chat message field as a calculator

```
send 21 bob #2121 jeanclaude van damme #2121 peter #8232
```
The above will result in 21 being sent to Bob, Jeanclaude and Peter


## Creating Pools and other Entity accounts

Use the menu to navigate to pools or other entities and use the plus button in the bottom right corner to add entities.

You can find then also in your profile, once added.


## View and Download Transaction History

You can access the transaction history by clicking on the purple circles or via the menu. You can download the history as CSV also via the menu.


## View Your Profile

You can access your profile via the menu. The profile page displays useful information about your personal account.


## View the Community Profile

You can access the community profile via the menu. The community page displays useful information and statistics about the community, the token and where else to find the community on the web.
