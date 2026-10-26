const likesService = require("../services/likes.service");
const { Prisma } = require("@prisma/client");

async function listLikes(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const likers = await likesService.getLikesByPostId(postId);
    if (!likers) {
      return res.status(404).json({ error: "Post not found" });
    }
    return res.status(200).json(likers);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function likePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { userId } = req.body;
  if (userId === undefined || userId === null || userId === "") {
    return res.status(400).json({ error: "userId is required" });
  }

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const like = await likesService.addLike(postId, parsedUserId);
    return res.status(201).json(like);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function unlikePost(req, res) {
  const postId = parseInt(req.params.id, 10);
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(postId) || isNaN(userId)) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.removeLike(postId, userId);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  listLikes,
  likePost,
  unlikePost,
};
