import {main} from '../langchain/import-docs.js';

const args = process.argv.slice(2);
if (args.includes('dev')) {
  await main('https://github.com/abridged/collabland-dev');
}
if (args.includes('support')) {
  await main('https://github.com/abridged/collabland-help-center');
}
