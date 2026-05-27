const Counter = require('../models/Counter');

/**
 * Atomically increment a named sequence and return the next value.
 * Sequences start at 1 (the first call to a fresh counter returns 1).
 *
 * @param {string} name - sequence name (typically the collection name)
 * @returns {Promise<number>}
 */
async function getNextSequence(name) {
  const c = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return c.seq;
}

module.exports = { getNextSequence };
