import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Trophy, Heart, TrendingUp, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [scoreInput, setScoreInput] = useState({
    score: "",
    scoreDate: new Date().toISOString().split("T")[0],
    courseName: "",
  });

  // Queries
  const { data: subscription } = trpc.subscription.getCurrent.useQuery();
  const { data: scores = [] } = trpc.golfScore.list.useQuery();
  const { data: charities = [] } = trpc.charity.list.useQuery();
  const { data: userCharity } = trpc.charity.getUserSelection.useQuery();
  const { data: myWinnings = [] } = trpc.winner.getMyWinners.useQuery();
  const { data: currentDraw } = trpc.draw.getCurrent.useQuery();

  // Mutations
  const addScoreMutation = trpc.golfScore.add.useMutation();
  const selectCharityMutation = trpc.charity.select.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreInput.score) {
      toast.error("Please enter a score");
      return;
    }

    try {
      await addScoreMutation.mutateAsync({
        score: parseInt(scoreInput.score),
        scoreDate: new Date(scoreInput.scoreDate),
        courseName: scoreInput.courseName,
      });
      toast.success("Score added successfully");
      setScoreInput({
        score: "",
        scoreDate: new Date().toISOString().split("T")[0],
        courseName: "",
      });
    } catch (error) {
      toast.error("Failed to add score");
    }
  };

  const handleSelectCharity = async (charityId: string) => {
    try {
      await selectCharityMutation.mutateAsync({
        charityId: parseInt(charityId),
        contributionPercentage: 10,
      });
      toast.success("Charity selected");
    } catch (error) {
      toast.error("Failed to select charity");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      setLocation("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const scoreData = scores
    .slice()
    .reverse()
    .map((score, index) => ({
      name: `Score ${index + 1}`,
      value: score.score,
    }));

  const totalWinnings = myWinnings.reduce(
    (sum: number, winner: any) => sum + parseFloat(winner.prizeAmount.toString()),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">⛳ Golf Charity</div>
          <div className="flex gap-4 items-center">
            <span className="text-slate-600">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-blue-100">
            Track your scores, participate in draws, and support charities
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          {["overview", "scores", "charity", "winnings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Subscription Status</p>
                    <p className="text-2xl font-bold mt-2">
                      {subscription?.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Latest Score</p>
                    <p className="text-2xl font-bold mt-2">
                      {scores.length > 0 ? scores[0].score : "—"}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Winnings</p>
                    <p className="text-2xl font-bold mt-2">${totalWinnings.toFixed(2)}</p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Charity Selected</p>
                    <p className="text-2xl font-bold mt-2">
                      {userCharity ? "Yes" : "No"}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </Card>
            </div>

            {scores.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        )}

        {/* Scores Tab */}
        {activeTab === "scores" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Add New Score</h3>
                <form onSubmit={handleAddScore} className="space-y-4">
                  <div>
                    <Label>Score (1-45)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="45"
                      value={scoreInput.score}
                      onChange={(e) =>
                        setScoreInput({ ...scoreInput, score: e.target.value })
                      }
                      placeholder="Enter score"
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scoreInput.scoreDate}
                      onChange={(e) =>
                        setScoreInput({
                          ...scoreInput,
                          scoreDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Course Name (Optional)</Label>
                    <Input
                      value={scoreInput.courseName}
                      onChange={(e) =>
                        setScoreInput({
                          ...scoreInput,
                          courseName: e.target.value,
                        })
                      }
                      placeholder="Course name"
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={addScoreMutation.isPending}
                  >
                    {addScoreMutation.isPending ? "Adding..." : "Add Score"}
                  </Button>
                </form>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Your Scores</h3>
                {scores.length === 0 ? (
                  <p className="text-slate-600">No scores yet. Add your first score!</p>
                ) : (
                  <div className="space-y-3">
                    {scores.map((score) => (
                      <div
                        key={score.id}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-bold">{score.score} points</p>
                          <p className="text-sm text-slate-600">
                            {score.courseName || "Course"}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {new Date(score.scoreDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Charity Tab */}
        {activeTab === "charity" && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Select a Charity</h3>
              <p className="text-slate-600 mb-4">
                Choose a charity to support with your subscription. A portion of
                your subscription fee will be donated.
              </p>
              <Select
                onValueChange={handleSelectCharity}
                defaultValue={userCharity?.charityId.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a charity" />
                </SelectTrigger>
                <SelectContent>
                  {charities.map((charity) => (
                    <SelectItem key={charity.id} value={charity.id.toString()}>
                      {charity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>

            {userCharity && (
              <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Your Selection
                </h3>
                <div>
                  <p className="text-slate-600 text-sm">Charity</p>
                  <p className="text-xl font-bold mb-4">
                    {charities.find((c) => c.id === userCharity.charityId)?.name}
                  </p>
                  <p className="text-slate-600 text-sm">Contribution</p>
                  <p className="text-2xl font-bold text-red-600">
                    {userCharity.contributionPercentage}%
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Winnings Tab */}
        {activeTab === "winnings" && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Your Winnings</h3>
            {myWinnings.length === 0 ? (
              <p className="text-slate-600">
                No winnings yet. Keep participating in draws!
              </p>
            ) : (
              <div className="space-y-3">
                {myWinnings.map((winning: any) => (
                  <div
                    key={winning.id}
                    className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border-l-4 border-yellow-500"
                  >
                    <div>
                      <p className="font-bold">{winning.matchType} Match</p>
                      <p className="text-sm text-slate-600">
                        Status: {winning.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-600">
                        ${winning.prizeAmount}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}
