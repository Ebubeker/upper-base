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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserX, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { getCommunity, isOwner } from "@/services/communityService";
import { getCommunityMembers } from "@/services/memberService";
import type { Community } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserOwner, setIsUserOwner] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, communityId]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [communityData, ownerStatus] = await Promise.all([
        getCommunity(communityId),
        isOwner(communityId, user.id),
      ]);

      if (!ownerStatus) {
        toast({
          title: "Access Denied",
          description: "Only owners can view members",
          variant: "destructive",
        });
        router.push(`/dashboard/communities/${communityId}`);
        return;
      }

      setCommunity(communityData);
      setIsUserOwner(ownerStatus);

      const membersData = await loadMembers();
      setMembers(membersData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("community_members")
      .select(`
        id,
        user_id,
        role,
        joined_at,
        profiles:user_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("community_id", communityId)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      profile: member.profiles,
    }));
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberId)
        .eq("community_id", communityId);

      if (error) throw error;

      await supabase.rpc("decrement_member_count", {
        community_id_param: communityId,
      });

      setMembers(members.filter((m) => m.id !== memberId));

      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading members...</p>
        </div>
      </div>
    );
  }

  if (!community || !isUserOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/communities/${communityId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">{community.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Community Members</CardTitle>
              <CardDescription>
                Manage members of your community
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="font-medium">{members.length} members</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No members yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.profile?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(member.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profile?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm px-2 py-1 rounded-md bg-primary/10 text-primary">
                        {member.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(member.joined_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role === "member" && member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveMember(member.id, member.user_id)
                          }
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
