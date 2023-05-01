// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  AnyType,
  PMapByPageOptions,
  debugFactory,
  getEnvVar,
  pMapByPage,
} from '@collabland/common';
import {
  BindingScope,
  ContextTags,
  asLifeCycleObserver,
  extensionFor,
  inject,
  injectable,
} from '@loopback/core';
import {PineconeClient} from '@pinecone-database/pinecone';
import {Document} from 'langchain/document';
import {OpenAIEmbeddings} from 'langchain/embeddings';
import {PineconeStore} from 'langchain/vectorstores/pinecone';
import {OPENAI_SERVICE, PINECONE_VECTOR_STORE__SERVICE} from './keys.js';
import {OpenAIService} from './openai.service.js';
import {LANGCHAIN_VECTOR_STORES, VectorStoreService} from './types.js';

const debug = debugFactory('collabland:pinecone');

@injectable(
  {
    scope: BindingScope.SINGLETON,
    tags: {
      [ContextTags.KEY]: PINECONE_VECTOR_STORE__SERVICE,
    },
  },
  asLifeCycleObserver,
  extensionFor(LANGCHAIN_VECTOR_STORES),
)
export class PineconeVectorStoreService
  implements VectorStoreService<PineconeStore>
{
  readonly name = 'pinecone';
  private pinecone: PineconeClient;
  private embeddings: OpenAIEmbeddings;

  constructor(@inject(OPENAI_SERVICE) openAIService: OpenAIService) {
    this.embeddings = openAIService.embeddings;
  }

  async init() {
    await this.getPineconeClient();
  }

  async stop() {}

  private async getPineconeClient() {
    if (this.pinecone != null) return this.pinecone;
    this.pinecone = new PineconeClient();
    const env = getEnvVar('PINECONE_ENVIRONMENT');
    debug('Initializing pinecone environment %s...', env);
    await this.pinecone.init({
      environment: env!,
      apiKey: getEnvVar('PINECONE_API_KEY')!,
    });
    return this.pinecone;
  }

  async importDocs(
    docs: Document<Record<string, AnyType>>[],
    indexName?: string,
    options?: PMapByPageOptions,
  ) {
    const index = await this.getIndex(indexName);

    await pMapByPage(
      docs,
      async page => {
        await PineconeStore.fromDocuments(page, this.embeddings, {
          pineconeIndex: index,
        });
      },
      {pageSize: 1000, concurrency: 5, ...options},
    );
  }

  async getIndex(indexName?: string) {
    const pinecone = await this.getPineconeClient();
    indexName = indexName ?? getEnvVar('PINECONE_INDEX_NAME')!;
    const index = pinecone.Index(indexName);
    return index;
  }

  async getVectorStore(indexName?: string) {
    const index = await this.getIndex(indexName);
    const store = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex: index,
    });
    return store;
  }
}
