// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar} from '@collabland/common';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAIChat} from 'langchain/llms/openai';

export class OpenAIHelper {
  readonly embeddings: OpenAIEmbeddings;
  readonly openAIChat: OpenAIChat;

  constructor(openAIApiKey?: string, readonly model = 'gpt-4') {
    openAIApiKey = openAIApiKey ?? getEnvVar('OPENAI_API_KEY')!;
    this.openAIChat = new OpenAIChat({openAIApiKey, modelName: model});
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
      openAIApiKey: getEnvVar('OPENAI_API_KEY'),
    });
  }
}
