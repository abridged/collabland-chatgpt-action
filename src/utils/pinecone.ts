// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {debugFactory, getEnvVar} from '@collabland/common';
import {PineconeClient} from '@pinecone-database/pinecone';
import {Document} from 'langchain/document';
import {OpenAIEmbeddings} from 'langchain/embeddings';
import {PineconeStore} from 'langchain/vectorstores';
import {OpenAIHelper} from './openai.js';

const debug = debugFactory('collabland:pinecone');

export class PineconeVectorStoreService {
  private pinecone: PineconeClient | null = null;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIHelper().embeddings;
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

  async importDocs(docs: Document<Record<string, any>>[]) {
    const index = await this.getIndex();
    const store = await PineconeStore.fromDocuments(docs, this.embeddings, {
      pineconeIndex: index,
    });

    return store;
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
