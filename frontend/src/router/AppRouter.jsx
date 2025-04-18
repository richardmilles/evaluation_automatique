import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import StudentDashboard from "../pages/student/Dashboard";
import Submit from "../pages/student/Submit";
import ProfessorDashboard from "../pages/professor/Dashboard";
import CreateExercise from "../pages/professor/CreateExercise";
import NotFound from "../pages/common/NotFound";
import PostLogin from '../pages/common/PostLogin';
import ProtectedRoute from './ProtectedRoute';
import SubmissionList from '../pages/professor/SubmissionList';
import FeedbackDetail from '../pages/professor/FeedbackDetail';
import StudentFeedbackDetail from '../pages/student/StudentFeedbackDetail';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post-login" element={<PostLogin />} />
        {/* Étudiant */}
       
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/submit"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Submit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/feedback/:correctionId"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentFeedbackDetail />
            </ProtectedRoute>
          }
        />

        {/* Professeur */}
        <Route
          path="/professor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <ProfessorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professor/create"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <CreateExercise />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professor/exercise/:exerciseId/submissions"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <SubmissionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professor/feedback/:correctionId"
          element={
            <ProtectedRoute allowedRoles={['professor']}>
              <FeedbackDetail />
            </ProtectedRoute>
          }
        />
        {/* Page 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
