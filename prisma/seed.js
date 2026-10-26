const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

async function main() {
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await prisma.user.createManyAndReturn({
    data: users,
  });

  const userMap = new Map();
  createdUsers.forEach((u) => {
    userMap.set(u.username, u.id);
  });

  const postsToCreate = posts.map((p) => ({
    imageUrl: p.imageUrl,
    caption: p.caption,
    location: p.location,
    createdAt: p.createdAt,
    authorId: userMap.get(p.author),
  }));

  const createdPosts = await prisma.post.createManyAndReturn({
    data: postsToCreate,
  });

  const postMap = new Map();
  createdPosts.forEach((p) => {
    const key = p.imageUrl.split("/")[4];
    postMap.set(key, p.id);
  });

  const likesToCreate = likes.map((l) => ({
    userId: userMap.get(l.user),
    postId: postMap.get(l.post),
  }));

  const createdLikes = await prisma.like.createMany({
    data: likesToCreate,
  });

  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.count} likes`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
