const express = require('express');
const router = express.Router();
const db = require('../config/database');
const axios = require('axios');
const FormData = require('form-data');
const { validateContentGeneration, validateContentId } = require('../middlewares/validation');

// OpenAI API Configuration
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Get all generated content for a user
const { validateUserId } = require('../middlewares/validation');
router.get('/user/:userId', validateUserId, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📥 Fetching content for user:', userId);
    
    // Use correct column names: OwnerID, DateCreated
    const [content] = await db.query(
      'SELECT * FROM content WHERE OwnerID = ? ORDER BY DateCreated DESC',
      [userId]
    );

    console.log(`✅ Found ${content.length} content items`);

    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('❌ Error fetching content:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get content', 
      error: error.message 
    });
  }
});

// Initialize database (ensure URL column exists)
const initializeDatabase = async () => {
  try {
    // Add URL column if it doesn't exist
    await db.query(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS URL LONGTEXT AFTER Description
    `);
    console.log('✅ Database initialized - URL column ready');
  } catch (error) {
    console.log('ℹ️  URL column may already exist or not needed');
  }
};

// Run initialization
initializeDatabase();

// Save generated content
router.post('/save', async (req, res) => {
  try {
    const { userId, type, description, url } = req.body;
    console.log('💾 Saving content:', { userId, type, description });

    // Use correct column names: OwnerID, ContentType, Description, Title
    // Title is required, so we'll use a truncated description or type
    const title = description ? description.substring(0, 100) : `Generated ${type}`;

    const [result] = await db.query(
      'INSERT INTO content (Title, OwnerID, ContentType, Description, DateCreated) VALUES (?, ?, ?, ?, NOW())',
      [title, userId, type, description]
    );

    console.log('✅ Content saved with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Content saved successfully',
      contentId: result.insertId
    });
  } catch (error) {
    console.error('❌ Error saving content:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save content', 
      error: error.message 
    });
  }
});

// Generate content using OpenAI API
router.post('/generate', validateContentGeneration, async (req, res) => {
  try {
    const { userId, type, description } = req.body;
    
    // Validation is handled by middleware, but keep this as extra safety
    // All fields are already validated at this point

    console.log('🎨 Generating content:', { userId, type, description });

    let generatedUrl = null;

    if (type === 'image') {
      // Generate image using OpenAI
      console.log('🖼️ Generating image with OpenAI...');
      console.log('🔑 API Key:', process.env.OPENAI_API_KEY ? 'Found' : 'Missing!');
      
      try {
        // Use OpenAI DALL-E for image generation
        console.log('🎨 Generating image with OpenAI DALL-E...');
        
        console.log('🔍 Calling OpenAI API with description:', description);
        const response = await openai.images.generate({
          model: 'dall-e-3', // Correct model for DALL-E 3
          prompt: description,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        });
        
        console.log('📡 OpenAI Response received:', response.data);
        
        if (response && response.data && response.data[0] && response.data[0].url) {
          const imageUrl = response.data[0].url;
          console.log('🔗 Image URL received:', imageUrl);
          
          // Download the image from OpenAI URL and save it locally
          const imageResponse = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream'
          });
          
          const fs = require('fs');
          const path = require('path');
          
          // Create uploads directory if it doesn't exist
          const uploadDir = path.join(__dirname, '..', 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // Generate unique filename
          const filename = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
          const filepath = path.join(uploadDir, filename);
          
          // Save image to file
          const writer = fs.createWriteStream(filepath);
          imageResponse.data.pipe(writer);
          
          // Wait for the file to be written
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          
          // Create accessible URL
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          generatedUrl = `${baseUrl}/uploads/${filename}`;
          console.log('✅ Image saved to file:', generatedUrl);
        } else {
          throw new Error('Invalid response from OpenAI API');
        }
      } catch (openaiError) {
        console.error('❌ OpenAI Error:', openaiError.message);
        console.error('❌ OpenAI Error Details:', openaiError);
        throw new Error(`Image generation failed: ${openaiError.message}`);
      }
    } else if (type === 'video') {
      // Generate video using Runway API
      console.log('🎬 Generating video with Runway...');
      console.log('🔑 Runway API Key:', process.env.RUNWAY_API_KEY ? 'Found' : 'Missing!');
      
      if (!process.env.RUNWAY_API_KEY) {
        throw new Error('Runway API key is not configured');
      }
      
      try {
        // Runway Gen-4 Turbo API endpoint
        const runwayResponse = await axios.post(
          'https://api.runwayml.com/v1/generate',
          {
            prompt: description,
            aspect_ratio: '16:9',
            duration: 5, // 5 seconds
            model: 'gen4-turbo'
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minutes timeout for video generation
          }
        );
        
        console.log('📡 Runway Response received:', runwayResponse.data);
        
        // Runway returns a task ID, we need to poll for completion
        if (runwayResponse.data && runwayResponse.data.task_id) {
          const taskId = runwayResponse.data.task_id;
          console.log('⏳ Polling for video completion, task ID:', taskId);
          
          // Poll for video completion (max 10 attempts, 10 seconds apart)
          let videoUrl = null;
          let attempts = 0;
          const maxAttempts = 30; // 5 minutes max wait time
          
          while (attempts < maxAttempts && !videoUrl) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            try {
              const statusResponse = await axios.get(
                `https://api.runwayml.com/v1/tasks/${taskId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
                  }
                }
              );
              
              console.log(`📊 Status check ${attempts + 1}/${maxAttempts}:`, statusResponse.data.status);
              
              if (statusResponse.data.status === 'completed' && statusResponse.data.output) {
                videoUrl = statusResponse.data.output[0] || statusResponse.data.output;
                console.log('✅ Video generation completed!', videoUrl);
                break;
              } else if (statusResponse.data.status === 'failed') {
                throw new Error('Video generation failed: ' + (statusResponse.data.error || 'Unknown error'));
              }
              
              attempts++;
            } catch (statusError) {
              console.error('Error checking status:', statusError.message);
              attempts++;
            }
          }
          
          if (!videoUrl) {
            throw new Error('Video generation timed out. Please try again.');
          }
          
          generatedUrl = videoUrl;
        } else if (runwayResponse.data && runwayResponse.data.url) {
          // Direct URL response (some API versions)
          generatedUrl = runwayResponse.data.url;
        } else {
          throw new Error('Invalid response from Runway API');
        }
        
        console.log('✅ Video generated successfully:', generatedUrl);
      } catch (runwayError) {
        console.error('❌ Runway Error:', runwayError.response?.data || runwayError.message);
        throw new Error(`Video generation failed: ${runwayError.response?.data?.message || runwayError.message}`);
      }
    }

    // Save to database with URL
    const title = description.substring(0, 100);
    const [result] = await db.query(
      'INSERT INTO content (Title, OwnerID, ContentType, Description, URL, DateCreated) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, userId, type, description, generatedUrl]
    );

    console.log('💾 Content saved to database with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Content generated successfully',
      contentId: result.insertId,
      url: generatedUrl,
      description: description,
      type: type
    });

  } catch (error) {
    console.error('❌ Error generating content:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
});

// Delete generated content
router.delete('/:id', validateContentId, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting content ID:', id);

    // Use correct column name: ContentID
    await db.query('DELETE FROM content WHERE ContentID = ?', [id]);

    console.log('✅ Content deleted successfully');

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting content:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete content', 
      error: error.message 
    });
  }
});

module.exports = router;
