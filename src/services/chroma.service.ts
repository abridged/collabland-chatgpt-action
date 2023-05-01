// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar, stringify} from '@collabland/common';
import {ChromaClient, Collection, OpenAIEmbeddingFunction} from 'chromadb';

const text1 = `How do I claim $COLLAB?
The COLLAB token claim will happen only on wagmi.collab.land (this page) starting on February 23 at 6 pm MT, 2023.

1. Start your claim and choose to authorize your Discord or Telegram account. If you wish to authorize both, you will go through the token claim again. If you are a Collab.Land Membership NFT or Patron NFT holder, join the Collab.Land Discord and claim your role before continuing with the token claim process.

2. Follow the steps to learn about $COLLAB and the Collab.Land DAO.

3. Once your distribution is determined, you will submit the Ethereum wallet address you wish to send your tokens. No message signature is required.

4. Collab.Land will send COLLAB tokens to that wallet address.

NOTE: you DO NOT need to sign a message with your wallet or pay gas to claim.

The COLLAB token and upcoming DAO will be launched on Optimism. To claim $COLLAB, recipients can use their desired Ethereum wallet address. However, to see their $COLLAB in their Optimism wallets and to participate in DAO governance, holders will need to add the Optimism network to their wallet.

See how to use Optimism on Metamask.

What is the Top 100 Communities token claim about?
This is something the core team is incredibly proud and excited about, allowing our Top 100 Discord communities to determine how they want to use or distribute 15% of the total $COLLAB supply.

These communities were chosen based on three factors. First, the number of verified wallets connected to a given community. Second, the number of days a given community has been using the Collab.Land bot. And third, has met the minimum activity threshold determined by the core team.

How do the top 100 Discord communities claim their $COLLAB distribution?
In order to claim tokens, each of the Top 100 communities must go through the Community Claim Process. The goal is to propose a unique and creative mechanism for how they will use and/or distribute the tokens. Top 100 communities can learn more in this Mirror article.

We encourage all Top 100 communities that have been allocated COLLAB tokens to begin discussions with the core team via the Collab.Land Discord.`;

const text2 = `What is the COLLAB token distribution?
The COLLAB token distribution is as follows:

1. DAO Treasury = 50% (500MM) (reserved for future distributions and use)

2. Team/Investors/Partners = 25% (250MM)

3. Retroactive Distribution = 25% (250MM)

The DAO Treasury will hold 50% of the total supply of $COLLAB. This allocation serves as the long-term community reserves, and we anticipate that proposals will be made into the future to allocate these tokens towards different community initiatives, including grants, airdrops, and other incentive / distribution programs.

We expect the DAO to distribute tokens to many Collab.Land contributors, members and communities on an ongoing basis.

The Collab.Land core team, investors, and partners have been allocated 25% of the total supply. This represents the time, energy and investment that they have put towards Collab.Land in the close to 3 years since the project was formed. They have a four-year time-based vesting schedule with a one-year cliff.





For the Retroactive Distribution, the breakdown of token distribution is as follows:

1. Top 100 Discord Communities = 60%

2. Collab.Land Patron NFT Holders (token numbers 0-141) = 16%

3. Collab.Land Membership NFT Holders = 16%

4. Verified Community Members as of 2/14/23 = 8%


Any tokens that remain unclaimed on 5/23/23 will return to the DAO Treasury.`;

async function main() {
  const client = new ChromaClient();
  await client.reset();
  const embedder = new OpenAIEmbeddingFunction(getEnvVar('OPENAI_API_KEY')!);

  // use directly
  const embeddings = await embedder.generate([text1, text2]);
  console.log('Embeddings: %O', embeddings);

  // pass documents to query for .add and .query
  let collection: Collection;

  collection = await client.createCollection(
    'collabland-token-story',
    {},
    embedder,
  );

  console.log('Collection: %O', collection.name);
  await collection.add(
    ['id1', 'id2'],
    undefined,
    [{source: 'my_source'}, {source: 'my_source'}],
    [text1, text2],
  );
  await collection.createIndex();
  const results = await collection.query(undefined, 2, undefined, [
    'What is the supply of Collab token?',
  ]);
  console.log('%s', stringify(results));
}

await main();
