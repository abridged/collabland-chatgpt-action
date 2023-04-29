// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {ConversationalRetrievalQAChain} from 'langchain/chains';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAIChat} from 'langchain/llms/openai';

import {getEnvVar} from '@collabland/common';
import {ConversationSummaryMemory} from 'langchain/memory';
import {PineconeStore} from 'langchain/vectorstores/pinecone';
import {getPineconeClient} from './pinecone.js';

const MODEL = 'gpt-4';

export class CollabLandQA {
  readonly llm: OpenAIChat;

  constructor() {
    const openAIApiKey = getEnvVar('OPENAI_API_KEY')!;
    this.llm = new OpenAIChat({openAIApiKey, modelName: MODEL});
  }

  async getVectorStore() {
    const pinecone = await getPineconeClient();

    // Embed the user's intent and query the Pinecone index
    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
    });
    const vectorStore = new PineconeStore(embedder, {
      pineconeIndex: pinecone.Index(getEnvVar('PINECONE_INDEX_NAME')!),
    });
    return vectorStore;
  }

  async buildChain() {
    const vectorStore = await this.getVectorStore();

    const memory = new ConversationSummaryMemory({
      memoryKey: 'chat_history',
      llm: this.llm,
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
      this.llm,
      vectorStore.asRetriever(5),
      {
        // returnSourceDocuments: true,
        qaTemplate: `Use the following pieces of context and general knowledge to answer the 
question at the end. If the provided context does enough information, give the general answer instead. 

Context: {context}

Question: {question}

Helpful Answer:`,
      },
    );
    chain.memory = memory;
    console.log(chain.combineDocumentsChain.serialize());
    return chain;
  }

  async ask(question: string) {
    try {
      const chain = await this.buildChain();

      const res = await chain.call({
        question,
        // chat_history: [],
      });

      console.log(res.text);
      if (chain.memory != null) {
        console.log('%O', await chain.memory.loadMemoryVariables({}));
      }
      return res.text;
    } catch (error) {
      console.error(error);
    }
  }
}

const qa = new CollabLandQA();
const question = process.argv[2];
await qa.ask(question);
