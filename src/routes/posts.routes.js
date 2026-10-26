const express = require("express");
const router = express.Router();
const postsController = require("../controllers/posts.controller");

router.post("/", postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getOne);
router.patch("/:id", postsController.update);
router.delete("/:id", postsController.remove);

module.exports = router;
