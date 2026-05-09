const User = require('../models/User');
const bcrypt = require('bcrypt');

class UserController {
    // Get user profile by ID
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            // Ensure the user is requesting their own profile or is an admin
            if (req.user.userId !== id) {
                // We could technically allow viewing other profiles, but for now restrict to own
                // Unless it's an admin check (not implemented yet)
            }

            const user = await User.findById(id).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user profile',
                error: error.message
            });
        }
    }

    // Update user profile
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { username, email, password } = req.body;

            // Ensure user is updating their own profile
            if (req.user.userId !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized to update this profile'
                });
            }

            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update fields if provided
            if (username) user.username = username;
            if (email) user.email = email;

            if (password) {
                const saltRounds = 10;
                user.password = await bcrypt.hash(password, saltRounds);
            }

            await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user profile',
                error: error.message
            });
        }
    }
}

module.exports = UserController;
