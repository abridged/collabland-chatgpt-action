// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {OpenAIChat} from 'langchain/llms/openai';

import {loadSecrets} from '@collabland/aws';
import {ConversationSummaryMemory} from 'langchain/memory';
import {OpenAIHelper} from './openai.js';
import {OpenSearchVectorStoreService} from './opensearch.js';
import {PineconeVectorStoreService} from './pinecone.js';

export class CollabLandQA {
  readonly llm: OpenAIChat;
  vectorStoreService: PineconeVectorStoreService | OpenSearchVectorStoreService;

  constructor(private readonly store = 'opensearch') {
    this.llm = new OpenAIHelper().openAIChat;
  }

  async getVectorStore() {
    if (this.store === 'opensearch') {
      this.vectorStoreService = new OpenSearchVectorStoreService();
      await this.vectorStoreService.init();
      const store = await this.vectorStoreService.getVectorStore();
      return store;
    } else {
      this.vectorStoreService = new PineconeVectorStoreService();
      await this.vectorStoreService.init();
      const store = await this.vectorStoreService.getVectorStore();
      return store;
    }
  }

  async buildChain() {
    const vectorStore = await this.getVectorStore();

    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: this.llm,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      this.llm,
      vectorStore.asRetriever(5),
      {
        // returnSourceDocuments: true,
        qaTemplate: `As a support expert, use the following pieces of context and general knowledge to 
answer the question at the end. Be specific and provide enough details if possible. If the given context
does enough information, give the general answer instead. 

Context: {context}

Question: {question}

Helpful Answer:`,
      },
    );
    chain.memory = memory;
    console.log(chain.combineDocumentsChain.serialize());
    return chain;
  }

  async ask(question: string) {
    try {
      const chain = await this.buildChain();

      const res = await chain.call({
        question,
        // chat_history: [],
      });

      console.log(res.text);
      if (chain.memory != null) {
        console.log('%O', await chain.memory.loadMemoryVariables({}));
      }
      return res.text;
    } catch (error) {
      console.error(error);
    }
  }
}

async function main() {
  await loadSecrets();
  const qa = new CollabLandQA();
  const question = process.argv[2];
  await qa.ask(question);
  await qa.vectorStoreService.stop();
}

await main();
