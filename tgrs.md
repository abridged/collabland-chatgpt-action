# Token Gating for Web3

Token gating uses ownership of digital assets to provide access control to
protected resources such as Discord channels or web site contents.

Let's break down token gating into a few important concepts:

## Assets

There are many types of digital assets that can be owned by certain entities
such as a person, an organization, or a community. Crypto communities usually
start with fungible or non-fungible tokens on various blockchain networks. Other
forms of digital assets emerge too, such as verifiable credentials that are
usually stored off-chain and can be shared and verified independent of issuers.
On the other hand, users probably have profiles, connections, and posts from
traditional web2 social/collaboration platforms. They are also valuable parts of
their digital portfolio.

- Fungible tokens (FT)
- Non-fungible tokens (NFT)
- Verifiable Credentials
- Social profiles/connections
- Diplomas/certificates

## Identities

Users bear multiple identifiers that are either self-issued or centrally
controlled by identity providers. Crypto wallets are specialized digital
identities.

- Discord user id
- Telegram user id
- Reddit user id
- Twitter account
- Google account
- Github account
- Decentralized ID (DID)
- Crypto wallets
- Email

## Ownership

Assets are issued or assigned to user identifiers to form ownership.

## Rules

Conditions to determine if a user's digital portfolio meet the criteria of
digital asset ownership. They can be quantity based or attribute based with
various predates.

## Access

Access can be granted to a user if his/her digital ownership satisfies rules
defined by a community or application.

- Discord server roles
- Telegram group member
- Reddit contributor

## JSON structure for trait based rules

- `asset` (including optional token ids)

  Format:

  ```
  <chain-type>:<chain-id-or-network>/<token-type>:<token-address>/<token-id>
  ```

  See https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md

  Examples:

  ```
  evm:1/ERC721:0x1FDf97e5beE48893EeF28116973ca81166e4EC02
  evm:1/ERC721:0x1FDf97e5beE48893EeF28116973ca81166e4EC02/1
  evm:1/ERC721:0x1FDf97e5beE48893EeF28116973ca81166e4EC02/1,5,10-100
  evm:1/ERC721:0x1FDf97e5beE48893EeF28116973ca81166e4EC02/1??,2*
  ```

- `tokenId` (One or more token ids, ranges, or wildcards separated by `,`). If
  not present, use token ids from the `asset`

- `condition` (and/or)

  - `and`: All filters need to be satisfied by tokens owned by an account
  - `or`: At least one of the filters need to be satisfied by tokens owned by an
    account

- `filters` (an array of per token filters to match trait type/value pairs with
  optional quantity of unique tokens)

  The following properties can be configured for each filter object:

  - `minCount`: Minimal count of unique tokens that match the traits
  - `maxCount`: Maximal count of unique tokens that match the traits
  - `condition` (and/or)
    - `and`: The token needs to have all trait type/value pairs
    - `or`: The token needs to have at least one of the trait type/value pairs
  - `traits`: A list of trait type/value pairs to match individual tokens. If
    not present or empty, any token can match the condition.
    - `trait_type`: Trait type (case insensitive and trimmed)
    - `value`: Trait value in string format (case insensitive and trimmed)

## Define trait based rules

1. Match individual tokens

   - Define a list of `trait_type` and `value` pairs, such as:

     - `{trait_type: 'Hair', value: 'Black'}`
     - `{trait_type: 'Eye', value: 'Brown'}`

   - Decide if `and` or `or` condition should apply the `trait_type` and `value`
     pairs against a single token

   - Optionally specify number of unique tokens that satisfies the filter at per
     token level
     - `minCount`
     - `maxCount`

2. Repeat 1 for other rules

3. Decide if `and` or `or` condition should apply the clauses against all tokens
   owned by an account

## Token gating rules as English sentences

Token gating rules can be phrased as English sentences as follows:

- To qualify for role <u>`${roleId}`</u>, a member must own at least
  <u>`${minCount}`</u> and at most <u>`${maxCount}`</u> number of unique
  <u>`${tokenType}`</u> tokens managed by contract <u>`${tokenAddress}`</u> on
  <u>`${chainType}`</u> <u>`${chainNetworkOrId}`</u>. The traits of each token
  must have <u>`ALL`|`ANY`</u> of the following type/value pairs:
  - <u>`${trait_type}`</u>: <u>`${value}`</u>
  - <u>`${trait_type}`</u>: <u>`${value}`</u>

For example,

- To qualify for role **123456789**, a member must own at least **1** and at
  most **5** number of unique **ERC721** tokens managed by contract
  **0x1FDf97e5beE48893EeF28116973ca81166e4EC02** on **evm** **mainnet**. The
  traits of each token must have **ALL** of the following type/value pairs:
  - **background**: **blue**
  - **eye**: **brown**

## References

### Sample TGRs

```json
[
  {
    "version": "1.0.0",
    "roleId": "1000170687689920512",
    "chainId": 137,
    "minToken": "1",
    "contractAddress": "0xe9B8160F83c7ac31577ee6722684EA657B267e35",
    "type": "ERC721"
  },
  {
    "version": "1.0.0",
    "tokenId": "2nPkG7zgW8Edr5eNhbaJ1RqNgx6Ds4ZsRM8qTRBNe2i1",
    "name": "Degen Whale",
    "roleId": "1022118100830802004",
    "chainId": 8000000000101,
    "minToken": "5",
    "contractAddress": "creators",
    "type": "SOLANA_NFT"
  },
  {
    "version": "1.0.0",
    "name": "Okay Bear holder",
    "roleId": "1000023899439902775",
    "chainId": 8000000000101,
    "minToken": "1",
    "contractAddress": "CJk8TvAXcq1cvC85M9aMQCxPMkTCSuWN5HsFEgAjh4ut",
    "type": "SOLANA_FT"
  },
  {
    "version": "1.0.0",
    "roleId": "1000061131446038648",
    "chainId": 1,
    "minToken": "1",
    "contractAddress": "0xA1a42be4f0421e86590674065520104657b6eB84",
    "type": "ERC20"
  },
  {
    "version": "1.0.0",
    "tokenId": "0xbeeba235b4b740eedf9411ac617aac6cea5546ccff678bd19d8c0de3c10c794f,0xb9e799e323c46293adc30aa999e6e3b9cecaeaf17298be44001b5961c7ebd587",
    "name": "OG holder",
    "roleId": "1011551663313666098",
    "chainId": 8000000000701,
    "minToken": "1",
    "contractAddress": "0x7364e22fc55536c18f5cbf9afd82f1fa9fdccc7e",
    "type": "LOOPRING_NFT"
  },
  {
    "version": "1.0.0",
    "tokenId": "12382299798866046354843276329909118056248259593254812422227920898302362517754",
    "maxToken": "1",
    "name": "Stoned Dawgz WL Pass",
    "roleId": "1005380042378985512",
    "chainId": 137,
    "minToken": "1",
    "contractAddress": "0x2953399124F0cBB46d2CbACD8A89cF0599974963",
    "type": "ERC1155"
  },
  {
    "version": "1.0.0",
    "collectionName": "conanscircle",
    "name": "holder",
    "roleId": "1004407674521276519",
    "chainId": 1,
    "minToken": "1",
    "type": "OPEN_SEA"
  },
  {
    "version": "1.0.0",
    "name": "Verified Holder of 1 Ghosts Protocol",
    "roleId": "1001642266542219365",
    "chainId": 8000000000401,
    "minToken": "1",
    "contractAddress": "KT1D81ov1zhDoZAz7C6qVzijsX3TkVwVVVus",
    "type": "TEZOS_FA2"
  },
  {
    "version": "1.0.0",
    "name": "Membooooor",
    "roleId": "1012793732170526801",
    "chainId": 8000000000501,
    "minToken": "1",
    "contractAddress": "https://singular.app/collectibles/kusama/36af143c6012f6266b-YOUDLE_TIX",
    "type": "RMRK"
  },
  {
    "eventId": "63826",
    "version": "1.0.0",
    "name": "POAP holder only",
    "roleId": "1012689862782103554",
    "chainId": 100,
    "contractAddress": "POAP",
    "type": "POAP"
  },
  {
    "version": "1.0.0",
    "name": "studio nancy",
    "roleId": "1004492076920086618",
    "chainId": 8000000000701,
    "minToken": "1",
    "contractAddress": "0x59584c7F16867Ce5f77c0b31421Fb18149b1AE64",
    "type": "LOOPRING_FT"
  },
  {
    "scheme": "BEP721",
    "version": "2.1.0",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "evm:56/ERC721:0x458AEE8b453F0d0FF22D8aab4FC1D10026a62068",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "minCount": "1",
            "traits": [
              {
                "value": "Daze",
                "trait_type": "Body Type"
              }
            ]
          }
        ]
      }
    },
    "name": "Daze",
    "asset": "evm:56/ERC721:0x458AEE8b453F0d0FF22D8aab4FC1D10026a62068",
    "roleId": "1031468061838016552",
    "requiresMetadata": true,
    "contractAddress": "0x458AEE8b453F0d0FF22D8aab4FC1D10026a62068"
  },
  {
    "version": "1.0.0",
    "name": "Anatomica",
    "roleId": "1008253836974100512",
    "chainId": 8000000000401,
    "minToken": "0",
    "contractAddress": "KT1Veg8r2PAH7uYV4RpRQAxJcSGT7N55CDWm",
    "type": "TEZOS_FA1.2"
  },
  {
    "version": "1.0.0",
    "roleId": "1009345458533044254",
    "chainId": 0,
    "minToken": "1",
    "contractAddress": "0xf0f92d35c7f45eb93b518d7d61eb1a4c49a26776",
    "type": "NIFTY"
  },
  {
    "scheme": "flow",
    "version": "2.1.0",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "flow:mainnet/NFT:A.0b2a3299cc857e29.TopShot.MomentCollectionPublic.MomentCollection",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "traits": [
              {
                "value": "25",
                "trait_type": "Rookie Premiere"
              }
            ]
          }
        ]
      }
    },
    "name": "25  Four Badges",
    "asset": "flow:mainnet/NFT:A.0b2a3299cc857e29.TopShot.MomentCollectionPublic.MomentCollection",
    "roleId": "1012059140031529073",
    "requiresMetadata": true,
    "contractAddress": "A.0b2a3299cc857e29.TopShot.MomentCollectionPublic.MomentCollection"
  },
  {
    "version": "1.0.0",
    "roleId": "1022060113772679178",
    "chainId": 8000000000601,
    "minToken": "1",
    "contractAddress": "0x059df550c89bebee3808b2256d76001e1a3703817e04781c17bd75b17b4959f2",
    "type": "IMMUTABLE_X"
  },
  {
    "version": "2.1.0",
    "scheme": "solana",
    "tokenId": "53rBE38kLiU2phhXYZiesbDvqQ7gnFgXStceaW7LswaC",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "solana:mainnet-beta/NFT:masterEditions/53rBE38kLiU2phhXYZiesbDvqQ7gnFgXStceaW7LswaC",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "minCount": "1",
            "traits": [
              {
                "value": "gold (legendary)",
                "trait_type": "leaf"
              }
            ]
          }
        ]
      }
    },
    "name": "Holder",
    "asset": "solana:mainnet-beta/NFT:masterEditions/53rBE38kLiU2phhXYZiesbDvqQ7gnFgXStceaW7LswaC",
    "roleId": "1031946884262141992",
    "requiresMetadata": true,
    "contractAddress": "masterEditions"
  },
  {
    "version": "1.0.0",
    "name": "flow holder verify",
    "roleId": "1015335185484623952",
    "chainId": 8000000000001,
    "minToken": "1",
    "contractAddress": "A.8529aaf64c168952.MonoCatMysteryBox.MonoCatMysteryBoxCollectionPublic.MonoCatMysteryBox.CollectionPublicPath",
    "type": "FLOW_NFT"
  },
  {
    "version": "1.0.0",
    "name": "default member role",
    "roleId": "1017982374648238121",
    "chainId": 137,
    "minToken": "1",
    "contractAddress": "0x60b045739a72E0Ce7f3C4803910B8905d4887465",
    "type": "Moloch"
  },
  {
    "scheme": "immutable_x",
    "version": "2.1.0",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "immutable_x:mainnet/IMMUTABLE_X:0x6465ef3009f3c474774f4afb607a5d600ea71d95",
        "condition": "and",
        "filters": [
          {
            "condition": "or",
            "minCount": "1",
            "traits": [
              {
                "value": "0",
                "trait_type": "Generation"
              }
            ]
          }
        ]
      }
    },
    "name": "BitVerse Gen 0 Owner",
    "asset": "immutable_x:mainnet/IMMUTABLE_X:0x6465ef3009f3c474774f4afb607a5d600ea71d95",
    "roleId": "1042341770459095080",
    "requiresMetadata": true,
    "classifierGroup": "TPC",
    "contractAddress": "0x6465ef3009f3c474774f4afb607a5d600ea71d95"
  },
  {
    "version": "1.0.0",
    "name": "Hold a minimum of 700 $SJSP to vote on proposals.",
    "roleId": "1052632850798743643",
    "chainId": 1,
    "minToken": "100",
    "tokenSymbol": "SJSP",
    "classifierGroup": "TPC",
    "type": "ROLL"
  },
  {
    "version": "1.0.0",
    "name": "Onyx NFT Holders",
    "roleId": "1034124196449628280",
    "chainId": 8000000000001,
    "minToken": "0",
    "contractAddress": "A.ce3935ac21d0d8ad.LegaciCollectible.._",
    "type": "FLOW_FT"
  },
  {
    "scheme": "superfluid",
    "version": "2.1.0",
    "query": "superfluid",
    "variables": {
      "_asset": "evm:137/ERC777:0xCAa7349CEA390F89641fe306D93591f87595dc1F",
      "_minMonthlyRate": "10",
      "_to": "0x6DB7723713dD8a79E3b7B5b5bB7B6a911DdB94C9"
    },
    "name": "Member",
    "asset": "evm:137/ERC777:0xCAa7349CEA390F89641fe306D93591f87595dc1F",
    "roleId": "1036600823909724200",
    "chainId": 137,
    "contractAddress": "0xCAa7349CEA390F89641fe306D93591f87595dc1F",
    "type": "ERC777"
  },
  {
    "version": "1.0.0",
    "roleId": "1044693666427572224",
    "chainId": 8000000000801,
    "minToken": "1",
    "classifierGroup": "TPC",
    "contractAddress": "rpQswJ4LGExnzzFS57gzNZPeS495UpZxYh.21560",
    "type": "XRPL_NFT"
  },
  {
    "scheme": "gnosis",
    "version": "2.1.0",
    "query": "",
    "name": "King Kong",
    "asset": "evm:56/gnosis:0xb0147F1a001c890C7040146D6704CeCf56F10F7F",
    "roleId": "1047630614393782333",
    "classifierGroup": "TPC"
  },
  {
    "version": "1.0.0",
    "name": "Token holders added to whitelist",
    "roleId": "1048189542353604618",
    "chainId": 8000000000801,
    "minToken": "1000000000",
    "classifierGroup": "TPC",
    "contractAddress": "47616C6178790000000000000000000000000000.r3Si5cWtHZZuKXQERoaTKc7Vhw53RdGi2A",
    "type": "XRPL_FT"
  },
  {
    "version": "1.0.0",
    "collectionName": "Coco",
    "roleId": "1051439242573795358",
    "chainId": 1,
    "minToken": "0",
    "classifierGroup": "TPC",
    "contractAddress": "0x0Df016Fb18ef4195b2CF9d8623E236272ec52e14",
    "type": "staking"
  },
  {
    "scheme": "tezos",
    "version": "2.1.0",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "tezos:mainnet/FA2:KT1NVvPsNDChrLRH5K2cy6Sc9r1uuUwdiZQd",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "minCount": "1",
            "traits": [
              {
                "value": "Bronze",
                "trait_type": "Rarity tier"
              }
            ]
          }
        ]
      }
    },
    "name": "Bronzie",
    "asset": "tezos:mainnet/FA2:KT1NVvPsNDChrLRH5K2cy6Sc9r1uuUwdiZQd",
    "roleId": "1052426089756119110",
    "requiresMetadata": true,
    "classifierGroup": "TPC",
    "contractAddress": "KT1NVvPsNDChrLRH5K2cy6Sc9r1uuUwdiZQd"
  },
  {
    "minToken": "1",
    "maxToken": "-5",
    "roleId": "906953414905307146",
    "type": "MOCA"
  },
  {
    "chainId": 100,
    "minToken": "10",
    "contractAddress": "0x58234d4bf7a83693dc0815d97189ed7d188f6981",
    "roleId": "683005771516346513",
    "type": "MOLOCH"
  },
  {
    "scheme": "VC",
    "version": "2.1.0",
    "query": "$ownsTraits($, $_filter)",
    "variables": {
      "_filter": {
        "asset": "veramo:collabland/vc:vc",
        "condition": "or",
        "filters": [
          {
            "condition": "and",
            "traits": [
              {
                "value": "DIS#COMM#709210493549674598:Rp0WAw8R5QBLwEPBHpxB2:952622238069297205",
                "trait_type": "warcamp-temp"
              }
            ]
          }
        ]
      }
    },
    "asset": "veramo:collabland/vc:vc",
    "roleId": "952622238069297205",
    "minToken": "1",
    "platform": "discord",
    "requiresMetadata": true,
    "type": "GUESTPASS"
  },
  {
    "name": "$EG Holder",
    "roleId": "956712827756904458",
    "chainId": 56,
    "minToken": "1000000",
    "contractAddress": "0x2A9718defF471f3Bb91FA0ECEAB14154F150a385",
    "type": "BEP20"
  },
  {
    "scheme": "role_composition",
    "query": "",
    "variables": {
      "roleComposition": {
        "action": "addOrRemove",
        "condition": {
          "1040721410210930832": true,
          "1040724505389182976": true
        },
        "operator": "and"
      }
    },
    "asset": "roles:roles/roles:roles",
    "roleId": "1040726323921952868"
  },
  {
    "scheme": "twitter",
    "version": "2.1.0",
    "query": "$ownsTraits($, $_filter)",
    "requiresMetadata": true,
    "variables": {
      "_filter": {
        "asset": "twitter:twitter/profile:data",
        "condition": "or",
        "filters": [
          {
            "traits": [
              {
                "value": "$contains($, 'link3.to')",
                "trait_type": "description"
              }
            ]
          }
        ]
      }
    },
    "asset": "twitter:twitter/profile:data",
    "roleId": "1047341166401687662"
  },
  {
    "scheme": "OPENSEA",
    "version": "2.1.0",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "evm:1/OPENSEA:pwrfwd-charter-club-jacket",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "traits": [
              {
                "value": "Discord",
                "trait_type": "Perk"
              }
            ]
          }
        ]
      }
    },
    "collectionName": "pwrfwd-charter-club-jacket",
    "name": "Charter Club Jacket Holder",
    "asset": "evm:1/OPENSEA:pwrfwd-charter-club-jacket",
    "roleId": "923219692594810912",
    "chainId": 1,
    "minToken": "1",
    "requiresMetadata": true
  },
  {
    "version": "2.1.0",
    "scheme": "xrpl",
    "query": "#ownsTraits",
    "variables": {
      "_filter": {
        "asset": "xrpl:mainnet/NFT:rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y.taxon",
        "condition": "and",
        "filters": [
          {
            "condition": "and",
            "traits": [
              {
                "value": "test",
                "trait_type": "test"
              }
            ]
          }
        ]
      }
    },
    "name": "test2",
    "asset": "xrpl:mainnet/NFT:rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y.taxon",
    "roleId": "913562535058362388",
    "requiresMetadata": true,
    "contractAddress": "rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y.taxon"
  },
  {
    "version": "1.0.0",
    "name": "first tgr_updatedc",
    "roleId": "969674768452313188",
    "chainId": 39,
    "minToken": "0",
    "contractAddress": "desktop",
    "type": "ERC2ads0"
  },
  {
    "chainId": 1,
    "minToken": 1,
    "contractAddress": "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB",
    "functionName": "balanceOf",
    "type": "CUSTOM_ABI"
  },
  {
    "swapScore": 10000,
    "chainId": 1,
    "type": "TRUST_SWAP"
  },
  {
    "chainId": 1,
    "tokenId": "/addTPC TEL#COMM#-1001571322996 CUSTOM_ABI",
    "minToken": 0,
    "contractAddress": "/addTPC TEL#COMM#-1001571322996 CUSTOM_ABI",
    "type": "NFTY.INK"
  }
]
```

