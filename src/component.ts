// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Component} from '@loopback/core';
import {ChatGPTController} from './actions/chatgpt.controller.js';
import {ConversationService} from './langchain/conversation.service.js';
import {OpenAIService} from './langchain/openai.service.js';
import {OpenSearchVectorStoreService} from './langchain/opensearch.service.js';
import {PineconeVectorStoreService} from './langchain/pinecone.service.js';

/**
 * Register all services including command handlers, job runners and services
 */
export class ChatGPTActionComponent implements Component {
  controllers = [ChatGPTController];

  services = [
    OpenAIService,
    OpenSearchVectorStoreService,
    PineconeVectorStoreService,
    ConversationService,
  ];
}
