import {getFetch, handleFetchResponse} from '@collabland/common';
import {OpenApiToolkit, createOpenApiAgent} from 'langchain/agents';
import {OpenAI} from 'langchain/llms/openai';
import {JsonObject, JsonSpec} from 'langchain/tools';

async function main() {
  const fetch = getFetch();
  const res = await fetch('https://claim-api.collab.land/openapi.json');
  const data = await handleFetchResponse<JsonObject>(res);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  const model = new OpenAI({temperature: 0});
  const toolkit = new OpenApiToolkit(new JsonSpec(data), model, headers);
  const executor = createOpenApiAgent(model, toolkit);

  const input = `get nft claim status with patron as the type`;
  console.log(`Executing with input "${input}"...`);

  const result = await executor.call({input});
  console.log(`Got output ${result.output}`);

  console.log(
    `Got intermediate steps ${JSON.stringify(
      result.intermediateSteps,
      null,
      2,
    )}`,
  );
}

await main();
