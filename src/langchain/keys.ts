import {BindingKey} from '@loopback/core';
import type {ConversationService} from './conversation.service.js';
import type {OpenAIService} from './openai.service.js';
import type {OpenSearchVectorStoreService} from './opensearch.service.js';
import type {PineconeVectorStoreService} from './pinecone.service.js';

export const OPENAI_SERVICE = BindingKey.create<OpenAIService>(
  'services.OpenAIService',
);

export const PINECONE_VECTOR_STORE__SERVICE =
  BindingKey.create<PineconeVectorStoreService>(
    'services.PineconeVectorStoreService',
  );

export const OPENSEARCH_VECTOR_STORE__SERVICE =
  BindingKey.create<OpenSearchVectorStoreService>(
    'services.OpenSearchVectorStoreService',
  );

export const CONVERSATION__SERVICE = BindingKey.create<ConversationService>(
  'services.ConversationService',
);
