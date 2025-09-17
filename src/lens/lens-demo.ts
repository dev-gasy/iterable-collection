// Demonstration of improved lens type inference capabilities

import { from } from "./lens.ts";

// Sample data structures
interface User {
  id: number;
  name: string;
  profile: {
    email: string;
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
  };
  posts: Post[];
}

interface Post {
  id: number;
  title: string;
  content: string;
  tags: string[];
  metadata: {
    createdAt: string;
    views: number;
  };
}

// Sample data
const sampleUser: User = {
  id: 1,
  name: "John Doe",
  profile: {
    email: "john@example.com",
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
  posts: [
    {
      id: 1,
      title: "Introduction to Lenses",
      content: "Lenses are a powerful functional programming concept...",
      tags: ["functional", "programming", "lenses"],
      metadata: {
        createdAt: "2024-01-01",
        views: 150,
      },
    },
    {
      id: 2,
      title: "TypeScript Tips",
      content: "Here are some advanced TypeScript techniques...",
      tags: ["typescript", "tips", "advanced"],
      metadata: {
        createdAt: "2024-01-15",
        views: 95,
      },
    },
  ],
};

// Examples of improved lens usage

// 1. Simple property access with type inference
const userName = from(sampleUser)
  .safeProp("name")
  .getOr("Unknown User");

console.log("User name:", userName); // "John Doe"

// 2. Deep nested property access - much cleaner than before!
const userTheme = from(sampleUser)
  .safeProp("profile")
  .safeProp("preferences")
  .safeProp("theme")
  .getOr("light");

console.log("User theme:", userTheme); // "dark"

// 3. Array access with type inference
const firstPostTitle = from(sampleUser)
  .safeProp("posts")
  .at<Post>(0)
  .safeProp("title")
  .getOr("No title");

console.log("First post title:", firstPostTitle); // "Introduction to Lenses"

// 4. Finding items in arrays with type safety
const typescriptPost = from(sampleUser)
  .safeProp("posts")
  .findItem((post: Post) => post.tags.includes("typescript"))
  .safeProp("title")
  .getOr("No TypeScript post found");

console.log("TypeScript post:", typescriptPost); // "TypeScript Tips"

// 5. Complex transformations with type inference
const userSummary = from(sampleUser)
  .transform((user: User) => ({
    name: user.name,
    email: user.profile.email,
    postCount: user.posts.length,
    totalViews: user.posts.reduce((sum, post) => sum + post.metadata.views, 0),
    hasNotifications: user.profile.preferences.notifications,
  }))
  .getOr({
    name: "Unknown",
    email: "No email",
    postCount: 0,
    totalViews: 0,
    hasNotifications: false,
  });

console.log("User summary:", userSummary);

// 6. Chaining operations with excellent type safety
const popularPostTags = from(sampleUser)
  .safeProp("posts")
  .findItem((post: Post) => post.metadata.views > 100)
  .safeProp("tags")
  .getOr([]);

console.log("Popular post tags:", popularPostTags); // ["functional", "programming", "lenses"]

// 7. Using direct lens composition for clean navigation
const userEmail = from(sampleUser)
  .safeProp("profile")
  .safeProp("email")
  .getOr("No email");

console.log("User email:", userEmail); // "john@example.com"

// 8. Safe updates with immutability
const updatedUser = from(sampleUser)
  .safeProp("profile")
  .safeProp("preferences")
  .set({ theme: "light", notifications: false });

console.log("Updated user preferences:", updatedUser.profile.preferences);

export { sampleUser };