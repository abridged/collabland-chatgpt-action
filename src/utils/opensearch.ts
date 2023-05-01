// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {OpenSearchServiceClient} from '@collabland/aws';
import {getEnvVar} from '@collabland/common';
import {Document} from 'langchain/document';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenSearchVectorStore} from 'langchain/vectorstores/opensearch';
import {OpenAIHelper} from './openai.js';

export class OpenSearchVectorStoreService {
  private embeddings: OpenAIEmbeddings;
  readonly openSearch = new OpenSearchServiceClient({});

  constructor() {
    this.embeddings = new OpenAIHelper().embeddings;
  }

  async init() {
    await this.openSearch.init();
  }

  async stop() {
    await this.openSearch.stop();
  }

  async importDocs(docs: Document<Record<string, any>>[], indexName?: string) {
    await OpenSearchVectorStore.fromDocuments(docs, this.embeddings, {
      client: this.openSearch.client!,
      indexName: indexName ?? getEnvVar('OPENSEARCH_INDEX') ?? 'openai-index', // Will default to `documents`
    });
  }

  async getVectorStore(indexName?: string) {
    indexName = indexName ?? getEnvVar('OPENSEARCH_INDEX') ?? 'openai-index';
    const store = await OpenSearchVectorStore.fromExistingIndex(
      this.embeddings,
      {client: this.openSearch.client!, indexName},
    );
    return store;
  }
}
