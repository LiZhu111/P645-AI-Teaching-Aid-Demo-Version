import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { existsSync } from 'node:fs';

// A local Node server owns the stdio process. This is not an edge/serverless route.
const root = path.resolve(process.cwd(), '../..');
let connection;
async function connect() {
  const venv = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const transport = new StdioClientTransport({
    command: process.env.AITA_PYTHON || (existsSync(venv) ? venv : 'python'),
    args: ['-m', 'aita.server'], cwd: path.join(root, 'src/backend'),
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([, value]) => typeof value === 'string')),
      AITA_DATABASE_PATH: process.env.AITA_DATABASE_PATH || path.join(root, 'database/aita.db')
    },
    stderr: 'inherit'
  });
  const client = new Client({ name: 'aita-web', version: '1.0.0' });
  client.onclose = () => { connection = undefined; };
  try { await client.connect(transport, { timeout: 15000 }); }
  catch (error) { await transport.close(); throw error; }
  return client;
}

export async function callTool(name, args = {}) {
  connection ??= connect().catch(error => { connection = undefined; throw error; });
  const client = await connection;
  const result = await client.callTool({ name, arguments: args }, undefined, { timeout: 30000 });
  if (result.isError) throw new Error('Course service rejected the request.');
  const blocks = result.content?.filter(block => block.type === 'text') || [];
  let value = result.structuredContent;
  if (!value && blocks.length === 1) value = JSON.parse(blocks[0].text);
  if (!value && blocks.length > 1) value = blocks.map(block => JSON.parse(block.text));
  // SDKs wrap non-object tool return values in a result field.
  if (value && Object.hasOwn(value, 'result')) value = value.result;
  if (!value || value.error) throw new Error('Course service returned no usable result.');
  return value;
}
