// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/chatgpt-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {generateEcdsaKeyPair, generateEd25519KeyPair} from '@collabland/action';
import {getEnvVar, setEnvVar} from '@collabland/common';
import {ApplicationConfig} from '@loopback/core';
import {ChatGPTActionApplication} from './application.js';

export async function main(config: ApplicationConfig = {}, publicKey?: string) {
  publicKey =
    publicKey ?? process.argv[2] ?? getEnvVar('COLLABLAND_ACTION_PUBLIC_KEY');
  let signingKey = '';
  if (publicKey == null || publicKey === 'ecdsa' || publicKey === 'ed25519') {
    const sigType = publicKey ?? 'ed25519';
    switch (sigType) {
      case 'ecdsa': {
        const keyPair = generateEcdsaKeyPair();
        signingKey = keyPair.privateKey;
        setEnvVar('COLLABLAND_ACTION_PUBLIC_KEY', keyPair.publicKey, true);
        if (config.rest == null) {
          console.log('Action signing key: %s', `${sigType}:${signingKey}`);
        }
        break;
      }
      case 'ed25519': {
        const keyPair = generateEd25519KeyPair();
        signingKey = keyPair.privateKey;
        setEnvVar('COLLABLAND_ACTION_PUBLIC_KEY', keyPair.publicKey, true);
        if (config.rest == null) {
          console.log('Action signing key: %s', `${sigType}:${signingKey}`);
        }
        break;
      }
      default: {
        throw new Error(
          `Signature type not supported: ${sigType}. Please use ecdsa or ed25519.`,
        );
      }
    }
  } else {
    // Set the public key
    setEnvVar('COLLABLAND_ACTION_PUBLIC_KEY', publicKey, true);
  }
  const app = new ChatGPTActionApplication(config);
  await app.start();

  const url = app.restServer.url;
  if (config.rest == null) {
    console.log(`ChatGPT action is running at ${url}`);
  }
  return {app, signingKey};
}

await main();
