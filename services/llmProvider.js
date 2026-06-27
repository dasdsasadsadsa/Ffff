/**
 * LLM Provider Service
 * Handles code generation using Qwen or Gemini
 */

const SYSTEM_PROMPT = `You are a production-ready app generator for mobile-first PWA applications.
Generate complete, working code for deployment to Cloudflare Pages or Vercel.

Output MUST be valid JSON with this exact structure:
{
  "projectName": "app-name",
  "description": "App description in Korean",
  "files": [
    {
      "path": "filename.ext",
      "content": "file content here"
    }
  ]
}

Required files for every project:
- package.json
- index.html (or src/main file depending on framework)
- README.md
- manifest.json (for PWA)
- sw.js (service worker for PWA)
- Deploy config (wrangler.toml for Cloudflare or vercel.json)

The app must be:
- Mobile-first responsive design
- Dark mode by default
- Production ready
- Include proper meta tags for PWA
- Have offline fallback

Do not include explanations outside the JSON.`;

export async function generateCode({ appIdea, model, llmApiKey, externalPrompt, externalSkill }) {
  // Build enhanced prompt
  let userPrompt = `Create a complete mobile-first web app with this idea: ${appIdea}`;
  
  if (externalPrompt) {
    userPrompt += `\n\nAdditional context from user's prompt: ${externalPrompt}`;
  }
  
  if (externalSkill) {
    userPrompt += `\n\nAdditional skills/instructions to consider: ${externalSkill}`;
  }
  
  userPrompt += `\n\nGenerate all necessary files for deployment. Output ONLY valid JSON.`;

  // Call actual LLM API
  try {
    const result = await callLLM(userPrompt, llmApiKey, model);
    return result;
  } catch (error) {
    console.warn('LLM API call failed, falling back to mock:', error.message);
    // Fallback to mock on error
    return generateMockProject(appIdea);
  }
}

async function callLLM(prompt, apiKey, model) {
  const url = model === 'gemini' 
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`
    : `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
    ...(model === 'qwen' && { 'Authorization': `Bearer ${apiKey}` })
  };

  const body = model === 'gemini' 
    ? { 
        contents: [{ parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }], 
        generationConfig: { responseMimeType: "application/json" } 
      }
    : { 
        model: "qwen-plus", 
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ], 
        response_format: { type: "json_object" } 
      };

  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    
    let rawText = "";
    if (model === 'gemini') {
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      rawText = data.choices?.[0]?.message?.content || "";
    }

    if (!rawText) throw new Error("No content generated");

    // Robust JSON Parsing
    try {
      return JSON.parse(rawText);
    } catch (e) {
      console.warn("Raw JSON parse failed, attempting cleanup...");
      // Try to extract JSON block if wrapped in markdown
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try to find first { and last }
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(rawText.substring(start, end + 1));
      }
      throw new Error("Invalid JSON structure from AI");
    }
  } catch (error) {
    throw error;
  }
}

function generateMockProject(appIdea) {
  // Generate project name from app idea (handle Korean and English)
  // Extract meaningful words, keeping Korean characters
  const koreanWords = appIdea.match(/[\uAC00-\uD7A3]+/g) || [];
  const englishWords = appIdea.match(/[a-zA-Z0-9]+/g) || [];
  
  // Combine and take first 3 meaningful words
  const allWords = [...koreanWords, ...englishWords].filter(w => w.length > 1);
  const nameParts = allWords.slice(0, 3);
  
  // Create ASCII-safe project name
  let projectName;
  if (nameParts.length === 0) {
    projectName = 'my-app-' + Date.now().toString(36).slice(-4);
  } else {
    // Convert Korean to romanized form or use as-is with hyphens
    projectName = nameParts.join('-').replace(/[^a-zA-Z0-9\-]/g, '-').slice(0, 30);
    // Clean up multiple hyphens
    projectName = projectName.replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!projectName) {
      projectName = 'app-' + Date.now().toString(36).slice(-4);
    }
  }
  
  return {
    projectName: projectName.toLowerCase(),
    description: `AI generated app: ${appIdea}`,
    files: [
      {
        path: 'package.json',
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview'
          },
          dependencies: {}
        }, null, 2)
      },
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#6366f1">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>${projectName}</title>
  <link rel="manifest" href="/manifest.json">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0d0d0d;
      color: #fff;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    h1 { color: #6366f1; margin-bottom: 16px; }
    .card { 
      background: #242424; 
      border-radius: 12px; 
      padding: 20px; 
      margin-bottom: 16px;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${projectName}</h1>
    <div class="card">
      <p>${appIdea}</p>
    </div>
    <button onclick="alert('앱이 작동합니다!')">탭하세요</button>
  </div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  </script>
</body>
</html>`
      },
      {
        path: 'manifest.json',
        content: JSON.stringify({
          name: projectName,
          short_name: projectName.slice(0, 12),
          description: `Generated app: ${appIdea}`,
          start_url: '/',
          display: 'standalone',
          background_color: '#0d0d0d',
          theme_color: '#6366f1',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }, null, 2)
      },
      {
        path: 'sw.js',
        content: `const CACHE_NAME = '${projectName}-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});`
      },
      {
        path: 'README.md',
        content: `# ${projectName}

${appIdea}

## Generated by 딸깍 배포

Deployed automatically with AI.`
      },
      {
        path: 'wrangler.toml',
        content: `name = "${projectName}"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"`
      },
      {
        path: 'vercel.json',
        content: JSON.stringify({
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
          devCommand: 'npm run dev',
          routes: [{ src: '/(.*)', dest: '/' }]
        }, null, 2)
      }
    ]
  };
}
