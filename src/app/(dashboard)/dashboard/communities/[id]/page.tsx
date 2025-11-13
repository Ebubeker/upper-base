"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import Link from "next/link";
import {
  getCommunity,
  getCommunityModules,
} from "@/services/communityService";
import type { Community, CommunityModule } from "@/lib/types";
import { ChatModule } from "@/components/modules/chat-module";
import { NotesModule } from "@/components/modules/notes-module";
import { TasksModule } from "@/components/modules/tasks-module";
import { motion } from "framer-motion";

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.id as string;
  const [community, setCommunity] = useState<Community | null>(null);
  const [modules, setModules] = useState<CommunityModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunity();
    loadModules();
  }, [communityId]);

  const loadCommunity = async () => {
    try {
      const data = await getCommunity(communityId);
      setCommunity(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const data = await getCommunityModules(communityId);
      setModules(data);
    } catch (error) {
    }
  };

  const getEnabledModules = () => {
    return modules.filter((m) => m.is_enabled);
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

  const enabledModules = getEnabledModules();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold">{community.name}</h1>
          <p className="text-muted-foreground">
            {community.description || "No description"}
          </p>
        </motion.div>
        <Link href={`/dashboard/communities/${communityId}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue={enabledModules[0]?.module_type || "chat"}>
          <TabsList>
            {enabledModules.map((module) => (
              <TabsTrigger
                key={module.id}
                value={module.module_type}
                className="capitalize"
              >
                {module.module_type}
              </TabsTrigger>
            ))}
          </TabsList>

          {enabledModules.map((module) => (
            <TabsContent key={module.id} value={module.module_type}>
              {module.module_type === "chat" && (
                <ChatModule communityId={communityId} />
              )}
              {module.module_type === "notes" && (
                <NotesModule communityId={communityId} />
              )}
              {module.module_type === "tasks" && (
                <TasksModule communityId={communityId} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </div>
  );
}
