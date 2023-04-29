import {getEnvVar} from '@collabland/common';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {TokenTextSplitter} from 'langchain/text_splitter';

import {GithubRepoLoader} from 'langchain/document_loaders/web/github';
import {PineconeStore} from 'langchain/vectorstores/pinecone';
import {getPineconeClient} from './pinecone.js';

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

export async function main(url: string) {
  const pineconeIndexName = getEnvVar('PINECONE_INDEX_NAME')!;

  const pinecone = await getPineconeClient();

  const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 300,
    chunkOverlap: 20,
  });

  const files = await loadGithubRepo(url);

  const documents = await splitter.splitDocuments(files);

  console.log('Splitted documents: %O', documents.length);

  const index = pinecone.Index(pineconeIndexName);
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-ada-002',
  });

  await PineconeStore.fromDocuments(documents, embedder, {
    pineconeIndex: index,
  });
}

await main('https://github.com/abridged/collabland-dev');
