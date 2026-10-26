function parsePagination(query) {
  const { page: rawPage, limit: rawLimit } = query;

  if (rawPage !== undefined) {
    if (typeof rawPage !== "string" || !/^\d+$/.test(rawPage) || parseInt(rawPage, 10) <= 0) {
      return { error: "page and limit must be positive integers" };
    }
  }

  if (rawLimit !== undefined) {
    if (typeof rawLimit !== "string" || !/^\d+$/.test(rawLimit) || parseInt(rawLimit, 10) <= 0) {
      return { error: "page and limit must be positive integers" };
    }
  }

  const page = rawPage !== undefined ? parseInt(rawPage, 10) : 1;
  const requestedLimit = rawLimit !== undefined ? parseInt(rawLimit, 10) : 10;
  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

module.exports = {
  parsePagination,
  buildMeta,
};
