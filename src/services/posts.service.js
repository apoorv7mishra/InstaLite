const prisma = require("../db");

async function createPost(data) {
  const { imageUrl, caption, location } = data;
  return await prisma.post.create({
    data: {
      imageUrl,
      caption: caption !== undefined ? caption : null,
      location: location !== undefined ? location : null,
    },
  });
}

async function listPosts({ skip, take, orderBy, where }) {
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      skip,
      take,
      orderBy,
      where,
    }),
    prisma.post.count({ where }),
  ]);
  return { data, total };
}

async function getPostById(id) {
  return await prisma.post.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

async function updatePost(id, data) {
  const postId = parseInt(id, 10);
  const updateData = {};
  if (data.caption !== undefined) updateData.caption = data.caption;
  if (data.location !== undefined) updateData.location = data.location;

  return await prisma.post.update({
    where: { id: postId },
    data: updateData,
  });
}

async function deletePost(id) {
  const postId = parseInt(id, 10);
  return await prisma.post.delete({
    where: { id: postId },
  });
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
};
