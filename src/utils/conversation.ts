// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {PineconeClient} from '@pinecone-database/pinecone';
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAI} from 'langchain/llms/openai';

import {getEnvVar} from '@collabland/common';
import {ConversationSummaryMemory} from 'langchain/memory';
import {PineconeStore} from 'langchain/vectorstores/pinecone';

const MODEL = 'gpt-3.5-turbo';

const openAIApiKey = getEnvVar('OPENAI_API_KEY')!;
const llm = new OpenAI({openAIApiKey, modelName: MODEL});

let pinecone: PineconeClient;

async function initPineconeClient() {
  pinecone = new PineconeClient();
  await pinecone.init({
    environment: getEnvVar('PINECONE_ENVIRONMENT')!,
    apiKey: getEnvVar('PINECONE_API_KEY')!,
  });
}

async function getVectorStore() {
  if (pinecone == null) {
    await initPineconeClient();
  }

  // Embed the user's intent and query the Pinecone index
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-ada-002',
  });
  const vectorStore = new PineconeStore(embedder, {
    pineconeIndex: pinecone.Index(getEnvVar('PINECONE_INDEX_NAME')!),
  });
  return vectorStore;
}

async function buildChain() {
  const vectorStore = await getVectorStore();

  const memory = new ConversationSummaryMemory({
    memoryKey: 'chat_history',
    llm,
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorStore.asRetriever(5),
    {
      // returnSourceDocuments: true,
    },
  );
  chain.memory = memory;
  return chain;
}

export async function handleRequest({
  prompt,
  userId,
}: {
  prompt: string;
  userId: string;
}) {
  try {
    const chain = await buildChain();

    const res = await chain.call({
      question: prompt,
      // chat_history: [],
    });

    console.log(res.text);
    if (chain.memory != null) {
      console.log('%O', await chain.memory.loadMemoryVariables({}));
    }
  } catch (error) {
    console.error(error);
  }
}

await handleRequest({
  userId: 'raymond',
  prompt: process.argv[2],
});
