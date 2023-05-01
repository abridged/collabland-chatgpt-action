// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ChatMessageHistory} from 'langchain/memory';

class ConversationLog {
  private history: ChatMessageHistory;
  constructor(public userId: string) {
    this.userId = userId;
    this.history = new ChatMessageHistory();
  }

  public async addEntry({entry, speaker}: {entry: string; speaker: string}) {
    console.log('Entry: %s, speaker: %s', entry, speaker);
    this.history.addUserMessage(entry);
    this.history.addAIChatMessage(speaker);
  }

  public async getConversation({limit}: {limit: number}): Promise<string[]> {
    const messages = await this.history.getMessages();
    console.log('Messages: %O', messages);
    return messages.map(m => m.text).slice(0, limit);
  }

  public async clearConversation() {
    this.history = new ChatMessageHistory();
  }
}

export {ConversationLog};
