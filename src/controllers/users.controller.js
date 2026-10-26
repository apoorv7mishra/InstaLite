const usersService = require("../services/users.service");
const { Prisma } = require("@prisma/client");

function isValidPositiveInteger(val) {
  if (typeof val !== "string") return false;
  if (!/^\d+$/.test(val)) return false;
  const num = parseInt(val, 10);
  return num > 0;
}

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
  const { page: rawPage, limit: rawLimit, sortBy = "createdAt", order = "desc", isPrivate: rawIsPrivate, search } = req.query;

  // Validation: page & limit
  if (rawPage !== undefined && !isValidPositiveInteger(rawPage)) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }
  if (rawLimit !== undefined && !isValidPositiveInteger(rawLimit)) {
    return res.status(400).json({ error: "page and limit must be positive integers" });
  }

  const page = rawPage !== undefined ? parseInt(rawPage, 10) : 1;
  const requestedLimit = rawLimit !== undefined ? parseInt(rawLimit, 10) : 10;
  const limit = Math.min(requestedLimit, 50);
  const skip = (page - 1) * limit;

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

  // Validation: isPrivate
  const where = {};
  if (rawIsPrivate !== undefined) {
    if (rawIsPrivate === "true") {
      where.isPrivate = true;
    } else if (rawIsPrivate === "false") {
      where.isPrivate = false;
    } else {
      return res.status(400).json({ error: "isPrivate must be true or false" });
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

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return res.status(200).json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
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

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
