import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  Loader2, 
  ShieldAlert, 
  AlertTriangle,
  TrendingUp,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface AnalyticsData {
  certificateTypeDistribution: {
    type: string;
    count: number;
  }[];
  tokenDistribution: {
    range: string;
    count: number;
  }[];
  dailyActivity: {
    date: string;
    certificates: number;
    verifications: number;
  }[];
  totalStats: {
    totalCertificates: number;
    verifiedCertificates: number;
    totalTokensAwarded: number;
    activeUsers: number;
  };
  topCertificateIssuer?: {
    issuer: string;
    count: number;
  }[];
  userGrowth?: {
    date: string;
    users: number;
  }[];
  verificationRate?: number;
  tokenTrend?: {
    date: string;
    totalTokens: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff6b6b', '#38b2ac', '#f6ad55', '#805ad5'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect non-admin users
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: user?.isAdmin === true,
  });

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-center text-muted-foreground mb-4">
          You need administrator privileges to view the analytics dashboard.
        </p>
        <Button onClick={() => setLocation("/")}>
          Return to Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="container py-8 px-4 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center mt-2 sm:mt-0">
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm font-medium">Admin View</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {Object.entries(analytics.totalStats).map(([key, value]) => (
          <Card key={key} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              {key === 'verifiedCertificates' && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Verification Rate: {Math.round((analytics.verificationRate || 0) * 100)}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificate Types Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.certificateTypeDistribution}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.type}
                  >
                    {analytics.certificateTypeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} certificates`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Token Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.tokenDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="certificates" fill="#8884d8" name="New Certificates" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verifications" fill="#82ca9d" name="Verifications" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {analytics.tokenTrend && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Token Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.tokenTrend}>
                    <defs>
                      <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} tokens`, 'Total Tokens']} />
                    <Area type="monotone" dataKey="totalTokens" stroke="#8884d8" fillOpacity={1} fill="url(#tokenGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {analytics.userGrowth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} users`, 'User Count']} />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
