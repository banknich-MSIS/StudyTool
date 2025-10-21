import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import SettingsPage from "./pages/SettingsPage";
import ExamPage from "./pages/ExamPage";
import ReviewPage from "./pages/ReviewPage";
import AttemptReviewPage from "./pages/AttemptReviewPage";
import HistoryPage from "./pages/HistoryPage";
import ClassesPage from "./pages/ClassesPage";
import SupportPage from "./pages/SupportPage";
import UtilitiesPage from "./pages/UtilitiesPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <UploadPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "exam/:examId", element: <ExamPage /> },
      { path: "review/:examId", element: <ReviewPage /> },
      { path: "classes", element: <ClassesPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "history/:attemptId", element: <AttemptReviewPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "utilities", element: <UtilitiesPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
