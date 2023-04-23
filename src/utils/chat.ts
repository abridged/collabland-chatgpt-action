// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {PineconeClient} from '@pinecone-database/pinecone';
import {CallbackManager} from 'langchain/callbacks';
import {LLMChain} from 'langchain/chains';
import {ChatOpenAI} from 'langchain/chat_models/openai';
import {OpenAIEmbeddings} from 'langchain/embeddings/openai';
import {OpenAI} from 'langchain/llms/openai';
import {PromptTemplate} from 'langchain/prompts';
import {summarizeLongDocument} from './summarizer.js';

import {generateIdSync, getEnvVar} from '@collabland/common';
import {ConversationLog} from './conversationLog.js';
import {Metadata, getMatchesFromEmbeddings} from './matches.js';
import {templates} from './templates.js';

const MODEL = 'gpt-3.5-turbo';

const openAIApiKey = getEnvVar('OPENAI_API_KEY')!;
const llm = new OpenAI({openAIApiKey});
let pinecone: PineconeClient | null = null;

const initPineconeClient = async () => {
  pinecone = new PineconeClient();
  await pinecone.init({
    environment: getEnvVar('PINECONE_ENVIRONMENT')!,
    apiKey: getEnvVar('PINECONE_API_KEY')!,
  });
};

export async function handleRequest({
  prompt,
  userId,
}: {
  prompt: string;
  userId: string;
}) {
  if (!pinecone) {
    await initPineconeClient();
  }

  try {
    const interactionId = generateIdSync();

    // Retrieve the conversation log and save the user's prompt
    const conversationLog = new ConversationLog(userId);
    const conversationHistory = await conversationLog.getConversation({
      limit: 10,
    });
    await conversationLog.addEntry({entry: prompt, speaker: 'user'});

    // Build an LLM chain that will improve the user prompt
    const inquiryChain = new LLMChain({
      llm,
      prompt: new PromptTemplate({
        template: templates.inquiryTemplate,
        inputVariables: ['userPrompt', 'conversationHistory'],
      }),
    });
    const inquiryChainResult = await inquiryChain.call({
      userPrompt: prompt,
      conversationHistory,
    });
    const inquiry = inquiryChainResult.text;
    console.log('Inquiry: %s', inquiry);

    // Embed the user's intent and query the Pinecone index
    const embedder = new OpenAIEmbeddings({
      modelName: 'text-embedding-ada-002',
    });
    console.log('%O', {
      data: {
        event: 'status',
        message: 'Embedding your inquiry...',
      },
    });

    const embeddings = await embedder.embedQuery(inquiry);
    console.log('%O', {
      data: {
        event: 'status',
        message: 'Finding matches...',
      },
    });

    const matches = await getMatchesFromEmbeddings(embeddings, pinecone!, 3);
    console.log('Matches: %O', matches);

    console.log('%O', {
      data: {
        event: 'status',
        message: `Found ${matches?.length} matches`,
      },
    });

    // const urls = docs && Array.from(new Set(docs.map(doc => doc.metadata.url)))

    const urls =
      matches &&
      Array.from(
        new Set(
          matches.map(match => {
            const metadata = match.metadata as Metadata;
            const {url} = metadata;
            return url;
          }),
        ),
      );

    console.log(urls);

    // const fullDocuments = matches && Array.from(new Set(matches.map(match => {
    //   const metadata = match.metadata as Metadata
    //   const { text } = metadata
    //   return text
    // })))

    const fullDocuments =
      matches &&
      Array.from(
        matches.reduce((map, match) => {
          const metadata = match.metadata as Metadata;
          const {text, url} = metadata;
          if (!map.has(url)) {
            map.set(url, text);
          }
          return map;
        }, new Map()),
      ).map(([_, text]) => text);

    const chunkedDocs =
      matches &&
      Array.from(
        new Set(
          matches.map(match => {
            const metadata = match.metadata as Metadata;
            const {chunk} = metadata;
            return chunk;
          }),
        ),
      );

    // const fullDocuments = urls && await getDocumentsByUrl(urls)
    // console.log(fullDocuments)

    console.log('%O', {
      data: {
        event: 'status',
        message: `Documents are summarized (they are ${
          fullDocuments?.join('').length
        } long)`,
      },
    });

    const summary = await summarizeLongDocument(
      fullDocuments!.join('\n'),
      inquiry,
    );
    console.log(summary);

    // const summary = chunkedDocs!.join("\n")

    console.log('%O', {
      data: {
        event: 'status',
        message: `Documents are summarized. Forming final answer...`,
      },
    });
    // Prepare a QA chain and call it with the document summaries and the user's prompt
    const promptTemplate = new PromptTemplate({
      template: templates.qaTemplate,
      inputVariables: ['summaries', 'question', 'conversationHistory', 'urls'],
    });

    const chat = new ChatOpenAI({
      streaming: true,
      verbose: true,
      modelName: MODEL,
      callbackManager: CallbackManager.fromHandlers({
        async handleLLMNewToken(token) {
          /*
          console.log(token);
          console.log('%O', {
            data: {
              event: 'response',
              token: token,
              interactionId,
            },
          });
          */
        },
        async handleLLMEnd(result) {
          /*
          console.log('%O', {
            data: {
              event: 'responseEnd',
              token: 'END',
              interactionId,
            },
          });
          */
        },
      }),
    });

    /*
    const memory = new ConversationSummaryMemory({
      memoryKey: 'conversationHistory',
      llm: new OpenAI({modelName: MODEL, temperature: 0}),
    });
    */

    const chain = new LLMChain({
      prompt: promptTemplate,
      llm: chat,
      // memory,
    });

    const res = await chain.call({
      summaries: summary,
      question: prompt,
      conversationHistory,
      urls,
    });

    // console.log('%O', {res, memory: await memory.loadMemoryVariables({})});
  } catch (error) {
    console.error(error);
  }
}
