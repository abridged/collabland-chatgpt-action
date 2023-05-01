// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar} from '@collabland/common';
import {BindingScope, ContextTags, config, injectable} from '@loopback/core';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAIChat} from 'langchain/llms/openai';
import {Configuration, OpenAIApi} from 'openai';
import {OPENAI_SERVICE} from './keys.js';
import {OpenAIConfig} from './types.js';

@injectable({
  scope: BindingScope.SINGLETON,
  tags: {
    [ContextTags.KEY]: OPENAI_SERVICE,
  },
})
export class OpenAIService {
  readonly embeddings: OpenAIEmbeddings;
  readonly openAIChat: OpenAIChat;
  readonly openAIApi: OpenAIApi;

  constructor(@config() options?: OpenAIConfig) {
    options = {
      openAIApiKey: getEnvVar('OPENAI_API_KEY'),
      model: 'gpt-4',
      embeddingsModel: 'text-embedding-ada-002',
      ...options,
    };
    this.openAIChat = new OpenAIChat({
      openAIApiKey: options.openAIApiKey,
      modelName: options.model,
    });
    this.embeddings = new OpenAIEmbeddings({
      modelName: options.embeddingsModel,
      openAIApiKey: options.openAIApiKey,
    });
    const configuration = new Configuration({
      apiKey: options.openAIApiKey,
    });
    this.openAIApi = new OpenAIApi(configuration);
  }
}
