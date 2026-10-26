const prisma = require("../db");

async function createUser(data) {
  const { username, email, fullname, bio } = data;
  return await prisma.user.create({
    data: {
      username,
      email,
      fullname,
      bio: bio !== undefined ? bio : null,
    },
  });
}

async function listUsers({ skip, take, orderBy, where }) {
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      orderBy,
      where,
    }),
    prisma.user.count({ where }),
  ]);
  return { data, total };
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      _count: {
        select: {
          posts: true,
          likes: true,
        },
      },
    },
  });
}

async function updateUser(id, data) {
  const userId = parseInt(id, 10);
  const updateData = {};
  if (data.fullname !== undefined) updateData.fullname = data.fullname;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

async function deleteUser(id) {
  const userId = parseInt(id, 10);
  return await prisma.user.delete({
    where: { id: userId },
  });
}

async function getUserPosts(userId, { skip, take }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return null;
  }

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { authorId: userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
    prisma.post.count({ where: { authorId: userId } }),
  ]);

  return { data, total };
}

async function getUserLikedPosts(userId, { skip, take }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return null;
  }

  const where = {
    likes: {
      some: {
        userId,
      },
    },
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
  getUserLikedPosts,
};
