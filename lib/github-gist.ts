import { FileSystemTree } from './types';
import { showAlert } from '@/lib/dialog-store';

const GIST_API_URL = 'https://api.github.com/gists';
const FRACTAL_GIST_FILENAME = 'fractal-project.json';
const FRACTAL_GIST_DESCRIPTION = 'A project snapshot from Anchor Fractal';

interface GistFile {
  content: string;
}

interface GistPayload {
  description: string;
  public: boolean;
  files: Record<string, GistFile>;
}

/**
 * Creates a new public GitHub Gist from a FileSystemTree.
 * Requires a Personal Access Token (PAT) with 'gist' scope.
 */
export async function createGist(tree: FileSystemTree, token: string): Promise<string | null> {
  const payload: GistPayload = {
    description: FRACTAL_GIST_DESCRIPTION,
    public: true,
    files: {
      [FRACTAL_GIST_FILENAME]: {
        content: JSON.stringify(tree),
      },
    },
  };

  try {
    const response = await fetch(GIST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `GitHub API responded with status ${response.status}`);
    }

    const gistData = await response.json();
    return gistData.id;

  } catch (error) {
    // Failed to create Gist (silenced)
    // Provide a more user-friendly error message
  if (error instanceof Error && error.message.includes('Bad credentials')) {
    showAlert('Gist creation failed. Your Personal Access Token is likely invalid or expired.', 'Gist Error');
  } else {
    showAlert(`An error occurred while creating the Gist: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Gist Error');
  }
    return null;
  }
}

/**
 * Fetches the content of a Gist and returns it as a FileSystemTree.
 */
export async function fetchGist(gistId: string): Promise<FileSystemTree | null> {
    try {
    const response = await fetch(`${GIST_API_URL}/${gistId}`, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitHub API status ${response.status}: ${text.slice(0,200)}`);
    }
    const gistData = await response.json();
    if (!gistData || !gistData.files) throw new Error('Malformed Gist response');
    // Primary expected file
    let fileContent: string | undefined = gistData.files[FRACTAL_GIST_FILENAME]?.content;
    // Fallback: pick first JSON-looking file
    if (!fileContent) {
      for (const key of Object.keys(gistData.files)) {
        const f = gistData.files[key];
        if (f && f.content && /\.(json|txt)$/.test(key.toLowerCase())) { fileContent = f.content; break; }
      }
    }
    if (!fileContent) throw new Error(`Expected file '${FRACTAL_GIST_FILENAME}' not found in gist.`);
    try {
      return JSON.parse(fileContent) as FileSystemTree;
    } catch (e) {
      throw new Error('File content parse failed (not valid JSON)');
    }
  } catch (error) {
    // Failed to fetch Gist (silenced)
    showAlert('Could not load project from the Gist. It may have been deleted, private, or malformed. ' + (error instanceof Error ? error.message : ''), 'Gist Fetch Error');
        return null;
    }
}