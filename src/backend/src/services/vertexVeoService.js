const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createVertexVeoError = ({ message, statusCode, details }) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.details = details;
  return err;
};

const getGoogleAuth = () => {
  const keyFileRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let keyFile = keyFileRaw;
  if (keyFileRaw && !path.isAbsolute(keyFileRaw)) {
    const candidate = path.resolve(process.cwd(), keyFileRaw);
    if (fs.existsSync(candidate)) {
      keyFile = candidate;
    } else if (keyFileRaw.startsWith('backend' + path.sep) || keyFileRaw.startsWith('backend/')) {
      const stripped = keyFileRaw.replace(/^backend[\\/]/, '');
      const candidateStripped = path.resolve(process.cwd(), stripped);
      if (fs.existsSync(candidateStripped)) {
        keyFile = candidateStripped;
      } else {
        keyFile = candidate;
      }
    } else {
      keyFile = candidate;
    }
  }

  return new GoogleAuth({
    keyFile: keyFile || undefined,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
};

const getAccessToken = async () => {
  const auth = getGoogleAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse && typeof tokenResponse === 'object' ? tokenResponse.token : tokenResponse;
  if (!token) {
    throw new Error('Failed to obtain Google Cloud access token');
  }
  return token;
};

const buildPredictLongRunningUrl = () => {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION;
  const modelId = process.env.VERTEX_VEO_MODEL_ID;
  if (!projectId || !location || !modelId) {
    throw new Error('Missing Vertex configuration. Please set VERTEX_PROJECT_ID, VERTEX_LOCATION, and VERTEX_VEO_MODEL_ID');
  }
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`;
};

const buildFetchOperationUrl = () => {
  const projectId = process.env.VERTEX_PROJECT_ID;
  const location = process.env.VERTEX_LOCATION;
  const modelId = process.env.VERTEX_VEO_MODEL_ID;
  if (!projectId || !location || !modelId) {
    throw new Error('Missing Vertex configuration. Please set VERTEX_PROJECT_ID, VERTEX_LOCATION, and VERTEX_VEO_MODEL_ID');
  }
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`;
};

const parseOperationName = (name) => {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Vertex response missing operation name');
  }
  return name;
};

const generateVideoOperation = async ({ prompt, durationSeconds, aspectRatio, seed }) => {
  const storageUri = process.env.VERTEX_GCS_OUTPUT_URI;
  if (!storageUri) {
    throw new Error('VERTEX_GCS_OUTPUT_URI is required for Veo output storage');
  }

  const accessToken = await getAccessToken();
  const url = buildPredictLongRunningUrl();

  const body = {
    instances: [
      {
        prompt
      }
    ],
    parameters: {
      aspectRatio: aspectRatio || '16:9',
      durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : 8,
      generateAudio: false,
      sampleCount: 1,
      seed: typeof seed === 'number' ? seed : Math.floor(Math.random() * 4294967295),
      storageUri,
      resolution: '720p'
    }
  };

  const resp = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    timeout: 30000,
    validateStatus: () => true
  });

  if (resp.status >= 400) {
    throw new Error(`Vertex Veo request failed (${resp.status}): ${JSON.stringify(resp.data)}`);
  }

  return parseOperationName(resp.data && resp.data.name);
};

const pollVideoOperation = async ({ operationName, maxAttempts, intervalMs }) => {
  const accessToken = await getAccessToken();
  const url = buildFetchOperationUrl();

  const attempts = typeof maxAttempts === 'number' ? maxAttempts : 120;
  const wait = typeof intervalMs === 'number' ? intervalMs : 5000;

  for (let i = 0; i < attempts; i++) {
    const resp = await axios.post(
      url,
      { operationName },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        timeout: 30000,
        validateStatus: () => true
      }
    );

    if (resp.status >= 400) {
      throw new Error(`Vertex Veo operation poll failed (${resp.status}): ${JSON.stringify(resp.data)}`);
    }

    const done = Boolean(resp.data && resp.data.done);
    if (done) {
      const opError = resp.data && resp.data.error;
      if (opError) {
        const code = typeof opError.code === 'number' ? opError.code : undefined;
        const message = opError.message || 'Vertex Veo operation failed';
        const statusCode = code === 3 ? 400 : 502;
        throw createVertexVeoError({
          message,
          statusCode,
          details: {
            operationName,
            vertexError: opError,
            raw: resp.data
          }
        });
      }

      const response = resp.data && resp.data.response;
      const videos = response && response.videos;
      const first = Array.isArray(videos) ? videos[0] : null;

      if (first && first.gcsUri) {
        return {
          operationName,
          gcsUri: first.gcsUri,
          mimeType: first.mimeType || 'video/mp4'
        };
      }

      if (first && first.bytesBase64Encoded) {
        return {
          operationName,
          bytesBase64Encoded: first.bytesBase64Encoded,
          mimeType: first.mimeType || 'video/mp4'
        };
      }

      throw new Error(`Vertex Veo operation completed but no video output was found: ${JSON.stringify(resp.data)}`);
    }

    await sleep(wait);
  }

  throw new Error('Vertex Veo video generation timed out');
};

const generateVideoWithVeo = async ({ prompt, durationSeconds, aspectRatio }) => {
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('prompt is required for video generation');
  }

  const operationName = await generateVideoOperation({
    prompt,
    durationSeconds,
    aspectRatio
  });

  return pollVideoOperation({ operationName });
};

module.exports = {
  generateVideoWithVeo
};
