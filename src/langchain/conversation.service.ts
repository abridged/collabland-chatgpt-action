// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {OpenAIChat} from 'langchain/llms/openai';

import {loadSecrets} from '@collabland/aws';
import {stringify} from '@collabland/common';
import {
  Application,
  BindingScope,
  ContextTags,
  asLifeCycleObserver,
  config,
  extensions,
  inject,
  injectable,
} from '@loopback/core';
import {ConversationSummaryMemory} from 'langchain/memory';
import {ChatGPTActionComponent} from '../component.js';
import {CONVERSATION__SERVICE, OPENAI_SERVICE} from './keys.js';
import {OpenAIService} from './openai.service.js';
import {LANGCHAIN_VECTOR_STORES, VectorStoreService} from './types.js';

@injectable(
  {
    scope: BindingScope.SINGLETON,
    tags: {
      [ContextTags.KEY]: CONVERSATION__SERVICE,
    },
  },
  asLifeCycleObserver,
)
export class ConversationService {
  readonly llm: OpenAIChat;
  private chain: ConversationalRetrievalQAChain;

  constructor(
    @inject(OPENAI_SERVICE) openAIService: OpenAIService,
    @extensions.list(LANGCHAIN_VECTOR_STORES)
    private vectorStoreServices: VectorStoreService[],
    @config() private store = 'opensearch',
  ) {
    this.llm = openAIService.openAIChat;
  }

  getVectorStore() {
    const service = this.vectorStoreServices.find(s => s.name === this.store);
    console.log('Vector store: %s', service?.name);
    return service?.getVectorStore();
  }

  async start() {
    const vectorStore = await this.getVectorStore();

    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: this.llm,
    });

    this.chain = ConversationalRetrievalQAChain.fromLLM(
      this.llm,
      vectorStore!.asRetriever(5),
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
    this.chain.memory = memory;
    console.log(
      'Langchain: %s',
      stringify(this.chain.combineDocumentsChain.serialize()),
    );
  }

  async ask(question: string) {
    try {
      const chain = this.chain;

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

export async function main() {
  await loadSecrets();
  const app = new Application();
  app.component(ChatGPTActionComponent);
  await app.start();
  const qa = await app.get(CONVERSATION__SERVICE);
  const question = process.argv[2];
  await qa.ask(question);
  await app.stop();
}
