/**
 * GitHub Service
 * Handles repository creation and file uploads
 */

// TODO: Replace with actual GitHub API calls
// For MVP, this returns mock responses

export async function createRepo({ githubToken, repoName }) {
  // TODO: Implement real GitHub API call
  // POST https://api.github.com/user/repos
  // Headers: Authorization: token ${githubToken}
  
  console.log(`[MOCK] Creating repo: ${repoName}`);
  
  return {
    success: true,
    repoUrl: `https://github.com/user/${repoName}`,
    repoName,
    cloneUrl: `https://github.com/user/${repoName}.git`
  };
}

export async function uploadFiles({ githubToken, owner, repo, files, commitMessage = 'Initial commit from 딸깍 배포' }) {
  // TODO: Implement real GitHub API calls
  // For each file: PUT /repos/{owner}/{repo}/contents/{path}
  // With base64 encoded content
  
  console.log(`[MOCK] Uploading ${files.length} files to ${owner}/${repo}`);
  
  // Simulate upload delay
  await new Promise(r => setTimeout(r, 500));
  
  return {
    success: true,
    commitSha: 'abc123def456',
    uploadedCount: files.length
  };
}

export async function getRepoInfo({ githubToken, owner, repo }) {
  // TODO: Implement real GitHub API call
  // GET /repos/{owner}/{repo}
  
  return {
    fullName: `${owner}/${repo}`,
    htmlUrl: `https://github.com/${owner}/${repo}`,
    defaultBranch: 'main'
  };
}

function generateRepoName(appIdea) {
  return appIdea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 4)
    .join('-') || 'my-app';
}

export { generateRepoName };
