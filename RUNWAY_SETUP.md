# Runway API Setup Guide

## ✅ Runway Video Generation Integration

Runway Gen-4 Turbo has been integrated for video generation in your application.

## Environment Variable Setup

Add the following to your `.env` file in the `backend` directory:

```env
RUNWAY_API_KEY=key_7d44552f7f77b8db1733ee7739194a0b4c423abb4798a2a088b7c5cabb04b21ec757a9b2bb35dcf5ec31cee40ba3c8a7331f6b93416d81f6bfcbeb6ee5abfd98
```

## How It Works

1. **User Request**: User enters a video description and clicks "Generate"
2. **API Call**: Backend sends request to Runway Gen-4 Turbo API
3. **Task Creation**: Runway creates a generation task and returns a task ID
4. **Polling**: Backend polls Runway API every 10 seconds to check video status
5. **Completion**: Once video is ready, URL is saved to database and returned to user

## Video Generation Settings

- **Model**: Gen-4 Turbo
- **Aspect Ratio**: 16:9 (widescreen)
- **Duration**: 5 seconds
- **Max Wait Time**: 5 minutes (30 polling attempts)
- **Polling Interval**: 10 seconds

## API Endpoints Used

- **Generate Video**: `POST https://api.runwayml.com/v1/generate`
- **Check Status**: `GET https://api.runwayml.com/v1/tasks/{task_id}`

## Request Format

```json
{
  "prompt": "A serene mountain landscape at sunset",
  "aspect_ratio": "16:9",
  "duration": 5,
  "model": "gen4-turbo"
}
```

## Response Handling

The API returns a task ID which is then polled until completion:
- **Status**: `pending` → `processing` → `completed` or `failed`
- **Output**: Video URL when status is `completed`

## Error Handling

- Missing API key: Returns clear error message
- Generation timeout: Returns timeout error after 5 minutes
- Generation failure: Returns error message from Runway API
- Network errors: Handled gracefully with retry logic

## Performance Notes

- Video generation typically takes 1-5 minutes
- The request timeout is set to 5 minutes to accommodate longer generations
- Users will see a loading indicator during generation
- The polling mechanism ensures we don't miss completion

## Testing

To test video generation:
1. Ensure `RUNWAY_API_KEY` is set in `.env`
2. Go to Dashboard → Generate Videos tab
3. Enter a video description
4. Click "Generate for free"
5. Wait for video generation (may take 1-5 minutes)

## Troubleshooting

**Issue**: "Runway API key is not configured"
- **Solution**: Add `RUNWAY_API_KEY` to your `.env` file

**Issue**: "Video generation timed out"
- **Solution**: The video may need more time. Try again or check Runway API status

**Issue**: "Invalid response from Runway API"
- **Solution**: Check API key validity and Runway API status

---

*Runway integration completed - Ready for video generation!*
