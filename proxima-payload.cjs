#!/usr/bin/env node
/**
 * Proxima Payload Helper
 * Генерирует корректные JSON-пейлоады для REST API вызовов Proxima
 * Использование: node proxima-payload.js <function> <model> <message> [additional_params]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROXIMA_API = 'http://localhost:3210/v1/chat/completions';
const TEMP_DIR = path.join(__dirname, 'temp-payloads');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const FUNCTIONS = {
  chat: { requiresAction: false },
  search: { requiresAction: false, defaultModel: 'perplexity' },
  translate: { requiresAction: false },
  code: { requiresAction: true, actions: ['generate', 'review', 'debug', 'explain'] },
  brainstorm: { requiresAction: false },
  analyze: { requiresAction: false, requiresUrl: true },
  security_audit: { requiresAction: true, requiresCode: true },
  debate: { requiresAction: false },
  graph_query: { requiresAction: false }
};

function generatePayload(func, model, message, options = {}) {
  const payload = {
    model: model || 'auto',
    message: message,
    function: func || 'chat'
  };

  // Add action for code-related functions
  if (options.action) {
    payload.action = options.action;
  }

  // Add URL for analyze function
  if (options.url) {
    payload.url = options.url;
  }

  // Add code for code review/security audit
  if (options.code) {
    payload.code = options.code;
  }

  // Add translation target language
  if (options.to) {
    payload.to = options.to;
  }

  // Add files if provided
  if (options.files && options.files.length > 0) {
    payload.files = options.files;
  }

  return payload;
}

function sendPayload(payload, outputFile = null) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const inputPath = path.join(TEMP_DIR, `payload-${timestamp}.json`);
  
  // Write payload to temp file
  fs.writeFileSync(inputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`📝 Payload written to: ${inputPath}`);

  // Send via curl
  try {
    const curlCmd = `curl.exe -s -X POST "${PROXIMA_API}" -H "Content-Type: application/json" -d @${inputPath}`;
    console.log(`🚀 Executing: ${curlCmd}`);
    
    const response = execSync(curlCmd, { encoding: 'utf8', timeout: 60000 });
    
    if (outputFile) {
      fs.writeFileSync(outputFile, response, 'utf8');
      console.log(`✅ Response saved to: ${outputFile}`);
    } else {
      console.log('📡 Response:');
      console.log(response);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) console.log('STDOUT:', error.stdout.toString());
    if (error.stderr) console.error('STDERR:', error.stderr.toString());
    return null;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(`
🔧 Proxima Payload Helper
========================
Usage: node proxima-payload.js <function> <model> <message> [options]

Functions: chat, search, translate, code, brainstorm, analyze, security_audit, debate, graph_query
Models: claude, chatgpt, gemini, perplexity, auto

Examples:
  node proxima-payload.js chat claude "What is AI?"
  node proxima-payload.js search perplexity "AI news 2026"
  node proxima-payload.js code claude "Review this code" --action review --code "function foo() {}"
  node proxima-payload.js graph_query claude "What are our AI projects?"
    `);
    process.exit(1);
  }

  const [func, model, ...messageParts] = args;
  const message = messageParts.join(' ');
  
  // Parse options
  const options = {};
  const optionIndex = args.indexOf('--');
  if (optionIndex !== -1) {
    for (let i = optionIndex + 1; i < args.length; i += 2) {
      const key = args[i].replace('--', '');
      const value = args[i + 1];
      if (key === 'files') {
        options[key] = value.split(',');
      } else {
        options[key] = value;
      }
    }
  }

  const payload = generatePayload(func, model, message, options);
  console.log('📦 Generated Payload:', JSON.stringify(payload, null, 2));
  
  sendPayload(payload);
}

module.exports = { generatePayload, sendPayload, FUNCTIONS };
