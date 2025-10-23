import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import SmartExamCreator from "./pages/SmartExamCreator";
import SettingsPage from "./pages/SettingsPage";
import ExamPage from "./pages/ExamPage";
import PracticeModePage from "./pages/PracticeModePage";
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
      { path: "ai-exam-creator", element: <SmartExamCreator /> },
      { path: "upload", element: <UploadPage /> },
      { path: "library", element: <Dashboard /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "exam/:examId", element: <ExamPage /> },
      { path: "practice/:examId", element: <PracticeModePage /> },
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
