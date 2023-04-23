import {handleRequest} from '../utils/chat.js';

export async function main(userId: string, prompt: string) {
  handleRequest({
    prompt,
    userId,
  });
}

await main('raymond', process.argv[2]);
