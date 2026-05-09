const cron = require('node-cron');
const Content = require('../models/Content');

// Daily generation reset cron job
const setupCronJobs = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    const now = new Date().toISOString();
    console.log('\n========================================');
    console.log(`🔄 DAILY RESET TRIGGERED AT: ${now}`);
    console.log('========================================');
    console.log('✅ Generation counts automatically reset for all free users');
    console.log('📅 New day begins - all users have fresh 5/5 generations');
    console.log('========================================\n');

    try {
      // Optional: Log statistics for monitoring
      // Get start of yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const stats = await Content.aggregate([
        {
          $match: {
            dateCreated: { $gte: yesterday, $lte: yesterdayEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalGenerations: { $sum: 1 },
            activeUsers: { $addToSet: '$ownerId' }
          }
        },
        {
          $project: {
            totalGenerations: 1,
            activeUsersCount: { $size: '$activeUsers' }
          }
        }
      ]);

      if (stats.length > 0) {
        console.log('📊 Yesterday\'s Statistics:');
        console.log(`   - Active users: ${stats[0].activeUsersCount}`);
        console.log(`   - Total generations: ${stats[0].totalGenerations}`);
        console.log('========================================\n');
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error.message);
    }
  }, {
    timezone: "Africa/Cairo"  // Sudan timezone
  });

  console.log('⏰ Cron jobs initialized - Daily reset at 00:00 Africa/Cairo');
};

module.exports = {
  setupCronJobs
};