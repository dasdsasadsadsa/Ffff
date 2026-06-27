/**
 * Pipeline Orchestrator
 * Coordinates the full deployment flow:
 * 1. Check materials safety
 * 2. Generate code with LLM
 * 3. Add PWA support
 * 4. Create GitHub repo
 * 5. Upload files to GitHub
 * 6. Deploy to Cloudflare/Vercel
 * 7. Build APK
 * 8. Save to Google Drive
 */

import { checkMaterials } from './materialChecker.js';
import { generateCode } from './llmProvider.js';
import { createRepo, uploadFiles, generateRepoName } from './githubService.js';
import { deployToCloudflare, deployToVercel, generateDeploymentUrl } from './deployService.js';
import { addPWASupport } from './pwaService.js';
import { buildAPK, saveToGoogleDrive } from './apkService.js';

export const PIPELINE_STEPS = [
  'AI 코드 생성중',
  'Skills/프롬프트 안전 검사중',
  '프로젝트 파일 구성중',
  'GitHub 저장소 생성중',
  'GitHub 업로드중',
  '배포중',
  'PWA 적용중',
  'Android APK 생성중',
  'Signed APK 준비중',
  'Google Drive 저장 준비중',
  '공유 링크 생성 완료'
];

export async function runPipeline({
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
}) {
  let currentStep = 0;
  
  // Step 1: Check materials safety
  currentStep = 1;
  const materialCheck = checkMaterials(externalPrompt || '', externalSkill || '');
  
  let safePrompt = '';
  let safeSkill = '';
  
  if (materialCheck.status === 'blocked') {
    console.log('Material blocked:', materialCheck.reason);
    // Don't use blocked materials
  } else {
    safePrompt = externalPrompt || '';
    safeSkill = externalSkill || '';
  }
  
  // Step 2: Generate code with LLM
  currentStep = 2;
  const generatedProject = await generateCode({
    appIdea,
    model,
    llmApiKey,
    externalPrompt: safePrompt,
    externalSkill: safeSkill
  });
  
  // Step 3: Add PWA support
  currentStep = 3;
  let files = addPWASupport(generatedProject.files, generatedProject.projectName);
  
  // Step 4: Create GitHub repo
  currentStep = 4;
  const repoName = generateRepoName(appIdea) + '-' + Date.now().toString(36).slice(-4);
  const repoResult = await createRepo({ githubToken, repoName });
  
  // Step 5: Upload files to GitHub
  currentStep = 5;
  await uploadFiles({
    githubToken,
    owner: 'user', // TODO: Get from GitHub API
    repo: repoName,
    files
  });
  
  // Step 6: Deploy to selected provider
  currentStep = 6;
  let deployResult;
  
  if (deployTarget === 'cloudflare') {
    deployResult = await deployToCloudflare({
      cloudflareToken,
      projectId: repoName,
      files
    });
  } else {
    deployResult = await deployToVercel({
      vercelToken,
      projectName: repoName,
      files
    });
  }
  
  const liveUrl = deployResult.deploymentUrl;
  
  // Step 7: Build APK
  currentStep = 7;
  const apkResult = await buildAPK({
    projectName: generatedProject.projectName,
    liveUrl
  });
  
  // Step 8: Sign APK (included in build for MVP)
  currentStep = 8;
  // APK is already signed in mock implementation
  
  // Step 9: Save to Google Drive (optional)
  currentStep = 9;
  let gdriveResult = null;
  
  if (gdriveToken) {
    gdriveResult = await saveToGoogleDrive({
      gdriveToken,
      fileData: apkResult.downloadUrl,
      fileName: apkResult.apkFileName
    });
  }
  
  // Step 10: Complete
  currentStep = 10;
  
  return {
    success: true,
    currentStep,
    liveUrl,
    githubUrl: repoResult.repoUrl,
    deployUrl: deployResult.deploymentUrl,
    provider: deployTarget,
    apk: apkResult,
    gdrive: gdriveResult,
    projectName: generatedProject.projectName
  };
}
