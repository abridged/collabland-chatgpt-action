// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {loadSummarizationChain} from 'langchain/chains';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {templates} from './templates.js';

const llm = new OpenAI({
  concurrency: 10,
  temperature: 0,
  modelName: 'gpt-3.5-turbo',
});

async function summarizeLongDocument(
  text: string,
  inquiry: string,
): Promise<string> {
  const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
  const docs = await textSplitter.createDocuments([text]);

  const template = templates.summarizerTemplate;
  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ['document', 'inquiry'],
  });

  // This convenience function creates a document chain prompted to summarize a set of documents.
  const chain = loadSummarizationChain(llm, {
    combineMapPrompt: promptTemplate,
    combinePrompt: promptTemplate,
  });
  const res = await chain.call({
    input_documents: docs,
    document: text,
    inquiry,
  });
  const result = res.text as string;
  console.log('Summary: %s', result);
  if (result.length > 4000) {
    return summarizeLongDocument(result, inquiry);
  } else {
    return result;
  }
}

export {summarizeLongDocument};
