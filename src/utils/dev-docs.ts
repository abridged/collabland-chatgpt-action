import {getEnvVar} from '@collabland/common';
import {PineconeClient} from '@pinecone-database/pinecone';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {TokenTextSplitter} from 'langchain/text_splitter';

import {GithubRepoLoader} from 'langchain/document_loaders/web/github';
import {PineconeStore} from 'langchain/vectorstores/pinecone';

async function loadGithubRepo(url: string) {
  /**
   * Loader uses `page.evaluate(() => document.body.innerHTML)`
   * as default evaluate function
   **/
  const loader = new GithubRepoLoader(url, {
    branch: 'master',
    recursive: true,
    accessToken: getEnvVar('GITHUB_ACCESS_TOKEN'),
  });

  console.log('Loading github repo: %s', url);
  const docs = await loader.load();
  console.log('%s documents are loaded from github repo %s', docs.length, url);
  return docs;
}

let pinecone: PineconeClient | null = null;

const initPineconeClient = async () => {
  pinecone = new PineconeClient();
  console.log('init pinecone');
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

export async function main(url: string) {
  const pineconeIndexName = getEnvVar('PINECONE_INDEX_NAME')!;

  if (!pinecone) {
    await initPineconeClient();
  }

  const splitter = new TokenTextSplitter({
    encodingName: 'gpt2',
    chunkSize: 300,
    chunkOverlap: 20,
  });

  const pages = await loadGithubRepo(url);

  const documents = await splitter.splitDocuments(pages);

  console.log('Splitted documents: %O', documents.length);

  const index = pinecone?.Index(pineconeIndexName);
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-ada-002',
  });

  await PineconeStore.fromDocuments(documents, embedder, {
    pineconeIndex: index!,
  });
}

await main('https://github.com/abridged/collabland-dev');
