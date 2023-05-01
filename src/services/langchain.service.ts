// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {handleRequest} from '../utils/chat.js';

export async function main(userId: string, prompt: string) {
  handleRequest({
    prompt,
    userId,
  });
}

await main('raymond', process.argv[2]);
