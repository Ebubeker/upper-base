"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import {
  getPublicCommunities,
  checkMembership,
  joinCommunity,
  getUserCommunities,
} from "@/services/memberService";
import type { Community, CommunityCategory } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, DollarSign, Building2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const categories: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "health", label: "Health" },
  { value: "creative", label: "Creative" },
  { value: "sports", label: "Sports" },
  { value: "gaming", label: "Gaming" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "other", label: "Other" },
];

export default function DiscoveryPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [memberCommunities, setMemberCommunities] = useState<string[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCommunities();
      loadUserMemberships();
    }
  }, [user]);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchQuery, selectedCategory]);

  const loadCommunities = async () => {
    try {
      const data = await getPublicCommunities();
      setCommunities(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadUserMemberships = async () => {
    if (!user) return;
    try {
      const communityIds = await getUserCommunities(user.id);
      setMemberCommunities(communityIds);
    } catch (error) {
    }
  };

  const filterCommunities = () => {
    let filtered = communities;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    setFilteredCommunities(filtered);
  };

  const handleJoin = async (communityId: string) => {
    if (!user) return;

    setJoiningId(communityId);
    try {
      await joinCommunity(communityId, user.id);
      setMemberCommunities([...memberCommunities, communityId]);
      toast({
        title: "Success",
        description: "Joined community successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const isMember = (communityId: string) => {
    return memberCommunities.includes(communityId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Discover Communities</h1>
        <p className="text-muted-foreground">
          Explore and join public communities
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredCommunities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No communities found</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your search or filters"
                : "There are no public communities yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community, index) => (
            <motion.div
              key={community.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                {community.banner_url && (
                  <div
                    className="h-32 bg-cover bg-center rounded-t-2xl"
                    style={{ backgroundImage: `url(${community.banner_url})` }}
                  />
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{community.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {community.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {categories.find((c) => c.value === community.category)
                        ?.label || community.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{community.member_count} members</span>
                    </div>
                    {community.is_paid && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>${(community.price! / 100).toFixed(0)}/mo</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  {isMember(community.id) ? (
                    <Link
                      href={`/dashboard/communities/${community.id}`}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        View Community
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleJoin(community.id)}
                      disabled={joiningId === community.id}
                    >
                      {joiningId === community.id ? "Joining..." : "Join Community"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
