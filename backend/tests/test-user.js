import connectDatabase from "../src/config/mongodb.js"
import User from "../src/models/user.model.js"
const test = async () => {
  await connectDatabase();

  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    username: "testuser",
    passwordHash: "temporary-hash",
  });

  console.log("User created:", user._id);

  await User.deleteOne({ _id: user._id });

  console.log("Test user deleted");

  process.exit(0);
};

test();