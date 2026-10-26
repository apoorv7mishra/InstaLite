const prisma = require("../db");

async function getLikesByPostId(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) {
    return null;
  }

  const likes = await prisma.like.findMany({
    where: { postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullname: true,
        },
      },
    },
    orderBy: {
      user: {
        username: "asc",
      },
    },
  });

  return likes.map((l) => l.user);
}

async function addLike(postId, userId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) {
    const error = new Error("Post not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.like.create({
    data: {
      postId,
      userId,
    },
    select: {
      userId: true,
      postId: true,
      createdAt: true,
    },
  });
}

async function removeLike(postId, userId) {
  return await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });
}

module.exports = {
  getLikesByPostId,
  addLike,
  removeLike,
};
