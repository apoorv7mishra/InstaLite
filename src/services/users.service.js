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

async function listUsers() {
  return await prisma.user.findMany();
}

async function getUserById(id) {
  return await prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
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

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
};
