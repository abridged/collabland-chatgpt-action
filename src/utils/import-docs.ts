// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar} from '@collabland/common';
import {TokenTextSplitter} from 'langchain/text_splitter';

import {loadSecrets} from '@collabland/aws';
import {GithubRepoLoader} from 'langchain/document_loaders/web/github';
import {OpenSearchVectorStoreService} from './opensearch.js';
import {PineconeVectorStoreService} from './pinecone.js';

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
  const vectorStore =
    store === 'opensearch'
      ? new OpenSearchVectorStoreService()
      : new PineconeVectorStoreService();
  await vectorStore.init();

  const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 300,
    chunkOverlap: 20,
  });

  const files = await loadGithubRepo(url);

  const documents = await splitter.splitDocuments(files);

  console.log('Splitted documents: %O', documents.length);

  await vectorStore.importDocs(documents);
  await vectorStore.stop();
}

await main('https://github.com/abridged/collabland-dev');
// await main('https://github.com/abridged/collabland-help-center');
