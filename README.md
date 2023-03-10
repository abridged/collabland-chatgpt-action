# @collabland/chatgpt-action

This repo implements a Collab.Land action to add `/chatgpt` command to your
Discord server and it allows members to interact with ChatGPT.

## Run the action

1.  Configure `OPENAI_API_KEY` environment variable

    ```sh
    export OPENAI_API_KEY=<your-openai-api-key>
    ```

2.  Run the action

    ```sh
    npm run server
    ngrok http 3000
    ```

## Install the action to Collab.Land QA bot

From a Discord channel:

```
/test-flight install <https-url-from-grok>/chatgpt
```

## Try the action

```
/chatgpt <optional-prompt>
```
