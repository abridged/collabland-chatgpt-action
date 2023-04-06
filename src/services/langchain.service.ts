import {getEnvVar} from '@collabland/common';
import {ChromaClient} from 'chromadb';
import {readFileSync} from 'fs';
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {OpenAIEmbeddings} from 'langchain/embeddings';
import {OpenAI} from 'langchain/llms';
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter';
import {Chroma} from 'langchain/vectorstores';

// to run this first run chroma's docker-container with `docker-compose up -d --build`

export async function main(text: string) {
  /* Initialize the LLM to use to answer the question */
  const openAIApiKey = getEnvVar('OPENAI_API_KEY')!;
  const model = new OpenAI({
    openAIApiKey,
  });
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({chunkSize: 1000});
  const docs = await textSplitter.createDocuments([text]);
  console.log('Docs: %O', docs);
  /* Create the vectorstore */
  const client = new ChromaClient();
  await client.reset();
  const vectorStore = await Chroma.fromDocuments(
    docs,
    new OpenAIEmbeddings({openAIApiKey}),
    {
      collectionName: 'cl-token-story',
    },
  );
  /* Create the chain */
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
  );
  /* Ask it a question */
  const question = "Generate a token gated rule in json for ERC20 with at least 10 tokens";
  const res = await chain.call({question, chat_history: []});
  console.log('Response: %O', res);
  /* Ask it a follow up question */
  const chatHistory = question + res.text;
  const followUpRes = await chain.call({
    question: 'What is an asset?',
    chat_history: chatHistory,
  });
  console.log('Follow-up response: %O', followUpRes);
}

const text = readFileSync('tgrs.md', 'utf-8');
await main(text);
