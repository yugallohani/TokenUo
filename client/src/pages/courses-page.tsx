import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  Star, 
  Clock, 
  Award,
  Trophy,
  Filter,
  SlidersHorizontal
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

// Course types and data
type CourseCategory = "programming" | "design" | "business" | "science" | "language" | "all";
type CourseDifficulty = "beginner" | "intermediate" | "advanced" | "all";
type CourseProvider = "udemy" | "coursera" | "edx" | "udacity" | "skillshare" | "all";

interface Course {
  id: number;
  title: string;
  description: string;
  image: string;
  category: Exclude<CourseCategory, "all">;
  difficulty: Exclude<CourseDifficulty, "all">;
  provider: Exclude<CourseProvider, "all">;
  rating: number;
  duration: string;
  tokenReward: number;
  enrolled?: boolean;
  featured?: boolean;
}

const COURSES: Course[] = [
  {
    id: 1,
    title: "Web Development Bootcamp",
    description: "A comprehensive bootcamp covering HTML, CSS, JavaScript, React, and Node.js to build modern web applications.",
    image: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "programming",
    difficulty: "beginner",
    provider: "udemy",
    rating: 4.8,
    duration: "40 hours",
    tokenReward: 5,
    featured: true,
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    description: "Learn the principles of user interface and experience design to create intuitive and beautiful applications.",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "design",
    difficulty: "beginner",
    provider: "skillshare",
    rating: 4.6,
    duration: "20 hours",
    tokenReward: 3,
  },
  {
    id: 3,
    title: "Data Science and Machine Learning",
    description: "Master the fundamentals of data science, machine learning, and AI using Python and popular libraries.",
    image: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "science",
    difficulty: "intermediate",
    provider: "coursera",
    rating: 4.9,
    duration: "60 hours",
    tokenReward: 7,
    featured: true,
  },
  {
    id: 4,
    title: "Digital Marketing Mastery",
    description: "Learn strategies for social media marketing, SEO, content marketing, and paid advertising campaigns.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "business",
    difficulty: "intermediate",
    provider: "udemy",
    rating: 4.5,
    duration: "25 hours",
    tokenReward: 4,
  },
  {
    id: 5,
    title: "Advanced JavaScript Patterns",
    description: "Dive deep into advanced JavaScript concepts, design patterns, and performance optimization techniques.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "programming",
    difficulty: "advanced",
    provider: "udacity",
    rating: 4.7,
    duration: "30 hours",
    tokenReward: 6,
  },
  {
    id: 6,
    title: "Spanish for Beginners",
    description: "Learn the basics of Spanish language including vocabulary, grammar, and conversational skills.",
    image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    category: "language",
    difficulty: "beginner",
    provider: "coursera",
    rating: 4.4,
    duration: "15 hours",
    tokenReward: 2,
  },
];

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<CourseDifficulty>("all");
  const [providerFilter, setProviderFilter] = useState<CourseProvider>("all");
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);
  
  const handleEnroll = (courseId: number) => {
    setEnrolledCourses(prev => [...prev, courseId]);
  };

  const filterCourses = () => {
    return COURSES.filter(course => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
      
      // Difficulty filter
      const matchesDifficulty = difficultyFilter === "all" || course.difficulty === difficultyFilter;
      
      // Provider filter
      const matchesProvider = providerFilter === "all" || course.provider === providerFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesProvider;
    }).map(course => ({
      ...course,
      enrolled: enrolledCourses.includes(course.id)
    }));
  };

  const filteredCourses = filterCourses();
  const featuredCourses = COURSES.filter(course => course.featured);
  
  return (
    <div className="container py-8 px-4 md:px-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Explore courses and earn tokens upon completion</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            <Trophy className="h-3 w-3 text-primary" />
            <span>{user?.totalTokens} Tokens Available</span>
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <TabsList className="mb-2 sm:mb-0">
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          </TabsList>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search courses..." 
              className="pl-9 w-full" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CourseCategory)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="programming">Programming</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="science">Science</SelectItem>
              <SelectItem value="language">Language</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as CourseDifficulty)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={providerFilter} onValueChange={(value) => setProviderFilter(value as CourseProvider)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="udemy">Udemy</SelectItem>
              <SelectItem value="coursera">Coursera</SelectItem>
              <SelectItem value="edx">edX</SelectItem>
              <SelectItem value="udacity">Udacity</SelectItem>
              <SelectItem value="skillshare">Skillshare</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onEnroll={handleEnroll} 
                />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No courses found</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  We couldn't find any courses matching your search criteria. Try adjusting your filters or search query.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setDifficultyFilter("all");
                  setProviderFilter("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="featured">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map(course => (
              <CourseCard 
                key={course.id} 
                course={{...course, enrolled: enrolledCourses.includes(course.id)}} 
                onEnroll={handleEnroll} 
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="enrolled">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.filter(course => enrolledCourses.includes(course.id)).length > 0 ? (
              filteredCourses
                .filter(course => enrolledCourses.includes(course.id))
                .map(course => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    onEnroll={handleEnroll} 
                  />
                ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">No enrolled courses</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  You haven't enrolled in any courses yet. Browse our catalog and enroll to start earning tokens.
                </p>
                <Button onClick={() => {
                  const tab = document.querySelector('[data-value="all"]') as HTMLElement;
                  if (tab) tab.click();
                }}>
                  Browse Courses
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CourseCardProps {
  course: Course & { enrolled?: boolean };
  onEnroll: (courseId: number) => void;
}

function CourseCard({ course, onEnroll }: CourseCardProps) {
  const { id, title, description, image, category, difficulty, provider, rating, duration, tokenReward, enrolled, featured } = course;
  
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-0 inset-x-0 p-3 flex justify-between items-start">
          <Badge className="capitalize bg-primary text-white border-0">
            {category}
          </Badge>
          {featured && (
            <Badge variant="outline" className="bg-black/50 text-white border-0">
              Featured
            </Badge>
          )}
        </div>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start gap-2 mb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span>{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="capitalize">
            {difficulty}
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">Provider:</span>
          <span className="capitalize">{provider}</span>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between items-center">
        <div className="flex items-center gap-1 text-sm">
          <Award className="h-4 w-4 text-primary" />
          <span className="font-medium">{tokenReward} Tokens</span>
          <span className="text-muted-foreground">upon completion</span>
        </div>
        <Button 
          size="sm" 
          className="gap-1"
          disabled={enrolled}
          onClick={() => onEnroll(id)}
        >
          {enrolled ? "Enrolled" : "Enroll"}
          {!enrolled && <ChevronRight className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}