import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Heart, Trophy, Users, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">⛳ Golf Charity</div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <a href="/charities">Charities</a>
            </Button>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 mb-6">
              Where Golf Meets Charity
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Track your golf scores, compete in monthly draws, and support
              charities you care about. Every subscription contributes to
              meaningful causes.
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>Get Started</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/charities">Explore Charities</a>
              </Button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl h-96 flex items-center justify-center text-white">
            <div className="text-center">
              <Trophy className="w-24 h-24 mx-auto mb-4" />
              <p className="text-2xl font-bold">Monthly Prize Draws</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Track Scores</h3>
              <p className="text-slate-600">
                Enter your latest golf scores in Stableford format. We keep
                your last 5 scores to track your performance.
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Trophy className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Win Prizes</h3>
              <p className="text-slate-600">
                Participate in monthly draws with prizes for matching 3, 4, or
                5 numbers. Jackpots roll over if unclaimed.
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Heart className="w-12 h-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">Support Charities</h3>
              <p className="text-slate-600">
                Choose a charity and allocate a portion of your subscription to
                support causes that matter to you.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="p-8 border-2 border-slate-200 hover:border-blue-500 transition-colors">
              <h3 className="text-2xl font-bold mb-4">Monthly</h3>
              <p className="text-4xl font-bold text-primary mb-6">$9.99</p>
              <ul className="space-y-3 mb-8 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Score tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Monthly draws
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Charity support
                </li>
              </ul>
              <Button className="w-full" asChild>
                <a href={getLoginUrl()}>Subscribe Now</a>
              </Button>
            </Card>
            <Card className="p-8 border-2 border-primary bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="inline-block bg-primary text-white px-3 py-1 rounded-full text-sm font-bold mb-4">
                Best Value
              </div>
              <h3 className="text-2xl font-bold mb-4">Yearly</h3>
              <p className="text-4xl font-bold text-primary mb-2">$99.99</p>
              <p className="text-sm text-slate-600 mb-6">Save 17% vs monthly</p>
              <ul className="space-y-3 mb-8 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Everything in
                  Monthly
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Exclusive events
                </li>
              </ul>
              <Button className="w-full" asChild>
                <a href={getLoginUrl()}>Subscribe Now</a>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,500+</div>
              <p className="text-slate-600">Active Members</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">$50K+</div>
              <p className="text-slate-600">Donated to Charities</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">48</div>
              <p className="text-slate-600">Monthly Draws</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <p className="text-slate-600">Partner Charities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start tracking your golf scores and supporting charities today.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href={getLoginUrl()}>Get Started Now</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Golf Charity</h3>
              <p className="text-sm">
                Where golf meets charity. Track scores, win prizes, support
                causes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="hover:text-white transition">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/charities" className="hover:text-white transition">
                    Charities
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Golf Charity Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
