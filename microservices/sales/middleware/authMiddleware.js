const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
require('dotenv').config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  return done(null, jwt_payload); // Assume valid; IAM verifies user and adds sub to payload
}));

const authMiddleware = passport.authenticate('jwt', { session: false });

module.exports = authMiddleware;