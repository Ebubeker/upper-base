"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash, Copy, Check, Link2 } from "lucide-react";
import Link from "next/link";
import {
  getCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityModules,
  toggleModule,
} from "@/services/communityService";
import type { Community, CommunityModule } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function CommunitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [modules, setModules] = useState<CommunityModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    try {
      const [communityData, modulesData] = await Promise.all([
        getCommunity(communityId),
        getCommunityModules(communityId),
      ]);

      if (communityData) {
        setCommunity(communityData);
        setName(communityData.name);
        setDescription(communityData.description || "");
        setIsPaid(communityData.is_paid);
        setPrice(
          communityData.price ? (communityData.price / 100).toString() : ""
        );
      }
      setModules(modulesData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const priceInCents = isPaid ? Math.round(parseFloat(price) * 100) : undefined;

      await updateCommunity(communityId, {
        name,
        description,
        is_paid: isPaid,
        price: priceInCents,
      } as Community);

      toast({
        title: "Success",
        description: "Community updated successfully",
      });

      router.push(`/dashboard/communities/${communityId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteCommunity(communityId);
      toast({
        title: "Success",
        description: "Community deleted successfully",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleModule = async (module: CommunityModule) => {
    try {
      await toggleModule(module.id, !module.is_enabled);
      setModules(
        modules.map((m) =>
          m.id === module.id ? { ...m, is_enabled: !m.is_enabled } : m
        )
      );
      toast({
        title: "Success",
        description: `${module.module_type} ${
          !module.is_enabled ? "enabled" : "disabled"
        }`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    if (!community) return;

    const shareLink = `${window.location.origin}/join/${community.slug}`;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with others to invite them to your community",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Community not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/communities/${communityId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Community Settings</h1>
          <p className="text-muted-foreground">
            Manage your community configuration
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your community information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="paid">Paid Membership</Label>
              <p className="text-sm text-muted-foreground">
                Charge members a monthly fee
              </p>
            </div>
            <Switch
              id="paid"
              checked={isPaid}
              onCheckedChange={setIsPaid}
            />
          </div>

          {isPaid && (
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shareable Link</CardTitle>
          <CardDescription>
            Share this link with others to invite them to join your community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm flex-1 truncate">
                {typeof window !== "undefined" && community
                  ? `${window.location.origin}/join/${community.slug}`
                  : "Loading..."}
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {community?.is_public
              ? "Anyone with this link can view and join your community."
              : "Only people with this link can join your community. Make it public in General Settings to allow discovery."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Enable or disable community modules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex items-center justify-between space-x-2 rounded-lg border p-4"
            >
              <div className="space-y-0.5">
                <Label className="capitalize">{module.module_type}</Label>
                <p className="text-sm text-muted-foreground">
                  {module.module_type === "chat" &&
                    "Real-time chat for your community"}
                  {module.module_type === "notes" &&
                    "Collaborative note-taking"}
                  {module.module_type === "tasks" && "Task management system"}
                </p>
              </div>
              <Switch
                checked={module.is_enabled}
                onCheckedChange={() => handleToggleModule(module)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Community
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
