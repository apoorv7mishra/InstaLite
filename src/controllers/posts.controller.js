const postsService = require("../services/posts.service");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { Prisma } = require("@prisma/client");

function isValidDate(str) {
  if (typeof str !== "string") return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body;
  if (!imageUrl || authorId === undefined || authorId === null || authorId === "") {
    return res.status(400).json({ error: "imageUrl and authorId are required" });
  }

  const parsedAuthorId = parseInt(authorId, 10);
  if (isNaN(parsedAuthorId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const post = await postsService.createPost({
      imageUrl,
      authorId: parsedAuthorId,
      caption,
      location,
    });
    return res.status(201).json(post);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { page, limit, skip } = pagination;
  const {
    sortBy = "createdAt",
    order = "desc",
    location,
    search,
    from,
    to,
  } = req.query;

  // Validation: sortBy
  const allowedSortBy = ["createdAt", "updatedAt", "likes"];
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, updatedAt, likes" });
  }

  // Validation: order
  const allowedOrder = ["asc", "desc"];
  if (!allowedOrder.includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  // Validation: from & to dates
  if ((from !== undefined && !isValidDate(from)) || (to !== undefined && !isValidDate(to))) {
    return res.status(400).json({ error: "from and to must be valid dates" });
  }

  const where = {};

  if (location) {
    where.location = { equals: location, mode: "insensitive" };
  }

  if (search) {
    where.caption = { contains: search, mode: "insensitive" };
  }

  if (from !== undefined || to !== undefined) {
    where.createdAt = {};
    if (from !== undefined) {
      where.createdAt.gte = new Date(from);
    }
    if (to !== undefined) {
      where.createdAt.lt = new Date(to);
    }
  }

  let orderBy;
  if (sortBy === "likes") {
    orderBy = [
      { likes: { _count: order } },
      { createdAt: "desc" },
    ];
  } else {
    orderBy = { [sortBy]: order };
  }

  try {
    const { data, total } = await postsService.listPosts({
      skip,
      take: limit,
      orderBy,
      where,
    });

    return res.status(200).json({
      data,
      meta: buildMeta(page, limit, total),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const post = await postsService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { caption, location } = req.body;
  try {
    const updated = await postsService.updatePost(id, { caption, location });
    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    await postsService.deletePost(id);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
