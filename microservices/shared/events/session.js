function read(query, session) {
  if (!session) {
    return query;
  }
  return query.session(session);
}

function save(doc, session) {
  if (!session) {
    return doc.save();
  }
  return doc.save({ session });
}

module.exports = { read, save };
