if (process.env.NODE_ENV === 'production') {
  module.exports.API_HOST = 'http://onboard.fun';
} else {
  module.exports.API_HOST = 'http://localhost:3000';
}
