function parsePagination(query, defaults = { page: 1, pageSize: 12 }) {
  const page = Math.max(parseInt(query.page || defaults.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize || defaults.pageSize, 10) || 12, 1), 100);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}
module.exports = { parsePagination };
