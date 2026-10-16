import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "@/components/study/AppLayout";
import { StudyProvider } from "@/features/study/StudyProvider";
import Dashboard from "@/pages/study/Dashboard";
import Planner from "@/pages/study/Planner";
import { SchoolworkPage, TuitionPage } from "@/pages/study/WorkQueues";
import SubjectPage from "@/pages/study/SubjectPage";
import AllChapters from "@/pages/study/AllChapters";
import ChapterDetail from "@/pages/study/ChapterDetail";
import ResourcesPage from "@/pages/study/ResourcesPage";
import SettingsPage from "@/pages/study/SettingsPage";

function Router() {
  return <AppLayout><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/planner" component={Planner} />
    <Route path="/schoolwork" component={SchoolworkPage} />
    <Route path="/tuition" component={TuitionPage} />
    <Route path="/subject/:subjectId" component={SubjectPage} />
    <Route path="/chapters" component={AllChapters} />
    <Route path="/chapter/:chapterId" component={ChapterDetail} />
    <Route path="/resources" component={ResourcesPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></AppLayout>;
}
export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><StudyProvider><Toaster /><Router /></StudyProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
