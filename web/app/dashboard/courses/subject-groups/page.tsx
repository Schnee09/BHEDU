"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button, LoadingState } from "@/components/ui";
import { PlusIcon } from "@heroicons/react/24/outline";
import Badge from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  subjects: Subject[];
}

export default function SubjectGroupsPage() {
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('subject_groups')
        .select('*');
        
      if (groupsError) throw groupsError;
      
      const groupsWithSubjects = await Promise.all(groupsData.map(async (group: any) => {
        const { data: links } = await supabase
          .from('subject_group_subjects')
          .select('subject_id, subjects(id, name, code)')
          .eq('subject_group_id', group.id);
          
        return {
          ...group,
          subjects: links?.map((link: any) => link.subjects) || []
        };
      }));
      
      setGroups(groupsWithSubjects);

    } catch (error) {
      console.error("Error fetching subject groups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subject Groups (Tổ hợp môn)</h1>
          <p className="text-muted-foreground">
            Manage subject combinations for the Vietnamese education curriculum (KHTN, KHXH).
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Group
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">{group.code}</code>
              </div>
              <Badge>{group.subjects.length} Subjects</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
              {group.description || "No description provided."}
            </p>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Subjects:</h4>
              <div className="flex flex-wrap gap-2">
                {group.subjects.map((subject) => (
                  <Badge key={subject.id}>
                    {subject.name}
                  </Badge>
                ))}
                {group.subjects.length === 0 && (
                  <span className="text-sm text-muted-foreground italic">No subjects assigned</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
