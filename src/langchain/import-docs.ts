// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar} from '@collabland/common';
import {TokenTextSplitter} from 'langchain/text_splitter';

import {loadSecrets} from '@collabland/aws';
import {Application} from '@loopback/core';
import {GithubRepoLoader} from 'langchain/document_loaders/web/github';
import {ChatGPTActionComponent} from '../component.js';
import {
  OPENSEARCH_VECTOR_STORE__SERVICE,
  PINECONE_VECTOR_STORE__SERVICE,
} from './keys.js';

async function loadGithubRepo(repoUrl: string) {
  const loader = new GithubRepoLoader(repoUrl, {
    branch: 'master',
    recursive: true,
    accessToken: getEnvVar('GITHUB_ACCESS_TOKEN'),
  });

  console.log('Loading github repo: %s', repoUrl);
  const docs = await loader.load();
  console.log(
    '%s documents are loaded from github repo %s',
    docs.length,
    repoUrl,
  );
  return docs;
}

export async function main(url: string, store = 'opensearch') {
  await loadSecrets();
  const app = new Application();
  app.component(ChatGPTActionComponent);
  await app.start();
  const vectorStore =
    store === 'opensearch'
      ? await app.get(OPENSEARCH_VECTOR_STORE__SERVICE)
      : await app.get(PINECONE_VECTOR_STORE__SERVICE);

  const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 300,
    chunkOverlap: 20,
  });

  const files = await loadGithubRepo(url);

  const documents = await splitter.splitDocuments(files);

  console.log('Splitted documents: %O', documents.length);

  await vectorStore.importDocs(documents);
  await app.stop();
}
