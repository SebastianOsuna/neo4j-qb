module.exports = function escapeString(str, hard) {
  var escaped = (str || '').toString().trim().replace(/[\s,-]/g, '_')
    .replace(/[\*\+\'\"\{\}\[\]\(\)]/g, '');

  if (hard) {
    escaped = escaped.replace(/\./g, '_');
  }

  return escaped;
};
