// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {AnyType, PMapByPageOptions} from '@collabland/common';
import {Document} from 'langchain/document';
import {OpenSearchVectorStore} from 'langchain/vectorstores/opensearch';
import {PineconeStore} from 'langchain/vectorstores/pinecone';

export type OpenAIConfig = {
  openAIApiKey?: string;
  model?: string;
  embeddingsModel?: string;
};

export interface VectorStoreService<
  S extends OpenSearchVectorStore | PineconeStore =
    | OpenSearchVectorStore
    | PineconeStore,
> {
  name: string;
  init(): Promise<void>;
  stop(): Promise<void>;
  importDocs(
    docs: Document<Record<string, AnyType>>[],
    indexName?: string,
    options?: PMapByPageOptions,
  ): Promise<void>;
  getVectorStore(indexName?: string): Promise<S>;
}

export const LANGCHAIN_VECTOR_STORES = 'langchain.vectorStores';
