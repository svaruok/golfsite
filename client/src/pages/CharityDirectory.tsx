import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function CharityDirectory() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: charities = [], isLoading } = trpc.charity.list.useQuery();

  const filteredCharities = charities.filter(
    (charity) =>
      charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => setLocation("/")}
          >
            ⛳ Golf Charity
          </div>
          <div className="flex gap-4">
            {user ? (
              <>
                <Button variant="outline" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
                {user.role === "admin" && (
                  <Button variant="outline" asChild>
                    <a href="/admin">Admin</a>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Our Partner Charities
          </h1>
          <p className="text-blue-100 text-lg">
            Choose a charity to support with your subscription
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search charities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      {/* Charities Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredCharities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">No charities found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity) => (
              <Card
                key={charity.id}
                className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {charity.imageUrl && (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <img
                      src={charity.imageUrl}
                      alt={charity.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2">{charity.name}</h3>
                  <p className="text-slate-600 mb-4 flex-1">
                    {charity.description}
                  </p>
                  {charity.website && (
                    <a
                      href={charity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                    >
                      Visit Website
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {user ? (
                    <Button
                      className="w-full"
                      onClick={() => setLocation("/dashboard")}
                    >
                      Select & Support
                    </Button>
                  ) : (
                    <Button className="w-full" asChild>
                      <a href={getLoginUrl()}>Sign In to Support</a>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
