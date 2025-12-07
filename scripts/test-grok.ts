import { callGrok } from '../lib/grokClient';

async function test() {
  try {
    const result = await callGrok('Return only valid JSON: {"test": "hello grok"}', 'grok-4-1-fast-reasoning');
    console.log('✅ Success:', result);
  } catch (err) {
    console.error('❌ Failed:', err);
  }
}

test();