"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import ErrorDisplay from "../components/ErrorDisplay";
import { useRouter } from "next/navigation";
import PageHeading from "../components/page_heading";
import { usePlayer } from "@/contexts/PlayerContext";

export default function Page() {
  const { data: session, update: updateSession, status } = useSession();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshPlayers } = usePlayer();

  // Keep the display name in sync with the session
  useEffect(() => {
    if (session?.user?.username && !isLoading) {
      setNewName(session.user.username);
    }
  }, [session?.user?.username, isLoading]);

  const handleUpdateName = async () => {
    if (!session?.user?.email) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
        }),
      });

      if (!response.ok) {
        const data = await response.text();
        throw new Error(data || "Failed to update username");
      }

      // Get the updated user data
      const updatedUser = await response.json();
      console.log("Received updated user:", updatedUser);

      // Update the session with new data
      await updateSession({
        ...session,
        user: {
          ...session.user,
          username: updatedUser.username,
        },
      });

      // Refresh player context
      refreshPlayers();

      // Use Next.js router for navigation
      router.refresh();
      router.push("/settings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Only redirect if we're sure there's no session
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10 flex flex-col space-y-8">
      {/* Header */}
      <PageHeading pageTitle="Settings"></PageHeading>

      {error && (
        <div className="px-4">
          <ErrorDisplay
            error={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      )}

      {/* Settings Form */}
      <div className="flex flex-col gap-4 px-4">
        {/* Profile Settings Card */}
        <div className="card bg-base-200 shadow-lg w-full">
          <div className="card-body">
            <h2 className="card-title">Profile Settings</h2>
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <div className="flex flex-col gap-5 w-full">
                <input
                  type="text"
                  placeholder="Change username"
                  className="input input-bordered w-full"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button
                  className={`btn btn-primary ${isLoading ? "loading" : ""}`}
                  onClick={handleUpdateName}
                  disabled={isLoading || newName === session?.user?.username}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <div className="card bg-base-200 shadow-lg w-full">
          <div className="card-body">
            <h2 className="card-title">Account</h2>
            <button
              className="btn btn-error w-full sm:w-auto"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
