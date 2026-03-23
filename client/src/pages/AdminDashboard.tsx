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
} from "recharts";
import { Users, Heart, Trophy, TrendingUp, LogOut } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("analytics");
  const [charityForm, setCharityForm] = useState({
    name: "",
    description: "",
    website: "",
    featured: false,
  });

  // Queries
  const { data: analytics } = trpc.admin.analytics.summary.useQuery();
  const { data: users = [] } = trpc.admin.users.list.useQuery();
  const { data: charities = [] } = trpc.admin.charities.list.useQuery();
  const { data: draws = [] } = trpc.admin.draws.list.useQuery();
  const { data: winners = [] } = trpc.admin.winners.list.useQuery();

  // Mutations
  const createCharityMutation = trpc.admin.charities.create.useMutation();
  const verifyWinnerMutation = trpc.admin.winners.verify.useMutation();
  const markPaidMutation = trpc.admin.winners.markPaid.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleCreateCharity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charityForm.name) {
      toast.error("Please enter charity name");
      return;
    }

    try {
      await createCharityMutation.mutateAsync({
        name: charityForm.name,
        description: charityForm.description,
        website: charityForm.website,
        featured: charityForm.featured,
      });
      toast.success("Charity created successfully");
      setCharityForm({
        name: "",
        description: "",
        website: "",
        featured: false,
      });
    } catch (error) {
      toast.error("Failed to create charity");
    }
  };

  const handleVerifyWinner = async (winnerId: number, status: "verified" | "rejected") => {
    try {
      await verifyWinnerMutation.mutateAsync({ winnerId, status });
      toast.success(`Winner ${status}`);
    } catch (error) {
      toast.error("Failed to verify winner");
    }
  };

  const handleMarkPaid = async (winnerId: number) => {
    try {
      await markPaidMutation.mutateAsync({ winnerId });
      toast.success("Winner marked as paid");
    } catch (error) {
      toast.error("Failed to mark as paid");
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

  const analyticsData = [
    { name: "Users", value: (analytics?.totalUsers as number) || 0 },
    { name: "Subscribers", value: (analytics?.totalSubscribers as number) || 0 },
    { name: "Draws", value: (analytics?.totalDraws as number) || 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">⛳ Admin Panel</div>
          <div className="flex gap-4 items-center">
            <span className="text-slate-600">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <section className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 overflow-x-auto">
          {["analytics", "users", "charities", "draws", "winners"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 font-medium transition-colors whitespace-nowrap ${
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
        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold mt-2">
                      {(analytics?.totalUsers as number) || 0}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Active Subscribers</p>
                    <p className="text-3xl font-bold mt-2">
                      {(analytics?.totalSubscribers as number) || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Draws</p>
                    <p className="text-3xl font-bold mt-2">
                      {(analytics?.totalDraws as number) || 0}
                    </p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Charity Contributions</p>
                    <p className="text-3xl font-bold mt-2">
                      ${((analytics?.totalCharityContributions as number) || 0).toFixed(2)}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Platform Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">User Management</h3>
            {users.length === 0 ? (
              <p className="text-slate-600">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Role</th>
                      <th className="px-4 py-2 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2">{u.email}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Charities Tab */}
        {activeTab === "charities" && (
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Add Charity</h3>
              <form onSubmit={handleCreateCharity} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={charityForm.name}
                    onChange={(e) =>
                      setCharityForm({ ...charityForm, name: e.target.value })
                    }
                    placeholder="Charity name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={charityForm.description}
                    onChange={(e) =>
                      setCharityForm({
                        ...charityForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={charityForm.website}
                    onChange={(e) =>
                      setCharityForm({ ...charityForm, website: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={charityForm.featured}
                    onChange={(e) =>
                      setCharityForm({
                        ...charityForm,
                        featured: e.target.checked,
                      })
                    }
                  />
                  <Label>Featured</Label>
                </div>
                <Button
                  className="w-full"
                  disabled={createCharityMutation.isPending}
                >
                  {createCharityMutation.isPending ? "Adding..." : "Add Charity"}
                </Button>
              </form>
            </Card>

            <div className="md:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Charities</h3>
                {charities.length === 0 ? (
                  <p className="text-slate-600">No charities</p>
                ) : (
                  <div className="space-y-3">
                    {charities.map((charity: any) => (
                      <div
                        key={charity.id}
                        className="p-3 bg-slate-50 rounded-lg border"
                      >
                        <p className="font-bold">{charity.name}</p>
                        <p className="text-sm text-slate-600">
                          {charity.description}
                        </p>
                        {charity.featured && (
                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded font-bold">
                            Featured
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Draws Tab */}
        {activeTab === "draws" && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Draws Management</h3>
            {draws.length === 0 ? (
              <p className="text-slate-600">No draws</p>
            ) : (
              <div className="space-y-3">
                {draws.map((draw: any) => (
                  <div
                    key={draw.id}
                    className="p-4 bg-slate-50 rounded-lg border flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">{draw.drawMonth}</p>
                      <p className="text-sm text-slate-600">
                        Type: {draw.drawType} | Status: {draw.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        ${draw.totalPrizePool.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Winners Tab */}
        {activeTab === "winners" && (
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Winner Verification</h3>
            {winners.length === 0 ? (
              <p className="text-slate-600">No winners</p>
            ) : (
              <div className="space-y-4">
                {winners.map((winner: any) => (
                  <div
                    key={winner.id}
                    className="p-4 bg-slate-50 rounded-lg border"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold">{winner.matchType} Match</p>
                        <p className="text-sm text-slate-600">
                          Prize: ${winner.prizeAmount}
                        </p>
                        <p className="text-sm text-slate-600">
                          Status: {winner.status}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          winner.status === "verified"
                            ? "bg-green-100 text-green-800"
                            : winner.status === "paid"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {winner.status}
                      </span>
                    </div>
                    {winner.status === "pending_verification" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleVerifyWinner(winner.id, "verified")
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleVerifyWinner(winner.id, "rejected")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {winner.status === "verified" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(winner.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Mark as Paid
                      </Button>
                    )}
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
