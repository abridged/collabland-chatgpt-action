export const EXAMPLE_RESPONSES = {
  content: 'Hello, world!',
  flags: 64,
  embeds: [
    {
      title: 'First embed',
      url: 'https://discord.com',
      description: 'Description for the first embed',
    },
    {
      title: 'Second embed',
      description:
        'Description for the second embed, `with support for markdown`\n\n',
    },
  ],
  components: [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: 'link: Request/response',
          url: 'http://localhost:3000/dev-action/interactions/1137570793585389609',
          style: 5,
        },
        {
          type: 2,
          label: 'button: Click me',
          custom_id: 'dev:button:click',
          style: 3,
        },
        {
          type: 2,
          label: 'button: Render a modal',
          custom_id: 'dev:button:modal',
          style: 1,
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: 'dev:select:string',
          placeholder: 'string-select-menu: Select a color',
          options: [
            {
              label: 'Red',
              value: 'red',
            },
            {
              label: 'Green',
              value: 'green',
            },
            {
              label: 'Blue',
              value: 'blue',
            },
          ],
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 6,
          custom_id: 'dev:select:role',
          placeholder: 'role-select-menu: Select a role',
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 5,
          custom_id: 'dev:select:user',
          placeholder: 'user-select-menu: Select a user',
        },
      ],
    },
  ],
};
