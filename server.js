/**
 * 딸깍 배포 Server
 * Korean mobile-first one-click AI deployment workspace
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { checkMaterials } from './services/materialChecker.js';
import { runPipeline } from './services/pipeline.js';
import { generateCode } from './services/llmProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'public')));

// API Routes

/**
 * POST /api/check-material
 * Check if pasted prompt/skill contains malicious instructions
 */
app.post('/api/check-material', async (req, res) => {
  try {
    const { prompt, skill } = req.body;
    
    const result = checkMaterials(prompt || '', skill || '');
    
    res.json(result);
  } catch (error) {
    console.error('Error checking material:', error);
    res.status(500).json({ 
      status: 'warning', 
      reason: '검사 중 오류가 발생했습니다.' 
    });
  }
});

/**
 * POST /api/generate-project
 * Generate project files using LLM
 */
app.post('/api/generate-project', async (req, res) => {
  try {
    const { appIdea, model, llmApiKey, externalPrompt, externalSkill } = req.body;
    
    // First check materials
    const materialCheck = checkMaterials(externalPrompt || '', externalSkill || '');
    
    let safePrompt = '';
    let safeSkill = '';
    
    if (materialCheck.status !== 'blocked') {
      safePrompt = externalPrompt || '';
      safeSkill = externalSkill || '';
    }
    
    // Call LLM provider to generate code
    const generatedProject = await generateCode({
      appIdea,
      model,
      llmApiKey,
      externalPrompt: safePrompt,
      externalSkill: safeSkill
    });
    
    res.json({
      success: true,
      projectName: generatedProject.projectName,
      description: generatedProject.description,
      files: generatedProject.files,
      materialStatus: materialCheck
    });
  } catch (error) {
    console.error('Error generating project:', error);
    res.status(500).json({ error: '프로젝트 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/github/create-repo
 * Create GitHub repository
 */
app.post('/api/github/create-repo', async (req, res) => {
  try {
    const { githubToken, repoName } = req.body;
    
    // TODO: Implement real GitHub API call
    
    res.json({
      success: true,
      repoUrl: `https://github.com/user/${repoName}`,
      repoName
    });
  } catch (error) {
    console.error('Error creating repo:', error);
    res.status(500).json({ error: '저장소 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/github/upload-files
 * Upload files to GitHub repository
 */
app.post('/api/github/upload-files', async (req, res) => {
  try {
    const { githubToken, owner, repo, files } = req.body;
    
    // TODO: Implement real GitHub API calls
    
    res.json({
      success: true,
      commitSha: 'abc123',
      uploadedCount: files?.length || 0
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/deploy/cloudflare
 * Deploy to Cloudflare Pages
 */
app.post('/api/deploy/cloudflare', async (req, res) => {
  try {
    const { cloudflareToken, projectId } = req.body;
    
    // TODO: Implement real Cloudflare API call
    
    res.json({
      success: true,
      deploymentUrl: `https://${projectId}.pages.dev`,
      provider: 'cloudflare'
    });
  } catch (error) {
    console.error('Error deploying to Cloudflare:', error);
    res.status(500).json({ error: 'Cloudflare 배포 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/deploy/vercel
 * Deploy to Vercel
 */
app.post('/api/deploy/vercel', async (req, res) => {
  try {
    const { vercelToken, projectName } = req.body;
    
    // TODO: Implement real Vercel API call
    
    res.json({
      success: true,
      deploymentUrl: `https://${projectName}.vercel.app`,
      provider: 'vercel'
    });
  } catch (error) {
    console.error('Error deploying to Vercel:', error);
    res.status(500).json({ error: 'Vercel 배포 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/pwa/generate
 * Generate PWA manifest and service worker
 */
app.post('/api/pwa/generate', async (req, res) => {
  try {
    const { projectName, files } = req.body;
    
    // TODO: Generate actual PWA files
    
    res.json({
      success: true,
      files: [
        { path: 'manifest.json', content: '{}' },
        { path: 'sw.js', content: '' }
      ]
    });
  } catch (error) {
    console.error('Error generating PWA:', error);
    res.status(500).json({ error: 'PWA 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/apk/build
 * Build Android APK
 */
app.post('/api/apk/build', async (req, res) => {
  try {
    const { projectName, liveUrl } = req.body;
    
    // TODO: Implement real APK build with Bubblewrap/Capacitor
    
    res.json({
      success: true,
      status: 'ready',
      apkFileName: `${projectName}-v1.0.0.apk`,
      downloadUrl: `/downloads/${projectName}-v1.0.0.apk`,
      signed: true
    });
  } catch (error) {
    console.error('Error building APK:', error);
    res.status(500).json({ error: 'APK 빌드 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/gdrive/save
 * Save file to Google Drive
 */
app.post('/api/gdrive/save', async (req, res) => {
  try {
    const { gdriveToken, fileName, fileData } = req.body;
    
    // TODO: Implement real Google Drive API call
    
    res.json({
      success: true,
      fileId: 'mock_file_id',
      webViewLink: `https://drive.google.com/file/d/mock_id/view`
    });
  } catch (error) {
    console.error('Error saving to Drive:', error);
    res.status(500).json({ error: 'Google Drive 저장 중 오류가 발생했습니다.' });
  }
});

/**
 * POST /api/deploy
 * Main deployment endpoint - runs full pipeline
 */
app.post('/api/deploy', async (req, res) => {
  try {
    const {
      appIdea,
      model,
      deployTarget,
      llmApiKey,
      githubToken,
      cloudflareToken,
      vercelToken,
      gdriveToken,
      externalPrompt,
      externalSkill
    } = req.body;
    
    // Validate required fields
    if (!appIdea) {
      return res.status(400).json({ error: '앱 아이디어를 입력해주세요.' });
    }
    
    if (!llmApiKey) {
      return res.status(400).json({ error: 'LLM API 키가 필요합니다.' });
    }
    
    if (!githubToken) {
      return res.status(400).json({ error: 'GitHub 토큰이 필요합니다.' });
    }
    
    // Run the full pipeline
    const result = await runPipeline({
      appIdea,
      model: model || 'qwen',
      deployTarget: deployTarget || 'cloudflare',
      llmApiKey,
      githubToken,
      cloudflareToken,
      vercelToken,
      gdriveToken,
      externalPrompt,
      externalSkill
    });
    
    res.json(result);
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({ 
      error: error.message || '배포 중 오류가 발생했습니다.' 
    });
  }
});

// Serve index.html for all other routes (SPA support)
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 딸깍 배포 서버 실행중: http://localhost:${PORT}`);
  console.log('말 한마디 → 딸깍 → GitHub → 배포 → PWA → APK');
});
