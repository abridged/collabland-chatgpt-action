// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  debugFactory,
  resolvePromiseWithTimeout,
  stringify,
} from '@collabland/common';
import {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandSpec,
  ApplicationCommandType,
  BaseDiscordActionController,
  DiscordActionMetadata,
  DiscordActionRequest,
  DiscordActionResponse,
  DiscordInteractionPattern,
  InteractionType,
  buildSimpleResponse,
  getCommandOptionValue,
} from '@collabland/discord';
import {MiniAppManifest} from '@collabland/models';
import {
  BindingScope,
  asLifeCycleObserver,
  inject,
  injectable,
} from '@loopback/core';
import {api} from '@loopback/rest';
import {
  APIInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionResponseType,
  MessageActionRowComponentBuilder,
  MessageFlags,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {CreateChatCompletionResponse, CreateCompletionResponse} from 'openai';
import type {ConversationService} from '../langchain/conversation.service.js';
import {CONVERSATION__SERVICE, OPENAI_SERVICE} from '../langchain/keys.js';
import type {OpenAIService} from '../langchain/openai.service.js';

const debug = debugFactory('collabland:chatgpt');
/**
 * TokenPriceController is a LoopBack REST API controller that exposes endpoints
 * to support Collab.Land actions for Discord interactions.
 */
@injectable(
  {
    scope: BindingScope.SINGLETON,
  },
  asLifeCycleObserver,
)
@api({basePath: '/chatgpt'}) // Set the base path to `/chatgpt`
export class ChatGPTController extends BaseDiscordActionController<APIInteraction> {
  @inject(CONVERSATION__SERVICE)
  private qa: ConversationService;

  @inject(OPENAI_SERVICE)
  private openaiService: OpenAIService;

  constructor() {
    super();
  }

  async ask(prompt: string): Promise<CreateChatCompletionResponse> {
    const chatgpt = this.openaiService.openAIApi;
    console.log('ChatGPT prompt: %s', prompt);
    const completion = chatgpt.createChatCompletion({
      model: 'gpt-4',
      messages: [
        /*
        {
          role: 'assistant',
          content: '',
        },
        */
        {role: 'user', content: prompt},
      ],
      temperature: 0.6,
      // n: 5,
      max_tokens: 1024,
    });
    const res = await resolvePromiseWithTimeout(
      completion,
      60000,
      'Timeout: ChatGPT does not respond in 60 seconds',
    );
    console.log('ChatGPT response: %s', stringify(res.data));
    return res.data;
  }

  async askCL(prompt: string): Promise<string> {
    console.log('ChatGPT prompt for Collab.Land: %s', prompt);
    const completion = this.qa.ask(prompt);
    const res = await resolvePromiseWithTimeout(
      completion,
      60000,
      'Timeout: ChatGPT does not respond in 60 seconds',
    );
    console.log('ChatGPT response: %s', res);
    return res;
  }

  /**
   * Expose metadata for the action. The return value is used by Collab.Land `/test-flight` command
   * or marketplace to list this action as a miniapp.
   * @returns
   */
  async getMetadata(): Promise<DiscordActionMetadata> {
    const metadata: DiscordActionMetadata = {
      /**
       * Miniapp manifest
       */
      manifest: new MiniAppManifest({
        appId: 'chatgpt',
        developer: 'collab.land',
        name: 'ChatGPT',
        platforms: ['discord'],
        shortName: 'chatgpt',
        version: {name: '0.0.1'},
        website: 'https://collab.land',
        description: 'Interact with ChatGPT',
      }),
      /**
       * Supported Discord interactions. They allow Collab.Land to route Discord
       * interactions based on the type and name/custom-id.
       */
      supportedInteractions: this.getSupportedInteractions(),
      /**
       * Supported Discord application commands. They will be registered to a
       * Discord guild upon installation.
       */
      applicationCommands: this.getApplicationCommands(),
    };
    return metadata;
  }

  async buildResponse(res?: CreateCompletionResponse, prompt = '') {
    const form = new ModalBuilder()
      .setCustomId('chatgpt:modal')
      .setTitle('ChatGPT interaction');
    if (res != null) {
      form.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('chatgpt:answer')
            .setPlaceholder('Answer from ChatGPT')
            .setRequired(false)
            .setLabel('Answer')
            .setValue(res.choices[0].text!)
            .setStyle(TextInputStyle.Paragraph),
        ),
      );
    }
    form.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('chatgpt:prompt')
          .setPlaceholder('Prompt for ChatGPT')
          .setRequired(true)
          .setLabel('Prompt')
          .setValue(prompt)
          .setStyle(TextInputStyle.Paragraph),
      ),
    );
    const response: APIInteractionResponse = {
      type: InteractionResponseType.Modal,
      data: form.toJSON(),
    };
    return response;
  }

  /**
   * Handle the Discord slash commands
   * @param request - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */
  protected async handleApplicationCommand(
    request: DiscordActionRequest<APIChatInputApplicationCommandInteraction>,
  ): Promise<DiscordActionResponse> {
    switch (request.data.name) {
      case 'chatgpt': {
        /**
         * Get the value of `prompt` argument for `/chatgpt`
         */
        const prompt = getCommandOptionValue(request, 'prompt');
        let answer: CreateCompletionResponse | undefined = undefined;
        if (prompt != null) {
          this.invokeChatGPT(request, prompt);
          return {
            type: InteractionResponseType.DeferredChannelMessageWithSource,
            data: {
              flags: MessageFlags.Ephemeral,
            },
          };
        }

        const response = this.buildResponse(answer, prompt);

        // Return the 1st response to Discord
        return response;
      }
      default: {
        return buildSimpleResponse(
          `Slash command ${request.data.name} is not implemented.`,
        );
      }
    }
  }

  protected async handleMessageComponent(
    request: DiscordActionRequest<APIMessageComponentInteraction>,
  ): Promise<APIInteractionResponse | undefined> {
    if (request.data.custom_id === 'chatgpt:ask') {
      return this.buildResponse();
    }
    return buildSimpleResponse(
      `Message component ${request.data.custom_id} is not implemented.`,
    );
  }

  private async prompt(
    request: DiscordActionRequest<APIInteraction>,
    prompt: string,
    cl = true,
  ) {
    let content = '';
    if (cl) {
      content = await this.askCL(prompt);
    } else {
      const answer = await this.ask(prompt);
      content = answer?.choices[0].message?.content ?? '';
    }
    // Return the 1st response to Discord
    await this.followupMessage(request, {
      content,
      /*
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: 'ChatGPT',
            url: 'https://chat.openai.com/',
          })
          .setDescription(content)
          .toJSON(),
      ],
      */
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('chatgpt:ask')
              .setEmoji('🙋‍♂️')
              .setLabel('Chat more')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('chatgpt:sponsor')
              .setEmoji('🎁')
              .setLabel('Tip the action developer')
              .setStyle(ButtonStyle.Success),
          )
          .toJSON(),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  /**
   * Handle the Discord message components including buttons
   * @param interaction - Discord interaction with Collab.Land action context
   * @returns - Discord interaction response
   */
  protected async handleModalSubmit(
    request: DiscordActionRequest<APIModalSubmitInteraction>,
  ): Promise<DiscordActionResponse> {
    if (request.data.custom_id.startsWith('chatgpt:modal')) {
      const promptInput = request.data.components[0].components.find(
        c => c.custom_id === 'chatgpt:prompt',
      );
      const prompt = promptInput?.value;
      this.invokeChatGPT(request, prompt);
      return {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    return buildSimpleResponse(
      `Modal ${request.data.custom_id} is not implemented.`,
    );
  }

  private invokeChatGPT(
    request: DiscordActionRequest<APIInteraction>,
    prompt: string | undefined,
  ) {
    this.prompt(request, prompt!).catch(err => {
      debug('Fail to generate response: %O', err.response?.data ?? err);
      this.followupMessage(request, {
        content: `ChatGPT error: ${
          err.isAxiosError ? err.response.data.error.message : err
        }`,
      }).catch(err => {});
    });
  }

  /**
   * Build a list of supported Discord interactions. The return value is used as filter so that
   * Collab.Land can route the corresponding interactions to this action.
   * @returns
   */
  private getSupportedInteractions(): DiscordInteractionPattern[] {
    return [
      {
        // Handle `/chatgpt` slash command
        type: InteractionType.ApplicationCommand,
        names: ['chatgpt'],
      },
      {
        // Handle message components such as buttons
        type: InteractionType.MessageComponent,
        // Use a namespace to catch all buttons with custom id starting with `chatgpt:`
        ids: ['chatgpt:*'],
      },
      {
        // Handle modal submit
        type: InteractionType.ModalSubmit,
        // Use a namespace to catch all buttons with custom id starting with `chatgpt:`
        ids: ['chatgpt:*'],
      },
    ];
  }

  /**
   * Build a list of Discord application commands. It's possible to use tools
   * like https://autocode.com/tools/discord/command-builder/.
   * @returns
   */
  private getApplicationCommands(): ApplicationCommandSpec[] {
    const commands: ApplicationCommandSpec[] = [
      // `/chatgpt <prompt>` slash command
      {
        metadata: {
          name: 'ChatGPT',
          shortName: 'chatgpt',
          supportedEnvs: ['dev', 'qa', 'staging'],
        },
        name: 'chatgpt',
        type: ApplicationCommandType.ChatInput,
        description: '/chatgpt',
        options: [
          {
            name: 'prompt',
            description: 'Prompt for ChatGPT',
            type: ApplicationCommandOptionType.String,
            required: false,
          },
        ],
      },
    ];
    return commands;
  }
}
