import { useQuery } from "@tanstack/react-query";
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
  Legend
} from "recharts";
import { Loader2, TrendingUp, Award, Medal, Users, FileCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

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
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Mapping for icons for stat cards
const statIcons = {
  totalCertificates: FileCheck,
  verifiedCertificates: Award,
  totalTokensAwarded: Medal,
  activeUsers: Users
};

// Animation variants for framer-motion
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });
  
  const [activeIndex, setActiveIndex] = useState(-1);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!analytics) return null;

  // Check if data is available for charts
  const hasCertificateData = analytics.certificateTypeDistribution.length > 0;
  const hasUserData = analytics.tokenDistribution.some(item => item.count > 0);
  const hasActivityData = analytics.dailyActivity.some(day => day.certificates > 0 || day.verifications > 0);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      className="container py-8"
    >
      <motion.h1 
        variants={fadeIn}
        custom={0}
        className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text"
      >
        Analytics Dashboard
      </motion.h1>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {Object.entries(analytics.totalStats).map(([key, value], index) => {
          const IconComponent = statIcons[key as keyof typeof statIcons] || TrendingUp;
          
          return (
            <motion.div
              key={key}
              variants={fadeIn}
              custom={index + 1}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Card className="overflow-hidden border-t-4 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-primary" />
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (index + 1) * 0.2, duration: 0.5 }}
                    className="text-2xl font-bold"
                  >
                    {value}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <motion.div variants={fadeIn} custom={5} whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" />
                Certificate Types Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasCertificateData ? (
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
                        label
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        animationDuration={1500}
                      >
                        {analytics.certificateTypeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            opacity={activeIndex === index ? 1 : 0.8}
                            stroke={activeIndex === index ? "#fff" : "none"}
                            strokeWidth={activeIndex === index ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Certificates`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mb-2 text-yellow-500" />
                  <p>No certificate data available</p>
                  <p className="text-sm">Upload and verify certificates to see data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeIn} custom={6} whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-purple-500" />
                Token Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasUserData ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.tokenDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} Users`, 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill="#8884d8" 
                        name="Users" 
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                      />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mb-2 text-yellow-500" />
                  <p>No token distribution data available</p>
                  <p className="text-sm">More users need to earn tokens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeIn} custom={7} whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
        <Card className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasActivityData ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="certificates" 
                      fill="#8884d8" 
                      name="New Certificates" 
                      stackId="a"
                      animationDuration={1500}
                      animationBegin={300}
                    />
                    <Bar 
                      dataKey="verifications" 
                      fill="#82ca9d" 
                      name="Verifications" 
                      stackId="a"
                      animationDuration={1500}
                      animationBegin={600}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-2 text-yellow-500" />
                <p>No activity data available</p>
                <p className="text-sm">Upload and verify certificates to see daily activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
