import Link from "next/link";
import { Folder, Tag, FileText, Star } from "lucide-react";

/**
 * Dashboard / Home Page
 * URL: / or /notes
 *
 * Shows:
 * - Stats overview (notes count, folders count, tags count)
 * - Pinned/favorite notes
 * - Recent notes
 * - Quick access folders
 */
export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">👋 Welcome back!</h1>
            <p className="text-muted-foreground mt-1">
              Your Second Brain Dashboard
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={FileText}
            label="Total Notes"
            value={0}
            color="blue"
          />
          <StatCard icon={Folder} label="Folders" value={0} color="green" />
          <StatCard icon={Tag} label="Tags" value={0} color="purple" />
        </div>

        {/* Pinned Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5" />
              Pinned Notes
            </h2>
            <Link
              href="/notes?favorites=true"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No favorite notes yet</p>
            <p className="text-sm mt-1">
              Star your important notes to see them here
            </p>
          </div>
        </section>

        {/* Recent Notes Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Notes
            </h2>
            <Link
              href="/notes"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm mt-1">
              Create your first note to get started
            </p>
            <Link
              href="/notes/new"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Note
            </Link>
          </div>
        </section>

        {/* Quick Access Folders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Quick Access Folders
            </h2>
          </div>
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No folders yet</p>
            <p className="text-sm mt-1">Organize your notes with folders</p>
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "green" | "purple";
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
  };

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
