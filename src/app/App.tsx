import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./ThemeContext";
import { BoardCategoriesProvider } from "./BoardCategoriesContext";

export default function App() {
  return (
    <ThemeProvider>
      <BoardCategoriesProvider>
        <RouterProvider router={router} />
      </BoardCategoriesProvider>
    </ThemeProvider>
  );
}
