// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {generateIdSync, getEnvVar} from '@collabland/common';
import {Vector} from '@pinecone-database/pinecone';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {TokenTextSplitter} from 'langchain/text_splitter';

import {loadSecrets} from '@collabland/aws';
import {Document} from 'langchain/document';
import {PuppeteerWebBaseLoader} from 'langchain/document_loaders/web/puppeteer';
import {PineconeVectorStoreService} from './pinecone.js';

async function loadUrl(url: string) {
  /**
   * Loader uses `page.evaluate(() => document.body.innerHTML)`
   * as default evaluate function
   **/
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: {
      headless: true,
    },
    gotoOptions: {
      waitUntil: 'domcontentloaded',
    },
  });

  const docs = await loader.load();
  console.log(docs);
  return docs;
}

const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes));
};

const sliceIntoChunks = (arr: Vector[], chunkSize: number) => {
  return Array.from({length: Math.ceil(arr.length / chunkSize)}, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize),
  );
};

export async function main(url: string) {
  await loadSecrets();
  const pineconeIndexName = getEnvVar('PINECONE_INDEX_NAME')!;

  const pinecone = new PineconeVectorStoreService();

  const pages: Document<Record<string, any>>[] = [];

  const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 300,
    chunkOverlap: 20,
  });

  pages.push({
    pageContent: tokenStory,
    metadata: {
      source: url,
    },
  });

  const documents = await splitter.splitDocuments(pages);

  console.log('Documents: %O', documents);

  const index = await pinecone.getIndex(pineconeIndexName);
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-ada-002',
  });

  //Embed the documents
  const getEmbeddings = async () => {
    return await Promise.all(
      documents.map(async doc => {
        const embedding = await embedder.embedQuery(doc.pageContent);
        return {
          id: generateIdSync(),
          values: embedding,
          metadata: {
            chunk: doc.pageContent,
            text: truncateStringByBytes(doc.pageContent, 36000),
            url: doc.metadata.source as string,
          },
        } as Vector;
      }),
    );
  };

  let vectors: Vector[] = [];

  vectors = (await getEmbeddings()) as unknown as Vector[];

  const chunks = sliceIntoChunks(vectors, 10);

  await Promise.all(
    chunks.map(async chunk => {
      index &&
        (await index.upsert({
          upsertRequest: {
            vectors: chunk as Vector[],
          },
        }));
    }),
  );
}

const tokenStory = `
What is the Collab.Land token?
COLLAB token is primarily for governance and use within the Collab.Land ecosystem. Decentralization is one of our core values, and today we open the gates of community stewardship to you. If you choose to join us, we will govern together as the Collab.Land DAO. We will vote on feature requests, offer bounties, curate the Marketplace, and more.

The token claim will begin on February 23 at 6 pm Mountain Time (MT), 2023 on wagmi.collab.land.

Official COLLAB token contract is 0x8B21e9b7dAF2c4325bf3D18c1BeB79A347fE902A on Optimism .

Any contract activity or transactions prior to February 23 at 6 pm Mountain Time (MT), 2023, are for verification purposes and system reliability.

Who is eligible for the Collab.Land token?
The following four groups are eligible for a sponsored claim. A sponsored claim means that Collab.Land is not requiring claimants to pay gas. This also means that no wallet connection is required.

1. Verified Community Members in Discord or Telegram

2. Collab.Land’s Top 100 Discord communities based on membership, longevity, and activity

3. Collab.Land Patron NFT holders (token numbers 0-141)

4. Collab.Land Membership NFT holders

For groups #1 and #2, the snapshot was taken on 02/14/23.

For #3 and #4, NFTs can each claim tokens once.

What is the token claim period?
Tokens can be claimed starting on February 23 at 6 pm MT, 2023 until May 23, 2023.

How do I claim $COLLAB?
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

We encourage all Top 100 communities that have been allocated COLLAB tokens to begin discussions with the core team via the Collab.Land Discord.


What is the COLLAB token distribution?
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


Any tokens that remain unclaimed on 5/23/23 will return to the DAO Treasury.



What is the Collab.Land DAO?
The Collab.Land DAO (legal entity: Collab.Land Co-op) is focused on building a trusted ecosystem to enable greater value-alignment and cooperation within web3 projects. Bringing together thousands of different communities under one roof and allowing them to work together to identify and build the most effective tools to coordinate.

The DAO is made up of the community of COLLAB token holders. Any token holder is welcome to join the Discord and verify their membership with the Collab.Land bot.

The work of the Collab.Land Co-op happens in different ways. One of the DAO’s primary functions is to oversee the Collab.Land Marketplace. DAO members will curate and review new apps submitted to the Marketplace and make other governance decisions.

The Collab.Land DAO and $COLLAB will be launched on Optimism. To participate in DAO governance, $COLLAB holders will need to add the Optimism network to their wallet.

See how to use Optimism on Metamask.

What is the Collab.Land Marketplace?
Announced in February 2023, the Collab.Land Marketplace is the next phase of the Collab.Land ecosystem. The Marketplace will be home to Miniapps built by the Collab.Land community of developers. These Miniapps will offer web3 communities more features and functionality beyond on-chain asset verification and token gating.

The Marketplace will include Miniapps reviewed and curated by the Collab.Land DAO.`;

await main('https://wagmi.collab.land/token-story');
