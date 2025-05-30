// Inventory/authMiddleware.js
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
require('dotenv').config();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts "Bearer <token>" from Authorization header
    secretOrKey: process.env.JWT_SECRET, // Same secret as IAM
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    // Payload: { sub: userId, role: roleName }
    return done(null, jwt_payload); // Attaches to req.user
}));

const authMiddleware = passport.authenticate('jwt', { session: false });

module.exports = authMiddleware;