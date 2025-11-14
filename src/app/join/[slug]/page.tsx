"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { joinCommunity, checkMembership } from "@/services/memberService";
import type { Community } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function JoinCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadCommunity();
  }, [slug]);

  useEffect(() => {
    if (user && community) {
      checkUserStatus();
    }
  }, [user, community]);

  const loadCommunity = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .eq("is_public", true)
        .single();

      if (error) throw error;
      setCommunity(data);
    } catch (error) {
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!user || !community) return;

    setIsOwner(community.owner_id === user.id);

    const memberStatus = await checkMembership(community.id, user.id);
    setIsMember(memberStatus);
  };

  const handleJoin = async () => {
    if (!user) {
      router.push(`/auth/signin?redirect=/join/${slug}`);
      return;
    }

    if (!community) return;

    setJoining(true);
    try {
      await joinCommunity(community.id, user.id);
      setIsMember(true);
      toast({
        title: "Success",
        description: "Joined community successfully!",
      });
      router.push(`/dashboard/communities/${community.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Community Not Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              This community doesn't exist or is not public
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {community.banner_url && (
            <div
              className="h-64 bg-cover bg-center rounded-2xl mb-8 shadow-lg"
              style={{ backgroundImage: `url(${community.banner_url})` }}
            />
          )}

          <Card className="shadow-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-4xl mb-2">
                    {community.name}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {community.description || "No description available"}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">
                    {community.member_count} members
                  </span>
                </div>
                {community.is_paid && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      ${(community.price! / 100).toFixed(0)}/month
                    </span>
                  </div>
                )}
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {community.category}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isOwner ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    You are the owner of this community
                  </p>
                  <Link href={`/dashboard/communities/${community.id}`}>
                    <Button className="w-full md:w-auto">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              ) : isMember ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    You're already a member of this community
                  </p>
                  <Link href={`/dashboard/communities/${community.id}`}>
                    <Button className="w-full md:w-auto">
                      View Community
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4">
                  <h3 className="text-xl font-semibold mb-2">
                    Join this Community
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {community.is_paid
                      ? `Become a member for $${(community.price! / 100).toFixed(0)}/month and get access to all features`
                      : "Join for free and get access to all community features"}
                  </p>
                  <Button
                    onClick={handleJoin}
                    disabled={joining}
                    size="lg"
                    className="w-full md:w-auto min-w-[200px]"
                  >
                    {joining ? "Joining..." : user ? "Join Now" : "Sign In to Join"}
                  </Button>
                </div>
              )}

              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-3">What you'll get:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Access to community chat and discussions
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Collaborative notes and documentation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Task management and project tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Connect with {community.member_count} other members
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <Button variant="ghost">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
