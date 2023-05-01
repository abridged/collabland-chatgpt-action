// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {OpenSearchServiceClient} from '@collabland/aws';
import {
  AnyType,
  PMapByPageOptions,
  getEnvVar,
  pMapByPage,
} from '@collabland/common';
import {
  BindingScope,
  ContextTags,
  LifeCycleObserver,
  asLifeCycleObserver,
  extensionFor,
  inject,
  injectable,
} from '@loopback/core';
import {Document} from 'langchain/document';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenSearchVectorStore} from 'langchain/vectorstores/opensearch';
import {OPENAI_SERVICE, OPENSEARCH_VECTOR_STORE__SERVICE} from './keys.js';
import {OpenAIService} from './openai.service.js';
import {LANGCHAIN_VECTOR_STORES, VectorStoreService} from './types.js';

@injectable(
  {
    scope: BindingScope.SINGLETON,
    tags: {
      [ContextTags.KEY]: OPENSEARCH_VECTOR_STORE__SERVICE,
    },
  },
  asLifeCycleObserver,
  extensionFor(LANGCHAIN_VECTOR_STORES),
)
export class OpenSearchVectorStoreService
  implements VectorStoreService<OpenSearchVectorStore>, LifeCycleObserver
{
  readonly name = 'opensearch';
  private embeddings: OpenAIEmbeddings;
  readonly openSearch = new OpenSearchServiceClient({});

  constructor(@inject(OPENAI_SERVICE) openAIService: OpenAIService) {
    this.embeddings = openAIService.embeddings;
  }

  async init() {
    await this.openSearch.init();
  }

  async stop() {
    await this.openSearch.stop();
  }

  private getIndexName(indexName?: string) {
    return indexName ?? getEnvVar('OPENSEARCH_INDEX') ?? 'openai-index';
  }

  async importDocs(
    docs: Document<Record<string, AnyType>>[],
    indexName?: string,
    options?: PMapByPageOptions,
  ) {
    await pMapByPage(
      docs,
      async page => {
        await OpenSearchVectorStore.fromDocuments(page, this.embeddings, {
          client: this.openSearch.client!,
          indexName: this.getIndexName(indexName),
        });
      },
      {pageSize: 1000, concurrency: 5, ...options},
    );
  }

  async getVectorStore(indexName?: string) {
    const store = await OpenSearchVectorStore.fromExistingIndex(
      this.embeddings,
      {
        client: this.openSearch.client!,
        indexName: this.getIndexName(indexName),
      },
    );
    return store;
  }
}
