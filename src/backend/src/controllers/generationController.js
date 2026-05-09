const Content = require('../models/Content');
const Subscription = require('../models/Subscription');

class GenerationController {
  // Check if user can generate content
  static async canGenerate(req, res) {
    try {
      const { userId } = req.params;

      // Check subscription status
      const subscription = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() }
      }).sort({ endDate: -1 });

      const isPremium = !!subscription;

      // If premium, unlimited generations
      if (isPremium) {
        return res.json({
          success: true,
          canGenerate: true,
          subscriptionType: 'premium',
          remaining: 'unlimited',
          used: 0,
          limit: 999999,
          message: 'Premium user has unlimited generations'
        });
      }

      // For free users, count today's generations
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await Content.countDocuments({
        ownerId: userId,
        dateCreated: { $gte: startOfDay }
      });

      const limit = 5;
      const remaining = Math.max(0, limit - todayCount);
      const canGenerate = todayCount < limit;

      res.json({
        success: true,
        canGenerate,
        subscriptionType: 'free',
        used: todayCount,
        limit: limit,
        remaining: remaining,
        message: canGenerate
          ? `You have ${remaining} generations remaining today`
          : 'Daily limit reached. Upgrade to Premium for unlimited generations!'
      });

    } catch (error) {
      console.error('Can generate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check generation limit',
        error: error.message
      });
    }
  }

  // Get generation count
  static async getCount(req, res) {
    try {
      const { userId } = req.params;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await Content.countDocuments({
        ownerId: userId,
        dateCreated: { $gte: startOfDay }
      });

      const limit = 5;
      const remaining = Math.max(0, limit - todayCount);

      res.json({
        success: true,
        count: todayCount,
        limit: limit,
        remaining: remaining
      });

    } catch (error) {
      console.error('Get count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get generation count',
        error: error.message
      });
    }
  }

  // Increment generation count (for compatibility)
  static async increment(req, res) {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      // Get updated count
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todayCount = await Content.countDocuments({
        ownerId: userId,
        dateCreated: { $gte: startOfDay }
      });

      const remaining = Math.max(0, 5 - todayCount);

      res.json({
        success: true,
        message: 'Count retrieved successfully',
        todayCount: todayCount,
        limit: 5,
        remaining: remaining
      });

    } catch (error) {
      console.error('Increment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get generation count',
        error: error.message
      });
    }
  }
}

module.exports = GenerationController;