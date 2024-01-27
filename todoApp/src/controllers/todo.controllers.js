import { Todo } from "../models/todo.models.js";
import { User } from "../models/user.models.js";
import { APIErrorHandler } from "../utils/APIErrorHandler.js";
import { APIResponseHandler } from "../utils/APIResponseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addTodo = asyncHandler(async (req, res) => {
  const { user: loggedInUser } = req;
  if (!loggedInUser) {
    throw new APIErrorHandler(401, "Login first");
  }
  const { title, description, isCompleted } = req.body;
  if (typeof isCompleted !== "boolean") {
    throw new APIErrorHandler(400, "isCompleted should be boolean");
  }
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new APIErrorHandler(400, "All fields are required");
  }
  const user = await User.findById(loggedInUser._id);
  if (!user) {
    throw new APIErrorHandler(404, "Invalid Access");
  }
  const todo = await Todo.create({
    title,
    description,
    isCompleted,
    createdBy: user._id,
  });
  if (!todo) {
    throw new APIErrorHandler(400, "Todo not created");
  }
  user.todos.push(todo._id);
  await user.save({ validateBeforeSave: false });
  res
    .status(201)
    .json(new APIResponseHandler(200, todo, "Todo created successfully"));
});

export const showAllTodos = asyncHandler(async (req, res) => {
  const { user: loggedInUser } = req;
  if (!loggedInUser) {
    throw new APIErrorHandler(401, "Login first");
  }
  const user = await User.findById(loggedInUser._id);
  if (!user) {
    throw new APIErrorHandler(404, "Invalid Access");
  }
  if (user.todos.length === 0) {
    res.status(200).json(new APIResponseHandler(200, [], "No todos found"));
  }
  const todos = await Todo.find({ createdBy: user._id });
  if (!todos) {
    throw new APIErrorHandler(500, "Unable to get the todos");
  }
  res.status(200).json(new APIResponseHandler(200, todos, "Todos found"));
});

export const showTodoById = asyncHandler(async (req, res) => {
  const { user: loggedInUser } = req;
  if (!loggedInUser) {
    throw new APIErrorHandler(401, "Login first");
  }
  const { todoId } = req.params;
  if (!todoId) {
    throw new APIErrorHandler(400, "Todo id not given");
  }
  const user = await User.findById(loggedInUser._id);
  if (!user) {
    throw new APIErrorHandler(404, "Invalid Access");
  }
  if (user.todos.length === 0) {
    res.status(200).json(new APIResponseHandler(200, [], "No todos found"));
  }
  if (!user.todos.includes(todoId)) {
    throw new APIErrorHandler(401, "No such todo found");
  }
  const todo = await Todo.findById(todoId);
  if (!todo) {
    throw new APIErrorHandler(500, "Unable to get the todo");
  }
  res.status(200).json(new APIResponseHandler(200, todo, "Todo found"));
});

export const updateTodo = asyncHandler(async (req, res) => {
  const { user: loggedInUser } = req;
  if (!loggedInUser) {
    throw new APIErrorHandler(401, "Login to access");
  }
  const { title, description, isCompleted } = req.body;
  const { todoId } = req.params;
  if (!todoId) {
    throw new APIErrorHandler(400, "Todo id not given");
  }
  const user = await User.findById(loggedInUser._id);
  if (!user) {
    throw new APIErrorHandler(500, "Unable to fetch the user");
  }
  if (!user.todos.includes(todoId)) {
    throw new APIErrorHandler(401, "Unauthorized");
  }
  const updatedTodo = await Todo.findByIdAndUpdate(
    todoId,
    {
      $set: {
        title,
        description,
        isCompleted,
      },
    },
    { new: true }
  );
  if (!updateTodo) {
    throw new APIErrorHandler(500, "Unable to update the todo");
  }
  res
    .status(200)
    .json(new APIResponseHandler(200, updatedTodo, "Todo updated"));
});

export const deleteTodo = asyncHandler(async (req, res) => {
  console.log("Delete HIt");
  const { user: loggedInUser } = req;
  if (!loggedInUser) {
    throw new APIErrorHandler(401, "Login to access");
  }
  const { todoId } = req.params;
  if (!todoId) {
    throw new APIErrorHandler(400, "Todo id not given");
  }
  const user = await User.findById(loggedInUser._id);
  if (!user) {
    throw new APIErrorHandler(500, "Unable to fetch the user");
  }
  if (!user.todos.includes(todoId)) {
    throw new APIErrorHandler(401, "Unauthorized");
  }
  const deleteTodo = await Todo.findByIdAndDelete(todoId);
  if (!deleteTodo) {
    throw new APIErrorHandler(500, "Unable to delete the todo");
  }
  user.todos = user.todos.filter((todo_id) => todo_id != todoId);
  await user.save({ validateBeforeSave: false });
  const updatedUser = await User.findById(loggedInUser._id);
  if (!updatedUser) {
    throw new APIErrorHandler(500, "Unable to fetch the user");
  }
  if (updatedUser.todos.includes(todoId)) {
    throw new APIErrorHandler(500, "Unable to delete the todo from database");
  }
  res.status(200).json(new APIResponseHandler(200, {}, "Todo deleted"));
});
