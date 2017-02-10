module.exports = function escapeString(str) {
  return (str || '').toString().trim().replace(/\s\.,-/g, '_').replace(/[\*\+\'\"\{\}\[\]\(\)]/g, '');
};
