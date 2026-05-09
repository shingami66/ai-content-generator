const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { generateVideoWithVeo } = require('../services/vertexVeoService');
const Content = require('../models/Content');

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure uploads directory exists and download remote files locally
const ensureUploadsDir = () => {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const downloadToUploads = async (fileUrl, extension, req) => {
  const uploadDir = ensureUploadsDir();
  const filename = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
  const filepath = path.join(uploadDir, filename);

  const response = await axios({
    method: 'GET',
    url: fileUrl,
    responseType: 'stream',
    timeout: 120000 // allow larger media downloads
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

const parseGcsUri = (gcsUri) => {
  if (typeof gcsUri !== 'string' || !gcsUri.startsWith('gs://')) {
    throw new Error('Invalid gcsUri');
  }
  const withoutScheme = gcsUri.slice('gs://'.length);
  const firstSlash = withoutScheme.indexOf('/');
  const bucket = firstSlash === -1 ? withoutScheme : withoutScheme.slice(0, firstSlash);
  const objectPath = firstSlash === -1 ? '' : withoutScheme.slice(firstSlash + 1);
  if (!bucket || !objectPath) {
    throw new Error('Invalid gcsUri');
  }
  return { bucket, objectPath };
};

const downloadGcsToUploads = async (gcsUri, req) => {
  const uploadDir = ensureUploadsDir();
  const filename = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
  const filepath = path.join(uploadDir, filename);
  const { bucket, objectPath } = parseGcsUri(gcsUri);

  const storage = new Storage();
  await storage.bucket(bucket).file(objectPath).download({ destination: filepath });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

const saveBase64VideoToUploads = async (bytesBase64Encoded, req) => {
  if (typeof bytesBase64Encoded !== 'string' || !bytesBase64Encoded.trim()) {
    throw new Error('Missing base64 video bytes');
  }
  const uploadDir = ensureUploadsDir();
  const filename = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
  const filepath = path.join(uploadDir, filename);

  const buffer = Buffer.from(bytesBase64Encoded, 'base64');
  fs.writeFileSync(filepath, buffer);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

class ContentController {
  // Get user content
  static async getUserContent(req, res) {
    try {
      const { userId } = req.params;
      console.log('📥 Fetching content for user:', userId);

      const content = await Content.find({ ownerId: userId }).sort({ dateCreated: -1 });

      console.log(`✅ Found ${content.length} content items for user ${userId}`);

      res.json({
        success: true,
        content
      });

    } catch (error) {
      console.error('❌ Get content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get content',
        error: error.message
      });
    }
  }

  // Generate content
  static async generateContent(req, res) {
    try {
      const { userId, type, description } = req.body;
      const User = require('../models/User'); // Lazy load models
      const Subscription = require('../models/Subscription');

      // 1. Input Validation (Security & Cost Control)
      if (!description || typeof description !== 'string') {
        return res.status(400).json({ success: false, message: 'Description is required' });
      }
      if (description.length > 2000) {
        return res.status(400).json({ success: false, message: 'Description exceeds 2000 characters limit' });
      }

      // 2. Auth & Quota Check (Atomic Concurrency Control)
      // Check subscription
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 });

      const isPremium = !!subscription;

      const PLAN_LIMITS = {
        starter: 100,
        pro: 500,
        premium: 999999 // Unlimited
      };

      if (!isPremium) {
        // Free user - Perform Atomic Quota Check
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Step A: Atomic Reset if new day
        await User.findOneAndUpdate({
          _id: userId,
          lastGenerationDate: { $lt: startOfDay }
        }, {
          $set: { generationsToday: 0, lastGenerationDate: new Date() }
        });

        // Step B: Atomic Increment & Check
        const updatedUser = await User.findOneAndUpdate({
          _id: userId,
          generationsToday: { $lt: 5 } // Strict condition
        }, {
          $inc: { generationsToday: 1 },
          $set: { lastGenerationDate: new Date() }
        }, { new: true });

        if (!updatedUser) {
          return res.status(429).json({
            success: false,
            message: 'Daily limit reached (5/5). Upgrade to Premium for unlimited generations!'
          });
        }
      } else {
        // Premium User - Check Monthly Limits
        const planType = subscription.planType || 'starter';
        const limit = PLAN_LIMITS[planType] || 100;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Atomic Reset if new month
        await User.findOneAndUpdate({
          _id: userId,
          lastGenerationDate: { $lt: startOfMonth }
        }, {
          $set: { generationsMonthly: 0 }
        });

        // Atomic Increment & Check
        const updatedUser = await User.findOneAndUpdate({
          _id: userId,
          generationsMonthly: { $lt: limit }
        }, {
          $inc: { generationsMonthly: 1 },
          $set: { lastGenerationDate: new Date() }
        }, { new: true });

        if (!updatedUser) {
          return res.status(429).json({
            success: false,
            message: `Monthly limit reached (${limit}/${limit}) for ${planType} plan. Upgrade for more!`
          });
        }
      }

      let generatedUrl = null;

      if (type === 'image') {
        // Generate image with OpenAI
        console.log('🖼️ Generating image with OpenAI...');

        if (!process.env.OPENAI_API_KEY) {
          return res.status(500).json({
            success: false,
            message: 'OpenAI API key not configured'
          });
        }

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: description,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        });

        if (response.data && response.data[0] && response.data[0].url) {
          const imageUrl = response.data[0].url;

          // Download and save image locally
          generatedUrl = await downloadToUploads(imageUrl, 'png', req);

          console.log('✅ Image saved:', generatedUrl);
        }

      } else if (type === 'video') {
        console.log('🎬 Generating video with Vertex AI Veo...');

        if (!process.env.VERTEX_PROJECT_ID || !process.env.VERTEX_LOCATION || !process.env.VERTEX_VEO_MODEL_ID || !process.env.VERTEX_GCS_OUTPUT_URI) {
          return res.status(500).json({
            success: false,
            message: 'Vertex AI Veo is not configured. Please set VERTEX_PROJECT_ID, VERTEX_LOCATION, VERTEX_VEO_MODEL_ID, and VERTEX_GCS_OUTPUT_URI.'
          });
        }

        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
          return res.status(500).json({
            success: false,
            message: 'Google credentials not configured. Please set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.'
          });
        }

        const result = await generateVideoWithVeo({
          prompt: description,
          durationSeconds: 8,
          aspectRatio: '16:9'
        });

        if (result && result.gcsUri) {
          generatedUrl = await downloadGcsToUploads(result.gcsUri, req);
          console.log('✅ Video saved:', generatedUrl);
        } else if (result && result.bytesBase64Encoded) {
          generatedUrl = await saveBase64VideoToUploads(result.bytesBase64Encoded, req);
          console.log('✅ Video saved:', generatedUrl);
        } else {
          throw new Error('Vertex Veo returned no video output');
        }
      }

      // Save to database
      const title = description.substring(0, 100);

      const newContent = new Content({
        title,
        ownerId: userId,
        contentType: type,
        description,
        url: generatedUrl
      });

      const result = await newContent.save();

      res.status(201).json({
        success: true,
        message: 'Content generated successfully',
        contentId: result._id,
        url: generatedUrl,
        description: description,
        type: type
      });

    } catch (error) {
      console.error('Generation error:', error);
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;

      res.status(statusCode).json({
        success: false,
        message: isDevelopment ? error.message : 'Failed to generate content',
        error: error.message,
        details: isDevelopment ? error.details : undefined
      });
    }
  }

  // Save content manually
  static async saveContent(req, res) {
    try {
      const { userId, type, description, url } = req.body;

      const title = description ? description.substring(0, 100) : `Generated ${type}`;

      const newContent = new Content({
        title,
        ownerId: userId,
        contentType: type,
        description,
        url
      });

      const result = await newContent.save();

      res.status(201).json({
        success: true,
        message: 'Content saved successfully',
        contentId: result._id
      });

    } catch (error) {
      console.error('Save content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save content',
        error: error.message
      });
    }
  }

  // Delete content
  static async deleteContent(req, res) {
    try {
      const { id } = req.params;

      await Content.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Content deleted successfully'
      });

    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete content',
        error: error.message
      });
    }
  }
}

module.exports = ContentController;