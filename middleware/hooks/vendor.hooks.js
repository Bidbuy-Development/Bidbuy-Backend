import bcrypt from 'bcryptjs';

/**
 * Middleware to hash vendor password before saving
 * @param {Object} schema - Mongoose schema
 */
export const hashVendorPassword = (schema) => {
    schema.pre('save', async function(next) {
        // Only hash the password if it has been modified (or is new)
        if (!this.isModified('password')) return next();
        
        try {
            // Generate salt
            const salt = await bcrypt.genSalt(10);
            // Hash the password with the salt
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    });
};

/**
 * Method to compare password for vendor authentication
 * @param {Object} schema - Mongoose schema
 */
export const addPasswordComparison = (schema) => {
    schema.methods.comparePassword = async function(candidatePassword) {
        try {
            return await bcrypt.compare(candidatePassword, this.password);
        } catch (error) {
            throw new Error('Error comparing passwords');
        }
    };
};
