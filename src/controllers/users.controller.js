const usersService = require("../services/users.service");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { Prisma } = require("@prisma/client");

async function create(req, res) {
  const { username, email, fullname, bio } = req.body;
  if (!username || !email || !fullname) {
    return res.status(400).json({ error: "username, email and fullname are required" });
  }

  try {
    const user = await usersService.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "username or email already taken" });
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
    isPrivate: rawIsPrivate,
    hasPosts: rawHasPosts,
    search,
  } = req.query;

  // Validation: sortBy
  const allowedSortBy = ["createdAt", "username", "fullname"];
  if (!allowedSortBy.includes(sortBy)) {
    return res.status(400).json({ error: "sortBy must be one of: createdAt, username, fullname" });
  }

  // Validation: order
  const allowedOrder = ["asc", "desc"];
  if (!allowedOrder.includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const where = {};

  // Validation: isPrivate
  if (rawIsPrivate !== undefined) {
    if (rawIsPrivate === "true") {
      where.isPrivate = true;
    } else if (rawIsPrivate === "false") {
      where.isPrivate = false;
    } else {
      return res.status(400).json({ error: "isPrivate must be true or false" });
    }
  }

  // Validation: hasPosts
  if (rawHasPosts !== undefined) {
    if (rawHasPosts === "true") {
      where.posts = { some: {} };
    } else if (rawHasPosts === "false") {
      where.posts = { none: {} };
    } else {
      return res.status(400).json({ error: "hasPosts must be true or false" });
    }
  }

  // search filter
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { fullname: { contains: search, mode: "insensitive" } },
    ];
  }

  const orderBy = { [sortBy]: order };

  try {
    const { data, total } = await usersService.listUsers({
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
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const user = await usersService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function update(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const { fullname, bio, isPrivate } = req.body;
  try {
    const updated = await usersService.updateUser(id, { fullname, bio, isPrivate });
    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function remove(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    await usersService.deleteUser(id);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { page, limit, skip } = pagination;

  try {
    const result = await usersService.getUserPosts(id, {
      skip,
      take: limit,
    });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      data: result.data,
      meta: buildMeta(page, limit, result.total),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function getUserLikedPosts(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }

  const pagination = parsePagination(req.query);
  if (pagination.error) {
    return res.status(400).json({ error: pagination.error });
  }

  const { page, limit, skip } = pagination;

  try {
    const result = await usersService.getUserLikedPosts(id, {
      skip,
      take: limit,
    });
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      data: result.data,
      meta: buildMeta(page, limit, result.total),
    });
  } catch (err) {
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
  getUserPosts,
  getUserLikedPosts,
};
