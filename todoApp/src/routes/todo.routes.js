import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addTodo,
  deleteTodo,
  showAllTodos,
  showTodoById,
  updateTodo,
} from "../controllers/todo.controllers.js";

const router = Router();

//todo routes
router.route("/add-todo").post(verifyJWT, addTodo);
router.route("/show-all-todos").get(verifyJWT, showAllTodos);
router.route("/show-todo/:todoId").get(verifyJWT, showTodoById);
router.route("/update-todo/:todoId").put(verifyJWT, updateTodo);
router.route("/delete-todo/:todoId").delete(verifyJWT, deleteTodo);

export default router;
