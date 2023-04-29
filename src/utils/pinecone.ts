import {debugFactory, getEnvVar} from '@collabland/common';
import {PineconeClient} from '@pinecone-database/pinecone';

const debug = debugFactory('collabland:pinecone');

let pinecone: PineconeClient | null = null;
export async function getPineconeClient() {
  pinecone = new PineconeClient();
  const env = getEnvVar('PINECONE_ENVIRONMENT');
  debug('Initializing pinecone environment %s...', env);
  await pinecone.init({
    environment: env!,
    apiKey: getEnvVar('PINECONE_API_KEY')!,
  });
  return pinecone;
}
