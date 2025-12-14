import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_EXPIRES = process.env.JWT_EXPIRES || '30d';

export const tokenService = {
    generateToken: (payload, expiresIn = DEFAULT_EXPIRES) => {
        return jwt.sign(payload, JWT_SECRET, { expiresIn });
    },

    verifyToken: (token) => {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return null;
        }
    }
};
